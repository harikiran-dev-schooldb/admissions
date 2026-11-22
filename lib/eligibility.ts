function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function calculateAge(dob: string, asOfDate?: string) {
  if (!dob) {
    return null;
  }

  const birthDate = parseLocalDate(dob);
  const today = asOfDate ? parseLocalDate(asOfDate) : new Date();
  if (!birthDate || !today || birthDate > today) return null;

  let years = today.getFullYear() - birthDate.getFullYear();

  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    text: `${years} Years ${months} Months`,
  };
}

export function getEligibleClass(age: number) {
  const map: Record<number, string> = {
    3: "PRE KG",
    4: "LKG",
    5: "UKG",
    6: "I",
    7: "II",
    8: "III",
    9: "IV",
    10: "V",
    11: "VI",
    12: "VII",
    13: "VIII",
    14: "IX",
    15: "X",
  };

  return map[age] || "NOT ELIGIBLE";
}
