'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

/* ── Color tokens ───────────────────────────────────────── */
const T = {
  bg:           '#05070B',
  panel:        '#090E1A',
  panelHover:   '#0D1524',
  border:       'rgba(255,255,255,0.07)',
  borderGold:   'rgba(197,162,111,0.32)',
  borderCyan:   'rgba(0,216,255,0.20)',
  text:         '#E6EDF7',
  muted:        '#8B9AB3',
  dim:          '#4A5570',
  dimmer:       '#2A3548',
  gold:         '#C5A26F',
  goldSoft:     'rgba(197,162,111,0.07)',
  cyan:         '#00D8FF',
  warn:         'rgba(180,100,40,0.10)',
  warnText:     '#9B6234',
  warnBorder:   'rgba(180,100,40,0.28)',
} as const

/* ── Types ──────────────────────────────────────────────── */
type Zone = 'ops-kernel' | 'maintenance-gravity'

type OpsModule = {
  id: string
  zone: Zone
  num: string
  title: string
  thesis: string
  core: string
  operational_meaning: string
  failure_pattern: string
  operator_question: string
  laws?: { numeral: string; title: string; description: string }[]
}

/* ── Module Data: Ops Kernel ─────────────────────────────── */
const OPS_KERNEL: OpsModule[] = [
  {
    id: 'prime-doctrine',
    zone: 'ops-kernel',
    num: '01',
    title: 'Prime Doctrine',
    thesis: 'When intelligence becomes abundant, confusion becomes the bottleneck.',
    core: 'The defining shift of this era is not that machines can produce more — text, code, images, analysis, workflows. That is the visible layer. The deeper shift is structural. Execution simplifies. Production cheapens. Iteration accelerates. Output multiplies. What changes is not capability. What changes is constraint.',
    operational_meaning: 'The bottleneck has migrated from production to judgment. The operator who produces more has no structural advantage. The operator who selects, governs, and directs has the advantage.',
    failure_pattern: 'Continuing to optimize production capacity after the bottleneck has moved to judgment. Building more workflows, automating more outputs — while structural coherence collapses.',
    operator_question: 'Where is the real bottleneck in my system right now?',
  },
  {
    id: 'immutable-laws',
    zone: 'ops-kernel',
    num: '02',
    title: 'Immutable Laws',
    thesis: 'Eight structural laws govern how constraint behaves under intelligence abundance.',
    core: 'The Eight Laws are not predictions. They are structural observations about how constraint migrates. Use them as a diagnostic lens. When something breaks in your system, ask which law is expressing itself.',
    operational_meaning: 'Each law describes a migration — from one bottleneck to another. The operator who can name which law is currently dominant has structural orientation. The operator who cannot is reacting.',
    failure_pattern: 'Treating the Eight Laws as theoretical framework rather than live operational structure. Failing to identify which law is driving the current constraint.',
    operator_question: 'Which law is currently most active in my system?',
    laws: [
      { numeral: 'I',    title: 'Intelligence Abundance',   description: 'When intelligence becomes abundant, output inflates and value migrates upstream.' },
      { numeral: 'II',   title: 'Bottleneck Migration',     description: 'When one constraint collapses, another becomes dominant. Optimizing the wrong layer amplifies instability.' },
      { numeral: 'III',  title: 'Responsibility Migration', description: 'Automation increases ambiguity. Ownership becomes economic currency.' },
      { numeral: 'IV',   title: 'Output Inflation',         description: 'When everyone can produce, differentiation shifts to selection, constraint design, and outcome integrity.' },
      { numeral: 'V',    title: 'Decision Half-Life',       description: 'Some decisions must be defended. Others must adapt. Confusing the two destroys cognitive capital.' },
      { numeral: 'VI',   title: 'Escalation Preservation',  description: 'Outsource analysis. Never outsource responsibility.' },
      { numeral: 'VII',  title: 'Optimization Fragility',   description: 'Systems optimized for speed without governance become brittle under scale.' },
      { numeral: 'VIII', title: 'Human Differentiation',    description: 'Perfect logic commoditizes brands. Emotional signal preserves leverage.' },
    ],
  },
  {
    id: 'signal-vs-noise',
    zone: 'ops-kernel',
    num: '03',
    title: 'Signal vs Noise',
    thesis: 'Intelligence abundance reorganizes information asymmetry — it does not eliminate it.',
    core: 'When production becomes inexpensive, visibility becomes a lagging indicator of structural reality. Search visibility is a distribution event, not a discovery event. Signal compounds quietly. Noise scales rapidly.',
    operational_meaning: 'The operator must distinguish signals — accumulated structural evidence revealing directional pressure — from noise: high-volume, low-value information artifacts. Noise is not wrong. It is insufficient.',
    failure_pattern: 'Mistaking visibility for signal strength. Acting on distribution events as if they were structural evidence. Tracking what is loud rather than what is structurally true.',
    operator_question: 'What am I treating as signal that is actually noise?',
  },
  {
    id: 'bottleneck-migration',
    zone: 'ops-kernel',
    num: '04',
    title: 'Bottleneck Migration',
    thesis: 'When one constraint collapses, another becomes dominant.',
    core: 'Every system operates under constraint. When one constraint dissolves, another becomes dominant. Production → Selection. Execution → Ownership. Access → Orchestration. Building → Governance. Analysis → Responsibility. Creation → Continuity. Visibility → Verifiability. Speed → Survivability.',
    operational_meaning: 'Optimizing the old bottleneck after migration is invisible waste. Tracking the dominant constraint requires active diagnosis, not historical precedent.',
    failure_pattern: "Solving last era's constraint after the bottleneck has already migrated. The system looks productive while the real bottleneck accumulates pressure elsewhere.",
    operator_question: 'What bottleneck am I still optimizing for that has already moved?',
  },
  {
    id: 'modular-cognition',
    zone: 'ops-kernel',
    num: '05',
    title: 'Modular Cognition',
    thesis: 'Access is not architecture. Using multiple models is not orchestration.',
    core: 'Modular Cognition is the deliberate structuring of distributed intelligence into a governed system. Architecture determines outcome. The operator commits. Accumulating capabilities without a governing structure creates the illusion of power while creating structural fragility.',
    operational_meaning: 'Intelligence must be governed at the architecture level, not just at the tool level. The operator who uses twelve AI tools without a governing structure is not orchestrating — they are accumulating.',
    failure_pattern: 'Collecting capabilities without a governing architecture. Tool abundance without structural commitment. High surface area with no coherent system beneath it.',
    operator_question: 'What is the governing architecture of my intelligence stack?',
  },
  {
    id: 'decision-half-life',
    zone: 'ops-kernel',
    num: '06',
    title: 'Decision Half-Life',
    thesis: 'Some decisions must be defended. Others must adapt. Confusing the two destroys cognitive capital.',
    core: 'Not all decisions should be treated equally. High half-life decisions are commitments that must be defended under pressure — identity, governance structure, core doctrine. Low half-life decisions must be updated as conditions change — tactics, tools, surface approaches.',
    operational_meaning: 'The operator must classify decisions by their half-life before committing resources to defend or revise them. Defending a low-half-life decision wastes capital. Revising a high-half-life decision creates incoherence.',
    failure_pattern: 'Treating all decisions the same — either defending everything rigidly and becoming obsolete, or adapting everything reactively and becoming incoherent.',
    operator_question: 'Which of my current commitments need defense, and which need revision?',
  },
  {
    id: 'failure-modes',
    zone: 'ops-kernel',
    num: '07',
    title: 'Failure Modes',
    thesis: 'In abundant environments, intelligence fails silently.',
    core: "In constrained environments, incompetence fails visibly — the output does not exist. In abundant environments, intelligence fails silently — the output exists, looks good, and the structure is breaking underneath it. These are structural failures caused by optimizing the visible layer after the bottleneck has migrated upward.",
    operational_meaning: 'Silent failure cannot be detected by measuring outputs. It requires structural audit — checking the governance layer, the ownership layer, the escalation layer — not the production layer.',
    failure_pattern: 'Using production metrics to detect structural failure. Output is increasing. Coherence is decreasing. No alarm sounds.',
    operator_question: 'What in my system is failing silently right now?',
  },
  {
    id: 'governance-abundance',
    zone: 'ops-kernel',
    num: '08',
    title: 'Governance Under Abundance',
    thesis: 'Intelligence abundance expands capability. Governance determines consequence.',
    core: 'Every intelligent system requires three layers: computation, commitment, and consequence. Computation can be distributed. Commitment must be bounded by authority. Consequence must be owned by identifiable actors. The more capable the system, the more critical governance becomes.',
    operational_meaning: 'Capability without governance is liability. The operator who expands capability without expanding governance structure is accelerating toward a governance failure.',
    failure_pattern: 'Building capable systems without defined ownership, authority boundaries, or consequence structures. High output, low accountability.',
    operator_question: 'Who owns the consequence in every system I am running?',
  },
  {
    id: 'strategic-imperfection',
    zone: 'ops-kernel',
    num: '09',
    title: 'Strategic Imperfection',
    thesis: 'Under abundance, identity becomes scarce. Constraint signals authorship.',
    core: 'Perfection scales. Imitation scales faster. Strategic Imperfection is deliberate asymmetry: the disciplined refusal to optimize every surface into sameness. When every output is polished to the same standard, the operator becomes indistinguishable from the system generating outputs.',
    operational_meaning: 'The operator must choose which surfaces to leave deliberately imperfect — where the seams show authorship, not error. Authentic constraint is a signal that cannot be counterfeited at scale.',
    failure_pattern: 'Optimizing all surfaces to maximum polish, achieving indistinguishability from generated outputs. Looking perfect. Being invisible.',
    operator_question: 'What deliberate constraints am I maintaining to signal authorship?',
  },
  {
    id: 'agentic-commerce',
    zone: 'ops-kernel',
    num: '10',
    title: 'Agentic Commerce',
    thesis: 'Commerce shifts from attention markets toward agent-mediated markets.',
    core: 'Intelligence abundance does not eliminate markets. It restructures them. Persuasion loses power where verification dominates. The decision-maker is increasingly an agent acting on behalf of a human.',
    operational_meaning: 'Agent-legibility — structural clarity, verifiability, parseable information — becomes competitive advantage. The operator must design for agents, not just for humans.',
    failure_pattern: 'Continuing to optimize for human attention and persuasion when the primary decision layer is shifting to agent-mediated evaluation.',
    operator_question: 'Is my system legible to an agent making a decision on behalf of a human?',
  },
  {
    id: 'great-filter',
    zone: 'ops-kernel',
    num: '11',
    title: 'The Great Filter',
    thesis: 'Abundance does not eliminate competition. It intensifies selection.',
    core: 'The Great Filter of abundance does not ask who can produce. It asks who can remain coherent. Abundance is the selection pressure. The filter is not productivity — it is coherence under scale.',
    operational_meaning: 'Expansion without coherence is not growth — it is the setup for filter-failure. The survivable operator builds governance capacity at least as fast as capability capacity.',
    failure_pattern: 'Expanding capabilities while losing organizational coherence, governance clarity, or directional consistency. Growing into incoherence.',
    operator_question: 'Am I becoming more coherent or less coherent as my capabilities expand?',
  },
  {
    id: 'renaissance-operator',
    zone: 'ops-kernel',
    num: '12',
    title: 'Renaissance Operator',
    thesis: 'The Renaissance Operator does not outproduce abundance. They orchestrate it.',
    core: 'They are more stable, more deliberate, and more difficult to replace. The Renaissance Operator is defined not by what they can produce, but by what they govern. In an era of abundant production, the premium role shifts from skilled producer to skilled governor.',
    operational_meaning: 'Governance, orchestration, and directional authority are the new scarce capabilities. The operator who develops these compounds in value as abundance expands.',
    failure_pattern: 'Trying to outcompete in production capacity — generating more, faster — rather than developing governance depth and directional authority.',
    operator_question: 'What can I govern that a purely capable system cannot?',
  },
  {
    id: 'physical-constraints',
    zone: 'ops-kernel',
    num: '13',
    title: 'Physical Constraints',
    thesis: 'Intelligence abundance appears digital. Its constraints are physical.',
    core: 'Digital intelligence remains bounded by physical systems — energy infrastructure, compute hardware, supply chains, and physical geography. No digital system overrides energy scarcity, infrastructure failure, or geographic physical reality.',
    operational_meaning: 'Physical constraint is the ultimate governance layer. The operator who treats digital capability as unconstrained by physical infrastructure will be surprised by the physical layer.',
    failure_pattern: 'Treating digital capability as sovereign from physical infrastructure. Failing to model energy, compute, and physical system dependencies into operational planning.',
    operator_question: 'What physical constraints bound my digital intelligence stack?',
  },
  {
    id: 'second-order-effects',
    zone: 'ops-kernel',
    num: '14',
    title: 'Second-Order Effects',
    thesis: 'First-order effects are visible. Second-order effects are consequential.',
    core: 'First-order effects are visible. Second-order effects are harder to see, yet more consequential. Design for consequence, not excitement. Every operational decision generates second-order effects that govern the eventual outcome.',
    operational_meaning: 'The discipline is not to predict second-order effects — it is to ask for them before acting. What does this enable next? What constraint does this remove, and what constraint does that removal create?',
    failure_pattern: 'Acting on visible first-order effects while ignoring the second-order consequences. Solving the current problem while creating the next one.',
    operator_question: 'What second-order effects am I generating that I have not yet evaluated?',
  },
]

