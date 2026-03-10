-- Audit log table — insert only, never updated or deleted
CREATE TABLE IF NOT EXISTS audit_logs
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
    actor_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE CASCADE,
    action VARCHAR
(
    100
) NOT NULL,
    entity_type VARCHAR
(
    50
) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT NOW
(
)
    );

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(org_id, created_at DESC);

-- Revoke UPDATE and DELETE on audit_logs to enforce insert-only semantics
-- (Run as superuser — ensures even app user cannot mutate audit rows)
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;