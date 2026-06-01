-- DR. E INTERNAL SCHEMA v1
-- Apply: paste into Supabase SQL Editor or run via supabase db push

CREATE TABLE IF NOT EXISTS dre_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT,
  source_alias TEXT,
  subject TEXT,
  body TEXT,
  category TEXT CHECK (category IN ('drift','work','signals','research','partnership','general','noise')),
  urgency TEXT CHECK (urgency IN ('high','medium','low')) DEFAULT 'medium',
  suggested_route TEXT,
  recommended_response TEXT,
  approval_state TEXT CHECK (approval_state IN ('needs_review','draft_prepared','routed_internally','founder_approval_required','archived')) DEFAULT 'needs_review',
  fit_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dre_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active','paused','planned','complete','decaying')) DEFAULT 'active',
  priority TEXT CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  current_phase TEXT,
  next_action TEXT,
  blocker TEXT,
  owner TEXT DEFAULT 'Ebaeldien',
  decay_risk TEXT CHECK (decay_risk IN ('high','medium','low','none')) DEFAULT 'none',
  linked_actions JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dre_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  thread_type TEXT CHECK (thread_type IN ('doctrine','market','pricing','signals','foundry','investigation','hypothesis')) DEFAULT 'investigation',
  status TEXT CHECK (status IN ('active','paused','complete','decayed')) DEFAULT 'active',
  decay_status TEXT CHECK (decay_status IN ('fresh','aging','stale','decayed')) DEFAULT 'fresh',
  summary TEXT,
  evidence_links JSONB DEFAULT '[]'::jsonb,
  related_signals JSONB DEFAULT '[]'::jsonb,
  related_projects JSONB DEFAULT '[]'::jsonb,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dre_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('draft_email','route_inquiry','prepare_prompt','create_task','update_record','summarize_workflow','review_signal','prepare_proposal','generate_note','trigger_workflow')),
  source_module TEXT,
  risk_level TEXT CHECK (risk_level IN ('safe','medium','high','forbidden')) DEFAULT 'safe',
  status TEXT CHECK (status IN ('suggested','drafted','pending_approval','approved','executed','failed','blocked','archived')) DEFAULT 'suggested',
  requires_approval BOOLEAN DEFAULT false,
  payload JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dre_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('autonomous','requires_approval','forbidden')),
  action_category TEXT,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: Projects
INSERT INTO dre_projects (project_name, status, priority, current_phase, next_action, decay_risk) VALUES
('DRIFT', 'active', 'critical', 'Phase I live — Phase II planning', 'Define Phase II feature scope', 'low'),
('CE Signals', 'active', 'critical', 'V1 live — schema alignment pending', 'Finish canonical schema alignment', 'medium'),
('CE Runtime', 'active', 'critical', 'V1 shipped — n8n cycles running', 'Build Dr. E internal layer', 'low'),
('CE Website', 'active', 'high', 'Live — mobile fixes pending', 'Fix mobile responsiveness and tab title', 'medium'),
('Dr. E Internal', 'active', 'critical', 'Blueprint locked — building now', 'Complete V1 build', 'low'),
('Company Registration', 'active', 'critical', 'In progress', 'Complete registration documents', 'high'),
('CE Research', 'active', 'high', 'Renamed from CE Briefs — content pending', 'Populate first research thread', 'medium'),
('FoundryLabs', 'planned', 'medium', 'Concept stage', 'Define first applied research project', 'low'),
('Logo / Identity', 'planned', 'medium', 'CE crosshair concept locked', 'Execute logo production', 'medium'),
('Work / Services', 'active', 'high', 'Positioning defined', 'Update Work page with focused service architecture', 'medium')
ON CONFLICT DO NOTHING;

