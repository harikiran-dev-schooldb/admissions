"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, Clock3, RefreshCw } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";

type Item = {
  id: string;
  dueAt: string;
  assignedToEmail: string;
  note: string | null;
  admission: { enquiryNo: string; student: string };
};
type Feed = { data: Item[]; total: number };

const POLL_MS = 60_000;
const storageKey = (email: string) => `schooldb:notifications:read:${email.toLowerCase()}`;

export default function NotificationBell() {
  const { email, role } = useAccess();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const alerted = useRef<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
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
      if ("Notification" in window && Notification.permission === "granted") {
        const now = Date.now();
        for (const item of body.data) {
          const due = new Date(item.dueAt).getTime();
          if (due <= now + 60 * 60 * 1000 && !alerted.current.has(item.id)) {
            alerted.current.add(item.id);
            new Notification(due < now ? "Overdue admission follow-up" : "Admission follow-up due soon", {
              body: `${item.admission.enquiryNo}: ${item.admission.student}`,
              tag: `schooldb-follow-up-${item.id}`,
            });
          }
        }
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

  const unread = useMemo(() => items.filter((item) => !readIds.includes(item.id)), [items, readIds]);
  const count = unread.length;
  function markRead(ids: string[]) {
    if (!email) return;
    const next = Array.from(new Set([...readIds, ...ids])).slice(-500);
    setReadIds(next);
    localStorage.setItem(storageKey(email), JSON.stringify(next));
  }
  async function enableAlerts() {
    setPushError("");
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Background notifications are not supported on this device or browser.");
      }
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") return;
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
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Unable to enable notifications");
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
          const overdue = new Date(item.dueAt).getTime() < Date.now();
          return <button type="button" key={item.id} onClick={() => { markRead([item.id]); setOpen(false); window.location.assign("/admissions"); }}
            className={`block w-full rounded-xl border p-3 text-left hover:border-indigo-300 ${readIds.includes(item.id) ? "border-slate-100 bg-white" : "border-indigo-100 bg-indigo-50/70"}`}>
            <span className="flex items-center gap-1 text-xs font-extrabold text-slate-900"><Clock3 className="size-3.5" />{overdue ? "Overdue task" : "Upcoming task"} · {item.admission.enquiryNo}</span>
            <span className="mt-1 block truncate text-xs font-semibold text-slate-700">{item.admission.student}</span>
            <span className="mt-1 block line-clamp-2 text-xs text-slate-500">{item.note || "Parent follow-up"}</span>
            <span className={`mt-1 block text-[11px] font-bold ${overdue ? "text-rose-700" : "text-indigo-700"}`}>Due {new Date(item.dueAt).toLocaleString()}</span>
          </button>;
        })}
      </div>
      {!pushEnabled && <button type="button" onClick={() => void enableAlerts()} className="mt-3 w-full rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-700">Enable background push notifications</button>}
      {pushEnabled && <button type="button" onClick={() => void disableAlerts()} className="mt-3 w-full rounded-xl bg-slate-50 p-2 text-xs font-bold text-slate-700">Disable background push notifications</button>}
      {pushError && <p role="alert" className="mt-2 text-xs text-rose-600">{pushError}</p>}
      <p className="mt-3 text-[11px] text-slate-500">{pushEnabled ? "Push alerts are subscribed on this device." : "Enable push alerts to receive follow-up reminders."} Read status is stored on this device.</p>
    </div>}
  </div>;
}
