-- Create enum type for organization roles
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'org_role'
    ) THEN
CREATE TYPE org_role AS ENUM (
            'owner',
            'admin',
            'member',
            'viewer'
        );
END IF;
END
$$;