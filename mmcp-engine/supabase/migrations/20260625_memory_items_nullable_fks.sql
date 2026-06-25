-- Allow pre-synthesis and pre-approval memory captures.
-- Early-stage pages (mission, oep, comparison) write memory items before
-- a synthesis or approval exists, so both FKs must be nullable.

ALTER TABLE memory_items ALTER COLUMN synthesis_id DROP NOT NULL;
ALTER TABLE memory_items ALTER COLUMN approval_id  DROP NOT NULL;
