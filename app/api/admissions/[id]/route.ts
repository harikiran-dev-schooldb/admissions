import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { admissionUpdateSchema, validationError } from "@/lib/validation/admissions";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
  return NextResponse.json({ data: admission });
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const { id } = await params;
    const parsed = admissionUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

    const data = {
      ...parsed.data,
      ...(parsed.data.student ? { student: parsed.data.student.toUpperCase() } : {}),
      ...(parsed.data.parent ? { parent: parsed.data.parent.toUpperCase() } : {}),
    };

    const admission = await prisma.admission.update({ where: { id }, data });
    return NextResponse.json({ data: admission });
  } catch (error) {
    console.error("UPDATE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.admission.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE_ADMISSION_ERROR", error);
    return NextResponse.json({ error: "Failed to delete admission" }, { status: 500 });
  }
}
