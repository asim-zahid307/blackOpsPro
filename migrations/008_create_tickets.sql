-- Create ticket status enum
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
CREATE TYPE ticket_status AS ENUM ('open', 'investigating', 'mitigated', 'resolved');
END IF;
END $$;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    org_id UUID NOT NULL REFERENCES organizations
(
    id
) ON DELETE CASCADE,
    title VARCHAR
(
    500
) NOT NULL,
    description TEXT,
    severity SMALLINT NOT NULL CHECK
(
    severity
    BETWEEN
    1
    AND
    5
),
    status ticket_status NOT NULL DEFAULT 'open',
    assignee_id UUID REFERENCES users
(
    id
)
  ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users
(
    id
),
    created_at TIMESTAMP DEFAULT NOW
(
),
    updated_at TIMESTAMP DEFAULT NOW
(
)
    );

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_severity ON tickets(org_id, severity);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);