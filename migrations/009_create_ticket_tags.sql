-- Tags are scoped per org
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

-- Junction table linking tickets to tags
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

CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag ON ticket_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(org_id);