/* ── Module Data: Maintenance Gravity ───────────────────── */
const MAINTENANCE_GRAVITY: OpsModule[] = [
  {
    id: 'maintenance-gravity',
    zone: 'maintenance-gravity',
    num: 'MG-01',
    title: 'Maintenance Gravity',
    thesis: 'Creation friction is falling faster than continuity capacity is expanding.',
    core: 'Starting becomes inexpensive. Sustaining compounds. Every new tool, workflow, automation, and system adds future upkeep, ownership, and escalation cost. The question is no longer only: Can this be built? The question is: Can this remain coherent?',
    operational_meaning: 'Every system created adds future governance cost. The operator who creates without accounting for maintenance gravity will be crushed by it — not in the moment of creation, but months later when the system demands attention it was never designed to receive.',
    failure_pattern: 'The operator feels productive while the system becomes harder to govern. Output is increasing. Maintenance gravity is accumulating. No alarm sounds until the system fails to sustain.',
    operator_question: 'What have I created that I can no longer maintain cleanly?',
  },
  {
    id: 'complexity-accumulation',
    zone: 'maintenance-gravity',
    num: 'MG-02',
    title: 'Complexity Accumulation',
    thesis: 'Complexity accumulates invisibly until it becomes ungovernable.',
    core: 'Systems do not announce when they become too complex to govern. Complexity accumulates through addition — new tools, integrations, exceptions, workarounds, and debt. Each addition feels manageable. The aggregate becomes structural drag.',
    operational_meaning: 'The operator must audit complexity actively. Passive management allows accumulation until crisis. Complexity becomes invisible through familiarity — the operator no longer sees what they navigate around every day.',
    failure_pattern: 'Adding capabilities, integrations, and tools without retiring the old ones. Workarounds become architecture. Exceptions become defaults. The system becomes ungovernable.',
    operator_question: 'What complexity have I accumulated that I have not audited in 90 days?',
  },
  {
    id: 'survivable-systems',
    zone: 'maintenance-gravity',
    num: 'MG-03',
    title: 'Survivable Systems',
    thesis: 'Abundance rewards expansion. Survival rewards coherence.',
    core: 'The systems that endure will be the systems that remain governable under pressure. The survivable system has defined ownership at every layer, clear escalation paths, and the capacity to reduce scope without losing function.',
    operational_meaning: 'Design for reduction, not just expansion. A system that can shed 40% of its surface area and still function coherently is more survivable than one that requires every part to operate.',
    failure_pattern: 'Building for maximum capability rather than maximum coherence. The system becomes brittle under any significant perturbation — it can expand but cannot contract.',
    operator_question: 'If I removed 40% of my current capabilities, would what remained be more survivable?',
  },
  {
    id: 'metrics-that-matter',
    zone: 'maintenance-gravity',
    num: 'MG-04',
    title: 'Metrics That Matter',
    thesis: 'In abundance, the wrong metrics accelerate failure.',
    core: 'Output metrics measure the wrong layer after the bottleneck has migrated. The metrics that matter are structural: coherence, ownership clarity, decision half-life, escalation integrity, and maintenance load — not production volume.',
    operational_meaning: 'Replace production metrics with governance metrics. Measure what determines survivability, not what looks impressive in a report. Volume is not signal. Structure is signal.',
    failure_pattern: 'Using volume metrics as proxies for structural health. Producing more while governing less. Looking healthy while becoming fragile.',
    operator_question: 'Am I measuring what will determine my survivability in the next 18 months?',
  },
  {
    id: 'diagnostic-questions',
    zone: 'maintenance-gravity',
    num: 'MG-05',
    title: 'Diagnostic Questions',
    thesis: 'Four questions orient the operator under structural pressure.',
    core: 'What changed? What structural direction does it support? What pressure is accumulating? What second-order consequence follows? These are not analytical questions — they are navigational. Apply them to every signal, every decision, every new capability before committing.',
    operational_meaning: 'Structural orientation does not require prediction. It requires the discipline to ask navigational questions before acting. The operator who applies these four questions consistently builds directional capital over time.',
    failure_pattern: 'Reacting to events without structural orientation. Operating in the visible layer only. Addressing the first-order problem without diagnosing the structural direction it represents.',
    operator_question: 'Apply all four questions to the most significant decision you made this week.',
  },
  {
    id: 'operator-moves',
    zone: 'maintenance-gravity',
    num: 'MG-06',
    title: 'Operator Moves',
    thesis: 'The operator has a defined set of structural moves at each constraint level.',
    core: "Direction Without Prediction: The operator does not need to predict every event. They need to understand which constraint is becoming dominant. Available moves: audit complexity, retire what cannot be maintained, clarify ownership at each layer, raise governance level on critical decisions, identify which law is currently most active.",
    operational_meaning: "The operator's job is not to forecast — it is to maintain direction under volatility by reading which bottleneck is accumulating pressure and executing the appropriate structural move.",
    failure_pattern: 'Waiting for certainty before moving. Analysis paralysis in the face of structural pressure. The operator studies the constraint rather than moving against it.',
    operator_question: 'What is the one structural move available to me right now that I have been avoiding?',
  },
]

