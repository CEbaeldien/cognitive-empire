"use client";

import { useMemo, useState } from "react";
import { lexicon, type LexiconTerm } from "../../_data/lexicon";
import { manuscriptChapters } from "../../_data/manuscript";
import type { TabId } from "../DoctrineConsole";

export function LexiconTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [openTerm, setOpenTerm] = useState<LexiconTerm | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const chapterOptions = useMemo(() => {
    const ids = Array.from(new Set(lexicon.map((t) => t.chapterId)));
    return ids
      .map((id) => manuscriptChapters.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
  }, []);

  const filtered = lexicon.filter((t) => {
    const matchesSearch =
      !search ||
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase());
    const matchesChapter = !chapterFilter || t.chapterId === chapterFilter;
    return matchesSearch && matchesChapter;
  });

  function copyTerm(t: LexiconTerm) {
    navigator.clipboard?.writeText(`${t.term} — ${t.definition}`);
    setCopied(t.term);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ce-gold)" }}>
            Appendix D — CE Doctrine Lexicon
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>Operational Definitions</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            style={{ background: "var(--ce-navy)", border: "1px solid var(--ce-border)", borderRadius: 8, color: "var(--ce-text)", fontSize: 12.5, padding: "8px 10px" }}
          >
            <option value="">All chapters</option>
            {chapterOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms…"
            style={{ width: 220, background: "var(--ce-navy)", border: "1px solid var(--ce-border)", borderRadius: 8, color: "var(--ce-text)", fontSize: 12.5, padding: "8px 12px" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {filtered.map((t) => (
          <button
            key={t.term}
            onClick={() => setOpenTerm(t)}
            className="command-card"
            style={{ textAlign: "left", padding: "16px 16px", cursor: "pointer", color: "inherit", background: "var(--ce-panel)", border: "1px solid var(--ce-border)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ce-white)" }}>{t.term}</div>
              <div style={{ fontSize: 10, color: "var(--ce-gold)", flexShrink: 0, padding: "2px 6px", background: "var(--ce-gold-soft)", borderRadius: 5 }}>
                {t.chapterLabel}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--ce-muted)", marginTop: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {t.definition}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: "var(--ce-dim)", fontSize: 13, gridColumn: "1 / -1" }}>No terms match.</div>
        )}
      </div>

      {openTerm && (
        <div
          onClick={() => setOpenTerm(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="command-card" style={{ maxWidth: 500, width: "100%", padding: "28px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ce-gold)", letterSpacing: "0.06em" }}>{openTerm.chapterLabel}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--ce-white)", marginTop: 4 }}>{openTerm.term}</div>
              </div>
              <button onClick={() => setOpenTerm(null)} style={{ background: "none", border: "none", color: "var(--ce-muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ marginTop: 16, fontSize: 14, color: "var(--ce-text)", lineHeight: 1.65 }}>{openTerm.definition}</div>
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--ce-border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => copyTerm(openTerm)}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--ce-gold-border)", background: "var(--ce-gold-soft)", color: "var(--ce-gold)", cursor: "pointer" }}
              >
                {copied === openTerm.term ? "Copied" : "Copy term"}
              </button>
              <button
                onClick={() => { onNavigate("manuscript"); setOpenTerm(null); }}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--ce-border)", background: "transparent", color: "var(--ce-muted)", cursor: "pointer" }}
              >
                View in manuscript →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
