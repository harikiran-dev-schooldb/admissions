/** Human-friendly, privacy-safe admission history built from server audit records. */
export type AdmissionLogChange = { field: string; from: string | null; to: string | null };
export type AdmissionLogItem = {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
  changes: AdmissionLogChange[];
  historical: boolean;
};

const fields = [
  "application", "entrance", "interview", "admissionGiven", "finalAdmission",
  "entranceScheduledAt", "interviewScheduledAt", "admClass", "academicYear", "eligibleStatus",
] as const;

const labels: Record<string, string> = {
  application: "Application",
  entrance: "Entrance",
  interview: "Interview",
  admissionGiven: "Admission given",
  finalAdmission: "Final admission",
  entranceScheduledAt: "Entrance appointment",
  interviewScheduledAt: "Interview appointment",
  admClass: "Applied class",
  academicYear: "Academic year",
  eligibleStatus: "Eligibility",
};

const stageTitles: Record<string, Record<string, string>> = {
  application: { NO: "Application not taken", YES: "Application taken", SUBMITTED: "Application submitted" },
  entrance: { NOT_STARTED: "Entrance not started", PENDING: "Entrance pending", PASS: "Entrance passed", FAIL: "Entrance failed", NOT_REQUIRED: "Entrance not required" },
  interview: { NOT_STARTED: "Interview not started", PENDING: "Interview pending", SELECTED: "Interview selected", REJECTED: "Interview rejected" },
  admissionGiven: { NOT_GIVEN: "Admission not given", GIVEN: "Admission given" },
  finalAdmission: { PENDING: "Admission reopened or pending", ADMITTED: "Admission confirmed", CANCELLED: "Admission cancelled" },
};

function auditString(value: unknown): string | null {
  if (typeof value === "string") return value.slice(0, 180);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

/** Never expose raw ActivityLog.changes, which can contain staff email identifiers. */
export function sanitizeAdmissionChanges(input: unknown): AdmissionLogChange[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  const raw = input as Record<string, unknown>;
  return fields.flatMap((field) => {
    const pair = raw[field];
    if (!pair || typeof pair !== "object" || Array.isArray(pair)) return [];
    const object = pair as Record<string, unknown>;
    if (!("from" in object) || !("to" in object)) return [];
    const from = auditString(object.from);
    const to = auditString(object.to);
    return from === to ? [] : [{ field, from, to }];
  });
}

function formatValue(field: string, value: string | null): string {
  if (value === null) return "—";
  if (field === "entranceScheduledAt" || field === "interviewScheduledAt") {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }) + " IST";
  }
  if (field === "application") return ({ NO: "Not taken", YES: "Taken", SUBMITTED: "Submitted" } as Record<string, string>)[value] ?? value;
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function describeAdmissionLog(entry: Pick<AdmissionLogItem, "action" | "changes" | "historical">) {
  if (entry.historical) return {
    title: "Enquiry date on record",
    details: ["The original enquiry date was saved before this activity history was available. Earlier stage dates cannot be verified."],
    tone: "neutral" as const,
  };
  if (entry.action === "CREATED") return {
    title: "Enquiry created",
    details: ["Student enquiry registered in SchoolDB."],
    tone: "indigo" as const,
  };
  const stages = entry.changes.filter((change) => stageTitles[change.field]);
  const scheduled = entry.changes.filter((change) => change.field.endsWith("ScheduledAt"));
  const main = stages.length === 1 ? stages[0] : scheduled.length === 1 && stages.length === 0 ? scheduled[0] : null;
  const title = main
    ? stageTitles[main.field]?.[main.to ?? ""] ??
      (main.field === "entranceScheduledAt" ? "Entrance appointment " : "Interview appointment ") +
        (main.to ? (main.from ? "rescheduled" : "scheduled") : "cleared")
    : stages.length > 1 ? "Admission stages updated"
      : scheduled.length > 0 ? "Appointment details updated"
        : "Admission details updated";
  const details = entry.changes.map((change) =>
    (labels[change.field] ?? change.field) + ": " + formatValue(change.field, change.from) + " → " + formatValue(change.field, change.to),
  );
  return {
    title,
    details: details.length ? details : ["An update was recorded without a displayed workflow change."],
    tone: stages.some((change) => ["FAIL", "REJECTED", "CANCELLED"].includes(change.to ?? "")) ? "rose" as const
      : stages.some((change) => ["SUBMITTED", "PASS", "SELECTED", "GIVEN", "ADMITTED"].includes(change.to ?? "")) ? "emerald" as const
        : "neutral" as const,
  };
}
