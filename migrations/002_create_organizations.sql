CREATE TABLE IF NOT EXISTS organizations (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

-- Insert default organizations
INSERT INTO organizations (name)
SELECT 'Alpha' WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Alpha');

INSERT INTO organizations (name)
SELECT 'Beta' WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Beta');

INSERT INTO organizations (name)
SELECT 'Gamma' WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Gamma');

INSERT INTO organizations (name)
SELECT 'Delta' WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Delta');