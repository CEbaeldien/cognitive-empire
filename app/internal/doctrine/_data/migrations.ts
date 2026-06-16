export interface MigrationStage {
  id: string;
  from: string;
  to: string;
  note: string;
}

export const migrationStages: MigrationStage[] = [
  { id: "production-selection", from: "Production", to: "Selection", note: "Output ceases to be scarce. Filtration before amplification becomes the structural lever." },
  { id: "execution-ownership", from: "Execution", to: "Ownership", note: "Doing the work no longer differentiates. Accountability for the outcome does." },
  { id: "access-orchestration", from: "Access", to: "Orchestration", note: "Having tools is no longer leverage. Governing how they interact is." },
  { id: "building-governance", from: "Building", to: "Governance", note: "Construction speed plateaus in value. Governance architecture compounds it." },
  { id: "analysis-responsibility", from: "Analysis", to: "Responsibility", note: "Analysis delegates cleanly to intelligent systems. Responsibility does not." },
  { id: "creation-continuity", from: "Creation", to: "Continuity", note: "Generating new surfaces is cheap. Sustaining coherence across them is not." },
  { id: "visibility-verifiability", from: "Visibility", to: "Verifiability", note: "Being seen loses force once everyone is visible. Being verifiable does not." },
  { id: "speed-survivability", from: "Speed", to: "Survivability", note: "Velocity is the default trajectory under abundance. Survivability is the scarce property." },
];

export const migrationFlow = [
  { id: "execution", label: "Execution", sub: "When intelligence is scarce", tag: "Production Bottleneck" },
  { id: "coordination", label: "Coordination", sub: "Output inflates", tag: "Selection Pressure" },
  { id: "governance", label: "Governance", sub: "Ambiguity surfaces", tag: "Responsibility Localizes" },
  { id: "ownership", label: "Ownership", sub: "Active constraint", tag: "Consequential Judgment" },
];

export const migrationFlowNotes = [
  "Execution was the original bottleneck when intelligence was scarce. Value accumulated at the point of doing.",
  "As intelligence abundance collapses execution friction, coordination and selection become the active constraints.",
  "Governance emerges as the dominant layer. Responsibility localization accelerates.",
  "Ownership and consequential judgment become the scarce, high-leverage layer. This is where premium accumulates.",
];
