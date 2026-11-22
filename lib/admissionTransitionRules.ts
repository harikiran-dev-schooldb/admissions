export type StageField = "application" | "entrance" | "interview" | "admissionGiven" | "finalAdmission";
export type AdmissionStageSnapshot = {
  application: string;
  entrance: string;
  interview: string;
  admissionGiven: string;
  finalAdmission: string;
};

/** Returns a user-facing error for invalid workflow transitions, or null when allowed. */
export function validateStageTransition(current: AdmissionStageSnapshot, field: StageField, value: string): string | null {
  if (field === "entrance" && value !== "NOT_STARTED" && current.application !== "SUBMITTED") {
    return "Submit the application before updating the entrance result";
  }
  if (field === "interview" && value !== "NOT_STARTED" && !["PASS", "NOT_REQUIRED"].includes(current.entrance)) {
    return "Complete the entrance requirement before the interview";
  }
  if (field === "admissionGiven" && value === "GIVEN" && current.interview !== "SELECTED") {
    return "Select the student in the interview before granting admission";
  }
  if (field === "finalAdmission" && value === "ADMITTED" && (
    current.application !== "SUBMITTED" ||
    !["PASS", "NOT_REQUIRED"].includes(current.entrance) ||
    current.interview !== "SELECTED"
  )) {
    return "Application, entrance and interview must be completed before final admission";
  }
  return null;
}
