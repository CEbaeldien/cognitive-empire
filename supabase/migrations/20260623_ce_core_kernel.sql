-- CE Core Kernel: module registry + permission grants + workspace_id extensions

-- Module registry
create table if not exists ce_modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  scope text default 'internal' check (scope in ('internal','operator','public')),
  permissions jsonb default '[]',
  routes jsonb default '[]',
  agent_capable boolean default false,
  offline_capable boolean default false,
  version text default '0.1',
  active boolean default true,
  created_at timestamptz default now()
);

-- Permission grants
create table if not exists permission_grants (
  id uuid primary key default gen_random_uuid(),
  principal_id uuid references auth.users(id),
  module_id uuid references ce_modules(id),
  scope text,
  granted_at timestamptz default now(),
  expires_at timestamptz
);

-- Register existing products as modules
insert into ce_modules (name, slug, scope, agent_capable, active, version) values
  ('CE Signals', 'signals', 'public', false, true, '1.0'),
  ('CE Signals V2', 'signals-v2', 'public', false, false, '2.0'),
  ('Mesodma', 'mesodma', 'internal', false, true, '1.0'),
  ('CE Runtime', 'runtime', 'internal', false, true, '1.0'),
  ('Dr. E', 'dr-e', 'internal', true, true, '1.0'),
  ('MMCP Engine', 'mmcp', 'operator', true, true, '1.0'),
  ('Maintenance Gravity', 'maintenance-gravity', 'operator', false, true, '0.1'),
  ('Drift', 'drift', 'internal', false, false, '1.0')
on conflict (slug) do nothing;

-- Add workspace_id to runtime tables
alter table runtime_memories add column if not exists workspace_id uuid;
alter table runtime_systems add column if not exists workspace_id uuid;
alter table runtime_tasks add column if not exists workspace_id uuid;
alter table runtime_approvals add column if not exists workspace_id uuid;
alter table runtime_conflicts add column if not exists workspace_id uuid;
alter table runtime_projects add column if not exists workspace_id uuid;

-- Add workspace_id to dr-e tables
alter table dre_inbox add column if not exists workspace_id uuid;
alter table dre_projects add column if not exists workspace_id uuid;
alter table dre_research add column if not exists workspace_id uuid;
alter table dre_actions add column if not exists workspace_id uuid;

-- Indexes
create index if not exists idx_ce_modules_slug on ce_modules(slug);
create index if not exists idx_permission_grants_principal on permission_grants(principal_id);
create index if not exists idx_permission_grants_module on permission_grants(module_id);

-- RLS
alter table ce_modules enable row level security;
alter table permission_grants enable row level security;

create policy "ce_modules_read" on ce_modules for select using (true);
create policy "permission_grants_own" on permission_grants for select using (auth.uid() = principal_id);
