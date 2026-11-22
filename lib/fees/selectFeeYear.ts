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

/** Latest academic year is the default, including a newly opened empty year. */
export function selectDefaultFeeYear(
  years: readonly YearRecord[],
  fees: readonly FeeYearRecord[],
  selectedYear: string,
): string {
  const options = getFeeYearOptions(years, fees);
  return selectedYear && options.includes(selectedYear) ? selectedYear : (options[0] ?? "");
}
