"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, Clock3, RefreshCw } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "sonner";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

type Item = {
  id: string;
  dueAt: string;
  assignedToEmail: string;
  note: string | null;
  admission: { enquiryNo: string; student: string };
  kind?: "EVENT" | "FOLLOW_UP";
  title?: string;
  href?: string;
  readAt?: string | null;
};
type Feed = { data: Item[]; total: number; mutedDue?: boolean; mutedOverdue?: boolean };

const POLL_MS = 60_000;
const storageKey = (email: string) => `schooldb:notifications:read:${email.toLowerCase()}`;
const popupKey = (email: string) => `schooldb:notifications:popups:${email.toLowerCase()}`;

export default function NotificationBell() {
  const { email, role } = useAccess();
  const [open, setOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const alerted = useRef<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testFeedback, setTestFeedback] = useState("");
  const [pushError, setPushError] = useState("");
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!email) { setReadIds([]); return; }
    try { setReadIds(JSON.parse(localStorage.getItem(storageKey(email)) || "[]")); }
    catch { setReadIds([]); }
    if ("Notification" in window) setPermission(Notification.permission);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.getRegistration("/push-sw.js").then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    }).catch(() => setPushEnabled(false));
  }, [email]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const refresh = useCallback(async () => {
    if (!email || (role !== "staff" && role !== "admin")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Notifications unavailable");
      const body: Feed = await response.json();
      setItems(body.data);
      setTotal(body.total);
      // In-app popups work on iPhone PWAs too. The Notification constructor used
      // previously is unsupported in iOS web apps and silently lost alerts.
      const now = Date.now();
      const seenKey = popupKey(email);
      let seen: Record<string, number> = {};
      try {
        const parsed = JSON.parse(localStorage.getItem(seenKey) ?? "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) seen = parsed;
      } catch { /* Ignore corrupted local popup history. */ }
      let read: string[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(storageKey(email)) ?? "[]");
        if (Array.isArray(parsed)) read = parsed;
      } catch { /* Unread state will be fetched separately. */ }
      const newDue = body.data.filter((item) => {
        if (item.kind === "EVENT") return false;
        const due = new Date(item.dueAt).getTime();
        if (!Number.isFinite(due) || due > now + 60 * 60 * 1000 || read.includes(item.id)) return false;
        const kind = due <= now ? "OVERDUE" : "DUE_SOON";
        if (kind === "OVERDUE" ? body.mutedOverdue : body.mutedDue) return false;
        const id = `${item.id}:${kind}`;
        if (alerted.current.has(id) || seen[id]) return false;
        alerted.current.add(id);
        seen[id] = now;
        return true;
      });
      const freshEvents = body.data.filter((item) => {
        if (item.kind !== "EVENT" || item.readAt || read.includes(item.id)) return false;
        if (alerted.current.has(item.id) || seen[item.id]) return false;
        alerted.current.add(item.id);
        seen[item.id] = now;
        return true;
      });
      if (freshEvents.length) {
        const firstEvent = freshEvents[0];
        toast.info(freshEvents.length > 1 ? `${freshEvents.length} SchoolDB admission updates` : (firstEvent.title || "SchoolDB update"), {
          description: firstEvent.note || "View your latest admission updates",
          action: { label: "Open", onClick: () => window.location.assign(firstEvent.href || "/admissions") },
          duration: 9000,
        });
      }
      if (newDue.length) {
        const first = newDue[0];
        const overdue = new Date(first.dueAt).getTime() <= now;
        toast.warning(newDue.length > 1 ? `${newDue.length} admission follow-ups need attention` :
          overdue ? "Overdue admission follow-up" : "Admission follow-up due soon", {
          description: `${first.admission.enquiryNo}: ${first.admission.student}`,
          action: { label: "Open", onClick: () => window.location.assign("/admissions") },
          duration: 9000,
        });
      }
      if (newDue.length || freshEvents.length) {
        try {
          localStorage.setItem(seenKey, JSON.stringify(Object.entries(seen)
            .filter(([, timestamp]) => typeof timestamp === "number" && now - timestamp < 7 * 24 * 60 * 60 * 1000)
            .slice(-500).reduce<Record<string, number>>((acc, [key, timestamp]) => {
              acc[key] = timestamp;
              return acc;
            }, {})));
        } catch { /* Storage may be unavailable; session ref still prevents repeats. */ }
      }
    } catch {
      // Keep the last successfully loaded feed on transient network errors.
    } finally { setLoading(false); }
  }, [email, role]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  const unread = useMemo(() => items.filter((item) =>
    !readIds.includes(item.id) && (item.kind !== "EVENT" || !item.readAt)), [items, readIds]);
  const count = unread.length;
  function markRead(ids: string[]) {
    if (!email) return;
    const next = Array.from(new Set([...readIds, ...ids])).slice(-500);
    setReadIds(next);
    localStorage.setItem(storageKey(email), JSON.stringify(next));
    const eventIds = ids.filter((id) => id.startsWith("event:"));
    if (eventIds.length) {
      void fetch("/api/notifications", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: eventIds }),
      }).then((response) => {
        if (!response.ok) throw new Error("Could not save read state");
      }).catch(() => { /* The next refresh will reconcile the server state. */ });
    }
  }
  async function enableAlerts() {
    setPushError("");
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Background notifications are not supported on this device or browser.");
      }
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setPushError(permissionResult === "denied"
          ? "Notifications are blocked in device settings. Allow notifications for SchoolDB, then retry."
          : "Allow notification permission to receive phone pop-ups.");
        return;
      }
      const keyResponse = await fetch("/api/notifications/subscriptions", { cache: "no-store" });
      if (!keyResponse.ok) throw new Error("Push setup unavailable");
      const { publicKey } = await keyResponse.json();
      if (!publicKey) throw new Error("Push server keys are not configured yet.");
      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const key = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: key,
      });
      const response = await fetch("/api/notifications/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("Could not save push subscription.");
      setPushEnabled(true);
      setTestFeedback("");
      toast.success("Push alerts enabled", { description: "Use Send test notification to verify the device banner." });
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Unable to enable notifications");
    }
  }
  async function sendTestPush() {
    setPushError("");
    setTestFeedback("");
    setTestingPush(true);
    try {
      const response = await fetch("/api/notifications/test", { method: "POST", cache: "no-store" });
      const body: { error?: string; message?: string; accepted?: number } = await response.json();
      if (!response.ok) throw new Error(body.error || "Test push delivery failed");
      setTestFeedback(body.message || "Push provider accepted the test notification.");
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Unable to test notifications.");
    } finally {
      setTestingPush(false);
    }
  }

  async function disableAlerts() {
    setPushError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/notifications/subscriptions", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error("Could not remove push subscription.");
        await subscription.unsubscribe();
      }
      setPushEnabled(false);
      setTestFeedback("");
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Unable to disable notifications");
    }
  }

  if (!email || (role !== "admin" && role !== "staff")) return null;
  return <div ref={popoverRef} className="relative z-50">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications, ${count} unread`}
      aria-expanded={open} className="relative grid size-11 place-items-center rounded-[15px] border border-indigo-100 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50">
      {count ? <BellRing className="size-5" /> : <Bell className="size-5" />}
      {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{count > 9 ? "9+" : count}</span>}
    </button>
    {open && <div role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-[calc(4.5rem+10px)] z-[80] max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-[22px] border border-indigo-100 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,.2)] lg:absolute lg:inset-x-auto lg:right-0 lg:top-[calc(100%+10px)] lg:w-[min(360px,calc(100vw-24px))] lg:max-h-[min(80dvh,620px)]">
      <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-black text-slate-900">Notifications</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => void refresh()} aria-label="Refresh notifications" className="rounded-lg p-2 hover:bg-slate-100"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button type="button" onClick={() => markRead(items.map((item) => item.id))} aria-label="Mark all notifications as read" className="rounded-lg p-2 hover:bg-slate-100"><CheckCheck className="size-4" /></button>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">{total} open tasks · {count} unread in this list</p>
      <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto">
        {!items.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No open tasks assigned to you.</p>}
        {items.map((item) => {
          const isEvent = item.kind === "EVENT";
          const overdue = !isEvent && new Date(item.dueAt).getTime() < Date.now();
          return <button type="button" key={item.id} onClick={() => { markRead([item.id]); setOpen(false); window.location.assign(item.href || "/admissions"); }}
            className={`block w-full rounded-xl border p-3 text-left hover:border-indigo-300 ${readIds.includes(item.id) ? "border-slate-100 bg-white" : "border-indigo-100 bg-indigo-50/70"}`}>
            <span className="flex items-center gap-1 text-xs font-extrabold text-slate-900"><Clock3 className="size-3.5" />{isEvent ? item.title : `${overdue ? "Overdue task" : "Upcoming task"} · ${item.admission.enquiryNo}`}</span>
            {!isEvent && <span className="mt-1 block truncate text-xs font-semibold text-slate-700">{item.admission.student}</span>}
            <span className="mt-1 block line-clamp-2 text-xs text-slate-500">{item.note || "Parent follow-up"}</span>
            <span className={`mt-1 block text-[11px] font-bold ${overdue ? "text-rose-700" : "text-indigo-700"}`}>{isEvent ? new Date(item.dueAt).toLocaleString() : `Due ${new Date(item.dueAt).toLocaleString()}`}</span>
          </button>;
        })}
      </div>
      <button type="button" aria-expanded={preferencesOpen} onClick={() => setPreferencesOpen((value) => !value)}
        className="mt-3 w-full rounded-xl border border-indigo-200 bg-white p-2 text-xs font-bold text-indigo-700">
        {preferencesOpen ? "Hide notification settings" : "Notification settings"}
      </button>
      {preferencesOpen && <NotificationPreferences />}
      {!pushEnabled && <button type="button" onClick={() => void enableAlerts()} className="mt-3 w-full rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-700">Enable background push notifications</button>}
      {pushEnabled && <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void sendTestPush()} disabled={testingPush}
          className="rounded-xl bg-indigo-600 p-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          {testingPush ? "Sending test…" : "Send test pop-up"}
        </button>
        <button type="button" onClick={() => void disableAlerts()}
          className="rounded-xl bg-slate-50 p-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
          Disable push
        </button>
      </div>}
      {pushEnabled && permission !== "granted" && <p role="status" className="mt-2 text-xs font-semibold text-amber-700">This device has not granted notification permission. Allow SchoolDB notifications in your browser or phone Settings.</p>}
      {testFeedback && <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">{testFeedback}</p>}
      {pushError && <p role="alert" className="mt-2 text-xs text-rose-600">{pushError}</p>}
      <p className="mt-3 text-[11px] text-slate-500">{pushEnabled ? "This browser has a push subscription. Send a test to verify delivery and system notification permissions." : "Phone banners need permission, an installed iPhone Home Screen app, and a subscription for the assigned account."} Reminders appear for follow-ups assigned to your signed-in email.</p>
    </div>}
  </div>;
}
