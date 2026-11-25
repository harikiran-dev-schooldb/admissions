"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock, CalendarDays, CheckCircle2, ClipboardCopy, Download, GraduationCap,
  Clock3, History, LayoutDashboard, MessageCircle, MessagesSquare, ReceiptText, UserRound, X,
} from "lucide-react";
import { toast } from "sonner";
import type { Admission } from "@/src/generated/prisma/client";
import { formatAdmissionDob } from "@/lib/admissions/formatAdmissionDob";
import { downloadAdmissionCsv } from "@/services/export.service";
import AdmissionFeePreview from "@/components/admissions/AdmissionFeePreview";
import AdmissionFollowUpManager from "@/components/admissions/AdmissionFollowUpManager";
import AdmissionSchedulePanel from "@/components/admissions/AdmissionSchedulePanel";
import AdmissionActivityLogs from "@/components/admissions/AdmissionActivityLogs";
import { getNextAdmissionAction } from "@/lib/admissions/nextAction";

type Props = {
  student: Admission | null;
  open: boolean;
  onClose: () => void;
  onFollowUpChanged?: () => void;
};

const PROFILE_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "journey", label: "Journey", icon: GraduationCap },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
  { id: "followups", label: "Follow-ups", icon: MessagesSquare },
  { id: "fees", label: "Fees", icon: ReceiptText },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "logs", label: "Logs", icon: Clock3 },
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number]["id"];

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
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,.035)] sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-slate-950 sm:text-lg">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/65 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">{value || "—"}</p>
    </div>
  );
}

function StagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <span className={"mt-2 inline-flex max-w-full rounded-lg border px-3 py-1.5 text-xs font-bold " + stageColors(value)}>
        {value.replaceAll("_", " ")}
      </span>
    </div>
  );
}

