export type AdmissionYearOption = {
  academicYear: string;
  isActive: boolean;
  admissionsCount?: number;
};

/**
 * Prefer the active cohort with the most enquiries, breaking ties by newest year.
 * This prevents a newly opened future year (with 1 record) hiding a 910-record cohort.
 */
export function selectDefaultAdmissionYear(
  years: readonly AdmissionYearOption[],
  selectedYear: string,
): string {
  if (selectedYear && years.some((year) => year.academicYear === selectedYear)) return selectedYear;
  const sorted = [...years].sort((a, b) => b.academicYear.localeCompare(a.academicYear, undefined, { numeric: true }));
  const mostPopulated = (options: readonly AdmissionYearOption[]) =>
    options.reduce<AdmissionYearOption | null>((best, year) =>
      (year.admissionsCount ?? 0) > (best?.admissionsCount ?? 0) ? year : best, null);

  return (
    mostPopulated(sorted.filter((year) => year.isActive))?.academicYear ??
    mostPopulated(sorted)?.academicYear ??
    sorted.find((year) => year.isActive)?.academicYear ??
    sorted[0]?.academicYear ??
    ""
  );
}
