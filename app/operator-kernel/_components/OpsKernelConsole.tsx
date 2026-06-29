'use client'

import { useState, useEffect, useCallback } from 'react'

/* ── Design tokens ───────────────────────────────────────── */
const BG         = '#03050A'
const SURFACE    = '#05080E'
const PANEL      = '#08101C'
const PANEL_ALT  = '#0A1422'
const RAIL_BG    = '#04070C'
const HDR_BG     = '#040810'

const BORDER     = 'rgba(255,255,255,0.08)'
const BORDER_HI  = 'rgba(255,255,255,0.13)'

const TEXT       = '#D0DAEA'
const TEXT_DIM   = '#6A7D96'
const TEXT_DIMMER= '#2E3E52'

const GOLD       = '#C5A26F'
const GOLD_SOFT  = 'rgba(197,162,111,0.07)'

const CYAN       = '#00D8FF'
const CYAN_SOFT  = 'rgba(0,216,255,0.06)'
const CYAN_EDGE  = 'rgba(0,216,255,0.30)'

const AMBER      = '#8A5520'
const AMBER_SOFT = 'rgba(130,70,20,0.10)'
const AMBER_EDGE = 'rgba(160,90,30,0.30)'

const GREEN      = '#357A55'
const GREEN_SOFT = 'rgba(45,110,70,0.08)'
const GREEN_EDGE = 'rgba(50,120,80,0.30)'

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
    canonLinks:         [
      { label: 'Law I: Intelligence Abundance' },
      { label: 'Law II: Bottleneck Migration' },
      { label: 'Law VI: Escalation Preservation' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law I through VIII — Full Reference' },
      { label: 'Law V: Decision Half-Life' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law I: Intelligence Abundance' },
      { label: 'Law IV: Output Inflation' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law II: Bottleneck Migration' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law III: Responsibility Migration' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law V: Decision Half-Life' },
      { label: 'Law VI: Escalation Preservation' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law III: Responsibility Migration' },
      { label: 'Law VI: Escalation Preservation' },
    ],
    route:              'Ops Kernel › Core Doctrine',
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
    canonLinks:         [
      { label: 'Law VII: Optimization Fragility' },
      { label: 'Law III: Responsibility Migration' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law II: Bottleneck Migration' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law VII: Optimization Fragility' },
      { label: 'Law VIII: Human Differentiation' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law IV: Output Inflation' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law II: Bottleneck Migration' },
      { label: 'Law V: Decision Half-Life' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law II: Bottleneck Migration' },
      { label: 'Law VI: Escalation Preservation' },
    ],
    route:              'Maintenance Gravity › Operational Reality',
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
    canonLinks:         [
      { label: 'Law I: Intelligence Abundance' },
      { label: 'Law VII: Optimization Fragility' },
    ],
    route:              'Constraints › Horizon',
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
    canonLinks:         [
      { label: 'Law V: Decision Half-Life' },
      { label: 'Law VIII: Human Differentiation' },
    ],
    route:              'Constraints › Horizon',
  },
]

/* ── Nav group config ─────────────────────────────────────── */
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'core-doctrine',       label: 'Core Doctrine'         },
  { key: 'operational-reality', label: 'Operational Reality'   },
  { key: 'horizon-constraints', label: 'Horizon & Constraints' },
]

/* ── Tab config ───────────────────────────────────────────── */
const TABS: { key: TabKey; label: string; firstModule: string }[] = [
  { key: 'ops-kernel',          label: 'Ops Kernel',          firstModule: 'prime-doctrine'     },
  { key: 'maintenance-gravity', label: 'Maintenance Gravity', firstModule: 'maintenance-gravity' },
  { key: 'physical',            label: 'Physical',            firstModule: 'physical-constraints'},
  { key: 'metrics',             label: 'Metrics',             firstModule: 'metrics-that-matter' },
]

const TAB_FOR_GROUP: Record<GroupKey, TabKey> = {
  'core-doctrine':       'ops-kernel',
  'operational-reality': 'maintenance-gravity',
  'horizon-constraints': 'physical',
}

/* ── Main component ──────────────────────────────────────── */
export function OpsKernelConsole() {
  const [activeId, setActiveId]   = useState('prime-doctrine')
  const [activeTab, setActiveTab] = useState<TabKey>('ops-kernel')
  const [fading, setFading]       = useState(false)

  const idx    = MODULES.findIndex(m => m.id === activeId)
  const active = MODULES[idx]!
  const prev   = idx > 0 ? MODULES[idx - 1] : null
  const next   = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  const goTo = useCallback((id: string) => {
    if (id === activeId) return
    setFading(true)
    setTimeout(() => {
      setActiveId(id)
      const m = MODULES.find(m => m.id === id)
      if (m) setActiveTab(TAB_FOR_GROUP[m.group])
      setFading(false)
    }, 140)
  }, [activeId])

  const goToTab = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    const first = TABS.find(t => t.key === tab)?.firstModule
    if (first) goTo(first)
  }, [goTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && next) {
        e.preventDefault(); goTo(next.id)
      }
      if ((e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   && prev) {
        e.preventDefault(); goTo(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, prev, next])

  const groupName = GROUPS.find(g => g.key === active.group)?.label ?? ''

  return (
    <>
      <style>{CSS(BORDER, BORDER_HI, BG, SURFACE, PANEL, PANEL_ALT,
                   RAIL_BG, HDR_BG, TEXT, TEXT_DIM, TEXT_DIMMER,
                   GOLD, GOLD_SOFT, CYAN, CYAN_SOFT, CYAN_EDGE,
                   AMBER, AMBER_SOFT, AMBER_EDGE, GREEN, GREEN_SOFT, GREEN_EDGE)}</style>

      <div className="ck-shell">

        {/* ── Command header ── */}
        <div className="ck-cmd-hdr">
          <div className="ck-cmd-left">
            <span className="ck-cmd-title">Ops Kernel Command Center</span>
            <span className="ck-cmd-doctrine">Intelligence is abundant. Judgment is power.</span>
          </div>
          <div className="ck-pills">
            <span className="ck-pill">Public Command Surface</span>
            <span className="ck-pill">Canon + Operations</span>
            <span className="ck-pill ck-pill-dim">Read-Only V1</span>
          </div>
        </div>

        {/* ── Zone tabs ── */}
        <div className="ck-zone-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className="ck-ztab"
              role="tab"
              aria-selected={activeTab === tab.key}
              data-active={activeTab === tab.key ? '' : undefined}
              onClick={() => goToTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span className="ck-module-count">{String(idx + 1).padStart(2,'0')} / {MODULES.length}</span>
        </div>

        {/* ── Mobile strip ── */}
        <div className="ck-mobile-strip" aria-hidden="true">
          {MODULES.map(m => (
            <button
              key={m.id}
              className="ck-mobile-chip"
              data-active={activeId === m.id ? '' : undefined}
              onClick={() => goTo(m.id)}
            >
              <span className="ck-chip-num">{m.num}</span>{m.title}
            </button>
          ))}
        </div>

        {/* ── Three-column body ── */}
        <div className="ck-body">

          {/* ── Left command rail ── */}
          <nav className="ck-left" aria-label="Module navigation">
            {GROUPS.map(group => (
              <div key={group.key} className="ck-grp">
                <div className="ck-grp-label">{group.label}</div>
                {MODULES.filter(m => m.group === group.key).map(m => (
                  <button
                    key={m.id}
                    className="ck-nav-item"
                    data-active={activeId === m.id ? '' : undefined}
                    onClick={() => goTo(m.id)}
                  >
                    <span className="ck-nav-num">{m.num}</span>
                    <span className="ck-nav-label">{m.title}</span>
                    {activeId === m.id && <span className="ck-nav-pip" />}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* ── Center: active module viewport ── */}
          <main className="ck-center" aria-live="polite" aria-atomic="true">
            <div className="ck-mod-panel" style={{ opacity: fading ? 0 : 1 }}>

              {/* Module identity header */}
              <div className="ck-mod-head">
                <div className="ck-mod-meta">
                  <span className="ck-mod-num">{active.num}</span>
                  <span className="ck-mod-sep">·</span>
                  <span className="ck-mod-group">{groupName}</span>
                </div>
                <h2 className="ck-mod-title">{active.title}</h2>
                <div className="ck-mod-subtitle">{active.subtitle}</div>
              </div>

              {/* ── Sections ── */}
              <div className="ck-mod-sections">

                <ModSection
                  label="Thesis"
                  dotColor={GOLD}
                  edgeColor={GOLD}
                  textColor={TEXT}
                >
                  <p className="ck-sec-text">{active.thesis}</p>
                  {active.laws && (
                    <div className="ck-laws-grid">
                      {active.laws.map(law => (
                        <div key={law.numeral} className="ck-law">
                          <div className="ck-law-num">Law {law.numeral}</div>
                          <div className="ck-law-title">{law.title}</div>
                          <div className="ck-law-desc">{law.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ModSection>

                <ModSection
                  label="Operational Meaning"
                  dotColor={TEXT_DIM}
                  edgeColor="rgba(100,130,160,0.25)"
                  textColor={TEXT_DIM}
                >
                  <p className="ck-sec-text">{active.operationalMeaning}</p>
                </ModSection>

                <ModSection
                  label="Failure Pattern"
                  dotColor={AMBER}
                  edgeColor={AMBER_EDGE}
                  bg={AMBER_SOFT}
                  textColor={AMBER}
                >
                  <p className="ck-sec-text">{active.failurePattern}</p>
                </ModSection>

                <ModSection
                  label="Operator Question"
                  dotColor={GOLD}
                  edgeColor={GOLD_SOFT}
                  bg="rgba(197,162,111,0.05)"
                  textColor={TEXT}
                  italic
                >
                  <p className="ck-sec-text">{active.operatorQuestion}</p>
                </ModSection>

                <ModSection
                  label="Operator Move"
                  dotColor={GREEN}
                  edgeColor={GREEN_EDGE}
                  bg={GREEN_SOFT}
                  textColor={GREEN}
                >
                  <p className="ck-sec-text">{active.operatorMove}</p>
                </ModSection>

              </div>

              {/* Module footer */}
              <div className="ck-mod-foot">
                <span className="ck-foot-route">{active.route}</span>
                <span className="ck-foot-kb">← → navigate modules</span>
              </div>
            </div>
          </main>

          {/* ── Right context panel ── */}
          <aside className="ck-right" aria-label="Module context">

            {/* Brief */}
            <div className="ck-rp-sec">
              <span className="ck-rp-label">Module Brief</span>
              <p className="ck-rp-body">{active.subtitle}</p>
            </div>

            {/* Related modules */}
            <div className="ck-rp-sec">
              <span className="ck-rp-label">Related Modules</span>
              <div className="ck-rp-list">
                {active.relatedModules.map(relId => {
                  const rel = MODULES.find(m => m.id === relId)
                  if (!rel) return null
                  return (
                    <button
                      key={relId}
                      className="ck-rp-link"
                      onClick={() => goTo(relId)}
                    >
                      <span className="ck-rp-link-num">{rel.num}</span>
                      {rel.title}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Canon links */}
            <div className="ck-rp-sec">
              <span className="ck-rp-label">Canon Links</span>
              <div className="ck-rp-list">
                {active.canonLinks.map(cl => (
                  <div key={cl.label} className="ck-canon-link">
                    <span className="ck-canon-diamond">◆</span>
                    {cl.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Route */}
            <div className="ck-rp-sec">
              <span className="ck-rp-label">Route</span>
              <div className="ck-route-path">{active.route}</div>
            </div>

            {/* Navigation */}
            <div className="ck-rp-sec">
              <div className="ck-nav-pair">
                <button
                  className="ck-dir"
                  onClick={() => prev && goTo(prev.id)}
                  disabled={!prev}
                  title={prev?.title}
                >
                  ← Prev
                </button>
                <button
                  className="ck-dir"
                  onClick={() => next && goTo(next.id)}
                  disabled={!next}
                  title={next?.title}
                >
                  Next →
                </button>
              </div>
              {prev && <div className="ck-dir-hint">← {prev.title}</div>}
              {next && <div className="ck-dir-hint ck-dir-hint-next">→ {next.title}</div>}
            </div>

            {/* Actions */}
            <div className="ck-rp-sec ck-rp-sec-actions">
              <a href="/downloads/ce-public-kernel.pdf" className="ck-action-btn ck-action-primary">
                Read Full Canon
              </a>
              <a href="/downloads/ce-public-kernel.pdf" className="ck-action-btn" download>
                Download PDF ↓
              </a>
            </div>

          </aside>
        </div>
      </div>
    </>
  )
}

/* ── ModSection sub-component ────────────────────────────── */
function ModSection({
  label, dotColor, edgeColor, bg, textColor, italic, children,
}: {
  label:      string
  dotColor:   string
  edgeColor:  string
  bg?:        string
  textColor:  string
  italic?:    boolean
  children:   React.ReactNode
}) {
  return (
    <div
      className="ck-section"
      style={{
        borderLeftColor: edgeColor,
        background:      bg ?? 'transparent',
        '--sec-text':    textColor,
        '--sec-italic':  italic ? 'italic' : 'normal',
      } as React.CSSProperties}
    >
      <div className="ck-sec-label">
        <span className="ck-sec-dot" style={{ background: dotColor }} />
        {label}
      </div>
      {children}
    </div>
  )
}

/* ── CSS factory ──────────────────────────────────────────── */
function CSS(
  BORDER: string, BORDER_HI: string, BG: string, SURFACE: string, PANEL: string,
  PANEL_ALT: string, RAIL_BG: string, HDR_BG: string,
  TEXT: string, TEXT_DIM: string, TEXT_DIMMER: string,
  GOLD: string, GOLD_SOFT: string, CYAN: string, CYAN_SOFT: string, CYAN_EDGE: string,
  AMBER: string, AMBER_SOFT: string, AMBER_EDGE: string,
  GREEN: string, GREEN_SOFT: string, GREEN_EDGE: string,
) {
  return `
/* ─── Shell ───────────────────────────────────────────── */
.ck-shell {
  display: flex; flex-direction: column;
  height: calc(100vh - 80px);
  background: ${BG}; overflow: hidden;
}

/* ─── Command header ──────────────────────────────────── */
.ck-cmd-hdr {
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; padding: 0 18px 0 14px; height: 52px;
  background: ${HDR_BG};
  border-bottom: 1px solid ${BORDER};
  gap: 12px;
}
.ck-cmd-left { display: flex; flex-direction: column; gap: 2px; }
.ck-cmd-title {
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  font-family: monospace; font-weight: 600; color: ${TEXT};
}
.ck-cmd-doctrine {
  font-size: 8.5px; letter-spacing: 1px; text-transform: uppercase;
  font-family: monospace; color: ${TEXT_DIMMER};
}
.ck-pills { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.ck-pill {
  font-size: 7.5px; letter-spacing: 1.5px; text-transform: uppercase;
  font-family: monospace; padding: 3px 8px; white-space: nowrap;
  border: 1px solid ${BORDER}; color: ${TEXT_DIM};
  background: rgba(255,255,255,0.02);
}
.ck-pill-dim { color: ${TEXT_DIMMER}; border-color: rgba(255,255,255,0.04); }

/* ─── Zone tabs ───────────────────────────────────────── */
.ck-zone-tabs {
  display: flex; align-items: stretch; flex-shrink: 0;
  height: 34px; padding: 0 12px;
  border-bottom: 1px solid ${BORDER};
  background: ${SURFACE};
  overflow-x: auto; scrollbar-width: none;
}
.ck-zone-tabs::-webkit-scrollbar { display: none; }
.ck-ztab {
  display: flex; align-items: center; padding: 0 16px;
  height: 34px; flex-shrink: 0;
  font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
  font-family: monospace; cursor: pointer;
  border: none; background: none; color: ${TEXT_DIMMER};
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 130ms, border-color 130ms;
}
.ck-ztab:hover:not([data-active]) { color: ${TEXT_DIM}; }
.ck-ztab[data-active] { color: ${CYAN}; border-bottom-color: ${CYAN}; }
.ck-module-count {
  align-self: center; font-size: 8px; letter-spacing: 2px;
  font-family: monospace; color: ${TEXT_DIMMER}; padding-right: 4px;
}

/* ─── Mobile strip ────────────────────────────────────── */
.ck-mobile-strip {
  display: none; overflow-x: auto; gap: 4px;
  padding: 8px 12px; flex-shrink: 0;
  border-bottom: 1px solid ${BORDER}; background: ${SURFACE};
  scrollbar-width: none;
}
.ck-mobile-strip::-webkit-scrollbar { display: none; }
.ck-mobile-chip {
  display: flex; align-items: center; gap: 5px;
  flex-shrink: 0; border: 1px solid ${BORDER};
  background: none; cursor: pointer; padding: 4px 10px;
  font-size: 10px; color: ${TEXT_DIM}; white-space: nowrap;
  transition: border-color 120ms, color 120ms, background 120ms;
}
.ck-mobile-chip[data-active] {
  border-color: ${CYAN_EDGE}; color: ${CYAN}; background: ${CYAN_SOFT};
}
.ck-chip-num {
  font-size: 8px; font-family: monospace; opacity: 0.4; letter-spacing: 1px;
}

/* ─── Body grid ───────────────────────────────────────── */
.ck-body {
  display: grid;
  grid-template-columns: 264px 1fr 300px;
  flex: 1; min-height: 0; overflow: hidden;
}

/* ─── Left command rail ───────────────────────────────── */
.ck-left {
  background: ${RAIL_BG};
  border-right: 1px solid ${BORDER};
  overflow-y: auto; padding: 12px 0 48px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.04) transparent;
}
.ck-left::-webkit-scrollbar { width: 2px; }
.ck-left::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }

.ck-grp { margin-bottom: 4px; }
.ck-grp-label {
  font-size: 7.5px; letter-spacing: 2.5px; text-transform: uppercase;
  font-family: monospace; padding: 10px 14px 4px;
  color: ${TEXT_DIMMER}; user-select: none;
  border-top: 1px solid rgba(255,255,255,0.04);
  margin-top: 4px;
}
.ck-grp:first-child .ck-grp-label {
  border-top: none; margin-top: 0; padding-top: 4px;
}

.ck-nav-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; text-align: left; background: none;
  border: none; border-left: 2px solid transparent;
  cursor: pointer; padding: 5.5px 14px 5.5px 12px;
  font-size: 11px; color: ${TEXT_DIMMER};
  transition: color 120ms, background 120ms, border-color 120ms;
  position: relative;
}
.ck-nav-item:hover:not([data-active]) {
  background: rgba(255,255,255,0.025); color: ${TEXT_DIM};
}
.ck-nav-item[data-active] {
  border-left-color: ${CYAN};
  background: ${CYAN_SOFT};
  color: ${TEXT};
}
.ck-nav-num {
  font-size: 8px; font-family: monospace; letter-spacing: 1px;
  opacity: 0.35; flex-shrink: 0; min-width: 28px;
}
.ck-nav-label { flex: 1; }
.ck-nav-pip {
  width: 4px; height: 4px; border-radius: 50%;
  background: ${CYAN}; flex-shrink: 0;
}

/* ─── Center viewport ─────────────────────────────────── */
.ck-center {
  overflow-y: auto; padding: 14px 12px 32px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.04) transparent;
}
.ck-center::-webkit-scrollbar { width: 2px; }
.ck-center::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }

/* Module panel — the main framed card */
.ck-mod-panel {
  border: 1px solid ${BORDER_HI};
  background: ${PANEL};
  transition: opacity 140ms ease;
  overflow: hidden;
}

/* Module header strip */
.ck-mod-head {
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${BORDER};
  background: ${PANEL_ALT};
}
.ck-mod-meta {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 8px;
}
.ck-mod-num {
  font-size: 8.5px; font-family: monospace; letter-spacing: 2px;
  color: ${CYAN}; font-weight: 600;
}
.ck-mod-sep { color: rgba(255,255,255,0.12); font-size: 9px; }
.ck-mod-group {
  font-size: 8px; letter-spacing: 2px; text-transform: uppercase;
  font-family: monospace; color: ${TEXT_DIMMER};
}
.ck-mod-title {
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  font-weight: 700; color: #EEF4FA;
  letter-spacing: -0.025em; line-height: 1.05;
  margin: 0 0 8px;
}
.ck-mod-subtitle {
  font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase;
  font-family: monospace; color: ${GOLD}; opacity: 0.80; line-height: 1.4;
}

/* Module sections */
.ck-mod-sections { display: flex; flex-direction: column; }

.ck-section {
  padding: 12px 20px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 200ms;
}
.ck-section:last-child { border-bottom: none; }

.ck-sec-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 7.5px; letter-spacing: 2.5px; text-transform: uppercase;
  font-family: monospace; color: ${TEXT_DIMMER};
  margin-bottom: 8px;
}
.ck-sec-dot {
  width: 5px; height: 5px; border-radius: 1px; flex-shrink: 0;
}
.ck-sec-text {
  font-size: 12.5px; line-height: 1.65; margin: 0;
  color: var(--sec-text);
  font-style: var(--sec-italic, normal);
}

/* Laws grid */
.ck-laws-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 5px; margin-top: 12px;
}
.ck-law {
  background: rgba(255,255,255,0.025);
  border: 1px solid ${BORDER};
  padding: 9px 11px;
  transition: border-color 130ms;
}
.ck-law:hover { border-color: rgba(197,162,111,0.18); }
.ck-law-num {
  font-size: 7.5px; color: ${GOLD}; font-family: monospace;
  letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;
}
.ck-law-title { font-size: 10.5px; font-weight: 600; color: ${TEXT}; margin-bottom: 3px; }
.ck-law-desc { font-size: 10px; color: ${TEXT_DIM}; line-height: 1.5; }

/* Module footer */
.ck-mod-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 20px; border-top: 1px solid ${BORDER};
  background: ${PANEL_ALT};
}
.ck-foot-route {
  font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase;
  font-family: monospace; color: ${TEXT_DIMMER};
}
.ck-foot-kb {
  font-size: 8px; letter-spacing: 1px; font-family: monospace;
  color: rgba(46,62,82,0.6);
}

/* ─── Right context panel ─────────────────────────────── */
.ck-right {
  background: ${RAIL_BG};
  border-left: 1px solid ${BORDER};
  overflow-y: auto; display: flex; flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.04) transparent;
}
.ck-right::-webkit-scrollbar { width: 2px; }
.ck-right::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }

.ck-rp-sec {
  padding: 12px 16px 10px;
  border-bottom: 1px solid ${BORDER};
}
.ck-rp-sec-actions { border-bottom: none; margin-top: auto; }

.ck-rp-label {
  display: block; font-size: 7.5px; letter-spacing: 2px;
  text-transform: uppercase; font-family: monospace;
  color: ${TEXT_DIMMER}; margin-bottom: 8px;
}
.ck-rp-body {
  font-size: 11.5px; color: ${TEXT_DIM}; line-height: 1.6; margin: 0;
}
.ck-rp-list { display: flex; flex-direction: column; gap: 3px; }

.ck-rp-link {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${BORDER};
  cursor: pointer; padding: 6px 10px;
  font-size: 11px; color: ${TEXT_DIM}; text-align: left;
  transition: border-color 120ms, color 120ms, background 120ms;
}
.ck-rp-link:hover {
  border-color: ${CYAN_EDGE}; color: ${CYAN}; background: ${CYAN_SOFT};
}
.ck-rp-link-num {
  font-size: 8px; font-family: monospace; letter-spacing: 1px;
  opacity: 0.35; flex-shrink: 0;
}

.ck-canon-link {
  display: flex; align-items: baseline; gap: 7px;
  font-size: 11px; color: ${TEXT_DIM}; padding: 3px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.ck-canon-link:last-child { border-bottom: none; }
.ck-canon-diamond {
  font-size: 6px; color: ${GOLD}; opacity: 0.6; flex-shrink: 0;
}

.ck-route-path {
  font-size: 10.5px; font-family: monospace; letter-spacing: 0.5px;
  color: ${TEXT_DIMMER}; line-height: 1.5;
}

.ck-nav-pair {
  display: flex; gap: 5px; margin-bottom: 6px;
}
.ck-dir {
  flex: 1; border: 1px solid ${BORDER}; background: none;
  cursor: pointer; padding: 7px 6px;
  font-size: 9px; font-family: monospace; letter-spacing: 1px;
  color: ${TEXT_DIMMER}; text-align: center;
  transition: all 120ms;
}
.ck-dir:not(:disabled):hover {
  border-color: ${CYAN_EDGE}; color: ${CYAN}; background: ${CYAN_SOFT};
}
.ck-dir:disabled { opacity: 0.15; cursor: default; }
.ck-dir-hint {
  font-size: 9.5px; color: ${TEXT_DIMMER}; font-family: monospace;
  letter-spacing: 0.3px; line-height: 1.4;
}
.ck-dir-hint-next { text-align: right; }

.ck-action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 9px 12px; margin-bottom: 5px;
  border: 1px solid ${BORDER}; background: none;
  font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
  font-family: monospace; color: ${TEXT_DIM};
  text-decoration: none; cursor: pointer;
  transition: border-color 130ms, color 130ms, background 130ms;
}
.ck-action-btn:last-child { margin-bottom: 0; }
.ck-action-btn:hover {
  border-color: ${CYAN_EDGE}; color: ${CYAN}; background: ${CYAN_SOFT};
}
.ck-action-primary {
  border-color: rgba(197,162,111,0.18); color: ${GOLD};
  background: ${GOLD_SOFT};
}
.ck-action-primary:hover {
  border-color: rgba(197,162,111,0.45); color: ${GOLD};
  background: rgba(197,162,111,0.10);
}

/* ─── Responsive ──────────────────────────────────────── */
@media (max-width: 1380px) {
  .ck-body { grid-template-columns: 240px 1fr 270px; }
}
@media (max-width: 1199px) {
  .ck-body { grid-template-columns: 228px 1fr; }
  .ck-right { display: none; }
  .ck-pills { display: none; }
}
@media (max-width: 1023px) {
  .ck-shell { height: auto; min-height: calc(100vh - 80px); overflow: visible; }
  .ck-body { grid-template-columns: 1fr; }
  .ck-left { display: none; }
  .ck-center { overflow-y: visible; padding: 12px 8px 48px; }
  .ck-zone-tabs { display: none; }
  .ck-mobile-strip { display: flex; }
  .ck-cmd-hdr { padding: 0 12px; height: 44px; }
  .ck-cmd-doctrine { display: none; }
}
@media (max-width: 639px) {
  .ck-mod-head { padding: 12px 14px 10px; }
  .ck-section { padding: 10px 14px; }
  .ck-mod-foot { padding: 7px 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .ck-mod-panel, .ck-ztab, .ck-nav-item, .ck-rp-link, .ck-dir, .ck-action-btn,
  .ck-mobile-chip { transition: none !important; }
}
`
}
