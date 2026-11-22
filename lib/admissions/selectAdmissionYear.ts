export type AdmissionYearOption = {
  academicYear: string;
  isActive: boolean;
  admissionsCount?: number;
};

/** Select the latest active cohort that actually has enquiries, not an empty future year. */
export function selectDefaultAdmissionYear(
  years: readonly AdmissionYearOption[],
  selectedYear: string,
): string {
  if (selectedYear && years.some((year) => year.academicYear === selectedYear)) return selectedYear;
  const sorted = [...years].sort((a, b) => b.academicYear.localeCompare(a.academicYear, undefined, { numeric: true }));
  return (
    sorted.find((year) => year.isActive && (year.admissionsCount ?? 0) > 0)?.academicYear ??
    sorted.find((year) => (year.admissionsCount ?? 0) > 0)?.academicYear ??
    sorted.find((year) => year.isActive)?.academicYear ??
    sorted[0]?.academicYear ??
    ""
  );
}