-- Seed: Research threads
INSERT INTO dre_research (title, thread_type, status, decay_status, summary, next_action) VALUES
('AI in 2026 — Operator Kernel Doctrine', 'doctrine', 'active', 'fresh', 'Eight Immutable Laws governing intelligence abundance, bottleneck migration, judgment preservation. 4 parts complete.', 'Finalize remaining parts and prepare publication path'),
('Maintenance Gravity Framework', 'doctrine', 'active', 'fresh', 'Doctrine-level framework for operational complexity accumulation under intelligence abundance.', 'Draft first public reference artifact'),
('DRIFT Pricing Research', 'pricing', 'active', 'aging', 'Operator $149/mo, Pro $249/mo, Agency $499/mo. ICP: Fractional CROs managing 2-8 clients.', 'Validate pricing against market benchmarks'),
('CE Signals Source Architecture', 'signals', 'active', 'fresh', '8 categories, 20 pressure vectors, 16 doctrine vectors. 18 sources seeded.', 'Add arXiv and policy source layers'),
('Multi-Model Cognition Practice', 'investigation', 'active', 'fresh', 'Orchestrating Claude, ChatGPT, Grok, Gemini, Perplexity, DeepSeek for strategic decision-making.', 'Document as CE methodology artifact')
ON CONFLICT DO NOTHING;

-- Seed: Governance rules
INSERT INTO dre_governance (rule_name, rule_type, action_category, description) VALUES
('Classify and summarize', 'autonomous', 'cognitive', 'Dr. E may classify, summarize, label, draft, prepare, recommend, route internally, create pending tasks, flag issues, generate review notes without approval.'),
('Send external email', 'requires_approval', 'communication', 'Any outbound email to external parties requires founder approval before sending.'),
('Publish public content', 'requires_approval', 'publishing', 'Any public-facing content publication requires founder approval.'),
('Modify product pricing', 'requires_approval', 'product', 'Pricing changes require founder approval.'),
('Trigger client-facing workflows', 'requires_approval', 'workflow', 'Any workflow that touches external clients requires founder approval.'),
('Money movement', 'forbidden', 'financial', 'Dr. E is forbidden from initiating any financial transactions.'),
('Legal commitments', 'forbidden', 'legal', 'Dr. E is forbidden from making legal commitments on behalf of CE.'),
('Irreversible infrastructure changes', 'forbidden', 'infrastructure', 'Dr. E is forbidden from irreversible infrastructure changes without explicit founder R4 approval.'),
('Autonomous public statements', 'forbidden', 'communication', 'Dr. E is forbidden from making autonomous public statements.')
ON CONFLICT DO NOTHING;

-- Seed: Inbox items
INSERT INTO dre_inbox (sender, source_alias, subject, category, urgency, approval_state, suggested_route, fit_score) VALUES
('Unknown', 'contact@cognitiveempire.com', 'Interested in your AI governance work', 'work', 'medium', 'needs_review', 'ops@cognitiveempire.com', 72),
('Unknown', 'drift@cognitiveempire.com', 'Question about DRIFT pricing', 'drift', 'high', 'needs_review', 'drift@cognitiveempire.com', 85),
('Unknown', 'signals@cognitiveempire.com', 'Signals research collaboration', 'research', 'low', 'needs_review', 'signals@cognitiveempire.com', 60)
ON CONFLICT DO NOTHING;

-- Seed: Actions
INSERT INTO dre_actions (title, action_type, source_module, risk_level, status, requires_approval, notes) VALUES
('Draft response to AI governance inquiry', 'draft_email', 'inbox', 'medium', 'suggested', true, 'Incoming work inquiry — prepare response draft for founder review'),
('Prepare DRIFT Phase II scope note', 'generate_note', 'projects', 'safe', 'suggested', false, 'DRIFT Phase I complete — scope next phase'),
('Review CE Website mobile fixes', 'generate_note', 'projects', 'safe', 'suggested', false, 'Tab title and mobile responsiveness fixes needed before company registration'),
('Summarize Runtime n8n cycle health', 'summarize_workflow', 'runtime', 'safe', 'suggested', false, 'First automated cycles ran — summarize outputs')
ON CONFLICT DO NOTHING;
