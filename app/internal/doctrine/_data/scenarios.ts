export interface ScenarioOption {
  text: string;
  correct: boolean;
  explanation: string;
}

export interface DoctrineScenario {
  id: string;
  situation: string;
  options: ScenarioOption[];
  relatedLaw: string;
  relatedLawTitle: string;
  relatedChapterId: string;
  relatedChapterLabel: string;
}

export const scenarios: DoctrineScenario[] = [
  {
    id: "foundation-model-release",
    situation:
      "A new foundation model is released that significantly outperforms your current orchestration stack. Your team wants to rebuild core workflows around it immediately.",
    options: [
      {
        text: "Pause and assess whether this affects long half-life decisions (governance, identity, escalation). Only adapt short half-life layers.",
        correct: true,
        explanation:
          "This preserves the distinction between decisions that must resist volatility and decisions that should adapt quickly. Capability change is a short half-life event until proven otherwise — treating it as one protects governance architecture from being reopened on every model release.",
      },
      {
        text: "Immediately restructure architecture to leverage the new model — staying current is critical.",
        correct: false,
        explanation:
          "This collapses long and short half-life decisions into one reflex. Reopening governance architecture on every capability shift destroys the cognitive capital that stability was supposed to protect.",
      },
      {
        text: "Run parallel experiments with the new model while keeping existing systems stable.",
        correct: false,
        explanation:
          "Closer to correct in spirit, but it skips the explicit step of classifying which decisions are actually in scope. Without that classification, experiments tend to bleed into governance changes by default.",
      },
    ],
    relatedLaw: "V",
    relatedLawTitle: "The Decision Half-Life Law",
    relatedChapterId: "ch5",
    relatedChapterLabel: "Chapter 5 — Decision Half-Life",
  },
  {
    id: "agentic-commerce-drift",
    situation:
      "Your agentic commerce system begins autonomously negotiating and executing supplier contracts. Several deals close with unexpected terms.",
    options: [
      {
        text: "Review the escalation boundaries you defined before deployment. Clarify where human override should have triggered.",
        correct: true,
        explanation:
          "Escalation is a pre-defined structural boundary, not an emergency response. The failure here is not that the agent negotiated — it's that no loss boundary was mapped at the point where terms became consequential.",
      },
      {
        text: "Increase automation oversight by adding more review steps in the agent workflow.",
        correct: false,
        explanation:
          "Adding generic review steps without locating the actual escalation gap treats the symptom. It increases friction everywhere instead of restoring authority precisely where it was missing.",
      },
      {
        text: "Accept the variance — agents are faster and the overall volume increase justifies occasional suboptimal terms.",
        correct: false,
        explanation:
          "This treats responsibility as a rounding error. Ownership does not transfer to the agent because the agent acted — it becomes more valuable, and more exposed, the less visible it is.",
      },
    ],
    relatedLaw: "VI",
    relatedLawTitle: "The Escalation Preservation Law",
    relatedChapterId: "ch7",
    relatedChapterLabel: "Chapter 7 — Governance Under Abundance",
  },
  {
    id: "output-volume-generic-voice",
    situation:
      "Your content and product description pipelines are generating 40x more output than six months ago. Brand voice feels increasingly generic across channels.",
    options: [
      {
        text: "Introduce deliberate constraint and strategic imperfection in key surfaces to preserve authorship signal.",
        correct: true,
        explanation:
          "When reasoning and production become inexpensive, differentiation cannot come from optimization alone. Deliberate, repeatable asymmetry is what keeps a surface attributable to a specific actor rather than to the model that produced it.",
      },
      {
        text: "Double down on optimization and A/B testing to find the highest-performing generic tone.",
        correct: false,
        explanation:
          "This optimizes the exact surface that abundance has already commoditized. Perfect logic and perfectly tuned tone converge toward the same output everyone else's pipeline converges toward.",
      },
      {
        text: "Reduce output volume until quality metrics recover.",
        correct: false,
        explanation:
          "Volume was never the actual constraint. Reducing it addresses output inflation symptomatically without addressing the missing selection and identity layer underneath.",
      },
    ],
    relatedLaw: "VIII",
    relatedLawTitle: "The Human Differentiation Law",
    relatedChapterId: "ch8",
    relatedChapterLabel: "Chapter 8 — Strategic Imperfection",
  },
  {
    id: "divergent-agent-governance",
    situation:
      "Multiple teams are independently building AI agents. Governance requirements, escalation paths, and data contracts are diverging rapidly.",
    options: [
      {
        text: "Establish explicit modular cognition architecture with defined roles, boundaries, and human authority mapping before further scaling.",
        correct: true,
        explanation:
          "Each agent should be treated as a governed module with a defined function, not an independent authority. Without shared architecture, horizontal capability growth outruns governance capacity and fragility accumulates invisibly.",
      },
      {
        text: "Allow teams to move fast — standardization can come later once patterns emerge.",
        correct: false,
        explanation:
          "This is velocity addiction: substituting acquisition and speed for integration. By the time patterns 'emerge,' divergent escalation paths are already load-bearing and far more costly to unify.",
      },
      {
        text: "Centralize all agent development under one team to reduce fragmentation.",
        correct: false,
        explanation:
          "Centralizing execution doesn't resolve a governance problem — it relocates a coordination bottleneck without addressing the missing authority mapping that caused the divergence.",
      },
    ],
    relatedLaw: "VII",
    relatedLawTitle: "The Optimization Fragility Law",
    relatedChapterId: "ch4",
    relatedChapterLabel: "Chapter 4 — Modular Cognition",
  },
  {
    id: "unowned-3am-failure",
    situation:
      "A critical automated workflow fails at 3am. No single person can immediately explain why the decision chain led to the failure.",
    options: [
      {
        text: "Audit responsibility clarity and escalation logs. The absence of clear ownership is itself the structural failure.",
        correct: true,
        explanation:
          "The model performed within its design parameters; the instability is at the governance layer. The real failure is that responsibility diffused across the automated chain until no actor remained clearly attributable.",
      },
      {
        text: "Add more logging and monitoring to future workflows.",
        correct: false,
        explanation:
          "More telemetry documents the diffusion more precisely — it does not relocate the ownership that was missing. Visibility is not the same as accountability.",
      },
      {
        text: "Roll back the automation and return that process to manual oversight.",
        correct: false,
        explanation:
          "This treats automation itself as the cause rather than the absence of mapped authority within it. The same ambiguity will reappear the next time any part of the chain is automated.",
      },
    ],
    relatedLaw: "III",
    relatedLawTitle: "The Responsibility Migration Law",
    relatedChapterId: "ch1",
    relatedChapterLabel: "Chapter 1 — The Prime Doctrine",
  },
  {
    id: "benchmark-anchored-strategy",
    situation:
      "You notice that strategy discussions now revolve heavily around the latest model capabilities and benchmark improvements rather than core operational principles.",
    options: [
      {
        text: "Re-anchor identity and long half-life decisions to structural forces. Treat capability updates as short half-life variables.",
        correct: true,
        explanation:
          "Benchmarks and capability releases are inherently volatile and belong at the short half-life layer. Letting them anchor strategy directly exposes long half-life decisions to constant, unjustified revision.",
      },
      {
        text: "This is healthy adaptation — the organization is staying current with the frontier.",
        correct: false,
        explanation:
          "Staying current at the tactical layer is healthy. Letting frontier news set the direction of governance and identity is decision destabilization wearing the costume of diligence.",
      },
      {
        text: "Create a dedicated 'emerging tech' track so core strategy remains insulated.",
        correct: false,
        explanation:
          "A separate track narrows where the bottleneck is visible, but it does not address it — the discussions described are already happening inside core strategy, not beside it.",
      },
    ],
    relatedLaw: "V",
    relatedLawTitle: "The Decision Half-Life Law",
    relatedChapterId: "ch5",
    relatedChapterLabel: "Chapter 5 — Decision Half-Life",
  },
];
