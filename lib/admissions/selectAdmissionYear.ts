export type AdmissionYearOption = {
  academicYear: string;
  isActive: boolean;
  admissionsCount?: number;
  isSuggested?: boolean;
};

/**
 * Always default to the newest configured academic year, whether populated or not.
 * An explicit valid historical selection remains respected.
 * Archived years remain available for viewing, but cannot receive new admissions.
 */
export function selectDefaultAdmissionYear(
  years: readonly AdmissionYearOption[],
  selectedYear: string,
): string {
  if (selectedYear && years.some((year) => year.academicYear === selectedYear)) return selectedYear;
  return [...years]
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear, undefined, { numeric: true }))[0]?.academicYear ?? "";
}
