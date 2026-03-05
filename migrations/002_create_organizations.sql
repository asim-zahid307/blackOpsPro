-- 002_create_organizations.sql
CREATE TABLE organizations
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP        DEFAULT NOW(),
    updated_at TIMESTAMP        DEFAULT NOW()
);

-- Index for fast lookup of orgs by owner user
CREATE INDEX idx_organizations_user_id ON organizations (user_id);