import { prisma } from "@/lib/prisma";

export function shouldSkipEntrance(admClass: string) {
  return ["PRE KG", "LKG"].includes(admClass.trim().toUpperCase());
}

export async function createEnquiryNumber() {
  const year = new Date().getFullYear();
  const prefix = `ENQ-${year}-`;
  const latest = await prisma.admission.findFirst({
    where: { enquiryNo: { startsWith: prefix } },
    orderBy: { enquiryNo: "desc" },
    select: { enquiryNo: true },
  });

  const current = Number(latest?.enquiryNo.split("-").at(-1) ?? "0");
  return `${prefix}${String(current + 1).padStart(4, "0")}`;
}
