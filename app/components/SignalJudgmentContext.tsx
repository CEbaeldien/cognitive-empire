/**
 * CE Signals — Judgment process strip + structural context panels.
 * Sits above and beside the primary signal card on /signals (V2 layout).
 *
 * CSS classes are injected by app/signals/page.tsx into its <style> block
 * so they stay scoped to the signals route and avoid conflicts with globals.
 */

type ProcessStage = { label: string; description: string };

const PROCESS_STAGES: ProcessStage[] = [
  {
    label:       "Evidence",
    description: "Gathered continuously from structural sources, not headlines.",
  },
  {
    label:       "Doctrine-mapped",
    description: "Filtered against the Eight Laws and structural invariants.",
  },
  {
    label:       "Stress-tested",
    description: "Challenged across independent reasoning passes before release.",
  },
  {
    label:       "Human-approved",
    description: "Published only after founder review. Nothing publishes automatically.",
  },
];

export function JudgmentProcessStrip() {
  return (
    <div className="ce-judgment-strip" style={{ marginBottom: "0.85rem" }}>
      {PROCESS_STAGES.map((stage, i) => (
        <div className="ce-judgment-stage" key={stage.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.45rem" }}>
            <span style={{
              fontSize: 8, fontWeight: 700, color: "rgba(201,169,97,0.35)",
              fontFamily: "ui-monospace, monospace", letterSpacing: "0.08em",
            }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="ce-judgment-eyebrow ce-judgment-eyebrow--gold" style={{ margin: 0 }}>
              {stage.label}
            </p>
          </div>
          <p className="ce-stage-copy">{stage.description}</p>
        </div>
      ))}
    </div>
  );
}

type SignalContextPanelProps = {
  eyebrow:  string;
  accent:   "left" | "right";
  children: React.ReactNode;
};

export function SignalContextPanel({ eyebrow, accent, children }: SignalContextPanelProps) {
  return (
    <div className={`ce-context-panel ce-context-panel--${accent}`}>
      <p className="ce-judgment-eyebrow">{eyebrow}</p>
      <div className="ce-context-body">{children}</div>
    </div>
  );
}

/**
 * Wraps the primary signal card with a judgment-process strip above and
 * optional structural-basis / what-to-watch panels on either side.
 * Panels are hidden when their content is null.
 */
export function SignalWithContext({
  primarySignal,
  structuralBasis,
  watchNote,
}: {
  primarySignal:    React.ReactNode;
  structuralBasis?: string | null;
  watchNote?:       string | null;
}) {
  const hasLeft  = Boolean(structuralBasis);
  const hasRight = Boolean(watchNote);
  const hasPanels = hasLeft || hasRight;

  if (!hasPanels) {
    return (
      <section>
        <JudgmentProcessStrip />
        <div className="ce-primary-slot" style={{ borderRadius: 10, overflow: "hidden" }}>
          {primarySignal}
        </div>
      </section>
    );
  }

  return (
    <section>
      <JudgmentProcessStrip />

      <div className="ce-signal-row">
        {hasLeft ? (
          <SignalContextPanel eyebrow="Structural basis" accent="left">
            <p>{structuralBasis}</p>
          </SignalContextPanel>
        ) : (
          <div />
        )}

        <div className="ce-primary-slot">{primarySignal}</div>

        {hasRight ? (
          <SignalContextPanel eyebrow="What to watch" accent="right">
            <p>{watchNote}</p>
          </SignalContextPanel>
        ) : (
          <div />
        )}
      </div>
    </section>
  );
}
