CREATE TABLE IF NOT EXISTS user_organizations (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
    );

-- Ensure a user can belong to only one org
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_unique_org ON user_organizations(user_id);