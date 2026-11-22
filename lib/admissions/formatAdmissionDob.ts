/** Display imported DD-MM-YY/DD-MM-YYYY dates without ambiguous JavaScript parsing. */
export function formatAdmissionDob(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  let day: number, month: number, year: number;
  const imported = /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/.exec(trimmed);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (imported) {
    day = Number(imported[1]);
    month = Number(imported[2]);
    year = Number(imported[3]);
    if (imported[3].length === 2) year += 2000;
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return trimmed;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return trimmed;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
