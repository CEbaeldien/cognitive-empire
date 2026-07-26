"use client";

import { useEffect, useState, useCallback } from "react";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelAlt:     "#0b0a1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  input:        "#0a0919",
  danger:       "#f87171",
  dangerBg:     "rgba(248,113,113,0.08)",
  dangerBorder: "rgba(248,113,113,0.25)",
  ok:           "#4ade80",
} as const;

const COUNT_LABELS: { key: string; label: string }[] = [
  { key: "new",       label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "queued",    label: "Queued" },
  { key: "sent",      label: "Sent" },
  { key: "replied",   label: "Replied" },
];

type Draft = {
  id: string;
  prospect_id: string;
  variant: string;
  draft_text: string;
  edited_text: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
};

type Prospect = {
  id: string;
  company_name: string | null;
  person_name: string | null;
  person_role: string | null;
  icp_score: number | null;
  signal_text: string | null;
  signal_url: string | null;
  linkedin_url: string | null;
  linkedin_search_url: string | null;
  tier: string;
  status: string;
  next_followup_at: string | null;
  drafts: Draft[];
};

type ResearchProspect = Omit<Prospect, "drafts">;

const btnBase: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: `1px solid ${C.border}`,
  background: "transparent",
  color: C.text,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function PipelineStrip({ counts }: { counts: Record<string, number> }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 14px" }}>
      {COUNT_LABELS.map(({ key, label }) => (
        <div
          key={key}
          style={{
            flex: "0 0 auto",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.panel,
            padding: "8px 12px",
            minWidth: 74,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{counts[key] ?? 0}</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function DraftItem({
  draft,
  isSelected,
  onSelect,
  onSaved,
}: {
  draft: Draft;
  isSelected: boolean;
  onSelect: () => void;
  onSaved: (draft: Draft) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.edited_text ?? draft.draft_text);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayText = draft.edited_text ?? draft.draft_text;

  async function handleCopy() {
    onSelect();
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op, principal can still select text manually
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/hunt/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edited_text: text }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      setEditing(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isSelected ? C.accentBorder : C.border}`,
        background: isSelected ? C.accentBg : C.panelAlt,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.faint }}>
        {draft.variant}
      </div>
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
            background: C.input, color: C.text, fontSize: 13, boxSizing: "border-box",
            fontFamily: "system-ui, -apple-system, sans-serif", resize: "vertical",
          }}
        />
      ) : (
        <p style={{ fontSize: 13, color: C.text, margin: 0, whiteSpace: "pre-wrap" }}>{displayText}</p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {editing ? (
          <>
            <button type="button" onClick={handleSave} disabled={saving} style={{ ...btnBase, borderColor: C.accentBorder, color: C.accent }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setText(displayText); }} style={btnBase}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={handleCopy} style={{ ...btnBase, borderColor: C.accentBorder, color: C.accent }}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={() => setEditing(true)} style={btnBase}>
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProspectCard({
  prospect,
  onSkip,
  onSent,
  onKilled,
}: {
  prospect: Prospect;
  onSkip: (id: string) => void;
  onSent: (id: string) => void;
  onKilled: (id: string) => void;
}) {
  const [drafts, setDrafts] = useState(prospect.drafts);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(prospect.drafts[0]?.id ?? null);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<"sent" | "kill" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signalText = prospect.signal_text ?? "";
  const isLong = signalText.length > 200;
  const shownSignal = expanded || !isLong ? signalText : signalText.slice(0, 200) + "…";

  async function handleSent() {
    if (!selectedDraftId) {
      setError("Copy a draft first so we know which one was sent.");
      return;
    }
    setBusy("sent");
    setError(null);
    const res = await fetch(`/api/hunt/prospects/${prospect.id}/sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: selectedDraftId }),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? `HTTP ${res.status}`);
      return;
    }
    onSent(prospect.id);
  }

  async function handleKill() {
    setBusy("kill");
    setError(null);
    const res = await fetch(`/api/hunt/prospects/${prospect.id}/kill`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? `HTTP ${res.status}`);
      return;
    }
    onKilled(prospect.id);
  }

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{prospect.company_name ?? "Unknown company"}</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {prospect.person_name ?? "Unknown"}{prospect.person_role ? ` · ${prospect.person_role}` : ""}
          </div>
        </div>
        {prospect.icp_score != null && (
          <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, flex: "0 0 auto" }}>{prospect.icp_score}</div>
        )}
      </div>

      {signalText && (
        <div>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, whiteSpace: "pre-wrap" }}>{shownSignal}</p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} style={{ ...btnBase, padding: "4px 0", border: "none", color: C.accent, fontSize: 12 }}>
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          {prospect.signal_url && (
            <a href={prospect.signal_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: C.accent, marginTop: 4 }}>
              View source →
            </a>
          )}
        </div>
      )}

      {prospect.linkedin_url && (
        <a
          href={prospect.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center", padding: "12px 14px", borderRadius: 8,
            background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}
        >
          Open profile
        </a>
      )}

      {drafts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {drafts.map((d) => (
            <DraftItem
              key={d.id}
              draft={d}
              isSelected={selectedDraftId === d.id}
              onSelect={() => setSelectedDraftId(d.id)}
              onSaved={(updated) => setDrafts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSent}
          disabled={busy !== null}
          style={{ ...btnBase, flex: 1, background: C.accentBg, borderColor: C.accentBorder, color: C.accent }}
        >
          {busy === "sent" ? "…" : "Sent"}
        </button>
        <button
          type="button"
          onClick={() => onSkip(prospect.id)}
          disabled={busy !== null}
          style={{ ...btnBase, flex: 1 }}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleKill}
          disabled={busy !== null}
          style={{ ...btnBase, flex: 1, background: C.dangerBg, borderColor: C.dangerBorder, color: C.danger }}
        >
          {busy === "kill" ? "…" : "Kill"}
        </button>
      </div>
    </div>
  );
}

type BatchEntry = {
  linkedin_url: string;
  person_name?: string;
  person_role?: string;
  company_name?: string;
  pasted_text?: string;
};

type BatchParseResult =
  | { ok: true; entries: BatchEntry[] }
  | { ok: false; error: string };

function parseBatchInput(raw: string): BatchParseResult {
  const blocks = raw.split(/\n\s*---+\s*\n/).map((b) => b.trim()).filter((b) => b.length > 0);

  if (blocks.length === 0) return { ok: false, error: "Paste at least one entry." };
  if (blocks.length > 10) return { ok: false, error: `Max 10 entries per batch (found ${blocks.length}).` };

  const entries: BatchEntry[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    let linkedin_url: string | undefined;
    let person_name: string | undefined;
    let person_role: string | undefined;
    let company_name: string | undefined;
    const textLines: string[] = [];

    for (const line of lines) {
      const m = line.match(/^(linkedin|name|role|company)\s*:\s*(.*)$/i);
      if (m) {
        const key = m[1].toLowerCase();
        const value = m[2].trim();
        if (key === "linkedin") linkedin_url = value;
        else if (key === "name") person_name = value;
        else if (key === "role") person_role = value;
        else if (key === "company") company_name = value;
        continue;
      }
      if (!linkedin_url && /^https?:\/\/\S*linkedin\.com/i.test(line)) {
        linkedin_url = line;
        continue;
      }
      textLines.push(line);
    }

    if (!linkedin_url) return { ok: false, error: `Entry ${i + 1} is missing a LinkedIn URL.` };

    entries.push({
      linkedin_url,
      person_name,
      person_role,
      company_name,
      pasted_text: textLines.length > 0 ? textLines.join("\n") : undefined,
    });
  }

  return { ok: true, entries };
}

function ManualInjectForm({ onInjected }: { onInjected: () => void }) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [signalText, setSignalText] = useState("");
  const [signalUrl, setSignalUrl] = useState("");
  const [batchRaw, setBatchRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
    border: `1px solid ${active ? C.accentBorder : C.border}`,
    background: active ? C.accentBg : "transparent",
    color: active ? C.accent : C.muted,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedinUrl.trim()) {
      setMessage({ kind: "err", text: "linkedin_url is required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/hunt/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkedin_url: linkedinUrl.trim(),
        person_name: personName.trim() || null,
        person_role: personRole.trim() || null,
        company_name: companyName.trim() || null,
        signal_text: signalText.trim() || null,
        signal_url: signalUrl.trim() || null,
      }),
    });

    setSubmitting(false);

    if (res.status === 409) {
      setMessage({ kind: "err", text: "Already in pipeline." });
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "err", text: d.error ?? `HTTP ${res.status}` });
      return;
    }

    setLinkedinUrl(""); setPersonName(""); setPersonRole(""); setCompanyName(""); setSignalText(""); setSignalUrl("");
    setMessage({ kind: "ok", text: "Added to queue." });
    onInjected();
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseBatchInput(batchRaw);
    if (!parsed.ok) {
      setMessage({ kind: "err", text: parsed.error });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/hunt/prospects/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: parsed.entries }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMessage({ kind: "err", text: d.error ?? `HTTP ${res.status}` });
      return;
    }

    const data = await res.json();
    const results = (data.results ?? []) as Array<{ ok: boolean; linkedin_url: string; error?: string }>;
    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);

    setBatchRaw("");
    setMessage({
      kind: failed.length === 0 ? "ok" : "err",
      text: failed.length === 0
        ? `Added ${succeeded} to queue.`
        : `Added ${succeeded}, failed ${failed.length}: ${failed.map((f) => f.error).join("; ")}`,
    });
    onInjected();
  }

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: 0 }}>
          Manual Inject
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => { setMode("single"); setMessage(null); }} style={tabStyle(mode === "single")}>Single</button>
          <button type="button" onClick={() => { setMode("batch"); setMessage(null); }} style={tabStyle(mode === "batch")}>Batch</button>
        </div>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={fieldStyle} placeholder="LinkedIn URL *" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          <input style={fieldStyle} placeholder="Person name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          <input style={fieldStyle} placeholder="Person role" value={personRole} onChange={(e) => setPersonRole(e.target.value)} />
          <input style={fieldStyle} placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <textarea style={{ ...fieldStyle, resize: "vertical" }} rows={3} placeholder="Signal text" value={signalText} onChange={(e) => setSignalText(e.target.value)} />
          <input style={fieldStyle} placeholder="Signal URL" value={signalUrl} onChange={(e) => setSignalUrl(e.target.value)} />
          {message && (
            <p style={{ fontSize: 12, margin: 0, color: message.kind === "ok" ? C.ok : C.danger }}>{message.text}</p>
          )}
          <button type="submit" disabled={submitting} style={{ ...btnBase, background: C.accentBg, borderColor: C.accentBorder, color: C.accent }}>
            {submitting ? "Adding…" : "Add to queue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            Up to 10 entries, separated by a line with just <code>---</code>. Each entry needs{" "}
            <code>LinkedIn: &lt;url&gt;</code>; optional <code>Name:</code>, <code>Role:</code>, <code>Company:</code> lines;
            any other line is treated as pasted post/profile text and enriched automatically.
          </p>
          <textarea
            style={{ ...fieldStyle, resize: "vertical", fontFamily: "ui-monospace, monospace" }}
            rows={10}
            placeholder={"LinkedIn: https://linkedin.com/in/janedoe\nRole: Founder\nWe inherited a legacy codebase and are drowning in technical debt...\n---\nLinkedIn: https://linkedin.com/in/johndoe\nName: John Doe\nCompany: Acme"}
            value={batchRaw}
            onChange={(e) => setBatchRaw(e.target.value)}
          />
          {message && (
            <p style={{ fontSize: 12, margin: 0, color: message.kind === "ok" ? C.ok : C.danger }}>{message.text}</p>
          )}
          <button type="submit" disabled={submitting} style={{ ...btnBase, background: C.accentBg, borderColor: C.accentBorder, color: C.accent }}>
            {submitting ? "Processing…" : "Process batch"}
          </button>
        </form>
      )}
    </div>
  );
}

