export type AdmissionYearOption = {
  academicYear: string;
  isActive: boolean;
  admissionsCount?: number;
  isSuggested?: boolean;
};

/**
 * Only active years are available in the live admissions and analytics views.
 * Historical records stay stored and can be managed by reactivating a year.
 */
export function selectDefaultAdmissionYear(
  years: readonly AdmissionYearOption[],
  selectedYear: string,
): string {
  const activeYears = years.filter((year) => year.isActive);
  if (selectedYear && activeYears.some((year) => year.academicYear === selectedYear)) return selectedYear;
  return [...activeYears]
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear, undefined, { numeric: true }))[0]?.academicYear ?? "";
}
