"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EvidenceStrength = "weak" | "moderate" | "strong";

type ActivityType =
  | "call_completed"
  | "email_sent"
  | "meeting_scheduled"
  | "proposal_sent"
  | "proposal_resent"
  | "decision_maker_contacted"
  | "next_action_updated"
  | "internal_review_completed"
  | "note_added"
  | "other";

type EvidenceModalProps = {
  interventionId: string;
  recommendedAction: string;
  workspaceId: string;
  opportunityId: string;
  accountId: string;
};

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "call_completed", label: "Call" },
  { value: "email_sent", label: "Email" },
  { value: "meeting_scheduled", label: "Meeting" },
  { value: "proposal_sent", label: "Proposal" },
  { value: "internal_review_completed", label: "Internal Review" },
  { value: "other", label: "Other" },
];

const ACTION_TAKEN_OPTIONS = [
  "Completed the call",
  "Sent follow-up email",
  "Scheduled a meeting",
  "Resent the proposal",
  "Contacted decision-maker",
  "Updated next action",
  "Completed internal review",
  "Other",
];

const OUTCOME_SUMMARY_OPTIONS = [
  "Positive response received",
  "Meeting confirmed",
  "Next step agreed",
  "No response yet",
  "Objection raised",
  "Deal still active",
  "Probability updated",
  "Other",
];

const NEXT_ACTION_OPTIONS = [
  "Schedule follow-up call",
  "Send follow-up email",
  "Resend proposal",
  "Request decision timeline",
  "Escalate to decision-maker",
  "Update close date",
  "Internal review",
  "Other",
];

const STRENGTH_BADGE: Record<EvidenceStrength, string> = {
  strong: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  moderate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  weak: "border-slate-600 bg-slate-800/60 text-slate-500",
};

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Definitive outcome confirmed.",
  moderate: "Clear action, partial result.",
  weak: "Activity logged, outcome unclear.",
};

type FormState = {
  activity_type: ActivityType | "";
  action_taken_select: string;
  action_taken_other: string;
  summary_note_select: string;
  summary_note_other: string;
  next_action_select: string;
  next_action_other: string;
  next_action_due_date: string;
};

const EMPTY_FORM: FormState = {
  activity_type: "",
  action_taken_select: "",
  action_taken_other: "",
  summary_note_select: "",
  summary_note_other: "",
  next_action_select: "",
  next_action_other: "",
  next_action_due_date: "",
};

function calcStrength(activityType: string, outcomeSelect: string): EvidenceStrength {
  const strongActivity = activityType === "call_completed" || activityType === "meeting_scheduled";
  const strongOutcome =
    outcomeSelect === "Positive response received" || outcomeSelect === "Meeting confirmed";
  if (strongActivity && strongOutcome) return "strong";

  const weakActivity = activityType === "email_sent";
  const weakOutcome = outcomeSelect === "No response yet";
  if (weakActivity && weakOutcome) return "weak";

  return "moderate";
}

const SELECT_CLASS =
  "w-full rounded-lg border border-slate-700/80 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-slate-500 focus:outline-none";

const TEXTAREA_CLASS =
  "mt-2 w-full resize-none rounded-lg border border-slate-700/80 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none";

