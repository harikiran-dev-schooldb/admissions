import { getAdmissionStageView, type AdmissionStageSnapshot } from "@/lib/admissionTransitionRules";

export type WorkflowAction = {
  stage: string;
  title: string;
  description: string;
  priority: "complete" | "attention" | "normal";
};

/** Derive guidance from persisted stages. Never mutate stages or skip validation. */
export function getNextAdmissionAction(admission: AdmissionStageSnapshot): WorkflowAction {
  const view = getAdmissionStageView(admission);
  if (view.kind === "admitted") return { stage: "Completed", title: "Admission confirmed", description: "All admission decisions are recorded. No further verification is required.", priority: "complete" };
  if (view.kind === "cancelled") return { stage: "Closed", title: "Admission cancelled", description: "Reopen this enquiry before recording another decision.", priority: "attention" };
  switch (view.index) {
    case 0:
      return admission.application === "YES"
        ? { stage: "Application", title: "Complete the application", description: "Collect the remaining application details and mark Submitted after checking them.", priority: "normal" }
        : { stage: "Application", title: "Start the application", description: "Contact the parent and begin the admission application.", priority: "normal" };
    case 1:
      return admission.entrance === "FAIL"
        ? { stage: "Entrance", title: "Review failed entrance result", description: "Record the next decision with the admissions team before proceeding.", priority: "attention" }
        : { stage: "Entrance", title: "Verify entrance result", description: "Record Pass or Not Required only after the entrance requirement is verified.", priority: "normal" };
    case 2:
      return admission.interview === "REJECTED"
        ? { stage: "Interview", title: "Review interview decision", description: "The interview was rejected. Confirm whether the enquiry should remain closed.", priority: "attention" }
        : { stage: "Interview", title: "Record interview decision", description: "Complete the interview and select the student only after verification.", priority: "normal" };
    case 3:
      return { stage: "Admission approval", title: "Verify admission approval", description: "Check the approved interview before marking admission Given.", priority: "normal" };
    default:
      return { stage: "Final admission", title: "Confirm final admission", description: "Review the verified stages and record the final decision.", priority: "normal" };
  }
}
