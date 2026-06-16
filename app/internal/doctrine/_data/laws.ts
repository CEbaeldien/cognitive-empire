export interface DoctrineLaw {
  id: number;
  numeral: string;
  title: string;
  statement: string;
  full: string;
  relatedChapters: string[];
  related: number[];
}

export const laws: DoctrineLaw[] = [
  {
    id: 1,
    numeral: "I",
    title: "The Intelligence Abundance Law",
    statement: "When intelligence becomes abundant, output inflates and value migrates upstream.",
    full: "When intelligence becomes abundant, output inflates and value migrates upstream. This is the foundational observation: production ceases to be the scarce resource. What was previously difficult and valuable — high-quality output, analysis, iteration — becomes inexpensive and abundant. Value therefore migrates to the layers that govern, select, and own outcomes rather than those that merely produce them.",
    relatedChapters: ["ch1", "ch2"],
    related: [2, 4],
  },
  {
    id: 2,
    numeral: "II",
    title: "The Bottleneck Migration Law",
    statement: "When one constraint collapses, another becomes dominant. Optimizing the wrong layer amplifies instability.",
    full: "When one constraint collapses, another becomes dominant. Optimizing the wrong layer amplifies instability. Every system operates under constraint. When intelligence was scarce, execution was the bottleneck. When intelligence becomes abundant, execution ceases to constrain the system at the same level. The bottleneck migrates upward — from production to selection, from execution to coordination, from access to orchestration, from building to governance.",
    relatedChapters: ["ch3"],
    related: [1, 3, 7],
  },
  {
    id: 3,
    numeral: "III",
    title: "The Responsibility Migration Law",
    statement: "Automation increases ambiguity. Ownership becomes economic currency.",
    full: "Automation increases ambiguity. Ownership becomes economic currency. When machines perform actions, the human who owns the consequence becomes less immediately visible — but no less structurally necessary. Responsibility does not disappear; it concentrates at the points where escalation, liability, and irreversible outcomes intersect. Those who preserve clear ownership under automation gain structural leverage.",
    relatedChapters: ["ch1"],
    related: [2, 6],
  },
  {
    id: 4,
    numeral: "IV",
    title: "The Output Inflation Law",
    statement: "When everyone can produce, differentiation shifts to selection, constraint design, and outcome integrity.",
    full: "When everyone can produce, differentiation shifts to selection, constraint design, and outcome integrity. Production loses scarcity. Selection gains structural power. Markets do not deteriorate under intelligence abundance — they reorganize around the new constraint architecture. Value migrates from production to selection, from execution to ownership, from visibility to verifiability.",
    relatedChapters: ["appendix-a"],
    related: [1, 8],
  },
  {
    id: 5,
    numeral: "V",
    title: "The Decision Half-Life Law",
    statement: "Some decisions must be made once and defended. Others must adapt continuously. Confusing the two destroys cognitive capital.",
    full: "Some decisions must be made once and defended. Others must adapt continuously. Confusing the two destroys cognitive capital. In environments characterized by Capability Volatility, operators become vulnerable to decision destabilization. Long half-life decisions (identity, governance architecture, constraint philosophy, escalation boundaries) must resist volatility. Short half-life decisions (interface choices, tactical experiments) should adapt quickly. The layers must not collapse into one another.",
    relatedChapters: ["ch5"],
    related: [2, 7],
  },
  {
    id: 6,
    numeral: "VI",
    title: "The Escalation Preservation Law",
    statement: "Outsource analysis. Never outsource responsibility.",
    full: "Outsource analysis. Never outsource responsibility. Escalation is not an emergency response. It is a pre-defined structural boundary. Modules may generate, evaluate, simulate, and recommend. They do not commit, authorize irreversible change, or absorb liability. Authority mapping is structural clarity about where decision rights reside and where they do not. Without mapped authority, systems drift toward default automation.",
    relatedChapters: ["ch7"],
    related: [3, 7],
  },
  {
    id: 7,
    numeral: "VII",
    title: "The Optimization Fragility Law",
    statement: "Systems optimized for speed without governance become brittle under scale.",
    full: "Systems optimized for speed without governance become brittle under scale. When horizontal capability growth exceeds vertical governance capacity, fragility accumulates invisibly. This brittleness typically manifests under conditions — high load, novel inputs, time pressure — where recovery is most difficult. Governance must grow vertically: deeper clarity, stronger boundaries, more explicit ownership at each layer.",
    relatedChapters: ["ch6", "ch7"],
    related: [2, 5, 6],
  },
  {
    id: 8,
    numeral: "VIII",
    title: "The Human Differentiation Law",
    statement: "Perfect logic commoditizes brands. Emotional signal preserves leverage.",
    full: "Perfect logic commoditizes brands. Emotional signal preserves leverage. When reasoning becomes inexpensive, differentiation cannot depend on reasoning alone. Strategic Imperfection is deliberate asymmetry — the disciplined decision to not optimize certain surfaces, maintained consistently as a positioning instrument. Constraint narrows possibility and sharpens signal. Under abundance, identity becomes scarce. Scarcity compounds.",
    relatedChapters: ["ch8"],
    related: [4, 1],
  },
];

export function getLaw(id: number): DoctrineLaw | undefined {
  return laws.find((l) => l.id === id);
}
