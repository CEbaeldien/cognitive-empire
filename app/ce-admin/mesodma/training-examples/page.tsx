"use client";

import { useState, useEffect, useCallback } from "react";

const C = {
  bg:           "#09091c",
  panel:        "#0e0c1f",
  panelDark:    "#0c0b1e",
  border:       "#1c1a35",
  accent:       "#00E0FF",
  accentBg:     "rgba(0,224,255,0.08)",
  accentBorder: "rgba(0,224,255,0.25)",
  text:         "#f1f5f9",
  muted:        "#94a3b8",
  faint:        "#64748b",
  input:        "#0a0919",
} as const;

type TrainingExample = {
  id: string;
  title: string;
  input_text: string | null;
  expected_route: string | null;
  example_category: string | null;
  lesson: string | null;
  created_at: string;
};

type ExampleForm = {
  title: string;
  input_text: string;
  expected_route: string;
  example_category: string;
  lesson: string;
};

const BLANK: ExampleForm = { title: "", input_text: "", expected_route: "", example_category: "", lesson: "" };

function fmt(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TD: React.CSSProperties = { padding: "11px 14px", verticalAlign: "middle", borderBottom: `1px solid ${C.border}` };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint, marginBottom: 5 };
const btnBase: React.CSSProperties    = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none" };

export default function TrainingExamplesPage() {
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [addOpen,  setAddOpen]  = useState(false);
  const [form,     setForm]     = useState<ExampleForm>(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/mesodma/training-examples")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setExamples(d.examples ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!form.title.trim()) { setSaveErr("Title is required."); return; }
    setSaving(true); setSaveErr(null);
    try {
      const res = await fetch("/api/mesodma/training-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setForm(BLANK); setAddOpen(false);
      load();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>CE Admin · Mesodma</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em", margin: "0 0 4px" }}>Training Examples</h1>
            <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Calibrate pipeline module behavior with labeled examples.</p>
          </div>
          <button
            onClick={() => setAddOpen(v => !v)}
            style={{ ...btnBase, padding: "8px 18px", background: addOpen ? C.accentBg : C.accent, color: addOpen ? C.accent : "#000", border: addOpen ? `1px solid ${C.accentBorder}` : "none" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {addOpen ? "Close" : "Add Example"}
          </button>
        </div>
      </div>

      {addOpen && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Short descriptor of this example" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Input Text</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.input_text} onChange={e => setForm(p => ({ ...p, input_text: e.target.value }))} placeholder="The raw item text this example is based on" />
            </div>
            <div>
              <label style={labelStyle}>Expected Route</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.expected_route} onChange={e => setForm(p => ({ ...p, expected_route: e.target.value }))}>
                <option value="">Select…</option>
                <option value="reject_noise">reject_noise</option>
                <option value="candidate_evidence">candidate_evidence</option>
                <option value="promote_first_pass_signal">promote_first_pass_signal</option>
                <option value="needs_more_sources">needs_more_sources</option>
                <option value="needs_human_check">needs_human_check</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Example Category</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.example_category} onChange={e => setForm(p => ({ ...p, example_category: e.target.value }))}>
                <option value="">Select…</option>
                <option value="obvious_noise">obvious_noise</option>
                <option value="candidate_evidence">candidate_evidence</option>
                <option value="strong_signal">strong_signal</option>
                <option value="false_signal_trap">false_signal_trap</option>
                <option value="edge_case">edge_case</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Lesson</label>
              <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={form.lesson} onChange={e => setForm(p => ({ ...p, lesson: e.target.value }))} placeholder="What should the pipeline learn from this example?" />
            </div>
          </div>
          {saveErr && <p style={{ marginTop: 12, fontSize: 12, color: "#f87171" }}>{saveErr}</p>}
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button onClick={submit} disabled={saving} style={{ ...btnBase, padding: "8px 20px", background: C.accent, color: "#000", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Example"}
            </button>
            <button onClick={() => { setForm(BLANK); setAddOpen(false); setSaveErr(null); }} style={{ ...btnBase, padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: C.faint, fontSize: 13, padding: "24px 0" }}>Loading…</p>
      ) : (
        <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.panelDark, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {["Title", "Expected Route", "Category", "Lesson", "Added"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {examples.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: C.faint, fontSize: 13 }}>
                    No training examples yet. Add examples to calibrate module behavior.
                  </td>
                </tr>
              ) : examples.map(ex => (
                <tr key={ex.id} style={{ background: C.panel }}>
                  <td style={{ ...TD, maxWidth: 260 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</p>
                  </td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{ex.expected_route ?? "—"}</span></td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.muted }}>{ex.example_category ? fmt(ex.example_category) : "—"}</span></td>
                  <td style={{ ...TD, maxWidth: 320 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.lesson ?? "—"}</p>
                  </td>
                  <td style={TD}><span style={{ fontSize: 11, color: C.faint }}>{timeAgo(ex.created_at)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
