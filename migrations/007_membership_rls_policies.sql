-- ============================
-- ORGANIZATIONS POLICIES
-- ============================

-- Users can view organizations they belong to
CREATE
POLICY "Users can view their organizations"
ON organizations
FOR
SELECT
    USING (
    EXISTS (
    SELECT 1
    FROM user_organizations
    WHERE user_organizations.org_id = organizations.id
    AND user_organizations.user_id = current_setting('app.current_user_id')::uuid
    )
    );

-- ============================
-- USER ORGANIZATIONS POLICIES
-- ============================

-- Users can view memberships of their organizations
CREATE
POLICY "Users can view memberships in their org"
ON user_organizations
FOR
SELECT
    USING (
    org_id IN (
    SELECT org_id
    FROM user_organizations
    WHERE user_id = current_setting('app.current_user_id')::uuid
    )
    );

-- Users can join an organization (handled by server)
CREATE
POLICY "Allow membership insert"
ON user_organizations
FOR INSERT
WITH CHECK (true);

-- Admins and owners can update roles
CREATE
POLICY "Admins can update roles"
ON user_organizations
FOR
UPDATE
    USING (
    EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.org_id = user_organizations.org_id
    AND uo.user_id = current_setting('app.current_user_id')::uuid
    AND uo.role IN ('owner','admin')
    )
    );

-- Owners and admins can remove members
CREATE
POLICY "Admins can delete members"
ON user_organizations
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM user_organizations uo
        WHERE uo.org_id = user_organizations.org_id
        AND uo.user_id = current_setting('app.current_user_id')::uuid
        AND uo.role IN ('owner','admin')
    )
);