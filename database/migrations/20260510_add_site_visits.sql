CREATE TABLE IF NOT EXISTS site_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path VARCHAR(1000) NOT NULL,
    referrer VARCHAR(1000),
    visitor_id VARCHAR(120),
    user_agent VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created ON site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_path_created ON site_visits(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_created ON site_visits(visitor_id, created_at DESC);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
