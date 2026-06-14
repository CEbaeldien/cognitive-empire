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
    <div className="ce-judgment-strip">
      {PROCESS_STAGES.map((stage) => (
        <div className="ce-judgment-stage" key={stage.label}>
          <p className="ce-judgment-eyebrow ce-judgment-eyebrow--gold">{stage.label}</p>
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
 * structural-basis / what-to-watch panels on either side.
 *
 * The copy in those panels is static until "structural_basis" and
 * "watch_note" fields are added to the signals schema and approval step.
 */
export function SignalWithContext({ primarySignal }: { primarySignal: React.ReactNode }) {
  return (
    <section>
      <JudgmentProcessStrip />

      <div className="ce-signal-row">
        <SignalContextPanel eyebrow="Structural basis" accent="left">
          <p>
            Optimization fragility — a system tuned to a measurable proxy
            can hold steady on that proxy while the property it was meant
            to protect quietly degrades.
          </p>
          <p className="ce-context-meta">
            Doctrine vector — pending mapping at approval
          </p>
        </SignalContextPanel>

        <div className="ce-primary-slot">{primarySignal}</div>

        <SignalContextPanel eyebrow="What to watch" accent="right">
          <p>
            Pressure is rising across two independent domains without a
            shared correction mechanism. Confidence reflects an early
            convergence, not a settled pattern — it strengthens if a third
            domain shows the same divergence, and fades if evaluation
            methods catch up first.
          </p>
        </SignalContextPanel>
      </div>
    </section>
  );
}
