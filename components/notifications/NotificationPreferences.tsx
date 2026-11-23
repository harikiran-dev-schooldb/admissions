"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Preference = {
  type: string; label: string; description: string;
  inAppEnabled: boolean; pushEnabled: boolean;
};

export default function NotificationPreferences() {
  const [items, setItems] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/notifications/preferences", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load notification preferences");
        if (!controller.signal.aborted) setItems(body.data ?? []);
      })
      .catch((caught) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load settings"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function update(item: Preference, field: "inAppEnabled" | "pushEnabled", value: boolean) {
    setError("");
    setSaving(item.type);
    const next = { ...item, [field]: value };
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, inAppEnabled: next.inAppEnabled, pushEnabled: next.pushEnabled }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not update preferences");
      }
      setItems((old) => old.map((option) => option.type === item.type ? next : option));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save notification setting");
    } finally {
      setSaving("");
    }
  }

  return (
    <section aria-label="Notification preferences" className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/35 p-3">
      <h3 className="text-sm font-black text-slate-900">Notification preferences</h3>
      <p className="mt-1 text-[11px] text-slate-500">Choose which alerts appear in SchoolDB and which send phone push. Your role controls available types.</p>
      {loading && <p className="mt-3 text-xs text-slate-500">Loading preferences…</p>}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      {!loading && <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_52px_52px] gap-2 text-right text-[10px] font-bold text-slate-500">
          <span className="text-left">Alert</span><span>In-app</span><span>Push</span>
        </div>
        {items.map((item) => (
          <div key={item.type} className="grid grid-cols-[minmax(0,1fr)_52px_52px] items-center gap-2 rounded-lg bg-white p-2">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800">{item.label}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{item.description}</p>
            </div>
            <label className="flex justify-center" title={`In-app: ${item.label}`}>
              <input type="checkbox" aria-label={`In-app: ${item.label}`} checked={item.inAppEnabled}
                disabled={Boolean(saving)} onChange={(event) => void update(item, "inAppEnabled", event.target.checked)}
                className="size-4 accent-indigo-600" />
            </label>
            <label className="flex justify-center" title={`Push: ${item.label}`}>
              <input type="checkbox" aria-label={`Push: ${item.label}`} checked={item.pushEnabled}
                disabled={Boolean(saving)} onChange={(event) => void update(item, "pushEnabled", event.target.checked)}
                className="size-4 accent-indigo-600" />
            </label>
          </div>
        ))}
      </div>}
      {saving && <p className="mt-2 flex items-center gap-1 text-xs text-indigo-700"><Loader2 className="size-3 animate-spin" />Saving preferences…</p>}
      <p className="mt-2 text-[10px] text-slate-500">Phone push also requires device permission and a registered subscription. The follow-up task queue remains accessible.</p>
    </section>
  );
}
