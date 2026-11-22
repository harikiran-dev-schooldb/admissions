export type StageField = "application" | "entrance" | "interview" | "admissionGiven" | "finalAdmission";

export type AdmissionStageSnapshot = {
  application: string;
  entrance: string;
  interview: string;
  admissionGiven: string;
  finalAdmission: string;
};

export type AdmissionStageContext = AdmissionStageSnapshot & { admClass: string };
export type StageView =
  | { kind: "active"; index: number }
  | { kind: "admitted"; index: 5 }
  | { kind: "cancelled"; index: 5 };

/**
 * A terminal admission decision takes priority over incomplete imported legacy
 * milestones. The dashboard must never show an admitted child as "Step 2".
 */
export function getAdmissionStageView(current: AdmissionStageSnapshot): StageView {
  if (current.finalAdmission === "ADMITTED") return { kind: "admitted", index: 5 };
  if (current.finalAdmission === "CANCELLED") return { kind: "cancelled", index: 5 };
  const complete = [
    current.application === "SUBMITTED",
    ["PASS", "NOT_REQUIRED"].includes(current.entrance),
    current.interview === "SELECTED",
    current.admissionGiven === "GIVEN",
  ];
  const incompleteIndex = complete.findIndex((value) => !value);
  return { kind: "active", index: incompleteIndex === -1 ? 4 : incompleteIndex };
}

/** Reopen terminal records explicitly before making any new stage decisions. */
export function validateStageTransition(
  current: AdmissionStageSnapshot,
  field: StageField,
  value: string,
): string | null {
  if (current.finalAdmission !== "PENDING") {
    if (field === "finalAdmission" && value === "PENDING") return null;
    return "This admission is already closed. Reopen the enquiry before changing its workflow.";
  }

  if (field === "entrance" && value !== "NOT_STARTED" && current.application !== "SUBMITTED") {
    return "Submit the application before updating the entrance result.";
  }
  if (field === "interview" && value !== "NOT_STARTED") {
    if (current.application !== "SUBMITTED") return "Submit the application before updating the interview.";
    if (!["PASS", "NOT_REQUIRED"].includes(current.entrance)) {
      return "Complete the entrance requirement before updating the interview.";
    }
  }
  if (field === "admissionGiven" && value === "GIVEN") {
    if (current.application !== "SUBMITTED") return "Submit the application before approving admission.";
    if (!["PASS", "NOT_REQUIRED"].includes(current.entrance)) {
      return "Complete the entrance requirement before approving admission.";
    }
    if (current.interview !== "SELECTED") {
      return "Select the student in the interview before granting admission.";
    }
  }
  if (field === "finalAdmission" && value === "ADMITTED") {
    if (current.application !== "SUBMITTED") return "Application must be submitted before final admission.";
    if (!["PASS", "NOT_REQUIRED"].includes(current.entrance)) return "Complete the entrance requirement before final admission.";
    if (current.interview !== "SELECTED") return "Select the student in the interview before final admission.";
    if (current.admissionGiven !== "GIVEN") return "Mark admission as GIVEN before confirming final admission.";
  }
  return null;
}

/**
 * Build a consistent downstream state whenever an earlier milestone changes.
 * Validation and this plan are executed together inside the database transaction.
 */
export function buildStageUpdate(
  current: AdmissionStageContext,
  field: StageField,
  value: string,
): Record<string, string> {
  const data: Record<string, string> = { [field]: value };

  if (field === "application") {
    const skipEntrance = ["PRE KG", "LKG"].includes(current.admClass.trim().toUpperCase());
    data.entrance = value === "SUBMITTED" ? (skipEntrance ? "NOT_REQUIRED" : "PENDING") : "NOT_STARTED";
    data.interview = "NOT_STARTED";
    data.admissionGiven = "NOT_GIVEN";
    data.finalAdmission = "PENDING";
  } else if (field === "entrance") {
    data.interview = ["PASS", "NOT_REQUIRED"].includes(value) ? "PENDING" : "NOT_STARTED";
    data.admissionGiven = "NOT_GIVEN";
    data.finalAdmission = "PENDING";
  } else if (field === "interview") {
    // Selecting an interview does NOT automatically grant admission; stage 4
    // must be explicitly verified before final confirmation.
    data.admissionGiven = "NOT_GIVEN";
    data.finalAdmission = value === "REJECTED" ? "CANCELLED" : "PENDING";
  } else if (field === "admissionGiven") {
    // "Not given" is pending, not an automatic cancellation.
    data.finalAdmission = "PENDING";
  } else if (field === "finalAdmission") {
    if (value === "PENDING" || value === "CANCELLED") {
      data.admissionGiven = "NOT_GIVEN";
    }
    // ADMITTED never silently rewrites entrance/interview/application results.
  }
  return data;
}