const ALL_MODULES = [...OPS_KERNEL, ...MAINTENANCE_GRAVITY]

/* ── Main Component ─────────────────────────────────────── */
export function OpsKernelConsole() {
  const [activeId, setActiveId] = useState('prime-doctrine')
  const [transitioning, setTransitioning] = useState(false)

  const activeIdx = ALL_MODULES.findIndex(m => m.id === activeId)
  const active    = ALL_MODULES[activeIdx]!
  const prev      = activeIdx > 0 ? ALL_MODULES[activeIdx - 1] : null
  const next      = activeIdx < ALL_MODULES.length - 1 ? ALL_MODULES[activeIdx + 1] : null

  const goTo = useCallback((id: string) => {
    if (id === activeId) return
    setTransitioning(true)
    setTimeout(() => {
      setActiveId(id)
      setTransitioning(false)
    }, 180)
  }, [activeId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && next) {
        e.preventDefault(); goTo(next.id)
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && prev) {
        e.preventDefault(); goTo(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, prev, next])

  const isGravity = active.zone === 'maintenance-gravity'
  const accentColor = isGravity ? T.cyan : T.gold
  const accentBorder = isGravity ? T.borderCyan : T.borderGold
  const progressPct = ((activeIdx + 1) / ALL_MODULES.length) * 100

  return (
    <>
      <style>{`
        .ok-shell {
          display: flex;
          height: calc(100vh - 80px);
          background: ${T.bg};
          position: relative;
          overflow: hidden;
        }
        .ok-nav {
          width: 236px;
          flex-shrink: 0;
          border-right: 1px solid ${T.border};
          overflow-y: auto;
          padding: 16px 0 48px;
          position: relative;
          z-index: 1;
        }
        .ok-content {
          flex: 1;
          overflow-y: auto;
          padding: 40px 52px 80px;
          max-width: 820px;
          position: relative;
          z-index: 1;
          transition: opacity 180ms ease;
        }
        .ok-mobile-strip {
          display: none;
        }
        @media (max-width: 1023px) {
          .ok-shell {
            flex-direction: column;
            height: auto;
            min-height: calc(100vh - 80px);
            overflow: visible;
          }
          .ok-nav { display: none; }
          .ok-mobile-strip {
            display: flex;
            overflow-x: auto;
            gap: 4px;
            padding: 10px 16px;
            border-bottom: 1px solid ${T.border};
            background: ${T.bg};
            position: sticky;
            top: 80px;
            z-index: 20;
            scrollbar-width: none;
          }
          .ok-mobile-strip::-webkit-scrollbar { display: none; }
          .ok-content {
            padding: 28px 20px 60px;
            overflow-y: visible;
            max-width: 100%;
          }
        }
        @media (max-width: 639px) {
          .ok-content { padding: 24px 16px 60px; }
        }
        .ok-nav-btn {
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          padding: 6px 16px 6px 14px;
          font-size: 11px;
          letter-spacing: 0.15px;
          line-height: 1.4;
          transition: color 130ms ease, background 130ms ease, border-color 130ms ease;
        }
        .ok-nav-btn:hover { background: rgba(255,255,255,0.02); }
        .ok-nav-btn[data-active="true"] {
          border-left-color: ${T.gold};
          background: rgba(197,162,111,0.05);
        }
        .ok-nav-btn[data-active="true"][data-zone="maintenance-gravity"] {
          border-left-color: ${T.cyan};
          background: rgba(0,216,255,0.04);
        }
        .ok-section-label {
          font-size: 8px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          font-family: monospace;
          padding: 0 16px;
          margin-bottom: 4px;
          user-select: none;
        }
        .ok-field-label {
          font-size: 8px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          font-family: monospace;
          margin-bottom: 10px;
        }
        .ok-prev-next {
          background: none;
          border: 1px solid ${T.border};
          cursor: pointer;
          padding: 10px 16px;
          font-size: 12px;
          text-align: left;
          flex: 1;
          max-width: 260px;
          transition: border-color 150ms ease, color 150ms ease;
          line-height: 1.4;
        }
        .ok-prev-next:hover {
          border-color: ${T.borderGold};
          color: ${T.gold};
        }
        .ok-chip {
          border: 1px solid ${T.border};
          padding: 4px 10px 5px;
          font-size: 10px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 130ms ease, color 130ms ease, background 130ms ease;
        }
        .ok-chip[data-active="true"] {
          border-color: ${T.borderGold};
          color: ${T.gold};
          background: rgba(197,162,111,0.06);
        }
        .ok-chip[data-active="true"][data-zone="maintenance-gravity"] {
          border-color: ${T.borderCyan};
          color: ${T.cyan};
          background: rgba(0,216,255,0.04);
        }
        .ok-law-card {
          background: ${T.panel};
          border: 1px solid ${T.border};
          padding: 12px 14px;
          transition: border-color 150ms ease;
        }
        .ok-law-card:hover { border-color: rgba(197,162,111,0.22); }
        @media (prefers-reduced-motion: reduce) {
          .ok-content, .ok-prev-next, .ok-nav-btn, .ok-chip, .ok-law-card {
            transition: none !important;
          }
        }
      `}</style>

      <div className="ok-shell">
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '52px 52px',
        }} />

        {/* Mobile: horizontal module strip */}
        <div className="ok-mobile-strip">
          {ALL_MODULES.map(m => (
            <button
              key={m.id}
              className="ok-chip"
              data-active={activeId === m.id ? 'true' : undefined}
              data-zone={m.zone}
              onClick={() => goTo(m.id)}
            >
              <span style={{ fontSize: 8, opacity: 0.5, marginRight: 4, fontFamily: 'monospace' }}>{m.num}</span>
              {m.title}
            </button>
          ))}
        </div>

        {/* Desktop: left nav */}
        <nav className="ok-nav" aria-label="Module navigation">
          <ZoneLabel label="Ops Kernel" style={{ color: T.gold }} />
          {OPS_KERNEL.map(m => (
            <button
              key={m.id}
              className="ok-nav-btn"
              data-active={activeId === m.id ? 'true' : undefined}
              data-zone={m.zone}
              onClick={() => goTo(m.id)}
              style={{ color: activeId === m.id ? T.gold : T.dim }}
            >
              <span style={{
                fontSize: 8, fontFamily: 'monospace', letterSpacing: '1px',
                marginRight: 6, opacity: 0.5,
              }}>
                {m.num}
              </span>
              {m.title}
            </button>
          ))}

          <ZoneLabel
            label="Maintenance Gravity"
            style={{ color: T.cyan, marginTop: 18 }}
          />
          {MAINTENANCE_GRAVITY.map(m => (
            <button
              key={m.id}
              className="ok-nav-btn"
              data-active={activeId === m.id ? 'true' : undefined}
              data-zone={m.zone}
              onClick={() => goTo(m.id)}
              style={{ color: activeId === m.id ? T.cyan : T.dim }}
            >
              <span style={{
                fontSize: 8, fontFamily: 'monospace', letterSpacing: '1px',
                marginRight: 6, opacity: 0.5,
              }}>
                {m.num}
              </span>
              {m.title}
            </button>
          ))}

          {/* Canon access */}
          <div style={{
            margin: '22px 14px 0',
            padding: '14px 0 0',
            borderTop: `1px solid ${T.border}`,
          }}>
            <div className="ok-section-label" style={{ color: T.dimmer }}>
              Canon
            </div>
            <a
              href="/downloads/ce-public-kernel.pdf"
              style={{
                display: 'block', fontSize: 11, color: T.dim,
                textDecoration: 'none', padding: '5px 16px',
                transition: 'color 130ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.gold }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.dim }}
            >
              ↓ Download PDF
            </a>
            <a
              href="/"
              style={{
                display: 'block', fontSize: 11, color: T.dim,
                textDecoration: 'none', padding: '5px 16px',
                transition: 'color 130ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.muted }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.dim }}
            >
              ← CE Home
            </a>
          </div>
        </nav>

        {/* Content viewport */}
        <main
          className="ok-content"
          style={{ opacity: transitioning ? 0 : 1 }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Module header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            }}>
              <span style={{
                fontSize: 8, letterSpacing: '3px', color: accentColor,
                textTransform: 'uppercase', fontFamily: 'monospace',
              }}>
                {isGravity ? 'Maintenance Gravity' : 'Ops Kernel'}
              </span>
              <div style={{ width: 20, height: 1, background: accentBorder }} />
              <span style={{
                fontSize: 8, letterSpacing: '2px', color: T.dimmer,
                fontFamily: 'monospace', textTransform: 'uppercase',
              }}>
                {active.num}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.65rem, 3.2vw, 2.3rem)',
              fontWeight: 700, color: T.text,
              letterSpacing: '-0.03em', lineHeight: 1.0,
              margin: '0 0 16px',
            }}>
              {active.title}
            </h1>

            <div style={{
              height: 1,
              background: `linear-gradient(90deg, ${accentBorder}, rgba(255,255,255,0.04) 55%, transparent)`,
            }} />
          </div>

          {/* Thesis */}
          <Field label="Thesis">
            <p style={{
              fontSize: '1.08rem', color: T.text,
              lineHeight: 1.6, letterSpacing: '-0.01em', margin: 0,
            }}>
              {active.thesis}
            </p>
          </Field>

          {/* Core */}
          <Field label="Core Doctrine">
            <p style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.78, margin: 0 }}>
              {active.core}
            </p>
            {active.laws && (
              <div style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 7,
              }}>
                {active.laws.map(law => (
                  <div key={law.numeral} className="ok-law-card">
                    <div style={{
                      fontSize: 8, color: T.gold, fontFamily: 'monospace',
                      letterSpacing: '2px', marginBottom: 6, textTransform: 'uppercase',
                    }}>
                      Law {law.numeral}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5,
                    }}>
                      {law.title}
                    </div>
                    <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.55 }}>
                      {law.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {/* Operational Meaning */}
          <Field label="Operational Meaning">
            <p style={{ fontSize: '0.9rem', color: T.muted, lineHeight: 1.78, margin: 0 }}>
              {active.operational_meaning}
            </p>
          </Field>

          {/* Failure Pattern */}
          <Field label="Failure Pattern" accent>
            <p style={{
              fontSize: '0.88rem', color: T.warnText,
              lineHeight: 1.75, margin: 0,
            }}>
              {active.failure_pattern}
            </p>
          </Field>

          {/* Operator Question */}
          <div style={{
            marginTop: 28,
            padding: '16px 20px',
            background: accentColor === T.gold
              ? 'rgba(197,162,111,0.06)'
              : 'rgba(0,216,255,0.04)',
            borderLeft: `3px solid ${accentColor}`,
            border: `1px solid ${accentBorder}`,
          }}>
            <div className="ok-field-label" style={{ color: accentColor }}>
              Operator Question
            </div>
            <p style={{
              fontSize: '0.93rem', color: T.text,
              lineHeight: 1.65, margin: 0, fontStyle: 'italic',
            }}>
              {active.operator_question}
            </p>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 1, background: T.border, position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                background: accentColor,
                width: `${progressPct}%`,
                transition: 'width 250ms ease',
              }} />
            </div>
            <span style={{
              fontSize: 9, color: T.dimmer, fontFamily: 'monospace',
              letterSpacing: '1px', flexShrink: 0,
            }}>
              {String(activeIdx + 1).padStart(2, '0')} / {ALL_MODULES.length}
            </span>
          </div>

          {/* Prev / Next */}
          <div style={{
            marginTop: 20,
            display: 'flex', justifyContent: 'space-between', gap: 12,
          }}>
            {prev ? (
              <button
                className="ok-prev-next"
                onClick={() => goTo(prev.id)}
                style={{ color: T.dim }}
              >
                <div style={{
                  fontSize: 8, letterSpacing: '2px', color: T.dimmer,
                  fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  ← Previous
                </div>
                {prev.title}
              </button>
            ) : <div />}

            {next ? (
              <button
                className="ok-prev-next"
                onClick={() => goTo(next.id)}
                style={{ color: T.dim, textAlign: 'right' }}
              >
                <div style={{
                  fontSize: 8, letterSpacing: '2px', color: T.dimmer,
                  fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4,
                  textAlign: 'right',
                }}>
                  Next →
                </div>
                {next.title}
              </button>
            ) : <div />}
          </div>

          {/* Keyboard hint */}
          <div style={{
            marginTop: 24, fontSize: 9, color: T.dimmer,
            letterSpacing: '1px', fontFamily: 'monospace',
          }}>
            ← → navigate modules
          </div>
        </main>
      </div>
    </>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function ZoneLabel({ label, style: sx }: {
  label: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="ok-section-label"
      style={{ color: '#2A3548', marginBottom: 6, ...sx }}
    >
      {label}
    </div>
  )
}

function Field({ label, children, accent }: {
  label: string
  children: ReactNode
  accent?: boolean
}) {
  return (
    <div style={{ marginTop: 26 }}>
      <div
        className="ok-field-label"
        style={{ color: accent ? 'rgba(180,100,40,0.55)' : '#2A3548' }}
      >
        {label}
      </div>
      {accent ? (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(160,80,30,0.07)',
          border: '1px solid rgba(160,80,30,0.18)',
          borderLeft: '2px solid rgba(160,80,30,0.45)',
        }}>
          {children}
        </div>
      ) : children}
    </div>
  )
}
