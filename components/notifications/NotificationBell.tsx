"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!email) { setReadIds([]); return; }
    try { setReadIds(JSON.parse(localStorage.getItem(storageKey(email)) || "[]")); }
    catch { setReadIds([]); }
    if ("Notification" in window) setPermission(Notification.permission);
  }, [email]);

  const refresh = useCallback(async () => {
    if (!email || (role !== "staff" && role !== "admin")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Notifications unavailable");
      const body: Feed = await response.json();
      setItems(body.data);
      setTotal(body.total);
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
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (!email || (role !== "admin" && role !== "staff")) return null;
  return <div className="relative z-50">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications, ${count} unread`}
      aria-expanded={open} className="relative grid size-11 place-items-center rounded-[15px] border border-indigo-100 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50">
      {count ? <BellRing className="size-5" /> : <Bell className="size-5" />}
      {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{count > 9 ? "9+" : count}</span>}
    </button>
    {open && <div className="absolute right-0 top-[calc(100%+10px)] w-[min(360px,calc(100vw-24px))] rounded-[22px] border border-indigo-100 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,.2)]">
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
      {permission === "default" && <button type="button" onClick={() => void enableAlerts()} className="mt-3 w-full rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-700">Allow device notifications</button>}
      <p className="mt-3 text-[10px] text-slate-400">Updates while signed in. Read state is saved on this device. Background push is not enabled.</p>
    </div>}
  </div>;
}
