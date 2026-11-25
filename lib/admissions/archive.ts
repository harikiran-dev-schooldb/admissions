import type { Prisma } from "@/src/generated/prisma/client";
import { assertUniqueEnquiry } from "@/lib/admissions/duplicateServer";
import { recordActivity, type AuditActor } from "@/lib/audit/activity";

export async function archiveAdmission(tx:Prisma.TransactionClient,id:string,actor:AuditActor) {
  const record=await tx.admission.findUniqueOrThrow({where:{id},include:{followUps:true,documents:true,caseDetails:true}});
  const {followUps,documents,caseDetails,...admission}=record;
  const snapshot=JSON.parse(JSON.stringify({version:1,admission,followUps,documents,caseDetails})) as Prisma.InputJsonValue;
  await tx.admissionArchive.create({data:{id,enquiryNo:admission.enquiryNo,academicYear:admission.academicYear,archivedByEmail:actor.email,snapshot}});
  const deleted=await tx.admission.delete({where:{id,updatedAt:admission.updatedAt}});
  await recordActivity(tx,actor,{entityType:"ADMISSION",action:"DELETED",entityId:id,entityLabel:deleted.enquiryNo,before:deleted});
  return deleted;
}

export class ArchiveConflict extends Error {}
export async function restoreAdmission(tx:Prisma.TransactionClient,id:string,actor:AuditActor){
  const archive=await tx.admissionArchive.findUnique({where:{id}});
  if(!archive)throw new ArchiveConflict("Archived record not found.");
  const snapshot=archive.snapshot as unknown as {version:number;admission:Prisma.AdmissionUncheckedCreateInput;followUps:Prisma.AdmissionFollowUpCreateManyInput[];documents:Prisma.AdmissionDocumentCreateManyInput[];caseDetails:Prisma.AdmissionCaseUncheckedCreateInput|null};
  if(snapshot.version!==1||snapshot.admission?.id!==archive.id||snapshot.admission.enquiryNo!==archive.enquiryNo||!Array.isArray(snapshot.followUps)||!Array.isArray(snapshot.documents))throw new ArchiveConflict("Unsupported recovery snapshot.");
  const year=await tx.academicYear.findUnique({where:{academicYear:archive.academicYear},select:{academicYear:true}});
  if(!year)throw new ArchiveConflict("Restore the original academic year before restoring this record.");
  await assertUniqueEnquiry(tx,{academicYear:archive.academicYear,student:snapshot.admission.student,mobile:snapshot.admission.mobile,dob:snapshot.admission.dob});
  const restored=await tx.admission.create({data:snapshot.admission});
  if(snapshot.followUps.length)await tx.admissionFollowUp.createMany({data:snapshot.followUps});
  if(snapshot.documents.length)await tx.admissionDocument.createMany({data:snapshot.documents});
  if(snapshot.caseDetails)await tx.admissionCase.create({data:snapshot.caseDetails});
  await recordActivity(tx,actor,{entityType:"ADMISSION",action:"REACTIVATED",entityId:id,entityLabel:restored.enquiryNo,after:restored});
  // Remove the duplicate protected snapshot only after all related data and audit are restored.
  await tx.admissionArchive.delete({where:{id}});
  return restored;
}
