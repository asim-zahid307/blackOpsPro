-- Original migration 003 added a unique index on just user_id,
-- which means a user can only belong to ONE org ever.
-- This is wrong for multi-tenancy. Fix it to allow one entry per user+org pair.

DROP INDEX IF EXISTS idx_user_unique_org;

-- Add the correct unique constraint: one role per user per org
ALTER TABLE user_organizations
DROP
CONSTRAINT IF EXISTS user_organizations_user_id_org_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_org_unique
    ON user_organizations(user_id, org_id);