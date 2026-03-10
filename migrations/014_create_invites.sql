CREATE TABLE IF NOT EXISTS invites
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
    invited_by UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE CASCADE,
    email VARCHAR
(
    255
),
    role org_role NOT NULL DEFAULT 'member',
    token VARCHAR
(
    128
) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW
(
)
    );

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(org_id);