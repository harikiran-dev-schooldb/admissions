export type FollowUpStatus = "OPEN" | "COMPLETED";
export type FollowUpOutcome = "INTERESTED" | "CALL_BACK" | "NO_RESPONSE" | "NOT_INTERESTED" | "OTHER";
export type FollowUpItem = {
  id: string;
  admissionId: string;
  assignedToEmail: string;
  dueAt: string;
  status: FollowUpStatus;
  note: string | null;
  outcome: FollowUpOutcome | null;
  completionNote: string | null;
  completedAt: string | null;
  completedByEmail: string | null;
  createdByEmail: string;
  createdAt: string;
  admission: { id: string; enquiryNo: string; student: string; admClass: string; finalAdmission: string };
};
export type FollowUpResponse = { data: FollowUpItem[]; total: number; page: number; pageSize: number; error?: string };
export const FOLLOW_UP_OUTCOMES: { value: FollowUpOutcome; label: string }[] = [
  { value: "INTERESTED", label: "Interested" },
  { value: "CALL_BACK", label: "Callback requested" },
  { value: "NO_RESPONSE", label: "No answer" },
  { value: "NOT_INTERESTED", label: "Not interested" },
  { value: "OTHER", label: "Other" },
];
