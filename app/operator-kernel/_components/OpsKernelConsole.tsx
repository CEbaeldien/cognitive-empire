'use client'

import { useState, useEffect, useCallback } from 'react'

/* ── Design tokens ───────────────────────────────────────── */
const C = {
  bg:           '#03050A',
  surface:      '#06090F',
  panel:        '#090E18',
  panelRaised:  '#0C1220',
  border:       'rgba(255,255,255,0.07)',
  borderGold:   'rgba(197,162,111,0.28)',
  borderCyan:   'rgba(0,216,255,0.16)',
  borderWarn:   'rgba(160,90,30,0.28)',
  borderAction: 'rgba(55,120,85,0.28)',
  text:         '#D8E2EF',
  textBright:   '#EEF4FA',
  muted:        '#7A8DA6',
  dim:          '#3E5068',
  dimmer:       '#243040',
  gold:         '#C5A26F',
  goldSoft:     'rgba(197,162,111,0.06)',
  cyan:         '#00D8FF',
  cyanSoft:     'rgba(0,216,255,0.04)',
  warnText:     '#8A5520',
  warnBg:       'rgba(130,70,20,0.08)',
  actionText:   '#3D7A58',
  actionBg:     'rgba(45,110,70,0.07)',
} as const

/* ── Types ──────────────────────────────────────────────── */
type GroupKey = 'core-doctrine' | 'operational-reality' | 'horizon-constraints'
type TabKey   = 'ops-kernel'   | 'maintenance-gravity'  | 'physical'            | 'metrics'

type LawEntry = { numeral: string; title: string; description: string }

type OpsModule = {
  id:                 string
  group:              GroupKey
  num:                string
  title:              string
  subtitle:           string
  thesis:             string
  operationalMeaning: string
  failurePattern:     string
  operatorQuestion:   string
  operatorMove:       string
  relatedModules:     string[]
  canonLinks:         { label: string }[]
  route:              string
  laws?:              LawEntry[]
}

