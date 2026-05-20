"use client";

import { useMemo, useState } from "react";

type EligibilityResult = {
  eligibleClass: string;
  calculatedAge: string;
  status: "ELIGIBLE" | "NOT_ELIGIBLE";
};

function calculateAge(dob: string) {
  const birth = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();

  let months = today.getMonth() - birth.getMonth();

  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;

    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;

    months += 12;
  }

  return {
    years,
    months,
    days,
    text: `${years} years, ${months} months, ${days} days`,
  };
}

function getEligibleClass(years: number) {
  if (years >= 2 && years < 3) return "PRE KG";

  if (years >= 3 && years < 4) return "LKG";

  if (years >= 4 && years < 5) return "UKG";

  if (years >= 5 && years < 6) return "I";

  if (years >= 6 && years < 7) return "II";

  if (years >= 7 && years < 8) return "III";

  if (years >= 8 && years < 9) return "IV";

  if (years >= 9 && years < 10) return "V";

  if (years >= 10 && years < 11) return "VI";

  if (years >= 11 && years < 12) return "VII";

  if (years >= 12 && years < 13) return "VIII";

  if (years >= 13 && years < 14) return "IX";

  if (years >= 14 && years < 15) return "X";

  return "NOT ELIGIBLE";
}

export default function EligibilityPage() {
  const [parent, setParent] = useState("");

  const [student, setStudent] = useState("");

  const [mobile, setMobile] = useState("");

  const [admClass, setAdmClass] = useState("");

  const [dob, setDob] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<EligibilityResult | null>(null);

  const ageData = useMemo(() => {
    if (!dob) return null;

    return calculateAge(dob);
  }, [dob]);

  function checkEligibility() {
    if (!dob || !ageData) return;

    const eligibleClass = getEligibleClass(ageData.years);

    setResult({
      eligibleClass,
      calculatedAge: ageData.text,
      status: eligibleClass === "NOT ELIGIBLE" ? "NOT_ELIGIBLE" : "ELIGIBLE",
    });
  }

  async function proceedToAdmission() {
    if (!result) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admissions", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          parent,
          student,
          mobile,
          dob,

          age: result.calculatedAge,

          admClass,

          eligibleClass: result.eligibleClass,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to create admission");

        return;
      }

      alert("Admission created successfully");

      setParent("");
      setStudent("");
      setMobile("");
      setDob("");
      setAdmClass("");
      setResult(null);
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div
        className="
          max-w-3xl
          mx-auto
          bg-white
          rounded-2xl
          shadow-sm
          p-8
        "
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Eligibility Check</h1>

          <p className="text-gray-500 mt-2">
            Student enquiry and admission entry
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            placeholder="Parent Name"
            className="
              border
              rounded-lg
              px-4
              py-3
            "
          />

          <input
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            placeholder="Student Name"
            className="
              border
              rounded-lg
              px-4
              py-3
            "
          />

          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Mobile Number"
            className="
              border
              rounded-lg
              px-4
              py-3
            "
          />

          <select
            value={admClass}
            onChange={(e) => setAdmClass(e.target.value)}
            className="
              border
              rounded-lg
              px-4
              py-3
            "
          >
            <option value="">Select Class</option>

            <option>PRE KG</option>
            <option>LKG</option>
            <option>UKG</option>
            <option>I</option>
            <option>II</option>
            <option>III</option>
            <option>IV</option>
            <option>V</option>
            <option>VI</option>
            <option>VII</option>
            <option>VIII</option>
            <option>IX</option>
            <option>X</option>
          </select>

          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium">
              Date of Birth
            </label>

            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="
                w-full
                border
                rounded-lg
                px-4
                py-3
              "
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={checkEligibility}
            className="
              bg-sky-600
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            Check Eligibility
          </button>

          {result && result.status === "ELIGIBLE" && (
            <button
              disabled={loading}
              onClick={proceedToAdmission}
              className="
                  bg-green-600
                  text-white
                  px-6
                  py-3
                  rounded-lg
                "
            >
              {loading ? "Saving..." : "Proceed to Admission"}
            </button>
          )}
        </div>

        {result && (
          <div
            className="
              mt-8
              border
              rounded-xl
              p-6
              bg-gray-50
            "
          >
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Calculated Age:</span>{" "}
                {result.calculatedAge}
              </div>

              <div>
                <span className="font-semibold">Eligible Class:</span>{" "}
                {result.eligibleClass}
              </div>

              <div>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={
                    result.status === "ELIGIBLE"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {result.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
