import { z } from "zod";
import { ENQUIRY_SOURCES } from "@/lib/admissions/casePolicy";
import { requireAccess } from "@/lib/auth/requireAccess";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { NextResponse, after } from "next/server";
import { queueAdminAlert, dispatchForRecipients } from "@/lib/notifications/events";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createEnquiryNumber, shouldSkipEntrance } from "@/lib/admissions";
import { admissionCreateSchema, validationError } from "@/lib/validation/admissions";
import { withDatabaseRetry } from "@/lib/dbRetry";
import { calculateAge, getEligibleClass } from "@/lib/eligibility";
import { loadYearPolicy } from "@/lib/admissions/yearPolicyServer";
import { eligibleForPolicy } from "@/lib/admissions/yearPolicy";
import { parsePage, parsePageSize, getPagination } from "@/lib/admissions/pagination";
import { getAdmissionWhere } from "@/lib/admissions/filterQuery";
import { assertUniqueEnquiry, DuplicateEnquiry } from "@/lib/admissions/duplicateServer";
import { canonicalName } from "@/lib/admissions/duplicate";
import { getNextAdmissionAction } from "@/lib/admissions/nextAction";

export async function GET(req: Request) {
  const accessError = await requireAccess("read");
  if (accessError) return accessError;
  try {
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear")?.trim();
    // Never return all school admissions when a page opens before year selection.
    if (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear)) {
      return NextResponse.json({ error: "Choose a valid academic year" }, { status: 400 });
    }
    const where = getAdmissionWhere(searchParams);

    // Analytics omits pagination but must still query only the selected year's data.
    // Directory clients request a page, so all search/filter/pagination work stays in SQL.
    if (searchParams.has("page")) {
      const requestedPage = parsePage(searchParams.get("page"));
      const pageSize = parsePageSize(searchParams.get("pageSize"));
      const total = await withDatabaseRetry(() => prisma.admission.count({ where }));
      const pagination = getPagination(total, requestedPage, pageSize);
      const admissions = await withDatabaseRetry(() => prisma.admission.findMany({
        where,
        orderBy: [{ enquiryDate: "desc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pageSize,
      }));
      return NextResponse.json({
        data: admissions,
        total,
        page: pagination.page,
        pageSize,
        totalPages: pagination.totalPages,
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const admissions = await withDatabaseRetry(() => prisma.admission.findMany({
      where,
      orderBy: [{ enquiryDate: "desc" }, { id: "asc" }],
    }));

    return NextResponse.json({ data: admissions, total: admissions.length });
  } catch (error) {
    console.error("GET_ADMISSIONS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

class PublicEnquiryConflict extends Error {}
const createWithSource = admissionCreateSchema.extend({ source: z.enum(ENQUIRY_SOURCES).optional(), publicEnquiryId: z.string().min(1).max(120).optional() });

export async function POST(req: Request) {
  const authz = await requireAuditActor("enquiry");
  if (authz.error) return authz.error;
  const actor = authz.actor;
  try {
    const parsed = createWithSource.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const body = parsed.data;
    if(body.publicEnquiryId && actor.role!=="admin")return NextResponse.json({error:"Administrator review required"},{status:403});
    const managedYear = await prisma.academicYear.findUnique({ where: { academicYear: body.academicYear } });
    if (!managedYear?.isActive) {
      return NextResponse.json({ error: "Choose an active academic year before creating an admission" }, { status: 400 });
    }
    const policy = await loadYearPolicy(body.academicYear);
    const ageData = calculateAge(body.dob, policy.ageAsOfDate);
    const eligibleClass = eligibleForPolicy(ageData, ageData ? getEligibleClass(ageData.years) : "NOT ELIGIBLE", body.admClass, policy.rules);
    const eligibleStatus = eligibleClass === body.admClass.trim().toUpperCase() ? "ELIGIBLE" : "NOT ELIGIBLE";
    const skipEntrance = shouldSkipEntrance(body.admClass);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let alertRecipients: string[] = [];
        const admission = await prisma.$transaction(async (tx) => {
          if(body.publicEnquiryId){
            const pending=await tx.publicAdmissionEnquiry.findUnique({where:{id:body.publicEnquiryId}});
            if(!pending||pending.status!=="PENDING"||pending.academicYear!==body.academicYear||pending.student!==body.student||pending.parent!==body.parent||pending.mobile!==body.mobile||pending.dob!==body.dob||pending.admClass!==body.admClass)throw new PublicEnquiryConflict("Online enquiry changed or was already reviewed.");
          }
          await assertUniqueEnquiry(tx, body);
          const created = await tx.admission.create({
          data: {
            academicYear: body.academicYear,
            enquiryNo: await createEnquiryNumber(),
            student: canonicalName(body.student),
            parent: body.parent.toUpperCase(),
            mobile: body.mobile,
            dob: body.dob,
            age: ageData?.text ?? null,
            admClass: body.admClass,
            eligibleClass,
            eligibleStatus,
            application: "NO",
            entrance: skipEntrance ? "NOT_REQUIRED" : "NOT_STARTED",
            interview: "NOT_STARTED",
            admissionGiven: "NOT_GIVEN",
            finalAdmission: "PENDING",
          },
          });
          const source=body.publicEnquiryId?"WEBSITE":body.source??"UNSPECIFIED";
          if(source!=="UNSPECIFIED"){
            const details=await tx.admissionCase.create({data:{admissionId:created.id,source}});
            await recordActivity(tx,actor,{entityType:"ADMISSION_CASE",action:"CREATED",entityId:created.id,entityLabel:created.enquiryNo,after:details});
          }
          if(body.publicEnquiryId){
            const reviewed=await tx.publicAdmissionEnquiry.updateMany({where:{id:body.publicEnquiryId,status:"PENDING"},data:{status:"ACCEPTED",reviewedAt:new Date(),convertedAdmissionId:created.id,student:"",parent:"",mobile:"",dob:""}});
            if(reviewed.count!==1)throw new PublicEnquiryConflict("Online enquiry was already reviewed.");
          }
          const action = getNextAdmissionAction(created);
          const task = await tx.admissionFollowUp.create({
            data: {
              admissionId: created.id,
              assignedToEmail: actor.email,
              dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
              note: `[WORKFLOW:${action.stage}] ${action.title}. ${action.description}`,
              createdByEmail: actor.email,
            },
          });
          await recordActivity(tx, actor, { entityType: "FOLLOW_UP", action: "CREATED",
            entityId: task.id, entityLabel: created.enquiryNo, after: task });
          await recordActivity(tx, actor, {
            entityType: "ADMISSION", action: "CREATED", entityId: created.id,
            entityLabel: created.enquiryNo, after: created,
          });
          alertRecipients = await queueAdminAlert(tx, {
            type: "NEW_ENQUIRY", eventKey: `admission:${created.id}:created`,
            title: "New admission enquiry", body: `Enquiry ${created.enquiryNo} · ${created.admClass}`,
          });
          return created;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        after(() => dispatchForRecipients(alertRecipients));
        return NextResponse.json({ data: admission }, { status: 201 });
      } catch (error) {
        if (error instanceof DuplicateEnquiry || error instanceof PublicEnquiryConflict) return NextResponse.json({ error: error.message }, { status: 409 });
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !["P2002", "P2034"].includes(error.code)) throw error;
        if (attempt === 2) return NextResponse.json({ error: "Another enquiry is being saved. Refresh and try again." }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Could not allocate enquiry number" }, { status: 409 });
  } catch (error) {
    console.error("CREATE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to create admission" }, { status: 500 });
  }
}
