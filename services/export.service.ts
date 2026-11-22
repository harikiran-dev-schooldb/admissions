import type { Admission } from "@/src/generated/prisma/client";

/** Keep spreadsheets from treating student-supplied values as formulas. */
function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

function isoDate(value: Date | string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function buildAdmissionCsv(admission: Admission): string {
  const fields: [string, unknown][] = [
    ["Enquiry Number", admission.enquiryNo],
    ["Academic Year", admission.academicYear],
    ["Student Name", admission.student],
    ["Parent Name", admission.parent],
    ["Mobile", admission.mobile],
    ["Date of Birth", admission.dob],
    ["Age", admission.age],
    ["Applied Class", admission.admClass],
    ["Eligible Class", admission.eligibleClass],
    ["Eligibility", admission.eligibleStatus],
    ["Application Stage", admission.application],
    ["Entrance Stage", admission.entrance],
    ["Interview Stage", admission.interview],
    ["Admission Given", admission.admissionGiven],
    ["Final Admission", admission.finalAdmission],
    ["Enquiry Created", isoDate(admission.enquiryDate)],
    ["Last Updated", isoDate(admission.updatedAt)],
  ];
  return "\uFEFF" + [["Field", "Value"], ...fields].map((cells) => cells.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Download only the admission record already loaded by the authenticated UI. */
export function downloadAdmissionCsv(admission: Admission): void {
  const csv = buildAdmissionCsv(admission);
  const filename = (admission.enquiryNo || "admission").replace(/[^a-z0-9_-]/gi, "_").slice(0, 90);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + "_details.csv";
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
