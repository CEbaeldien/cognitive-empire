-- Expand signal_scores.decay_factor CHECK constraint from 0–1 to 1–10.
-- The UI (NumInput min=1 max=10) and API (clamp110) both send integers 1–10.
-- The original constraint treated decay_factor as a 0–1 decimal (like confidence),
-- causing every save with decay_factor >= 2 to be silently rejected.

ALTER TABLE signal_scores DROP CONSTRAINT IF EXISTS signal_scores_decay_factor_check;

ALTER TABLE signal_scores
  ADD CONSTRAINT signal_scores_decay_factor_check
  CHECK (decay_factor >= 1 AND decay_factor <= 10);
