"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EvidenceStrength = "weak" | "moderate" | "strong";

type EvidenceModalProps = {
  interventionId: string;
  recommendedAction: string;
};

type EvidenceForm = {
  action_taken: string;
  summary_note: string;
  next_action: string;
  next_action_due_date: string;
  evidence_strength: EvidenceStrength | "";
};

const EMPTY_FORM: EvidenceForm = {
  action_taken: "",
  summary_note: "",
  next_action: "",
  next_action_due_date: "",
  evidence_strength: "",
};

export default function EvidenceModal({
  interventionId,
  recommendedAction,
}: EvidenceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [form, setForm] = useState<EvidenceForm>(EMPTY_FORM);

  const allFilled =
    form.action_taken.trim() !== "" &&
    form.summary_note.trim() !== "" &&
    form.next_action.trim() !== "" &&
    form.next_action_due_date !== "" &&
    form.evidence_strength !== "";

  function handleChange(field: keyof EvidenceForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpen() {
    setForm(EMPTY_FORM);
    setApiError(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setApiError(null);
  }

  async function submit() {
    if (!allFilled || submitting) return;
    setSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch("/api/drift/interventions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventionId,
          action_taken: form.action_taken.trim(),
          summary_note: form.summary_note.trim(),
          next_action: form.next_action.trim(),
          next_action_due_date: form.next_action_due_date,
          evidence_strength: form.evidence_strength,
        }),
      });

      const text = await res.text();
      let result: { error?: string } | null = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!res.ok) {
        setApiError(result?.error ?? `Request failed (${res.status})`);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
      >
        Record Evidence
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-8 shadow-2xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Drift / Intervention
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">
                Record Execution Evidence
              </h2>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Recommended action
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {recommendedAction}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
                  Action Taken <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.action_taken}
                  onChange={(e) => handleChange("action_taken", e.target.value)}
                  placeholder="Describe what was actually done"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
                  Outcome Summary <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.summary_note}
                  onChange={(e) => handleChange("summary_note", e.target.value)}
                  placeholder="What changed as a result?"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
                  Next Action <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.next_action}
                  onChange={(e) => handleChange("next_action", e.target.value)}
                  placeholder="What happens next?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
                  Next Action Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.next_action_due_date}
                  onChange={(e) => handleChange("next_action_due_date", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-slate-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
                  Evidence Strength <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.evidence_strength}
                  onChange={(e) => handleChange("evidence_strength", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                >
                  <option value="">Select strength...</option>
                  <option value="weak">Weak — activity logged, outcome unclear</option>
                  <option value="moderate">Moderate — clear action, partial result</option>
                  <option value="strong">Strong — definitive outcome confirmed</option>
                </select>
              </div>
            </div>

            {apiError && (
              <p className="mt-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                {apiError}
              </p>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!allFilled || submitting}
                className="flex-1 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting..." : "Submit Evidence"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