function ResearchCard({
  prospect,
  onPromoted,
}: {
  prospect: ResearchProspect;
  onPromoted: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const signalText = prospect.signal_text ?? "";
  const shownSignal = signalText.length > 200 ? signalText.slice(0, 200) + "…" : signalText;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/hunt/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_name: personName.trim(),
        person_role: personRole.trim(),
        linkedin_url: linkedinUrl.trim(),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? `HTTP ${res.status}`);
      return;
    }
    onPromoted();
  }

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.panel, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{prospect.company_name ?? "Unknown company"}</div>
        {signalText && <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{shownSignal}</p>}
      </div>

      {prospect.linkedin_search_url && (
        <a
          href={prospect.linkedin_search_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center", padding: "10px 12px", borderRadius: 8,
            background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}
        >
          Open LinkedIn Search
        </a>
      )}

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} style={btnBase}>
          Add identity
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input style={fieldStyle} placeholder="Person name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          <input style={fieldStyle} placeholder="Role" value={personRole} onChange={(e) => setPersonRole(e.target.value)} />
          <input style={fieldStyle} placeholder="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          {error && <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={{ ...btnBase, background: C.accentBg, borderColor: C.accentBorder, color: C.accent }}>
            {submitting ? "Saving…" : "Save & re-evaluate"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function HuntPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [peerProspects, setPeerProspects] = useState<Prospect[]>([]);
  const [researchProspects, setResearchProspects] = useState<ResearchProspect[]>([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/hunt/queue");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProspects(data.prospects ?? []);
    setPeerProspects(data.peerProspects ?? []);
    setResearchProspects(data.researchProspects ?? []);
    setFilteredCount(data.filteredCount ?? 0);
    setCounts(data.counts ?? {});
    setSkipped(new Set());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadQueue();
  }, [loadQueue]);

  function handleSkip(id: string) {
    setSkipped((prev) => new Set(prev).add(id));
  }

  function handleResolved(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  }

  const visible = prospects.filter((p) => !skipped.has(p.id));
  const visiblePeers = peerProspects.filter((p) => !skipped.has(p.id));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 12px 48px" }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.faint, margin: "4px 0 12px" }}>
          Hunt
        </h1>

        <PipelineStrip counts={counts} />

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: 0 }}>
            Today&apos;s Queue
          </p>

          {loading && <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>}
          {error && <p style={{ fontSize: 13, color: C.danger }}>{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p style={{ fontSize: 13, color: C.muted }}>Nothing queued right now.</p>
          )}

          {visible.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              onSkip={handleSkip}
              onSent={handleResolved}
              onKilled={handleResolved}
            />
          ))}
        </div>

        {visiblePeers.length > 0 && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint }}>
              Peer ({visiblePeers.length})
            </summary>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {visiblePeers.map((p) => (
                <ProspectCard
                  key={p.id}
                  prospect={p}
                  onSkip={handleSkip}
                  onSent={handleResolved}
                  onKilled={handleResolved}
                />
              ))}
            </div>
          </details>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, margin: 0 }}>
              Research
            </p>
            <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>{filteredCount} filtered</p>
          </div>
          {researchProspects.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted }}>Nothing to research right now.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {researchProspects.map((p) => (
                <ResearchCard key={p.id} prospect={p} onPromoted={loadQueue} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <ManualInjectForm onInjected={loadQueue} />
        </div>
      </div>
    </div>
  );
}
