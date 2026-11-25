export const SCHOOL_CLASSES = ["PRE KG", "LKG", "UKG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;
export type SchoolClass = typeof SCHOOL_CLASSES[number];
export type AgeRule = { minMonths: number; maxMonths: number };
export type YearPolicy = { ageAsOfDate: string; rules: Partial<Record<SchoolClass, AgeRule>> };
export type SeatCapacity = Partial<Record<SchoolClass, number>>;
export function policyKey(year: string) { return "agePolicy:" + year; }
export function capacityKey(year: string) { return "seatCapacity:" + year; }
export function eligibleForPolicy(age: { years: number; months: number } | null, baseline: string, appliedClass: string, rules: YearPolicy["rules"]) {
  if (!age) return "NOT ELIGIBLE";
  const months = age.years * 12 + age.months;
  const eligible = SCHOOL_CLASSES.filter(name => {
    const rule = rules[name];
    return rule ? months >= rule.minMonths && months <= rule.maxMonths : name === baseline;
  });
  const applied = appliedClass.trim().toUpperCase() as SchoolClass;
  return eligible.find(name => name === applied) ?? eligible.find(name => name === baseline) ?? eligible[0] ?? "NOT ELIGIBLE";
}
export function seatBalance(capacity: number | undefined, admitted: number) {
  return capacity === undefined ? null : capacity - admitted;
}
