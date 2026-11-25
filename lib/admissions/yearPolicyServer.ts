import { prisma } from "@/lib/prisma";
import { getDefaultAgeAsOfDate } from "@/lib/admissionSettings";
import { policyKey, capacityKey, type YearPolicy, type SeatCapacity } from "./yearPolicy";
import { yearPolicySchema, seatCapacitySchema } from "./yearPolicySchema";

export async function loadYearPolicy(year: string): Promise<YearPolicy> {
  const records = await prisma.admissionConfig.findMany({ where: { key: { in: [policyKey(year), "ageAsOfDate"] } } });
  const stored = records.find(record => record.key === policyKey(year));
  if (stored) return yearPolicySchema.parse(JSON.parse(stored.value));
  return { ageAsOfDate: records.find(record => record.key === "ageAsOfDate")?.value ?? getDefaultAgeAsOfDate(year), rules: {} };
}
export async function loadCapacity(year: string): Promise<SeatCapacity> {
  const stored = await prisma.admissionConfig.findUnique({ where: { key: capacityKey(year) } });
  return stored ? seatCapacitySchema.parse(JSON.parse(stored.value)) : {};
}
