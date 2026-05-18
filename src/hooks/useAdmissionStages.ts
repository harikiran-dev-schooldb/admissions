"use client";

export function useAdmissionStages() {
  async function updateStage(
    enquiryNo: string,
    field: string,
    value: string
  ) {
    try {
      const res = await fetch("/api/admissions/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryNo,
          field,
          value,
        }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  return {
    updateStage,
  };
}