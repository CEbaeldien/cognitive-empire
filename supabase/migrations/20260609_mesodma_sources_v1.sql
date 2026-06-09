-- Mesodma Sources V1: new source architecture columns + Wave 1 seed
-- Live schema already has: trust_tier, subcategory, ingestion_mode, ingestion_status, use_case, priority, notes
-- This migration adds: url, feed_url, domain, source_tier, ingestion_lane, source_reliability_score

ALTER TABLE sources ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS feed_url text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_tier text CHECK (source_tier IN ('tier_1_primary', 'tier_2_technical', 'tier_3_media', 'tier_4_noise_prone'));
ALTER TABLE sources ADD COLUMN IF NOT EXISTS ingestion_lane text CHECK (ingestion_lane IN ('rss', 'api', 'direct_page', 'doctrine_resource', 'manual_example', 'synthetic_edge_case', 'historical_case', 'false_signal_trap'));
-- ingestion_mode already exists as TEXT — IF NOT EXISTS skips; no constraint added
ALTER TABLE sources ADD COLUMN IF NOT EXISTS ingestion_mode text CHECK (ingestion_mode IN ('scheduled', 'manual', 'api_pull', 'page_watch'));
ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_reliability_score numeric DEFAULT 0.5 CHECK (source_reliability_score >= 0 AND source_reliability_score <= 1);
-- notes already exists as TEXT — IF NOT EXISTS skips
ALTER TABLE sources ADD COLUMN IF NOT EXISTS notes text;

-- Seed Wave 1 sources (15 sources)
-- slug is NOT NULL UNIQUE; source_type must be rss/api/scrape/manual (live enum)
-- ON CONFLICT (slug) DO UPDATE: populates new columns on existing rows too
INSERT INTO sources (slug, name, url, feed_url, domain, category, source_type, source_tier, ingestion_lane, ingestion_mode, ingestion_status, source_reliability_score, notes)
VALUES

