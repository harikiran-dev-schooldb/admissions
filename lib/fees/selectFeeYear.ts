/** Only active configured academic years belong in the Fee Structure workspace. */
export type YearRecord = { academicYear: string; isActive: boolean };
export type FeeYearRecord = { academicYear: string };

export function getFeeYearOptions(
  years: readonly YearRecord[],
  _fees: readonly FeeYearRecord[],
): string[] {
  void _fees;
  return [...new Set(years.filter((year) => year.isActive).map((year) => year.academicYear).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

/** Select the latest active year, rejecting inactive, legacy and unknown selections. */
export function selectDefaultFeeYear(
  years: readonly YearRecord[],
  fees: readonly FeeYearRecord[],
  selectedYear: string,
): string {
  const options = getFeeYearOptions(years, fees);
  if (selectedYear && options.includes(selectedYear)) return selectedYear;
  return options[0] ?? "";
}
