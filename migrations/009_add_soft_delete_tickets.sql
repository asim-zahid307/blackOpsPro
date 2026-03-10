-- Add soft delete column to tickets
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Index for filtering out deleted tickets efficiently
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON tickets(org_id) WHERE deleted_at IS NULL;