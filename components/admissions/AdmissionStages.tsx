"use client";

type Props = {
  student: any;
  reload: () => void;
};

function pillClass(value: string) {
  switch (value) {
    case "YES":
    case "PASS":
    case "SELECTED":
    case "GIVEN":
    case "ADMITTED":
      return "bg-green-600 text-white";

    case "FAIL":
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-500 text-white";

    case "PENDING":
      return "bg-yellow-500 text-white";

    case "NOT_REQUIRED":
      return "bg-blue-500 text-white";

    default:
      return "bg-gray-200 text-gray-700";
  }
}

export default function AdmissionStages({ student, reload }: Props) {
  async function updateStage(field: string, value: string) {
    try {
      const res = await fetch("/api/admissions/stage", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: student.id,
          field,
          value,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to update");

        return;
      }

      reload();
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* APPLICATION */}

      <select
        value={student.application}
        onChange={(e) => updateStage("application", e.target.value)}
        className={`
          px-3
          py-2
          rounded-lg
          text-sm
          font-medium
          border-0
          ${pillClass(student.application)}
        `}
      >
        <option value="YES">YES</option>

        <option value="SUBMITTED">SUBMITTED</option>
      </select>

      {/* ENTRANCE */}

      <select
        value={student.entrance}
        onChange={(e) => updateStage("entrance", e.target.value)}
        className={`
          px-3
          py-2
          rounded-lg
          text-sm
          font-medium
          border-0
          ${pillClass(student.entrance)}
        `}
      >
        <option value="NOT_STARTED">NOT STARTED</option>

        <option value="PENDING">PENDING</option>

        <option value="PASS">PASS</option>

        <option value="FAIL">FAIL</option>

        <option value="NOT_REQUIRED">NOT REQUIRED</option>
      </select>

      {/* INTERVIEW */}

      <select
        value={student.interview}
        onChange={(e) => updateStage("interview", e.target.value)}
        className={`
          px-3
          py-2
          rounded-lg
          text-sm
          font-medium
          border-0
          ${pillClass(student.interview)}
        `}
      >
        <option value="NOT_STARTED">NOT STARTED</option>

        <option value="PENDING">PENDING</option>

        <option value="SELECTED">SELECTED</option>

        <option value="REJECTED">REJECTED</option>
      </select>

      {/* ADMISSION GIVEN */}

      <select
        value={student.admissionGiven}
        onChange={(e) => updateStage("admissionGiven", e.target.value)}
        className={`
          px-3
          py-2
          rounded-lg
          text-sm
          font-medium
          border-0
          ${pillClass(student.admissionGiven)}
        `}
      >
        <option value="NOT_GIVEN">NOT GIVEN</option>

        <option value="GIVEN">GIVEN</option>
      </select>

      {/* FINAL */}

      <select
        value={student.finalAdmission}
        onChange={(e) => updateStage("finalAdmission", e.target.value)}
        className={`
          px-3
          py-2
          rounded-lg
          text-sm
          font-medium
          border-0
          ${pillClass(student.finalAdmission)}
        `}
      >
        <option value="PENDING">PENDING</option>

        <option value="ADMITTED">ADMITTED</option>

        <option value="CANCELLED">CANCELLED</option>
      </select>
    </div>
  );
}
