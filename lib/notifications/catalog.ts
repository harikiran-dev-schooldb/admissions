export const ALERT_OPTIONS = [
  { type: "NEW_ENQUIRY", label: "New enquiry created", description: "New admission enquiry added", roles: ["admin"] },
  { type: "APPLICATION_SUBMITTED", label: "Application submitted", description: "Applicant submitted the application stage", roles: ["admin"] },
  { type: "ENTRANCE_SCHEDULED", label: "Entrance exam scheduled", description: "A real entrance date was assigned to you", roles: ["admin", "staff"] },
  { type: "INTERVIEW_SCHEDULED", label: "Interview scheduled", description: "A real interview date was assigned to you", roles: ["admin", "staff"] },
  { type: "STUDENT_ADMITTED", label: "Student admitted", description: "Final admission changed to Admitted", roles: ["admin"] },
  { type: "ADMISSION_CANCELLED", label: "Admission cancelled", description: "Final admission changed to Cancelled", roles: ["admin"] },
  { type: "FOLLOW_UP_COMPLETED", label: "Follow-up completed", description: "A staff member completed a parent follow-up", roles: ["admin"] },
  { type: "DAILY_SUMMARY", label: "Daily admissions summary", description: "Previous day's activity, sent at 8:30 AM IST", roles: ["admin"] },
  { type: "FOLLOW_UP_ASSIGNED", label: "Follow-up assigned", description: "A new parent follow-up is assigned to you", roles: ["admin", "staff"] },
  { type: "FOLLOW_UP_DUE", label: "Follow-up due soon", description: "Upcoming assigned parent follow-up", roles: ["admin", "staff"] },
  { type: "FOLLOW_UP_OVERDUE", label: "Overdue follow-up", description: "An assigned follow-up is overdue", roles: ["admin", "staff"] },
] as const;
export type AlertType = typeof ALERT_OPTIONS[number]["type"];
export type AlertRole = "admin" | "staff";

export function isAlertType(value: string): value is AlertType {
  return ALERT_OPTIONS.some((entry) => entry.type === value);
}
export function canReceiveAlert(role: AlertRole, type: AlertType): boolean {
  return ALERT_OPTIONS.some((entry) => entry.type === type && (entry.roles as readonly string[]).includes(role));
}
export function getAlertOptions(role: AlertRole) {
  return ALERT_OPTIONS.filter((entry) => (entry.roles as readonly string[]).includes(role));
}

export function indiaDayWindow(now: Date) {
  const offset = 330 * 60_000;
  const localDay = Math.floor((now.getTime() + offset) / 86_400_000);
  const start = new Date((localDay - 1) * 86_400_000 - offset);
  const end = new Date(localDay * 86_400_000 - offset);
  const label = new Date(start.getTime() + offset).toISOString().slice(0, 10);
  return { start, end, label };
}