/* ── Module data ─────────────────────────────────────────── */
const MODULES: OpsModule[] = [
  /* ── CORE DOCTRINE ─── */
  {
    id:                 'prime-doctrine',
    group:              'core-doctrine',
    num:                '01',
    title:              'Prime Doctrine',
    subtitle:           'Production is not the constraint. Judgment is.',
    thesis:             'The defining shift of this era is not that machines can produce more. That is the visible layer. The deeper shift is structural. Execution simplifies. Production cheapens. Iteration accelerates. Output multiplies. What changes is not capability. What changes is constraint.',
    operationalMeaning: 'The bottleneck has migrated from production to judgment. The operator who produces more has no structural advantage. The operator who selects, governs, and directs has the advantage.',
    failurePattern:     'Continuing to optimize production capacity after the bottleneck has moved to judgment. Building more workflows, automating more outputs — while structural coherence collapses.',
    operatorQuestion:   'Where is the real bottleneck in my system right now?',
    operatorMove:       'Audit where you are spending effort. Is it at the production layer or the judgment layer? Move resources to judgment.',
    relatedModules:     ['bottleneck-migration', 'decision-half-life', 'governance-abundance'],
    canonLinks:         [{ label: 'CE Public Canon — Prime Doctrine' }],
    route:              'Ops Kernel / Core Doctrine',
  },
  {
    id:                 'immutable-laws',
    group:              'core-doctrine',
    num:                '02',
    title:              'Immutable Laws',
    subtitle:           'Eight laws govern how constraint migrates under abundance.',
    thesis:             'The Eight Laws are not predictions. They are structural observations about how constraint migrates. Use them as a diagnostic lens. When something breaks in your system, ask which law is expressing itself.',
    operationalMeaning: 'Each law describes a migration — from one bottleneck to another. The operator who can name which law is currently dominant has structural orientation. The operator who cannot is reacting.',
    failurePattern:     'Treating the Eight Laws as theoretical framework rather than live operational structure. Failing to identify which law is driving the current constraint.',
    operatorQuestion:   'Which law is currently most active in my system?',
    operatorMove:       'Name the law that is currently most active in your primary system. Act from that identification — not from the visible symptom.',
    relatedModules:     ['prime-doctrine', 'bottleneck-migration', 'governance-abundance'],
    canonLinks:         [{ label: 'CE Public Canon — The Eight Laws' }],
    route:              'Ops Kernel / Core Doctrine',
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
    id:                 'signal-vs-noise',
    group:              'core-doctrine',
    num:                '03',
    title:              'Signal vs Noise',
    subtitle:           'When production cheapens, visibility becomes a lagging indicator.',
    thesis:             'Intelligence abundance does not eliminate information asymmetry. It reorganizes it. When production becomes inexpensive, visibility becomes a lagging indicator of structural reality. Signal compounds quietly. Noise scales rapidly.',
    operationalMeaning: 'The operator must distinguish signals — accumulated structural evidence revealing directional pressure — from noise: high-volume, low-value information artifacts. Noise is not wrong. It is insufficient.',
    failurePattern:     'Mistaking visibility for signal strength. Acting on distribution events as if they were structural evidence. Tracking what is loud rather than what is structurally true.',
    operatorQuestion:   'What am I treating as signal that is actually noise?',
    operatorMove:       'Audit your top 5 information inputs. For each, ask: is this structural evidence or a distribution event? Cut at least one noise input.',
    relatedModules:     ['bottleneck-migration', 'diagnostic-questions', 'second-order-effects'],
    canonLinks:         [{ label: 'CE Public Canon — Signal vs Noise' }],
    route:              'Ops Kernel / Core Doctrine',
  },
  {
    id:                 'bottleneck-migration',
    group:              'core-doctrine',
    num:                '04',
    title:              'Bottleneck Migration',
    subtitle:           'The constraint has already moved. Are you optimizing the old one?',
    thesis:             'Every system operates under constraint. When one dissolves, another becomes dominant. Production → Selection. Execution → Ownership. Access → Orchestration. Building → Governance. Analysis → Responsibility. Creation → Continuity. Visibility → Verifiability. Speed → Survivability.',
    operationalMeaning: 'Optimizing the old bottleneck after migration is invisible waste. Tracking the dominant constraint requires active diagnosis, not historical precedent.',
    failurePattern:     "Solving last era's constraint after the bottleneck has already migrated. The system looks productive while the real bottleneck accumulates pressure elsewhere.",
    operatorQuestion:   'What bottleneck am I still optimizing for that has already moved?',
    operatorMove:       'Identify the current dominant constraint. Confirm it has not migrated. Stop optimizing anything that is not the current bottleneck.',
    relatedModules:     ['prime-doctrine', 'immutable-laws', 'maintenance-gravity'],
    canonLinks:         [{ label: 'CE Public Canon — Bottleneck Migration' }],
    route:              'Ops Kernel / Core Doctrine',
  },
  {
    id:                 'modular-cognition',
    group:              'core-doctrine',
    num:                '05',
    title:              'Modular Cognition',
    subtitle:           'Access is not architecture.',
    thesis:             'Modular Cognition is the deliberate structuring of distributed intelligence into a governed system. Architecture determines outcome. The operator commits. Accumulating capabilities without a governing structure creates the illusion of power while creating structural fragility.',
    operationalMeaning: 'Intelligence must be governed at the architecture level, not just at the tool level. The operator who uses twelve AI tools without a governing structure is not orchestrating — they are accumulating.',
    failurePattern:     'Collecting capabilities without a governing architecture. Tool abundance without structural commitment. High surface area with no coherent system beneath it.',
    operatorQuestion:   'What is the governing architecture of my intelligence stack?',
    operatorMove:       'Map your intelligence stack. Identify which components have a governing architecture and which are accumulated tools. Retire at least one ungoverned tool.',
    relatedModules:     ['governance-abundance', 'complexity-accumulation', 'decision-half-life'],
    canonLinks:         [{ label: 'CE Public Canon — Modular Cognition' }],
    route:              'Ops Kernel / Core Doctrine',
  },
  {
    id:                 'decision-half-life',
    group:              'core-doctrine',
    num:                '06',
    title:              'Decision Half-Life',
    subtitle:           'Some decisions must be defended. Others must adapt.',
    thesis:             'Not all decisions should be treated equally. High half-life decisions are commitments that must be defended under pressure — identity, governance structure, core doctrine. Low half-life decisions must be updated as conditions change — tactics, tools, surface approaches.',
    operationalMeaning: 'The operator must classify decisions by their half-life before committing resources to defend or revise them. Defending a low-half-life decision wastes capital. Revising a high-half-life decision creates incoherence.',
    failurePattern:     'Treating all decisions the same — either defending everything rigidly and becoming obsolete, or adapting everything reactively and becoming incoherent.',
    operatorQuestion:   'Which of my current commitments need defense, and which need revision?',
    operatorMove:       'List your top 3 current commitments. Assign each a half-life: high (must defend) or low (must update). Act accordingly before the next decision point.',
    relatedModules:     ['governance-abundance', 'operator-moves', 'survivable-systems'],
    canonLinks:         [{ label: 'CE Public Canon — Decision Half-Life' }],
    route:              'Ops Kernel / Core Doctrine',
  },
  {
    id:                 'governance-abundance',
    group:              'core-doctrine',
    num:                '07',
    title:              'Governance Under Abundance',
    subtitle:           'Capability without governance is liability.',
    thesis:             'Every intelligent system requires three layers: computation, commitment, and consequence. Computation can be distributed. Commitment must be bounded by authority. Consequence must be owned by identifiable actors. The more capable the system, the more critical governance becomes.',
    operationalMeaning: 'Capability without governance is liability. The operator who expands capability without expanding governance structure is accelerating toward a governance failure.',
    failurePattern:     'Building capable systems without defined ownership, authority boundaries, or consequence structures. High output, low accountability.',
    operatorQuestion:   'Who owns the consequence in every system I am running?',
    operatorMove:       'For each system you run, confirm: who owns the consequence? If unowned, assign ownership explicitly or retire the system.',
    relatedModules:     ['modular-cognition', 'decision-half-life', 'survivable-systems'],
    canonLinks:         [{ label: 'CE Public Canon — Governance Under Abundance' }],
    route:              'Ops Kernel / Core Doctrine',
  },

  /* ── OPERATIONAL REALITY ─── */
  {
    id:                 'maintenance-gravity',
    group:              'operational-reality',
    num:                'MG-01',
    title:              'Maintenance Gravity',
    subtitle:           'Starting is cheap. Sustaining compounds.',
    thesis:             'Creation friction is falling faster than continuity capacity is expanding. Starting becomes inexpensive. Sustaining compounds. Every new tool, workflow, automation, and system adds future upkeep, ownership, and escalation cost. The question is no longer only: Can this be built? The question is: Can this remain coherent?',
    operationalMeaning: 'Every system created adds future governance cost. The operator who creates without accounting for maintenance gravity will be crushed by it — not in the moment of creation, but months later when the system demands attention it was never designed to receive.',
    failurePattern:     'The operator feels productive while the system becomes harder to govern. Output is increasing. Maintenance gravity is accumulating. No alarm sounds until the system fails to sustain.',
    operatorQuestion:   'What have I created that I can no longer maintain cleanly?',
    operatorMove:       'List every system, tool, and workflow created in the last 6 months. For each: can you maintain it cleanly? Retire or explicitly assign everything you cannot.',
    relatedModules:     ['complexity-accumulation', 'survivable-systems', 'bottleneck-migration'],
    canonLinks:         [{ label: 'CE Public Canon — Maintenance Gravity' }],
    route:              'Maintenance Gravity / Operational Reality',
  },
  {
    id:                 'complexity-accumulation',
    group:              'operational-reality',
    num:                'MG-02',
    title:              'Complexity Accumulation',
    subtitle:           'Complexity accumulates invisibly until it governs you.',
    thesis:             "Systems do not announce when they become too complex to govern. Complexity accumulates through addition — new tools, integrations, exceptions, workarounds, and debt. Each addition feels manageable. The aggregate becomes structural drag.",
    operationalMeaning: 'The operator must audit complexity actively. Passive management allows accumulation until crisis. Complexity becomes invisible through familiarity — the operator no longer sees what they navigate around every day.',
    failurePattern:     'Adding capabilities, integrations, and tools without retiring the old ones. Workarounds become architecture. Exceptions become defaults. The system becomes ungovernable.',
    operatorQuestion:   'What complexity have I accumulated that I have not audited in 90 days?',
    operatorMove:       'Select one system you manage. List every integration, exception, and workaround added in the last 12 months. Retire at least one this week.',
    relatedModules:     ['maintenance-gravity', 'survivable-systems', 'metrics-that-matter'],
    canonLinks:         [{ label: 'CE Public Canon — Complexity Accumulation' }],
    route:              'Maintenance Gravity / Operational Reality',
  },
  {
    id:                 'survivable-systems',
    group:              'operational-reality',
    num:                'MG-03',
    title:              'Survivable Systems',
    subtitle:           'Build for reduction, not just expansion.',
    thesis:             'Abundance rewards expansion. Survival rewards coherence. The systems that endure will be the systems that remain governable under pressure. The survivable system has defined ownership at every layer, clear escalation paths, and the capacity to reduce scope without losing function.',
    operationalMeaning: 'Design for reduction, not just expansion. A system that can shed 40% of its surface area and still function coherently is more survivable than one that requires every part to operate.',
    failurePattern:     'Building for maximum capability rather than maximum coherence. The system becomes brittle under any significant perturbation — it can expand but cannot contract.',
    operatorQuestion:   'If I removed 40% of my current capabilities, would what remained be more survivable?',
    operatorMove:       'Identify 40% of your current capability surface that could be removed. If you cannot identify it, treat this as a governance emergency.',
    relatedModules:     ['maintenance-gravity', 'governance-abundance', 'metrics-that-matter'],
    canonLinks:         [{ label: 'CE Public Canon — Survivable Systems' }],
    route:              'Maintenance Gravity / Operational Reality',
  },
  {
    id:                 'metrics-that-matter',
    group:              'operational-reality',
    num:                'MG-04',
    title:              'Metrics That Matter',
    subtitle:           'The wrong metrics accelerate failure.',
    thesis:             'Output metrics measure the wrong layer after the bottleneck has migrated. The metrics that matter are structural: coherence, ownership clarity, decision half-life, escalation integrity, and maintenance load — not production volume.',
    operationalMeaning: 'Replace production metrics with governance metrics. Measure what determines survivability, not what looks impressive in a report. Volume is not signal. Structure is signal.',
    failurePattern:     'Using volume metrics as proxies for structural health. Producing more while governing less. Looking healthy while becoming fragile.',
    operatorQuestion:   'Am I measuring what will determine my survivability in the next 18 months?',
    operatorMove:       'Replace one production metric with a structural governance metric this week. Measure ownership clarity, decision half-life, or escalation integrity instead.',
    relatedModules:     ['diagnostic-questions', 'complexity-accumulation', 'governance-abundance'],
    canonLinks:         [{ label: 'CE Public Canon — Metrics Under Abundance' }],
    route:              'Maintenance Gravity / Operational Reality',
  },
  {
    id:                 'diagnostic-questions',
    group:              'operational-reality',
    num:                'MG-05',
    title:              'Diagnostic Questions',
    subtitle:           'Four questions orient the operator under structural pressure.',
    thesis:             'What changed? What structural direction does it support? What pressure is accumulating? What second-order consequence follows? These are not analytical questions — they are navigational. Apply them to every signal, every decision, every new capability before committing.',
    operationalMeaning: 'Structural orientation does not require prediction. It requires the discipline to ask navigational questions before acting. The operator who applies these four questions consistently builds directional capital over time.',
    failurePattern:     'Reacting to events without structural orientation. Operating in the visible layer only. Addressing the first-order problem without diagnosing the structural direction it represents.',
    operatorQuestion:   'Apply all four questions to the most significant decision you made this week.',
    operatorMove:       'Take the most significant recent event. Write one-line answers to all four questions. Act from the structural direction they identify, not from the immediate symptom.',
    relatedModules:     ['signal-vs-noise', 'second-order-effects', 'operator-moves'],
    canonLinks:         [{ label: 'CE Public Canon — The Four Questions' }],
    route:              'Maintenance Gravity / Operational Reality',
  },
  {
    id:                 'operator-moves',
    group:              'operational-reality',
    num:                'MG-06',
    title:              'Operator Moves',
    subtitle:           'The operator has defined structural moves available.',
    thesis:             "Direction Without Prediction: The operator does not need to predict every event. They need to understand which constraint is becoming dominant. Available moves: audit complexity, retire what cannot be maintained, clarify ownership, raise governance level on critical decisions, identify which law is most active.",
    operationalMeaning: "The operator's job is not to forecast — it is to maintain direction under volatility by reading which bottleneck is accumulating pressure and executing the appropriate structural move.",
    failurePattern:     'Waiting for certainty before moving. Analysis paralysis in the face of structural pressure. The operator studies the constraint rather than moving against it.',
    operatorQuestion:   'What is the one structural move available to me right now that I have been avoiding?',
    operatorMove:       'Identify the current dominant constraint. Select the one structural move that directly addresses it. Execute before analysis is complete.',
    relatedModules:     ['diagnostic-questions', 'bottleneck-migration', 'maintenance-gravity'],
    canonLinks:         [{ label: 'CE Public Canon — Direction Without Prediction' }],
    route:              'Maintenance Gravity / Operational Reality',
  },

  /* ── HORIZON & CONSTRAINTS ─── */
  {
    id:                 'physical-constraints',
    group:              'horizon-constraints',
    num:                'HC-01',
    title:              'Physical Constraints',
    subtitle:           'Digital intelligence remains bounded by physical systems.',
    thesis:             'Intelligence abundance appears digital. Its constraints are physical. Digital intelligence remains bounded by physical systems — energy infrastructure, compute hardware, supply chains, and physical geography. No digital system overrides energy scarcity, infrastructure failure, or geographic physical reality.',
    operationalMeaning: 'Physical constraint is the ultimate governance layer. The operator who treats digital capability as unconstrained by physical infrastructure will be surprised by the physical layer.',
    failurePattern:     'Treating digital capability as sovereign from physical infrastructure. Failing to model energy, compute, and physical system dependencies into operational planning.',
    operatorQuestion:   'What physical constraints bound my digital intelligence stack?',
    operatorMove:       'Map the physical dependencies of your digital intelligence stack. Identify the single physical constraint that could most rapidly limit your capability.',
    relatedModules:     ['bottleneck-migration', 'survivable-systems', 'second-order-effects'],
    canonLinks:         [{ label: 'CE Public Canon — Physical Constraints' }],
    route:              'Constraints / Horizon',
  },
  {
    id:                 'second-order-effects',
    group:              'horizon-constraints',
    num:                'HC-02',
    title:              'Second-Order Effects',
    subtitle:           'Design for consequence, not excitement.',
    thesis:             'First-order effects are visible. Second-order effects are harder to see, yet more consequential. Every operational decision generates second-order effects that govern the eventual outcome. Design for consequence, not excitement.',
    operationalMeaning: 'The discipline is not to predict second-order effects — it is to ask for them before acting. What does this enable next? What constraint does this remove, and what constraint does that removal create?',
    failurePattern:     'Acting on visible first-order effects while ignoring the second-order consequences. Solving the current problem while creating the next one.',
    operatorQuestion:   'What second-order effects am I generating that I have not yet evaluated?',
    operatorMove:       'For your most recent significant decision: write the second-order effects. If you have not done this, do it before the second-order consequences arrive uninvited.',
    relatedModules:     ['physical-constraints', 'diagnostic-questions', 'governance-abundance'],
    canonLinks:         [{ label: 'CE Public Canon — Second-Order Effects' }],
    route:              'Constraints / Horizon',
  },
]