export default function EvidenceModal({
  interventionId,
  recommendedAction,
  workspaceId,
  opportunityId,
  accountId,
}: EvidenceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const actualActionTaken =
    form.action_taken_select === "Other" ? form.action_taken_other : form.action_taken_select;
  const actualSummaryNote =
    form.summary_note_select === "Other" ? form.summary_note_other : form.summary_note_select;
  const actualNextAction =
    form.next_action_select === "Other" ? form.next_action_other : form.next_action_select;

  const evidenceStrength = calcStrength(form.activity_type, form.summary_note_select);
  const showStrength = form.activity_type !== "" && form.summary_note_select !== "";

  const allFilled =
    form.activity_type !== "" &&
    form.action_taken_select !== "" &&
    (form.action_taken_select !== "Other" || form.action_taken_other.trim() !== "") &&
    form.summary_note_select !== "" &&
    (form.summary_note_select !== "Other" || form.summary_note_other.trim() !== "") &&
    form.next_action_select !== "" &&
    (form.next_action_select !== "Other" || form.next_action_other.trim() !== "") &&
    form.next_action_due_date !== "";

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
    console.log("[EvidenceModal] submit called — allFilled:", allFilled, "submitting:", submitting);
    console.log("[EvidenceModal] props —", { interventionId, workspaceId, opportunityId, accountId });
    if (!allFilled || submitting) return;
    setSubmitting(true);
    setApiError(null);

    const payload = {
      interventionId,
      workspace_id: workspaceId,
      opportunity_id: opportunityId,
      account_id: accountId,
      activity_type: form.activity_type,
      action_taken: actualActionTaken,
      summary_note: actualSummaryNote,
      next_action: actualNextAction,
      next_action_due_date: form.next_action_due_date,
      evidence_strength: evidenceStrength,
    };
    console.log("[EvidenceModal] payload →", payload);

    try {
      const res = await fetch("/api/drift/interventions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result: { error?: string } | null = null;
      try { result = text ? JSON.parse(text) : null; } catch { result = null; }

      if (!res.ok) {
        const msg = result?.error ?? `Request failed (${res.status})`;
        console.error("[EvidenceModal] API error —", res.status, result);
        setApiError(msg);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="flex w-full max-w-[560px] flex-col rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl"
            style={{ maxHeight: "85vh" }}
          >
            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-2">
              {/* Header */}
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600">
                  Drift · Intervention
                </p>
                <h2 className="mt-1.5 text-xl font-semibold text-slate-100">
                  Record Execution Evidence
                </h2>
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600">
                    Recommended action
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{recommendedAction}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Activity Type */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Activity Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.activity_type}
                    onChange={(e) => set("activity_type", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Select category...</option>
                    {ACTIVITY_TYPE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Action Taken */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Action Taken <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.action_taken_select}
                    onChange={(e) => set("action_taken_select", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Select what was done...</option>
                    {ACTION_TAKEN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.action_taken_select === "Other" && (
                    <textarea
                      rows={2}
                      value={form.action_taken_other}
                      onChange={(e) => set("action_taken_other", e.target.value)}
                      placeholder="Describe what was done..."
                      className={TEXTAREA_CLASS}
                    />
                  )}
                </div>

                {/* Outcome Summary */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Outcome Summary <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.summary_note_select}
                    onChange={(e) => set("summary_note_select", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Select outcome...</option>
                    {OUTCOME_SUMMARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.summary_note_select === "Other" && (
                    <textarea
                      rows={2}
                      value={form.summary_note_other}
                      onChange={(e) => set("summary_note_other", e.target.value)}
                      placeholder="Describe the outcome..."
                      className={TEXTAREA_CLASS}
                    />
                  )}
                </div>

                {/* Next Action */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Next Action <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.next_action_select}
                    onChange={(e) => set("next_action_select", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Select next action...</option>
                    {NEXT_ACTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.next_action_select === "Other" && (
                    <textarea
                      rows={2}
                      value={form.next_action_other}
                      onChange={(e) => set("next_action_other", e.target.value)}
                      placeholder="Describe the next action..."
                      className={TEXTAREA_CLASS}
                    />
                  )}
                </div>

                {/* Next Action Due Date */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Next Action Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.next_action_due_date}
                    onChange={(e) => set("next_action_due_date", e.target.value)}
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-slate-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>

              </div>

              {/* Bottom padding so last field isn't flush against footer */}
              <div className="h-4" />
            </div>

            {/* STICKY FOOTER */}
            <div className="shrink-0 border-t border-slate-800/60 bg-slate-950 px-8 pt-4 pb-5">
              {/* API error — always visible */}
              {apiError && (
                <p className="mb-4 rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  {apiError}
                </p>
              )}

              {/* Evidence Strength — always visible, appears once activity + outcome are selected */}
              {showStrength && (
                <div className="mb-4">
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.35em] text-slate-500">
                    Evidence Strength
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded border px-3 py-1 text-[11px] uppercase tracking-widest ${STRENGTH_BADGE[evidenceStrength]}`}
                    >
                      {evidenceStrength}
                    </span>
                    <p className="text-[11px] text-slate-600">{STRENGTH_LABEL[evidenceStrength]}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!allFilled || submitting}
                className="flex-1 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Submitting..." : "Submit Evidence"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-700/80 px-6 py-2.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
