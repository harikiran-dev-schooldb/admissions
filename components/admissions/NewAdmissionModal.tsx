"use client";

import { useMemo, useState } from "react";

import { Calendar, CheckCircle2, Loader2, Phone, User, X } from "lucide-react";

import { calculateAge, getEligibleClass } from "@/lib/eligibility";
import NewFeeModal from "../fees/NewFeeModal";

type Props = {
  open: boolean;
  onClose: () => void;
  reload: () => void;
};

export default function NewAdmissionModal({ open, onClose, reload }: Props) {
  const [dob, setDob] = useState("");

  const [student, setStudent] = useState("");

  const [parent, setParent] = useState("");

  const [mobile, setMobile] = useState("");

  const [admClass, setAdmClass] = useState("");

  const [loading, setLoading] = useState(false);
  const [showFees, setShowFees] = useState(false);

  const ageData = useMemo(() => {
    if (!dob) return null;

    return calculateAge(dob);
  }, [dob]);

  const eligibleClass = useMemo(() => {
    if (!ageData) return "";

    return getEligibleClass(ageData.years);
  }, [ageData]);

  async function createAdmission() {
    try {
      setLoading(true);

      const res = await fetch("/api/admissions/create", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          student,
          parent,
          mobile,
          dob,
          age: ageData?.text,
          admClass,
          eligibleClass,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed");

        return;
      }

      reload();

      onClose();
      setShowFees(true);

      setAdmClass("");
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCloseFees() {
    setShowFees(false);

    onClose();

    setStudent("");

    setParent("");

    setMobile("");

    setDob("");

    setAdmClass("");
  }

  if (!open) return null;

  return (
    <>
      <div
        className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        backdrop-blur-sm
        p-4
      "
      >
        <div
          className="
          relative
          w-full
          max-w-3xl
          overflow-hidden
          rounded-[32px]
          bg-white
          shadow-2xl
          animate-in
          zoom-in-95
          duration-300
        "
        >
          {/* HEADER */}

          <div
            className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            bg-gradient-to-r
            from-blue-600
            to-blue-500
            px-8
            py-6
            text-white
          "
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                New Admission
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                Create new enquiry & admission workflow
              </p>
            </div>

            <button
              onClick={onClose}
              className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white/20
              transition-all
              hover:bg-white/30
            "
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* BODY */}

          <div className="space-y-8 p-8">
            {/* ELIGIBILITY */}

            <div
              className="
              rounded-3xl
              border
              border-slate-200
              bg-slate-50
              p-6
            "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                  rounded-2xl
                  bg-blue-100
                  p-3
                  text-blue-600
                "
                >
                  <Calendar className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Eligibility Check
                  </h3>

                  <p className="text-sm text-slate-500">
                    Calculate student age & eligible class
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="
                    h-14
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    outline-none
                    transition-all
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Calculated Age
                  </label>

                  <div
                    className="
                    flex
                    h-14
                    items-center
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    font-semibold
                    text-slate-700
                  "
                  >
                    {ageData?.text || "-"}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Eligible Class
                  </label>

                  <div
                    className="
                    flex
                    h-14
                    items-center
                    rounded-2xl
                    border
                    border-blue-200
                    bg-blue-50
                    px-4
                    font-bold
                    text-blue-700
                  "
                  >
                    {eligibleClass || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* ENQUIRY DETAILS */}

            <div
              className="
              rounded-3xl
              border
              border-slate-200
              bg-slate-50
              p-6
            "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                  rounded-2xl
                  bg-emerald-100
                  p-3
                  text-emerald-600
                "
                >
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Parent Enquiry
                  </h3>

                  <p className="text-sm text-slate-500">
                    Enter student & parent details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Student Name
                  </label>

                  <input
                    value={student}
                    onChange={(e) => setStudent(e.target.value.toUpperCase())}
                    placeholder="Enter student name"
                    className="
                    h-14
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    outline-none
                    transition-all
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Parent Name
                  </label>

                  <input
                    value={parent}
                    onChange={(e) => setParent(e.target.value.toUpperCase())}
                    placeholder="Enter parent name"
                    className="
                    h-14
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    outline-none
                    transition-all
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Mobile Number
                  </label>

                  <div className="relative">
                    <Phone
                      className="
                      absolute
                      left-4
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-slate-400
                    "
                    />

                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter mobile number"
                      className="
                      h-14
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      pl-12
                      pr-4
                      outline-none
                      transition-all
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Admission Class
                  </label>

                  <select
                    value={admClass}
                    onChange={(e) => setAdmClass(e.target.value)}
                    className="
    h-14
    w-full
    rounded-2xl
    border
    border-slate-200
    bg-white
    px-4
    text-sm
    font-semibold
    text-slate-700
    outline-none
    transition-all
    focus:border-blue-500
    focus:ring-4
    focus:ring-blue-100
  "
                  >
                    <option value="">Select Class</option>

                    <option value="PRE KG">PRE KG</option>

                    <option value="LKG">LKG</option>

                    <option value="UKG">UKG</option>

                    <option value="I">I</option>

                    <option value="II">II</option>

                    <option value="III">III</option>

                    <option value="IV">IV</option>

                    <option value="V">V</option>

                    <option value="VI">VI</option>

                    <option value="VII">VII</option>

                    <option value="VIII">VIII</option>

                    <option value="IX">IX</option>

                    <option value="X">X</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="
                rounded-2xl
                border
                border-slate-200
                px-6
                py-3
                font-semibold
                text-slate-700
                transition-all
                hover:bg-slate-100
              "
              >
                Cancel
              </button>

              <button
                onClick={createAdmission}
                disabled={loading}
                className="
                flex
                items-center
                gap-2
                rounded-2xl
                bg-blue-600
                px-7
                py-3
                font-semibold
                text-white
                shadow-lg
                shadow-blue-200
                transition-all
                hover:scale-105
                hover:bg-blue-700
                disabled:opacity-50
              "
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-5 w-5" />
                Proceed to Admission
              </button>
            </div>
          </div>
        </div>
      </div>

      <NewFeeModal open={showFees} onClose={handleCloseFees} reload={reload} />
    </>
  );
}
