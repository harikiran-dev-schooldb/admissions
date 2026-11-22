/** A fee history view must not omit archived or legacy academic years. */
export type YearRecord = { academicYear: string; isActive: boolean };
export type FeeYearRecord = { academicYear: string };

export function getFeeYearOptions(
  years: readonly YearRecord[],
  fees: readonly FeeYearRecord[],
): string[] {
  const names = new Set([
    ...years.map((year) => year.academicYear),
    ...fees.map((fee) => fee.academicYear),
  ].filter(Boolean));
  return [...names].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

/** Prefer the most recent *active* academic year that actually has fees. */
export function selectDefaultFeeYear(
  years: readonly YearRecord[],
  fees: readonly FeeYearRecord[],
  selectedYear: string,
): string {
  const options = getFeeYearOptions(years, fees);
  if (selectedYear && options.includes(selectedYear)) return selectedYear;
  const existingFeeYears = new Set(fees.map((fee) => fee.academicYear));
  const activeYears = new Set(years.filter((year) => year.isActive).map((year) => year.academicYear));
  return (
    options.find((year) => activeYears.has(year) && existingFeeYears.has(year)) ??
    options.find((year) => existingFeeYears.has(year)) ??
    options.find((year) => activeYears.has(year)) ??
    options[0] ??
    ""
  );
}