('openai-news',           'OpenAI News',           'https://openai.com/news/',    NULL, 'Intelligence',        'intelligence',        'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.6,  'Official OpenAI news. Model releases, API direction, capability shifts. Use RSS.app to create feed.'),
('anthropic-news',        'Anthropic News',         'https://www.anthropic.com/news', NULL, 'Intelligence',   'intelligence',        'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.7,  'Claude updates, AI safety direction, model governance, enterprise deployment signals.'),
('google-deepmind-blog',  'Google DeepMind Blog',   'https://deepmind.google/blog/', NULL, 'Intelligence',    'intelligence',        'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.8,  'Frontier AI research, scientific AI, agentic research, capability direction.'),
('microsoft-research-blog','Microsoft Research Blog','https://www.microsoft.com/en-us/research/blog/', 'https://www.microsoft.com/en-us/research/feed/', 'Intelligence', 'intelligence', 'rss', 'tier_2_technical', 'rss', 'scheduled', 'pending_setup', 0.8, 'Agentic systems, enterprise AI research, AI infrastructure research, multi-model orchestration.'),
('hugging-face-blog',     'Hugging Face Blog',      'https://huggingface.co/blog', NULL, 'Intelligence',      'intelligence',        'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.7,  'Open-source model ecosystem, developer adoption, model distribution, AI tooling shifts. Wave 2.'),
('nvidia-developer-blog', 'NVIDIA Developer Blog',  'https://developer.nvidia.com/blog/', NULL, 'Infrastructure', 'infrastructure',  'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.8,  'AI compute, chips, accelerated computing, robotics infrastructure, data center direction.'),
('iea-news',              'IEA News',               'https://www.iea.org/news',    NULL, 'Infrastructure',    'infrastructure',      'rss',    'tier_1_primary',   'rss',         'scheduled', 'pending_setup', 0.9,  'Energy security, electricity demand, global energy systems, data center power context.'),
('us-eia-today-in-energy','U.S. EIA — Today in Energy', 'https://www.eia.gov/tools/rssfeeds/', NULL, 'Infrastructure', 'infrastructure', 'rss', 'tier_1_primary', 'rss',        'scheduled', 'pending_setup', 0.9,  'Energy supply, electricity demand, grid pressure, fuel markets, physical constraint data.'),
('ieee-spectrum',         'IEEE Spectrum',          'https://spectrum.ieee.org/',  NULL, 'Infrastructure',    'infrastructure',      'rss',    'tier_2_technical', 'rss',         'scheduled', 'pending_setup', 0.75, 'Robotics, engineering systems, hardware systems, physical AI. Wave 2.'),
('data-center-dynamics',  'Data Center Dynamics',   'https://www.datacenterdynamics.com/', NULL, 'Infrastructure', 'infrastructure',  'rss',    'tier_3_media',     'rss',         'scheduled', 'pending_setup', 0.65, 'Data center buildout, AI infrastructure expansion, cooling, power procurement. Wave 2.'),
('eu-ai-digital-strategy','European Commission AI & Digital Strategy', 'https://digital-strategy.ec.europa.eu/', NULL, 'Governance & Stability', 'governance_stability', 'rss', 'tier_1_primary', 'rss', 'scheduled', 'pending_setup', 0.9, 'AI regulation, AI Act implementation, digital sovereignty, platform governance.'),
('nist-ai-rmf',           'NIST AI Risk Management Framework', 'https://www.nist.gov/itl/ai-risk-management-framework', NULL, 'Governance & Stability', 'governance_stability', 'manual', 'tier_1_primary', 'direct_page', 'manual', 'pending_setup', 0.95, 'AI governance standards, risk management, organizational accountability, trust frameworks.'),
('oecd-ai-policy-observatory', 'OECD AI Policy Observatory', 'https://oecd.ai/', NULL, 'Governance & Stability', 'governance_stability', 'rss', 'tier_1_primary', 'rss', 'scheduled', 'pending_setup', 0.9, 'AI policy, international governance, policy trends, institutional AI adoption.'),
('uk-ai-safety-institute','UK AI Safety Institute', 'https://www.gov.uk/government/organisations/ai-safety-institute', NULL, 'Governance & Stability', 'governance_stability', 'rss', 'tier_1_primary', 'rss', 'scheduled', 'pending_setup', 0.9, 'AI safety evaluations, model risk, frontier AI governance, state-level institutional response.'),
('stanford-hai',          'Stanford HAI',           'https://hai.stanford.edu/',   NULL, 'Governance & Stability', 'governance_stability', 'rss', 'tier_2_technical', 'rss', 'scheduled', 'pending_setup', 0.8, 'AI governance research, AI measurement, institutional analysis, policy and safety context. Wave 2.')

ON CONFLICT (slug) DO UPDATE SET
  url                    = EXCLUDED.url,
  feed_url               = EXCLUDED.feed_url,
  domain                 = EXCLUDED.domain,
  source_tier            = EXCLUDED.source_tier,
  ingestion_lane         = EXCLUDED.ingestion_lane,
  source_reliability_score = EXCLUDED.source_reliability_score,
  notes                  = EXCLUDED.notes;

-- Seed arXiv as API source
INSERT INTO sources (slug, name, url, feed_url, domain, category, source_type, source_tier, ingestion_lane, ingestion_mode, ingestion_status, source_reliability_score, notes)
VALUES
('arxiv-ai', 'arXiv AI', 'https://arxiv.org/list/cs.AI/recent', 'http://export.arxiv.org/rss/cs.AI', 'Intelligence', 'intelligence', 'api', 'tier_1_primary', 'api', 'api_pull', 'pending_setup', 0.95, 'Upstream AI research papers. cs.AI and cs.LG categories. Highest tier source for Intelligence domain.')
ON CONFLICT (slug) DO UPDATE SET
  url                    = EXCLUDED.url,
  feed_url               = EXCLUDED.feed_url,
  domain                 = EXCLUDED.domain,
  source_tier            = EXCLUDED.source_tier,
  ingestion_lane         = EXCLUDED.ingestion_lane,
  source_reliability_score = EXCLUDED.source_reliability_score,
  notes                  = EXCLUDED.notes;

-- Verify
SELECT name, domain, source_tier, ingestion_lane, ingestion_status FROM sources ORDER BY domain, source_tier;
