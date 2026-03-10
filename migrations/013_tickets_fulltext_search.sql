-- Add full-text search vector column to tickets
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE tickets
SET search_vector = to_tsvector('english',
                                coalesce(title, '') || ' ' || coalesce(description, '')
                    );

-- Auto-update search_vector on insert/update
CREATE
OR REPLACE FUNCTION tickets_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector
:= to_tsvector('english',
        coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '')
    );
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_search_vector_trigger ON tickets;
CREATE TRIGGER tickets_search_vector_trigger
    BEFORE INSERT OR
UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_search_vector_update();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tickets_search ON tickets USING GIN(search_vector);

-- Composite indexes for filter combinations
CREATE INDEX IF NOT EXISTS idx_tickets_org_status_updated ON tickets(org_id, status, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_org_severity_updated ON tickets(org_id, severity, updated_at DESC) WHERE deleted_at IS NULL;