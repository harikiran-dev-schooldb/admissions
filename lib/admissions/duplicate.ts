/** Match the same child, not merely a shared family telephone number. */
export function canonicalName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
}
export function canonicalDob(value: string | null | undefined) {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const legacy = /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/.exec(value.trim());
  const result = iso ? iso[0] : legacy ? (legacy[3].length === 2 ? "20" + legacy[3] : legacy[3]) + "-" + legacy[2].padStart(2,"0") + "-" + legacy[1].padStart(2,"0") : "";
  if (!result) return "";
  const date = new Date(result + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === result ? result : "";
}
type Identity = { student: string; dob?: string | null; mobile: string };
export function isDuplicateEnquiry(a: Identity, b: Identity) {
  if (canonicalName(a.student) !== canonicalName(b.student)) return false;
  const first = canonicalDob(a.dob), second = canonicalDob(b.dob);
  if (first && second) return first === second;
  const mobile = (value: string) => value.replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"");
  return Boolean(mobile(a.mobile)) && mobile(a.mobile) === mobile(b.mobile);
}
