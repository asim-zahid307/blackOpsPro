-- Safely add any missing columns to tickets table
-- This handles cases where the table was created in a partial state

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS severity SMALLINT NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5);
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Re-create indexes in case they were missed
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_severity ON tickets(org_id, severity);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);