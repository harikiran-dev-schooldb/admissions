export function getAgeString(dobStr: string) {
  if (!dobStr) return "";

  const parts = dobStr.split("-");

  const dob =
    parts[0].length === 4
      ? new Date(dobStr)
      : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);

  if (isNaN(dob.getTime())) return "";

  const now = new Date();

  let y = now.getFullYear() - dob.getFullYear();
  let m = now.getMonth() - dob.getMonth();
  let d = now.getDate() - dob.getDate();

  if (d < 0) {
    m--;

    d += new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    ).getDate();
  }

  if (m < 0) {
    y--;
    m += 12;
  }

  return `${y} years, ${m} months, ${d} day(s)`;
}