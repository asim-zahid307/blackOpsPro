-- Add role column to user_organizations
ALTER TABLE user_organizations
    ADD COLUMN IF NOT EXISTS role org_role NOT NULL DEFAULT 'viewer';

-- Ensure existing rows have a role (safety step)
UPDATE user_organizations
SET role = 'viewer'
WHERE role IS NULL;

-- Ensure only one owner per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_owner_per_org
    ON user_organizations(org_id)
    WHERE role = 'owner';