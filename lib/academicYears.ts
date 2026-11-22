export function getLatestAcademicYear(referenceDate = new Date()) {
  const startYear = referenceDate.getMonth() >= 3
    ? referenceDate.getFullYear()
    : referenceDate.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export function getAcademicYearOptions(count = 4, referenceDate = new Date()) {
  const startYear = Number(getLatestAcademicYear(referenceDate).slice(0, 4));
  return Array.from({ length: count }, (_, index) => {
    const year = startYear - index;
    return `${year}-${String(year + 1).slice(-2)}`;
  });
}

export function sortAcademicYearsNewestFirst(years: Iterable<string>) {
  return [...new Set(years)].sort((a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4)));
}