function indiaDateTime(value: Date | string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AdmissionDetailModal({ student, open, onClose, onFollowUpChanged }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const showFees = activeTab === "fees";

  useEffect(() => {
    if (!open || !student) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      ) ?? []).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, student, onClose]);

  if (!open || !student) return null;

  const nextAction = getNextAdmissionAction(student);
  const isAdmitted = student.finalAdmission === "ADMITTED";
  const statusLabel = isAdmitted ? "Admitted" : student.finalAdmission === "CANCELLED" ? "Cancelled" : "In progress";
  const contact = (student.mobile || "").replace(/\D/g, "");
  const whatsappNumber = contact.length === 10 ? "91" + contact : contact;
  const canMessage = whatsappNumber.length >= 10;

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
    setActiveTab((current) => current === "fees" ? "overview" : "fees");
  }

  function handleTabKeys(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % PROFILE_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = PROFILE_TABS.length - 1;
    else return;
    event.preventDefault();
    const target = PROFILE_TABS[next].id;
    setActiveTab(target);
    dialogRef.current?.querySelector<HTMLButtonElement>("#admission-profile-tab-" + target)?.focus();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="admission-profile-heading"
        className="relative flex h-[100dvh] w-full max-w-[920px] flex-col overflow-hidden border-l border-slate-200 bg-[#f7f8fc] shadow-[-20px_0_70px_rgba(15,23,42,.18)] sm:w-[min(920px,94vw)]">
        <header className="z-20 shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-[max(16px,env(safe-area-inset-top,0px))] sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-base font-bold text-white">
                {(student.student || "?").trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-indigo-600">Student profile</p>
                <h2 id="admission-profile-heading" className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl" title={student.student}>{student.student}</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{student.admClass} · {student.academicYear}</p>
              </div>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close admission details"
              className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-4 focus-visible:ring-indigo-100">
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void copyEnquiryNo()}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" title="Copy enquiry number">
              {student.enquiryNo} <ClipboardCopy className="size-3.5" />
            </button>
            <span className={"rounded-lg border px-2.5 py-1 text-xs font-bold " + stageColors(student.finalAdmission)}>{statusLabel}</span>
          </div>
        </header>

        <div role="tablist" aria-label="Admission profile sections"
          className="z-10 flex shrink-0 snap-x gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 sm:gap-1.5 sm:px-6">
          {PROFILE_TABS.map(({ id, label, icon: Icon }, index) => (
            <button type="button" key={id} id={"admission-profile-tab-" + id} role="tab"
              aria-selected={activeTab === id} aria-controls="admission-profile-panel"
              tabIndex={activeTab === id ? 0 : -1} onKeyDown={(event) => handleTabKeys(event, index)}
              onClick={() => setActiveTab(id)}
              className={"flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm " +
                (activeTab === id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div id="admission-profile-panel" role="tabpanel" aria-labelledby={"admission-profile-tab-" + activeTab}
          tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(20px,env(safe-area-inset-bottom,0px))] sm:px-7 sm:py-6">
          <div className="mx-auto max-w-[850px] space-y-4 sm:space-y-5">
            {activeTab === "overview" && (
              <>
                <section aria-label="Admission quick actions" className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {canMessage ? (
                      <a href={"https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("Dear Parent, thank you for your admission enquiry (" + student.enquiryNo + "). Please contact the school admission office for the next steps. Thank you.")} target="_blank" rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                        <MessageCircle className="size-4" /> WhatsApp parent
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-500">No WhatsApp number</span>
                    )}
                    <button type="button" aria-expanded={showFees} aria-controls="admission-profile-panel" onClick={toggleFees}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100">
                      <ReceiptText className="size-4" /> View fees
                    </button>
                    <button type="button" onClick={exportDetails}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      <Download className="size-4" /> Export CSV
                    </button>
                  </div>
                </section>
                <DetailCard title="Student information" description="Contact and eligibility details" icon={UserRound}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <DataField label="Parent" value={student.parent} />
                    <DataField label="Mobile" value={student.mobile} />
                    <DataField label="Applied class" value={student.admClass} />
                    <DataField label="Date of birth" value={formatAdmissionDob(student.dob)} />
                    <DataField label="Age" value={student.age} />
                    <DataField label="Eligible class" value={student.eligibleClass} />
                  </div>
                </DetailCard>
                <button type="button" onClick={() => setActiveTab("journey")}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-800 hover:bg-indigo-100">
                  <span>View all five admission stages</span>
                  <GraduationCap className="size-5" />
                </button>
              </>
            )}

            {activeTab === "journey" && (
              <>
                <DetailCard title="Admission journey" description="Latest verified stage statuses" icon={GraduationCap}>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <StagePill label="Application" value={student.application} />
                    <StagePill label="Entrance" value={student.entrance} />
                    <StagePill label="Interview" value={student.interview} />
                    <StagePill label="Admission given" value={student.admissionGiven} />
                    <StagePill label="Final admission" value={student.finalAdmission} />
                  </div>
                </DetailCard>
                <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Next workflow step · {nextAction.stage}</p>
                  <p className="mt-1 font-semibold text-slate-900">{nextAction.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{nextAction.description}</p>
                  {student.finalAdmission === "PENDING" && (
                    <button type="button" onClick={() => setActiveTab("followups")}
                      className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-indigo-200 bg-white px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                      Assign an owner and due date in Parent follow-ups
                    </button>
                  )}
                </section>
              </>
            )}

            {activeTab === "appointments" && (
              <AdmissionSchedulePanel key={student.id} student={student} onChanged={onFollowUpChanged} />
            )}

            {activeTab === "followups" && (
              <AdmissionFollowUpManager key={student.id} admissionId={student.id}
                isOpenAdmission={student.finalAdmission === "PENDING"} onChanged={onFollowUpChanged} />
            )}

            {activeTab === "fees" && (
              <AdmissionFeePreview key={student.id} student={student} onClose={() => setActiveTab("overview")} />
            )}

            {activeTab === "logs" && (
              <AdmissionActivityLogs key={student.id} admissionId={student.id} />
            )}

            {activeTab === "timeline" && (
              <DetailCard title="Record timeline" description="All times shown in Indian Standard Time" icon={CalendarDays}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DataField label="Enquiry created" value={indiaDateTime(student.enquiryDate)} />
                  <DataField label="Last updated" value={indiaDateTime(student.updatedAt)} />
                </div>
              </DetailCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
