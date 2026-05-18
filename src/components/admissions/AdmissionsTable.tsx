import { Admission } from "@/src/types/admission";
import AdmissionRow from "./AdmissionRow";

type Props = {
  students: Admission[];
};

export default function AdmissionsTable({ students }: Props) {
  if (students.length === 0) {
    return (
      <div className="p-5 text-center text-gray-500">No records found</div>
    );
  }

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Enquiry</th>
            <th className="p-3 text-left">Student</th>
            <th className="p-3 text-left">Parent</th>
            <th className="p-3 text-left">Class</th>
            <th className="p-3 text-left">Mobile</th>
            <th className="p-3 text-left">Age</th>
            <th className="p-3 text-left">Application</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <AdmissionRow key={student.enquiryNo} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
