CREATE TABLE mg_waitlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  name       text,
  tier       text        NOT NULL DEFAULT 'starter',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, tier)
);

ALTER TABLE mg_waitlist ENABLE ROW LEVEL SECURITY;
