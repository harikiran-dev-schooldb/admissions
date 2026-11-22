export type AdmissionAnalyticsGroup = {
  admClass: string;
  application: string;
  entrance: string;
  interview: string;
  finalAdmission: string;
  _count: { _all: number };
};

export type AdmissionAnalyticsSummary = {
  total: number;
  admitted: number;
  conversionRate: number;
  funnelData: { name: string; value: number }[];
  classData: { name: string; value: number }[];
};

/**
 * Summarize database-counted groups, never individual students.
 * Filters are applied to the tiny year-scoped dataset instantly in the browser.
 */
export function summarizeAdmissionGroups(
  groups: readonly AdmissionAnalyticsGroup[],
  classFilter = "ALL",
  finalStatusFilter = "ALL",
): AdmissionAnalyticsSummary {
  let total = 0;
  let applications = 0;
  let entrance = 0;
  let interview = 0;
  let admitted = 0;
  const classCounts = new Map<string, number>();

  for (const group of groups) {
    if (classFilter !== "ALL" && group.admClass !== classFilter) continue;
    if (finalStatusFilter !== "ALL" && group.finalAdmission !== finalStatusFilter) continue;
    const count = group._count._all;
    total += count;
    if (group.application !== "NO") applications += count;
    if (group.entrance === "PASS") entrance += count;
    if (group.interview === "SELECTED") interview += count;
    if (group.finalAdmission === "ADMITTED") admitted += count;
    classCounts.set(group.admClass, (classCounts.get(group.admClass) ?? 0) + count);
  }

  return {
    total,
    admitted,
    conversionRate: total ? Math.round((admitted / total) * 1000) / 10 : 0,
    funnelData: [
      { name: "Enquiries", value: total },
      { name: "Applications", value: applications },
      { name: "Entrance", value: entrance },
      { name: "Interview", value: interview },
      { name: "Admitted", value: admitted },
    ],
    classData: [...classCounts].map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name, "en-IN", { numeric: true })),
  };
}

export function analyticsClassOptions(groups: readonly AdmissionAnalyticsGroup[]): string[] {
  return [...new Set(groups.map((group) => group.admClass).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "en-IN", { numeric: true }));
}
