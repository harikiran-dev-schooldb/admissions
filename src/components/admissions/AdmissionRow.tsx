"use client";

import { useAdmissionStages } from "@/src/hooks/useAdmissionStages";
import { Admission } from "@/src/types/admission";
import { getAgeString } from "@/src/utils/age";
import StatusPill from "./StatusPill";

type Props = {
  student: Admission;
};

export default function AdmissionRow({ student }: Props) {
  const { updateStage } = useAdmissionStages();

  return (
    <tr className="hover:bg-gray-50 border-b">
      <td className="p-3">{student.enquiryNo}</td>

      <td className="p-3">{student.student}</td>

      <td className="p-3">{student.parent}</td>

      <td className="p-3">{student.admClass}</td>

      <td className="p-3">{student.mobile}</td>

      <td className="p-3">{getAgeString(student.dob)}</td>

      <td className="p-3">
        <StatusPill
          value={student.application || "NO"}
          onClick={() =>
            updateStage(
              student.enquiryNo,
              "application",
              student.application === "YES" ? "NO" : "YES",
            )
          }
        />
      </td>
    </tr>
  );
}
