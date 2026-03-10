-- Safe one-time creation of tickets schema
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
CREATE TYPE ticket_status AS ENUM ('open', 'investigating', 'mitigated', 'resolved');
END IF;
END $$;

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
    severity SMALLINT NOT NULL DEFAULT 3 CHECK
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

CREATE TABLE IF NOT EXISTS tags
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
    name VARCHAR
(
    100
) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW
(
),
    UNIQUE
(
    org_id,
    name
)
    );

CREATE TABLE IF NOT EXISTS ticket_tags
(
    ticket_id
    UUID
    NOT
    NULL
    REFERENCES
    tickets
(
    id
) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags
(
    id
)
  ON DELETE CASCADE,
    PRIMARY KEY
(
    ticket_id,
    tag_id
)
    );

CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_severity ON tickets(org_id, severity);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag ON ticket_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(org_id);