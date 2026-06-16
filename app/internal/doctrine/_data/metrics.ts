export interface DoctrineMetric {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  default: number;
}

export const metrics: DoctrineMetric[] = [
  { id: "decision_half_life", name: "Decision Half-Life Stability", shortLabel: "Half-Life", description: "Foundational decisions defended across capability cycles", default: 7 },
  { id: "responsibility_clarity", name: "Responsibility Clarity", shortLabel: "Responsibility", description: "Clear ownership and escalation authority for all outcomes", default: 6 },
  { id: "constraint_discipline", name: "Constraint Discipline", shortLabel: "Discipline", description: "Deliberate refusal to optimize indiscriminately", default: 5 },
  { id: "selection_integrity", name: "Selection Integrity", shortLabel: "Selection", description: "Quality of filtration before amplification", default: 6 },
  { id: "tool_mastery", name: "Tool Mastery Ratio", shortLabel: "Tool Mastery", description: "Governed tools vs passively accumulated tools", default: 4 },
  { id: "governance_friction", name: "Governance Friction Awareness", shortLabel: "Governance", description: "Understanding where compliance and escalation boundaries exist", default: 5 },
  { id: "attention_stability", name: "Attention Stability", shortLabel: "Attention", description: "Direction anchored in structural forces vs surface noise", default: 6 },
  { id: "trust_density", name: "Trust Density", shortLabel: "Trust", description: "Trust increasing faster than output volume", default: 5 },
  { id: "continuity_capacity", name: "Continuity Capacity", shortLabel: "Continuity", description: "Ability to remain coherent under increasing operational density", default: 5 },
  { id: "survivability", name: "Survivability Under Volatility", shortLabel: "Survivability", description: "Coherence preserved during capability shifts and accumulation", default: 6 },
];

export interface InterpretationBand {
  min: number;
  max: number;
  label: string;
}

export const interpretationBands: InterpretationBand[] = [
  { min: 0, max: 5, label: "Fragile" },
  { min: 5, max: 7, label: "Developing" },
  { min: 7, max: 8.5, label: "Coherent" },
  { min: 8.5, max: 10, label: "Operator-Grade" },
];

export function getInterpretation(score: number): InterpretationBand {
  return (
    interpretationBands.find((b) => score >= b.min && score < b.max) ??
    interpretationBands[interpretationBands.length - 1]
  );
}
