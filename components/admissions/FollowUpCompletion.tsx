"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FOLLOW_UP_OUTCOMES, type FollowUpOutcome } from "@/types/followUps";
import { getApiErrorMessage } from "@/lib/ui/getApiErrorMessage";

export default function FollowUpCompletion({ id, onDone }: { id: string; onDone: () => void }) {
  const [outcome, setOutcome] = useState<FollowUpOutcome | "">("");
  const [completionNote, setCompletionNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!outcome || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/follow-ups/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, completionNote }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(body, "Unable to save contact outcome"));
      toast.success("Follow-up completed");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-3 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
      <label className="block text-xs font-bold text-slate-700" htmlFor={"outcome-" + id}>Parent response</label>
      <select id={"outcome-" + id} required value={outcome} onChange={(event) => setOutcome(event.target.value as FollowUpOutcome)}
        className="premium-input h-11 w-full rounded-xl px-3 text-sm font-semibold">
        <option value="">Select an outcome</option>
        {FOLLOW_UP_OUTCOMES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="block text-xs font-bold text-slate-700" htmlFor={"note-" + id}>Conversation note (optional)</label>
      <textarea id={"note-" + id} maxLength={2000} rows={2} value={completionNote} onChange={(event) => setCompletionNote(event.target.value)}
        className="premium-input w-full rounded-xl p-3 text-sm" placeholder="What did the parent say?" />
      <button type="submit" disabled={!outcome || saving} className="premium-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Save outcome
      </button>
    </form>
  );
}
