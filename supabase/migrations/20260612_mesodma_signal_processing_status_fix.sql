-- Fix signal_processing_status CHECK constraint on raw_items.
-- The original constraint only allowed ('pending', 'rejected'), blocking all
-- mesodma pipeline state transitions. This migration expands it to include
-- the full set of values the process route writes.

ALTER TABLE raw_items DROP CONSTRAINT IF EXISTS raw_items_signal_processing_status_check;

ALTER TABLE raw_items
  ADD CONSTRAINT raw_items_signal_processing_status_check
  CHECK (signal_processing_status IN (
    'pending',
    'rejected',
    'needs_enrichment',
    'mesodma_pending',
    'mesodma_processed',
    'rejected_noise'
  ));