/* ── Nav group config ─────────────────────────────────────── */
const GROUPS: { key: GroupKey; label: string; color: string }[] = [
  { key: 'core-doctrine',       label: 'Core Doctrine',       color: '#C5A26F' },
  { key: 'operational-reality', label: 'Operational Reality', color: '#00D8FF' },
  { key: 'horizon-constraints', label: 'Horizon & Constraints', color: '#8B9AB3' },
]

/* ── Tab config ───────────────────────────────────────────── */
const TABS: { key: TabKey; label: string; firstModule: string }[] = [
  { key: 'ops-kernel',         label: 'Ops Kernel',          firstModule: 'prime-doctrine'    },
  { key: 'maintenance-gravity',label: 'Maintenance Gravity', firstModule: 'maintenance-gravity' },
  { key: 'physical',           label: 'Physical',            firstModule: 'physical-constraints' },
  { key: 'metrics',            label: 'Metrics',             firstModule: 'metrics-that-matter' },
]

const TAB_FOR_GROUP: Record<GroupKey, TabKey> = {
  'core-doctrine':       'ops-kernel',
  'operational-reality': 'maintenance-gravity',
  'horizon-constraints': 'physical',
}

/* ── Main component ──────────────────────────────────────── */
export function OpsKernelConsole() {
  const [activeId, setActiveId]     = useState('prime-doctrine')
  const [activeTab, setActiveTab]   = useState<TabKey>('ops-kernel')
  const [transitioning, setTrans]   = useState(false)

  const idx     = MODULES.findIndex(m => m.id === activeId)
  const active  = MODULES[idx]!
  const prev    = idx > 0 ? MODULES[idx - 1] : null
  const next    = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  const goTo = useCallback((id: string) => {
    if (id === activeId) return
    setTrans(true)
    setTimeout(() => {
      setActiveId(id)
      const m = MODULES.find(m => m.id === id)
      if (m) setActiveTab(TAB_FOR_GROUP[m.group])
      setTrans(false)
    }, 160)
  }, [activeId])

  const goToTab = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    const first = TABS.find(t => t.key === tab)?.firstModule
    if (first) goTo(first)
  }, [goTo])

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

  const groupColor = GROUPS.find(g => g.key === active.group)?.color ?? C.gold

  return (
    <>
      <style>{`
        /* ── Shell ── */
        .ck-shell {
          display: flex; flex-direction: column;
          height: calc(100vh - 80px);
          background: ${C.bg}; overflow: hidden;
          position: relative;
        }
        /* subtle dot grid */
        .ck-shell::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          z-index: 0;
        }

        /* ── Zone tabs ── */
        .ck-tabs {
          display: flex; align-items: stretch; gap: 0;
          height: 36px; flex-shrink: 0;
          border-bottom: 1px solid ${C.border};
          background: ${C.surface};
          position: relative; z-index: 1;
          padding: 0 12px;
          overflow-x: auto; scrollbar-width: none;
        }
        .ck-tabs::-webkit-scrollbar { display: none; }
        .ck-tab-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 0 14px; height: 36px;
          font-size: 9px; letter-spacing: 2.5px;
          text-transform: uppercase; font-family: monospace;
          cursor: pointer; border: none; background: none;
          border-bottom: 2px solid transparent;
          color: ${C.dim}; white-space: nowrap; flex-shrink: 0;
          transition: color 130ms ease, border-color 130ms ease;
          margin-bottom: -1px;
        }
        .ck-tab-btn:hover:not([data-active]) { color: ${C.muted}; }
        .ck-tab-btn[data-active] { color: ${C.gold}; border-bottom-color: ${C.gold}; }
        .ck-tab-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
          background: currentColor; opacity: 0.6;
        }

        /* ── Three-column body ── */
        .ck-body {
          display: grid;
          grid-template-columns: 272px 1fr 272px;
          flex: 1; min-height: 0; overflow: hidden;
          position: relative; z-index: 1;
        }

        /* ── Left rail ── */
        .ck-left {
          border-right: 1px solid ${C.border};
          overflow-y: auto; padding: 14px 0 48px;
          background: ${C.surface};
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.05) transparent;
        }
        .ck-left::-webkit-scrollbar { width: 3px; }
        .ck-left::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 2px; }

        /* ── Center viewport ── */
        .ck-center {
          overflow-y: auto; padding: 28px 36px 64px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.05) transparent;
          transition: opacity 160ms ease;
        }
        .ck-center::-webkit-scrollbar { width: 3px; }
        .ck-center::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 2px; }

        /* ── Right panel ── */
        .ck-right {
          border-left: 1px solid ${C.border};
          overflow-y: auto; padding: 20px 0 48px;
          background: ${C.surface};
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.05) transparent;
        }
        .ck-right::-webkit-scrollbar { width: 3px; }
        .ck-right::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 2px; }

        /* ── Nav group header ── */
        .ck-group-hd {
          font-size: 8px; letter-spacing: 2.5px;
          text-transform: uppercase; font-family: monospace;
          padding: 0 14px; margin: 14px 0 5px;
          user-select: none; color: ${C.dimmer};
        }
        .ck-group-hd:first-child { margin-top: 4px; }

        /* ── Nav item ── */
        .ck-nav-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; text-align: left;
          background: none; border: none;
          border-left: 2px solid transparent;
          cursor: pointer; padding: 5px 14px 5px 12px;
          font-size: 11px; line-height: 1.35; color: ${C.dim};
          transition: color 120ms, background 120ms, border-color 120ms;
        }
        .ck-nav-item:hover:not([data-active]) {
          background: rgba(255,255,255,0.02); color: ${C.muted};
        }
        .ck-nav-item[data-active] {
          border-left-color: ${C.gold};
          background: rgba(197,162,111,0.05);
          color: ${C.gold};
        }
        .ck-nav-num {
          font-size: 8px; font-family: monospace;
          letter-spacing: 1px; opacity: 0.4; flex-shrink: 0;
        }

        /* ── Content blocks ── */
        .ck-block {
          background: ${C.panel};
          border: 1px solid ${C.border};
          border-radius: 2px;
          padding: 14px 16px; margin-bottom: 7px;
        }
        .ck-block-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 8px; letter-spacing: 2.5px;
          text-transform: uppercase; font-family: monospace;
          margin-bottom: 9px;
        }
        .ck-block-marker {
          width: 5px; height: 5px; flex-shrink: 0;
        }

        /* ── Right panel sections ── */
        .ck-rp-section {
          padding: 12px 16px 14px;
          border-bottom: 1px solid ${C.border};
        }
        .ck-rp-label {
          font-size: 8px; letter-spacing: 2.5px;
          text-transform: uppercase; font-family: monospace;
          color: ${C.dimmer}; margin-bottom: 8px; display: block;
        }
        .ck-rp-btn {
          display: block; width: 100%;
          background: none; border: 1px solid ${C.border};
          cursor: pointer; text-align: left;
          padding: 9px 12px; font-size: 11px;
          color: ${C.muted}; line-height: 1.35;
          transition: border-color 130ms, color 130ms, background 130ms;
          margin-bottom: 5px;
        }
        .ck-rp-btn:hover {
          border-color: ${C.borderGold}; color: ${C.gold};
          background: rgba(197,162,111,0.04);
        }
        .ck-rp-btn:last-child { margin-bottom: 0; }
        .ck-nav-next-prev {
          display: flex; gap: 5px; padding: 0 16px;
        }
        .ck-dir-btn {
          flex: 1; border: 1px solid ${C.border};
          background: none; cursor: pointer;
          padding: 8px 10px; font-size: 10px;
          font-family: monospace; letter-spacing: 1px;
          color: ${C.dim}; text-align: center;
          transition: border-color 130ms, color 130ms, background 130ms;
        }
        .ck-dir-btn:hover:not(:disabled) {
          border-color: ${C.borderGold}; color: ${C.gold};
          background: rgba(197,162,111,0.04);
        }
        .ck-dir-btn:disabled { opacity: 0.2; cursor: default; }

        /* ── Mobile: horizontal strip ── */
        .ck-mobile-strip {
          display: none;
          overflow-x: auto; gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid ${C.border};
          background: ${C.surface};
          position: sticky; top: 80px; z-index: 20;
          scrollbar-width: none;
        }
        .ck-mobile-strip::-webkit-scrollbar { display: none; }
        .ck-mobile-chip {
          border: 1px solid ${C.border};
          background: none; cursor: pointer;
          padding: 4px 10px; font-size: 10px;
          white-space: nowrap; flex-shrink: 0;
          color: ${C.dim};
          transition: border-color 120ms, color 120ms, background 120ms;
        }
        .ck-mobile-chip[data-active] {
          border-color: ${C.borderGold}; color: ${C.gold};
          background: rgba(197,162,111,0.05);
        }

        /* ── Laws grid ── */
        .ck-laws-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 6px; margin-top: 12px;
        }
        .ck-law-card {
          background: ${C.panelRaised};
          border: 1px solid ${C.border};
          padding: 10px 12px;
          transition: border-color 130ms;
        }
        .ck-law-card:hover { border-color: rgba(197,162,111,0.20); }

        /* ── Progress bar ── */
        .ck-progress-track {
          height: 1px; background: ${C.border};
          position: relative; flex: 1;
        }
        .ck-progress-fill {
          position: absolute; top: 0; left: 0; bottom: 0;
          background: ${C.gold};
          transition: width 240ms ease;
        }

        /* ── Responsive ── */
        @media (max-width: 1279px) {
          .ck-body { grid-template-columns: 252px 1fr; }
          .ck-right { display: none; }
        }
        @media (max-width: 1023px) {
          .ck-shell { height: auto; min-height: calc(100vh - 80px); overflow: visible; }
          .ck-body { grid-template-columns: 1fr; }
          .ck-left { display: none; }
          .ck-center { overflow-y: visible; padding: 24px 20px 60px; }
          .ck-tabs { display: none; }
          .ck-mobile-strip { display: flex; }
        }
        @media (max-width: 639px) {
          .ck-center { padding: 20px 14px 56px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ck-center, .ck-tab-btn, .ck-nav-item, .ck-mobile-chip,
          .ck-block, .ck-rp-btn, .ck-dir-btn, .ck-progress-fill,
          .ck-law-card { transition: none !important; }
        }
      `}</style>

      <div className="ck-shell">

        {/* ── Zone tabs ── */}
        <div className="ck-tabs" role="tablist" aria-label="Content zones">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className="ck-tab-btn"
              role="tab"
              data-active={activeTab === tab.key ? '' : undefined}
              onClick={() => goToTab(tab.key)}
            >
              <span className="ck-tab-dot" />
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 8, letterSpacing: '2px', color: C.dimmer,
            fontFamily: 'monospace', textTransform: 'uppercase',
            alignSelf: 'center', paddingRight: 4,
          }}>
            {MODULES.length} Modules
          </span>
        </div>

        {/* ── Mobile strip ── */}
        <div className="ck-mobile-strip">
          {MODULES.map(m => (
            <button
              key={m.id}
              className="ck-mobile-chip"
              data-active={activeId === m.id ? '' : undefined}
              onClick={() => goTo(m.id)}
            >
              <span style={{ opacity: 0.4, marginRight: 4, fontSize: 8, fontFamily: 'monospace' }}>{m.num}</span>
              {m.title}
            </button>
          ))}
        </div>

        {/* ── Three-column body ── */}
        <div className="ck-body">

          {/* ── Left rail ── */}
          <nav className="ck-left" aria-label="Module navigation">
            {GROUPS.map(group => (
              <div key={group.key}>
                <div
                  className="ck-group-hd"
                  style={{ color: group.color + '55' }}
                >
                  {group.label}
                </div>
                {MODULES.filter(m => m.group === group.key).map(m => (
                  <button
                    key={m.id}
                    className="ck-nav-item"
                    data-active={activeId === m.id ? '' : undefined}
                    onClick={() => goTo(m.id)}
                    style={activeId === m.id ? { color: group.color, borderLeftColor: group.color + '88', background: group.color + '09' } : undefined}
                  >
                    <span className="ck-nav-num">{m.num}</span>
                    {m.title}
                  </button>
                ))}
              </div>
            ))}

            {/* Canon footer */}
            <div style={{
              margin: '20px 12px 0', padding: '14px 2px 0',
              borderTop: `1px solid ${C.border}`,
            }}>
              <div className="ck-group-hd" style={{ marginTop: 0, color: C.dimmer }}>
                Canon
              </div>
              <a
                href="/downloads/ce-public-kernel.pdf"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', fontSize: 11,
                  color: C.dim, textDecoration: 'none',
                  transition: 'color 120ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.gold }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.dim }}
              >
                <span style={{ opacity: 0.6 }}>↓</span> Download PDF
              </a>
            </div>
          </nav>

          {/* ── Center viewport ── */}
          <main
            className="ck-center"
            style={{ opacity: transitioning ? 0 : 1 }}
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Module header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14,
              }}>
                <span style={{
                  fontSize: 8, letterSpacing: '3px', color: groupColor,
                  textTransform: 'uppercase', fontFamily: 'monospace', opacity: 0.7,
                }}>
                  {GROUPS.find(g => g.key === active.group)?.label}
                </span>
                <span style={{ color: C.border }}>·</span>
                <span style={{
                  fontSize: 8, letterSpacing: '2px', color: C.dimmer,
                  fontFamily: 'monospace', textTransform: 'uppercase',
                }}>
                  {active.num}
                </span>
              </div>

              {/* Module marker */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, marginBottom: 14,
                border: `1px solid ${groupColor}33`,
                fontFamily: 'monospace', fontSize: 11, letterSpacing: '1px',
                color: groupColor,
              }}>
                {active.num}
              </div>

              <h1 style={{
                fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                fontWeight: 700, color: C.textBright,
                letterSpacing: '-0.03em', lineHeight: 1.0,
                margin: '0 0 10px',
              }}>
                {active.title}
              </h1>

              {/* Subtitle — uppercase tagline */}
              <div style={{
                fontSize: 11, letterSpacing: '1.5px', color: groupColor,
                textTransform: 'uppercase', marginBottom: 16, lineHeight: 1.4,
                opacity: 0.8,
              }}>
                {active.subtitle}
              </div>

              <div style={{
                height: 1,
                background: `linear-gradient(90deg, ${groupColor}30, ${C.border} 50%, transparent)`,
              }} />
            </div>

            {/* ── Content block: THESIS ── */}
            <ContentBlock
              label="Thesis"
              markerColor={C.gold}
              borderColor={C.borderGold}
              bg={C.panel}
            >
              <p style={{ fontSize: '0.9rem', color: C.text, lineHeight: 1.75, margin: 0 }}>
                {active.thesis}
              </p>

              {/* Eight Laws grid (Immutable Laws module only) */}
              {active.laws && (
                <div className="ck-laws-grid">
                  {active.laws.map(law => (
                    <div key={law.numeral} className="ck-law-card">
                      <div style={{
                        fontSize: 8, color: C.gold, fontFamily: 'monospace',
                        letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5,
                      }}>
                        Law {law.numeral}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                        {law.title}
                      </div>
                      <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>
                        {law.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ContentBlock>

            {/* ── Content block: OPERATIONAL MEANING ── */}
            <ContentBlock
              label="Operational Meaning"
              markerColor={C.muted}
              borderColor={C.border}
              bg={C.panel}
            >
              <p style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.75, margin: 0 }}>
                {active.operationalMeaning}
              </p>
            </ContentBlock>

            {/* ── Content block: FAILURE PATTERN ── */}
            <ContentBlock
              label="Failure Pattern"
              markerColor={C.warnText}
              borderColor={`rgba(160,90,30,0.22)`}
              bg={`rgba(120,65,20,0.07)`}
            >
              <p style={{ fontSize: '0.88rem', color: C.warnText, lineHeight: 1.75, margin: 0 }}>
                {active.failurePattern}
              </p>
            </ContentBlock>

            {/* ── Content block: OPERATOR QUESTION ── */}
            <ContentBlock
              label="Operator Question"
              markerColor={C.gold}
              borderColor={C.borderGold}
              bg={C.goldSoft}
            >
              <p style={{ fontSize: '0.9rem', color: C.text, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                {active.operatorQuestion}
              </p>
            </ContentBlock>

            {/* ── Content block: OPERATOR MOVE ── */}
            <ContentBlock
              label="Operator Move"
              markerColor={C.actionText}
              borderColor={C.borderAction}
              bg={C.actionBg}
            >
              <p style={{ fontSize: '0.9rem', color: C.actionText, lineHeight: 1.7, margin: 0 }}>
                {active.operatorMove}
              </p>
            </ContentBlock>

            {/* Progress + counter */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginTop: 28,
            }}>
              <div className="ck-progress-track">
                <div
                  className="ck-progress-fill"
                  style={{ width: `${((idx + 1) / MODULES.length) * 100}%` }}
                />
              </div>
              <span style={{
                fontSize: 9, color: C.dimmer, fontFamily: 'monospace',
                letterSpacing: '1px', flexShrink: 0,
              }}>
                {String(idx + 1).padStart(2, '0')} / {MODULES.length}
              </span>
            </div>

            {/* Keyboard hint */}
            <div style={{
              marginTop: 10, fontSize: 9, color: C.dimmer,
              fontFamily: 'monospace', letterSpacing: '0.5px',
            }}>
              ← → navigate
            </div>
          </main>

          {/* ── Right context panel ── */}
          <aside className="ck-right" aria-label="Module context">

            {/* Module brief */}
            <div className="ck-rp-section">
              <span className="ck-rp-label">Module Brief</span>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0 }}>
                {active.subtitle}
              </p>
              <div style={{
                marginTop: 10, fontSize: 9, color: C.dimmer,
                fontFamily: 'monospace', letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>
                {active.route}
              </div>
            </div>

            {/* Related modules */}
            <div className="ck-rp-section">
              <span className="ck-rp-label">Related Modules</span>
              {active.relatedModules.map(relId => {
                const rel = MODULES.find(m => m.id === relId)
                if (!rel) return null
                return (
                  <button
                    key={relId}
                    className="ck-rp-btn"
                    onClick={() => goTo(relId)}
                  >
                    <span style={{
                      fontSize: 8, fontFamily: 'monospace', letterSpacing: '1px',
                      opacity: 0.4, marginRight: 6,
                    }}>
                      {rel.num}
                    </span>
                    {rel.title}
                  </button>
                )
              })}
            </div>

            {/* Canon links */}
            <div className="ck-rp-section">
              <span className="ck-rp-label">Canon Links</span>
              {active.canonLinks.map(link => (
                <div
                  key={link.label}
                  style={{
                    fontSize: 11, color: C.dim, padding: '4px 0', lineHeight: 1.4,
                    borderLeft: `2px solid ${C.border}`, paddingLeft: 8, marginBottom: 5,
                  }}
                >
                  {link.label}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="ck-rp-section">
              <span className="ck-rp-label">Navigate</span>
              <div className="ck-nav-next-prev" style={{ padding: 0, marginBottom: 5 }}>
                <button
                  className="ck-dir-btn"
                  onClick={() => prev && goTo(prev.id)}
                  disabled={!prev}
                >
                  ← Prev
                </button>
                <button
                  className="ck-dir-btn"
                  onClick={() => next && goTo(next.id)}
                  disabled={!next}
                >
                  Next →
                </button>
              </div>
              {prev && (
                <div style={{
                  fontSize: 10, color: C.dimmer, lineHeight: 1.3,
                  fontFamily: 'monospace', marginBottom: 2, letterSpacing: '0.3px',
                }}>
                  ← {prev.title}
                </div>
              )}
              {next && (
                <div style={{
                  fontSize: 10, color: C.dimmer, lineHeight: 1.3,
                  fontFamily: 'monospace', letterSpacing: '0.3px',
                }}>
                  → {next.title}
                </div>
              )}
            </div>

            {/* Canon actions */}
            <div className="ck-rp-section" style={{ borderBottom: 'none' }}>
              <span className="ck-rp-label">Canon</span>
              <a
                href="/downloads/ce-public-kernel.pdf"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', marginBottom: 5,
                  border: `1px solid ${C.border}`,
                  fontSize: 11, color: C.muted,
                  textDecoration: 'none',
                  transition: 'border-color 130ms, color 130ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = C.borderGold; el.style.color = C.gold
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = C.border; el.style.color = C.muted
                }}
              >
                Download PDF
                <span style={{ opacity: 0.4, fontSize: 10 }}>↓</span>
              </a>
              <div style={{
                padding: '7px 12px', fontSize: 10,
                color: C.dimmer, letterSpacing: '0.5px', lineHeight: 1.4,
                fontFamily: 'monospace',
              }}>
                Intelligence Is Abundant.<br />Judgment Is Power.
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  )
}

/* ── ContentBlock sub-component ─────────────────────────── */
function ContentBlock({
  label, markerColor, borderColor, bg, children,
}: {
  label:       string
  markerColor: string
  borderColor: string
  bg:          string
  children:    React.ReactNode
}) {
  return (
    <div
      className="ck-block"
      style={{ borderColor, background: bg }}
    >
      <div className="ck-block-label" style={{ color: markerColor }}>
        <span
          className="ck-block-marker"
          style={{ background: markerColor, borderRadius: 1 }}
        />
        {label}
      </div>
      {children}
    </div>
  )
}
