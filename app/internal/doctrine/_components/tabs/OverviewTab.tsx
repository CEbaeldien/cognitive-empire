"use client";

import { useState } from "react";
import { laws } from "../../_data/laws";
import type { TabId } from "../DoctrineConsole";

const CHAPTER_LINKS = [
  { id: "ch1", label: "Ch. 1 - The Prime Doctrine" },
  { id: "ch3", label: "Ch. 3 - Bottleneck Migration" },
  { id: "ch7", label: "Ch. 7 - Governance Under Abundance" },
  { id: "ch12", label: "Ch. 12 - The Renaissance Operator" },
  { id: "ch15", label: "Ch. 15 - Survivable Systems" },
  { id: "appendix-c", label: "Appendix C - Doctrine Summary" },
];

export function OverviewTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [notes, setNotes] = useState("");

  return (
    <div className="doctrine-section-stack">
      <section className="doctrine-card doctrine-hero-card">
        <div className="doctrine-panel-kicker">The Prime Doctrine</div>
        <div className="doctrine-hero-title">
          When intelligence becomes abundant, confusion becomes the bottleneck.
        </div>
        <div className="doctrine-hero-copy">
          What changes is not capability. What changes is constraint. Intelligence solved execution. It did not solve
          judgment. This console is the internal operating interface for reading, applying, and governing the
          Operator Kernel.
        </div>
      </section>

      <section>
        <div className="doctrine-section-heading">
          <div className="doctrine-section-title">The Eight Laws - Summary</div>
          <button
            onClick={() => onNavigate("laws")}
            className="doctrine-text-button"
            type="button"
          >
            Open Laws
          </button>
        </div>

        <div className="doctrine-law-grid">
          {laws.map((law) => (
            <div key={law.id} className="doctrine-card doctrine-law-summary">
              <div className="doctrine-law-numeral">{law.numeral}</div>
              <div className="doctrine-law-title">{law.title}</div>
              <div className="doctrine-law-copy">{law.statement}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="doctrine-overview-grid">
        <div className="doctrine-card doctrine-overview-card">
          <div className="doctrine-card-title">Canon Status</div>
          <Row label="Immutable laws" value="8" />
          <Row label="Manuscript chapters" value="19 + 4 appendices" />
          <Row label="Lexicon terms" value="27" />
          <Row label="Structural migrations" value="8" />
          <Row label="Application scenarios" value="6" />
        </div>

        <div className="doctrine-card doctrine-overview-card">
          <div className="doctrine-card-title">Quick Links - Manuscript</div>
          <div className="doctrine-link-stack">
            {CHAPTER_LINKS.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => onNavigate("manuscript")}
                className="toc-link"
                style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                type="button"
              >
                {chapter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="doctrine-card doctrine-overview-card">
          <div className="doctrine-card-title">Private Operator Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not yet persisted - local to this session."
            className="doctrine-notes-input"
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="doctrine-overview-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
