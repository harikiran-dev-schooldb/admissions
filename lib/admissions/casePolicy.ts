export const DOCUMENT_KINDS = [
  { value: "BIRTH_CERTIFICATE", label: "Birth certificate" },
  { value: "TRANSFER_CERTIFICATE", label: "Transfer certificate" },
  { value: "PHOTOGRAPHS", label: "Student photographs" },
  { value: "ADDRESS_PROOF", label: "Address proof" },
  { value: "PREVIOUS_REPORT_CARD", label: "Previous report card" },
  { value: "IDENTITY_PROOF", label: "Identity proof (if applicable)" },
] as const;
export const DOCUMENT_STATUSES = ["PENDING","RECEIVED","VERIFIED","NOT_REQUIRED"] as const;
export const ENQUIRY_SOURCES = ["UNSPECIFIED","WALK_IN","PHONE","REFERRAL","WEBSITE","SOCIAL_MEDIA","OTHER"] as const;
export const CANCELLATION_REASONS = ["NOT_SPECIFIED","PARENT_WITHDREW","SEAT_UNAVAILABLE","ELIGIBILITY","OTHER_SCHOOL","FEES","OTHER"] as const;
export function labelCode(code: string) { return code.toLowerCase().replaceAll("_"," ").replace(/^./, c=>c.toUpperCase()); }
export function isSeatAvailable(capacity: number | undefined, admitted: number) { return capacity !== undefined && admitted < capacity; }
export function isClassFull(capacity: number | undefined, admitted: number) { return capacity !== undefined && admitted >= capacity; }
export function documentComplete(status: string) { return status === "VERIFIED" || status === "NOT_REQUIRED"; }
export function conversionRate(total: number, admitted: number) { return total ? Math.round(1000*admitted/total)/10 : 0; }
