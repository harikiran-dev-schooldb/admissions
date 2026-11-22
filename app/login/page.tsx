"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useAccess } from "@/hooks/useAccess";

const RESEND_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const { refreshAccess, notifyAuthChange } = useAccess();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (loading || resendSeconds > 0) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized.length > 254) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email: normalized,
        type: "sign-in",
      });
      if (sendError) throw new Error(sendError.message || "Unable to send a code");
      setEmail(normalized);
      setCode("");
      setStep("otp");
      setResendSeconds(RESEND_SECONDS);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send a code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const otp = code.trim();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: signInError } = await authClient.signIn.emailOtp({ email, otp });
      if (signInError) throw new Error(signInError.message || "Verification failed");
      // Resolve the authenticated user's workspace role once before entering the app.
      // A valid OTP alone must never grant workspace access.
      await refreshAccess();
      notifyAuthChange("login");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/admissions");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Incorrect or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="premium-hero relative m-5 hidden overflow-hidden rounded-[36px] p-12 text-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_14px_32px_rgba(79,70,229,.35)]"><GraduationCap /></div>
          <div><p className="text-xl font-black tracking-tight">SchoolDB</p><p className="text-sm font-bold uppercase tracking-[.12em] text-indigo-200">Admissions Console</p></div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[.18em] text-indigo-200">Admissions 2026–27</p>
          <h1 className="text-5xl font-black leading-[1.08] tracking-[-.045em]">From first enquiry to confirmed admission, in one workspace.</h1>
          <p className="mt-6 max-w-lg text-base leading-7">Secure passwordless access for the admissions team. Enter your email and verify a one-time code to sign in.</p>
        </div>
        <p className="relative text-xs font-semibold text-slate-500">SchoolDB · Admissions Management</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"><GraduationCap /></div>
            <div><p className="font-black">SchoolDB</p><p className="text-xs text-indigo-500">Admissions Console</p></div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-[#252a36] p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,.26)] sm:p-9">
            <div className="mb-8">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-300/15">{step === "email" ? <Mail /> : <KeyRound />}</div>
              <h1 className="text-3xl font-black tracking-[-.04em]">{step === "email" ? "Sign in with email" : "Check your email"}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {step === "email"
                  ? "We'll email a six-digit, one-time sign-in code. No password is needed."
                  : <>Enter the six-digit code sent to <span className="font-semibold text-white">{email}</span>. If this email has access, you should receive a code.</>}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={(event) => void requestCode(event)} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-200">Email address</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input required autoComplete="email" type="email" maxLength={254} value={email}
                      onChange={(event) => setEmail(event.target.value)} placeholder="staff@school.edu"
                      className="h-13 w-full rounded-2xl border border-white/10 bg-[#0b1020] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </label>
                {error && <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">{error}</p>}
                <button disabled={loading || !email.trim()} className="premium-button h-13 w-full justify-center px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><Loader2 className="size-4 animate-spin" /> Sending code…</> : <>Send email code <ArrowRight className="size-4" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={(event) => void verifyCode(event)} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-200">Verification code</span>
                  <input required autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" aria-label="Six-digit verification code"
                    className="h-16 w-full rounded-2xl border border-white/10 bg-[#0b1020] px-5 text-center text-3xl font-bold tracking-[.35em] text-white outline-none placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
                </label>
                {error && <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">{error}</p>}
                <button disabled={loading || code.length !== 6} className="premium-button h-13 w-full justify-center px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><Loader2 className="size-4 animate-spin" /> Verifying…</> : <>Verify & sign in <ArrowRight className="size-4" /></>}
                </button>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button type="button" disabled={loading} onClick={() => { setStep("email"); setCode(""); setError(""); setResendSeconds(0); }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-50"><ArrowLeft className="size-4" />Change email</button>
                  <button type="button" disabled={loading || resendSeconds > 0} onClick={() => void requestCode()}
                    className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 disabled:text-slate-500">
                    {resendSeconds ? `Resend in ${resendSeconds}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><ShieldCheck className="size-4" /> Protected SchoolDB Admissions workspace</p>
        </div>
      </section>
    </main>
  );
}
