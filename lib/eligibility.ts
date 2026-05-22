export function calculateAge(dob: string) {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);

  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

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