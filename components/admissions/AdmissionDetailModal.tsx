"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardCopy, Download, GraduationCap, MessageCircle, ReceiptText, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import type { Admission } from "@/src/generated/prisma/client";
import { formatAdmissionDob } from "@/lib/admissions/formatAdmissionDob";
import { downloadAdmissionCsv } from "@/services/export.service";
import AdmissionFeePreview from "@/components/admissions/AdmissionFeePreview";
import AdmissionFollowUpManager from "@/components/admissions/AdmissionFollowUpManager";

type Props = {
  student: Admission | null;
  open: boolean;
  onClose: () => void;
  onFollowUpChanged?: () => void;
};

function stageColors(status: string) {
  if (["PASS", "SELECTED", "GIVEN", "ADMITTED", "SUBMITTED"].includes(status))
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["FAIL", "REJECTED", "CANCELLED"].includes(status))
    return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "PENDING") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function DetailCard({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_7px_24px_rgba(15,23,42,.045)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-700">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50/80 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value || "—"}</p>
    </div>
  );
}

function StagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <span className={`mt-2 inline-flex max-w-full rounded-lg border px-3 py-1.5 text-xs font-black tracking-wide ${stageColors(value)}`}>
        {value.replaceAll("_", " ")}
      </span>
    </div>
  );
}

export default function AdmissionDetailModal({ student, open, onClose, onFollowUpChanged }: Props) {
  const [openFeeFor, setOpenFeeFor] = useState<string | null>(null);
  const showFees = Boolean(student && openFeeFor === student.id);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !student) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, student, onClose]);

  if (!open || !student) return null;

  const isAdmitted = student.finalAdmission === "ADMITTED";
  const statusLabel = isAdmitted ? "Admitted" : student.finalAdmission === "CANCELLED" ? "Cancelled" : "In progress";
  const contact = (student.mobile || "").replace(/\D/g, "");
  const whatsappNumber = contact.length === 10 ? "91" + contact : contact;

  function exportDetails() {
    try {
      if (!student) return;
      downloadAdmissionCsv(student);
      toast.success("Admission details exported", { description: "CSV file saved for Excel or Google Sheets." });
    } catch {
      toast.error("Unable to export admission details. Please try again.");
    }
  }

  async function copyEnquiryNo() {
    if (!student) return;
    try {
      await navigator.clipboard.writeText(student.enquiryNo);
      toast.success("Enquiry number copied");
    } catch {
      toast.error("Could not copy the enquiry number");
    }
  }

  function toggleFees() {
    setOpenFeeFor(showFees ? null : student?.id ?? null);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[3px]">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="admission-profile-heading"
        className="relative flex h-full w-full max-w-[920px] flex-col overflow-hidden border-l border-indigo-100 bg-[#f8faff] shadow-[-24px_0_90px_rgba(15,23,42,.22)] sm:w-[min(920px,92vw)]">
        <header className="z-20 flex shrink-0 items-start justify-between gap-4 border-b border-indigo-100 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-indigo-600">Admission profile</p>
            <h2 id="admission-profile-heading" className="mt-1 break-words text-xl font-black tracking-[-.035em] text-slate-950 sm:text-2xl">{student.student}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void copyEnquiryNo()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                title="Copy enquiry number">
                {student.enquiryNo} <ClipboardCopy className="size-3.5" />
              </button>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">{student.admClass} · {student.academicYear}</span>
              <span className={`rounded-lg border px-2.5 py-1.5 text-xs font-black ${stageColors(student.finalAdmission)}`}>{statusLabel}</span>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close admission details"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-indigo-100 hover:text-indigo-800 focus-visible:ring-4 focus-visible:ring-indigo-100">
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:space-y-6 sm:px-7 sm:py-6">
          <section className="rounded-[22px] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 sm:p-5" aria-label="Admission quick actions">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">Quick actions</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700">
                <MessageCircle className="size-4" /> WhatsApp parent
              </a>
              <button type="button" aria-expanded={showFees} aria-controls="admission-fee-preview" onClick={toggleFees}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-extrabold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                <ReceiptText className="size-4" /> {showFees ? "Hide fees" : "View fees"}
              </button>
              <button type="button" onClick={exportDetails}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-violet-700">
                <Download className="size-4" /> Export details (CSV)
              </button>
            </div>
          </section>

          {showFees && <AdmissionFeePreview key={student.id} student={student} onClose={() => setOpenFeeFor(null)} />}

          <DetailCard title="Student information" description="Enquiry details and eligibility" icon={UserRound}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <DataField label="Parent" value={student.parent} />
              <DataField label="Mobile" value={student.mobile} />
              <DataField label="Applied class" value={student.admClass} />
              <DataField label="Date of birth" value={formatAdmissionDob(student.dob)} />
              <DataField label="Age" value={student.age} />
              <DataField label="Eligible class" value={student.eligibleClass} />
            </div>
          </DetailCard>

          <DetailCard title="Admission journey" description="Latest verified stage statuses" icon={GraduationCap}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <StagePill label="Application" value={student.application} />
              <StagePill label="Entrance" value={student.entrance} />
              <StagePill label="Interview" value={student.interview} />
              <StagePill label="Admission given" value={student.admissionGiven} />
              <StagePill label="Final admission" value={student.finalAdmission} />
            </div>
          </DetailCard>

          <AdmissionFollowUpManager key={student.id} admissionId={student.id}
            isOpenAdmission={student.finalAdmission === "PENDING"} onChanged={onFollowUpChanged} />

          <DetailCard title="Record timeline" description="When this enquiry was created and last changed" icon={CalendarDays}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DataField label="Enquiry created" value={new Date(student.enquiryDate).toLocaleString("en-IN")} />
              <DataField label="Last updated" value={new Date(student.updatedAt).toLocaleString("en-IN")} />
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
