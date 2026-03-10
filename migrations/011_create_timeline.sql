-- Comments table
CREATE TABLE IF NOT EXISTS comments
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    ticket_id UUID NOT NULL REFERENCES tickets
(
    id
) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations
(
    id
)
  ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW
(
),
    updated_at TIMESTAMP DEFAULT NOW
(
)
    );

CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_org ON comments(org_id);

-- Ticket events table (status changes, assignee changes, tag changes, etc.)
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_event_type') THEN
CREATE TYPE ticket_event_type AS ENUM (
            'ticket_created',
            'status_changed',
            'assignee_changed',
            'tags_changed',
            'severity_changed',
            'comment_added'
        );
END IF;
END $$;

CREATE TABLE IF NOT EXISTS ticket_events
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    ticket_id UUID NOT NULL REFERENCES tickets
(
    id
) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations
(
    id
)
  ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE CASCADE,
    event_type ticket_event_type NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment_id UUID REFERENCES comments
(
    id
)
  ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW
(
)
    );

CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_org ON ticket_events(org_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_time ON ticket_events(ticket_id, created_at DESC);