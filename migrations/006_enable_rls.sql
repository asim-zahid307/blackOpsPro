-- Enable Row Level Security on multi-tenant tables

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Force RLS so even table owners cannot bypass it accidentally
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE user_organizations FORCE ROW LEVEL SECURITY;