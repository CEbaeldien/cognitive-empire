-- CE Signals V2 — Base Signal Set + Evidence Ledger
-- June 2026
-- Tasks: decay_factor fix → signal_state enum → V2 columns → evidence ledger → 7 base signals → F6 evidence

-- ── PRE-CONDITION: Fix signals.decay_factor constraint ─────────────────────────
-- signals.decay_factor should be 0.0–1.0 (float). Drop any stale constraint first.

ALTER TABLE signals DROP CONSTRAINT IF EXISTS signals_decay_factor_check;
ALTER TABLE signals ADD CONSTRAINT signals_decay_factor_check
  CHECK (decay_factor >= 0.0 AND decay_factor <= 1.0);

-- ── TASK 1: Signal State System ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE signal_state AS ENUM (
    'raw',
    'potential',
    'growing',
    'directional',
    'act_now',
    'watch',
    'contradicted',
    'retire'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_state signal_state DEFAULT 'raw';

-- ── TASK 2: V2 Schema Additions ────────────────────────────────────────────────

ALTER TABLE signals ADD COLUMN IF NOT EXISTS is_base_signal       BOOLEAN DEFAULT false;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS directional_thesis   TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS competing_paths      JSONB;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS dominant_path        TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS act_now_gate         JSONB;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS convergence_record   JSONB;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS v2_category          TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS v2_subcategory       TEXT;

-- confidence stored on signals for base signals that bypass the signal_scores scoring flow
ALTER TABLE signals ADD COLUMN IF NOT EXISTS confidence NUMERIC
  CHECK (confidence >= 0.0 AND confidence <= 1.0);

-- base signals use directional_thesis rather than the traditional implication field
ALTER TABLE signals ALTER COLUMN implication DROP NOT NULL;

-- ── TASK 3: Evidence Ledger ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS signal_evidence (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id        UUID    REFERENCES signals(id) ON DELETE CASCADE,
  source_url       TEXT    NOT NULL,
  institution_class TEXT,
  publication_date DATE,
  claim_extracted  TEXT,
  confidence_score FLOAT   CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  contradiction_flag BOOLEAN DEFAULT false,
  last_upgrade     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE signal_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read signal evidence" ON signal_evidence;
CREATE POLICY "Public read signal evidence"
  ON signal_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = signal_evidence.signal_id
        AND signals.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Admin write signal evidence" ON signal_evidence;
CREATE POLICY "Admin write signal evidence"
  ON signal_evidence FOR ALL
  USING (auth.role() = 'authenticated');

-- ── TASK 4: Seed 7 Base Signals ────────────────────────────────────────────────
-- Each insert is guarded by WHERE NOT EXISTS — idempotent.

-- FORCE 1: Infrastructure Concentration
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Infrastructure Concentration',
  'Compute, models, and API access consolidating into a small number of actors. Open-weight progress delays the sovereignty bottleneck — it does not dissolve it.',
  'intelligence'::signal_category,
  'intelligence',
  'ai_infrastructure',
  'act_now'::signal_state,
  true,
  'Infrastructure control is migrating from model capability alone toward vertically integrated control over compute, cloud, distribution, APIs, data-center power, and enterprise deployment channels. The orchestration layer above model providers is the operator strategic asset.',
  'Hyperscaler vertical integration captures the highest-leverage layer through 2031. Chinese open-weight is the only credible near-term cost disruption — constrained by compliance risk.',
  '[
    {"path": "Hyperscaler vertical integration", "weight_pct": 60, "signal_strength": "very_strong"},
    {"path": "Chinese open-weight disruption", "weight_pct": 22, "signal_strength": "strong"},
    {"path": "Application-layer orchestration", "weight_pct": 12, "signal_strength": "strong"},
    {"path": "National/sovereign compute", "weight_pct": 6, "signal_strength": "growing"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": true, "c3_demand_rising": true, "c4_waiting_costs": true}'::jsonb,
  '{"convergence_id": "C-002", "models": ["Claude", "ChatGPT", "Grok"], "confidence": "high", "date": "2026-06"}'::jsonb,
  0.87, 0.05, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Infrastructure Concentration' AND is_base_signal = true
);

-- FORCE 2: Epistemic Collapse
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Epistemic Collapse',
  'When generation is costless, shared ability to evaluate evidence degrades. Verification becomes the scarce infrastructure — not content.',
  'intelligence'::signal_category,
  'intelligence',
  'verification_infrastructure',
  'directional'::signal_state,
  true,
  'The response to epistemic collapse is not detection — it is provenance infrastructure that proves authenticity before distribution, not after. Signing is currently outpacing verification: credentials are produced at hardware level but stripped by most distribution intermediaries.',
  'Cryptographic provenance wins institutional adoption driven by regulatory mandate. Critical implementation gap persists: signing outpaces verification at the distribution layer.',
  '[
    {"path": "Cryptographic provenance (C2PA)", "weight_pct": 40, "signal_strength": "strong"},
    {"path": "Provenance-backed institutional verification", "weight_pct": 25, "signal_strength": "very_strong"},
    {"path": "Platform mandatory labeling", "weight_pct": 18, "signal_strength": "solid"},
    {"path": "AI watermarking (SynthID)", "weight_pct": 12, "signal_strength": "growing"},
    {"path": "Detection-only approaches", "weight_pct": 5, "signal_strength": "weak"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": false, "c3_demand_rising": true, "c4_waiting_costs": false}'::jsonb,
  '{"convergence_id": "D-001", "divergence": true, "states": {"Claude": "directional", "ChatGPT": "act_now", "Grok": "growing"}, "resolution": "directional_locked", "date": "2026-06"}'::jsonb,
  0.73, 0.08, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Epistemic Collapse' AND is_base_signal = true
);

-- FORCE 3: Accountability Diffusion
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Accountability Diffusion',
  'Machine-speed execution has permanently outpaced human-speed governance. Responsibility becomes unattributable not through malice — through structural displacement.',
  'governance_stability'::signal_category,
  'governance_stability',
  'ai_governance',
  'act_now'::signal_state,
  true,
  'Agentic AI systems are being deployed at a rate that structurally outpaces the governance infrastructure built to hold them accountable. Losses are materializing now. Regulatory deadlines are forcing a governance reckoning in 2026–2027, but most organizations will be retroactively building governance for systems already running.',
  'Regulatory enforcement crystallizes governance requirements starting August 2026, while parallel liability exposure through courts arrives independent of regulatory status. Both paths converge on the same structural requirement: attributable human decision authority at escalation boundaries.',
  '[
    {"path": "Regulatory enforcement (EU AI Act + state laws)", "weight_pct": 35, "signal_strength": "very_strong"},
    {"path": "Liability crystallization (courts)", "weight_pct": 22, "signal_strength": "growing"},
    {"path": "Enterprise governance maturity (ISO 42001, NIST)", "weight_pct": 18, "signal_strength": "solid"},
    {"path": "Ungoverned scaling (majority default)", "weight_pct": 17, "signal_strength": "strong_warning"},
    {"path": "Technical standards for agentic systems", "weight_pct": 8, "signal_strength": "early"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": true, "c3_demand_rising": true, "c4_waiting_costs": true}'::jsonb,
  '{"convergence_id": "C-003", "models": ["Claude", "ChatGPT", "Grok"], "confidence": "high", "date": "2026-06"}'::jsonb,
  0.85, 0.04, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Accountability Diffusion' AND is_base_signal = true
);

-- FORCE 4: Labor Identity Displacement
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Labor Identity Displacement',
  'Skill collapses as the primary human identity currency. Policy, education, and welfare architecture are unprepared for what replaces it.',
  'governance_stability'::signal_category,
  'governance_stability',
  'labor_markets',
  'growing'::signal_state,
  true,
  'Displacement pressure in routine cognitive work is outpacing institutional adaptation, creating a widening gap between technological change and social/economic identity structures. New forms of human value — judgment, orchestration, constraint design, consequence ownership — are emerging but remain poorly institutionalized.',
  'Simultaneous augmentation at the top and displacement at the bottom — with the demarcation line moving upward faster than most operators expect and faster than policy can track.',
  '[
    {"path": "Displacement of routine cognitive / entry-level", "weight_pct": 35, "signal_strength": "very_strong"},
    {"path": "Augmentation for high-judgment operators", "weight_pct": 32, "signal_strength": "strong"},
    {"path": "Credential and education system redesign", "weight_pct": 18, "signal_strength": "growing"},
    {"path": "Ownership/governance concentration", "weight_pct": 12, "signal_strength": "strong"},
    {"path": "Welfare/policy adaptation", "weight_pct": 8, "signal_strength": "underdelivering"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": false, "c3_demand_rising": true, "c4_waiting_costs": false}'::jsonb,
  '{"convergence_id": "D-002", "divergence": true, "states": {"Claude": "growing", "ChatGPT": "act_now", "Grok": "growing"}, "resolution": "growing_locked", "date": "2026-06"}'::jsonb,
  0.79, 0.06, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Labor Identity Displacement' AND is_base_signal = true
);

-- FORCE 5: Sovereignty Fragmentation
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Sovereignty Fragmentation',
  'Competing governance architectures across jurisdictions produce compliance complexity that becomes a structural constraint on every operator globally.',
  'governance_stability'::signal_category,
  'governance_stability',
  'regulatory_divergence',
  'act_now'::signal_state,
  true,
  'Three fundamentally incompatible AI governance philosophies are hardening simultaneously: EU risk-based regulation, US deregulation, China state-directed control. Fragmentation is the permanent operating condition — not a transition state. Modular compliance architecture is not optional.',
  'Layered regulatory fragmentation becomes permanent. No international convergence mechanism is functional. Operators must build modular compliance architecture or accept market exclusion from high-compliance jurisdictions.',
  '[
    {"path": "EU enforcement path (AI Act, GDPR, NIS2)", "weight_pct": 32, "signal_strength": "very_strong"},
    {"path": "US deregulation / state fragmentation", "weight_pct": 22, "signal_strength": "strong"},
    {"path": "China regulatory + export control", "weight_pct": 18, "signal_strength": "strong"},
    {"path": "Regulatory arbitrage (UAE, Singapore, UK)", "weight_pct": 15, "signal_strength": "growing"},
    {"path": "Fragmentation permanence / no convergence", "weight_pct": 13, "signal_strength": "high_probability"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": true, "c3_demand_rising": true, "c4_waiting_costs": true}'::jsonb,
  '{"convergence_id": "C-004", "models": ["Claude", "ChatGPT", "Grok"], "confidence": "high", "date": "2026-06"}'::jsonb,
  0.88, 0.04, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Sovereignty Fragmentation' AND is_base_signal = true
);

-- FORCE 6: Physical Compute Ceiling (ANCHOR SIGNAL)
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Physical Compute Ceiling',
  'The intelligence expansion race is hitting physical reality: energy grids, water, semiconductors. Physical infrastructure is upstream of everything digital.',
  'infrastructure'::signal_category,
  'infrastructure',
  'energy_compute',
  'act_now'::signal_state,
  true,
  'The bottleneck has migrated from model capability to grid connection speed and energy access. Data center electricity demand grew 17% in 2025; AI-focused data centers grew 50%. IEA projects doubling to 950 TWh by 2030, with AI-focused data center power tripling.',
  'Solar + storage wins deployment speed. Nuclear/SMR is the strategic positioning play — offtake agreements are the now-decision even though delivery is post-2030. Grid connection speed is the binding constraint above all generation technologies.',
  '[
    {"path": "Energy/grid constraint (binding first)", "weight_pct": 52, "signal_strength": "very_strong"},
    {"path": "Solar + storage + grid flexibility", "weight_pct": 40, "signal_strength": "very_strong"},
    {"path": "Natural gas bridge (firm capacity)", "weight_pct": 17, "signal_strength": "strong"},
    {"path": "Nuclear/SMR (strategic firm-power)", "weight_pct": 12, "signal_strength": "strategic_watch"},
    {"path": "Semiconductor supply (HBM, CoWoS)", "weight_pct": 8, "signal_strength": "acute_near_term"},
    {"path": "Water/cooling constraints", "weight_pct": 7, "signal_strength": "emerging"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": true, "c3_demand_rising": true, "c4_waiting_costs": true}'::jsonb,
  '{"convergence_id": "C-001", "models": ["Claude", "ChatGPT", "Grok"], "confidence": "maximum", "is_anchor": true, "date": "2026-06"}'::jsonb,
  0.91, 0.03, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Physical Compute Ceiling' AND is_base_signal = true
);

-- FORCE 7: Access Stratification
INSERT INTO signals (
  title, summary, category, v2_category, v2_subcategory, signal_state, is_base_signal,
  directional_thesis, dominant_path, competing_paths, act_now_gate, convergence_record,
  confidence, decay_factor, status
)
SELECT
  'Access Stratification',
  'The next five years determine whether intelligence abundance democratizes operational leverage or permanently concentrates it. The gap is crystallizing now.',
  'infrastructure'::signal_category,
  'infrastructure',
  'access_inequality',
  'act_now'::signal_state,
  true,
  'The gap is not in model benchmarks — it is in inference infrastructure, language/data context, connectivity reliability, and agentic deployment capacity. Africa holds less than 1% of global data center capacity despite 18% of global population. Concentration crystallization is the default trajectory without deliberate intervention.',
  'Concentration crystallization is the default path. Open-weight and national programs are real counter-pressures but insufficient at current velocity to change the structural outcome without deliberate infrastructure investment.',
  '[
    {"path": "Concentration crystallization (default)", "weight_pct": 35, "signal_strength": "high_probability"},
    {"path": "Open-weight democratization (inference edge)", "weight_pct": 25, "signal_strength": "strong"},
    {"path": "National/sovereign AI programs", "weight_pct": 18, "signal_strength": "growing"},
    {"path": "Language infrastructure gap (sub-force)", "weight_pct": 12, "signal_strength": "structural_underaddressed"},
    {"path": "Mobile-first / Small AI / edge deployment", "weight_pct": 10, "signal_strength": "real_underinvested"}
  ]'::jsonb,
  '{"c1_evidence_repeated": true, "c2_deployment_visible": true, "c2_5_early_movers_advantage": true, "c3_demand_rising": true, "c4_waiting_costs": true}'::jsonb,
  '{"convergence_id": "C-005", "models": ["Claude", "ChatGPT", "Grok"], "confidence": "high", "date": "2026-06"}'::jsonb,
  0.83, 0.05, 'published'
WHERE NOT EXISTS (
  SELECT 1 FROM signals WHERE title = 'Access Stratification' AND is_base_signal = true
);

-- ── TASK 5: Seed Evidence Ledger — Force 6 Anchor ─────────────────────────────

DO $$
DECLARE
  f6_id UUID;
BEGIN
  SELECT id INTO f6_id
  FROM signals
  WHERE title = 'Physical Compute Ceiling' AND is_base_signal = true
  LIMIT 1;

  IF f6_id IS NOT NULL THEN
    INSERT INTO signal_evidence (signal_id, source_url, institution_class, publication_date, claim_extracted, confidence_score, contradiction_flag)
    VALUES
      (f6_id,
       'https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary',
       'IEA', '2026-04-14',
       'Global data center electricity consumption grew 17% in 2025; AI-focused data centers grew 50%; projected to double to 950 TWh by 2030',
       0.95, false),
      (f6_id,
       'https://www.iea.org/news/data-centre-electricity-use-surged-in-2025-even-with-tightening-bottlenecks-driving-a-scramble-for-solutions',
       'IEA', '2026-04-16',
       'SMR conditional offtake pipeline grew from 25GW to 45GW; AI-focused data center power to triple by 2030',
       0.93, false),
      (f6_id,
       'https://futurumgroup.com/insights/ai-capex-2026-the-690b-infrastructure-sprint/',
       'Industry Research', '2026-02-12',
       'Five hyperscalers spending $660-690B in 2026; all markets supply-constrained',
       0.88, false);
  END IF;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT title, signal_state, is_base_signal, confidence, decay_factor, status
--   FROM signals WHERE is_base_signal = true ORDER BY created_at;
-- SELECT COUNT(*) FROM signal_evidence;
