BEGIN;

-- App Metrics (One row per day per app)
CREATE TABLE IF NOT EXISTS api_metrics_apps (
    date DATE NOT NULL,
    api_key VARCHAR(255),
    app_name VARCHAR(255),
    request_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, api_key, app_name)
);

-- App Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_api_metrics_apps_date ON api_metrics_apps(date);
CREATE INDEX IF NOT EXISTS idx_api_metrics_apps_api_key ON api_metrics_apps(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_metrics_apps_app_name ON api_metrics_apps(app_name) WHERE app_name IS NOT NULL;

-- Add unique constraint on developer_apps.address if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_developer_apps_address' AND table_name = 'developer_apps') THEN
        ALTER TABLE developer_apps ADD CONSTRAINT unique_developer_apps_address UNIQUE (address);
    END IF;
END $$;

-- Route Metrics (One row per day per route)
CREATE TABLE IF NOT EXISTS api_metrics_routes (
    date DATE NOT NULL,
    route_pattern VARCHAR(512) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, route_pattern, method)
);

-- Route Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_api_metrics_routes_date ON api_metrics_routes(date);
CREATE INDEX IF NOT EXISTS idx_api_metrics_routes_route_pattern ON api_metrics_routes(route_pattern);
CREATE INDEX IF NOT EXISTS idx_api_metrics_routes_method ON api_metrics_routes(method);

-- Counts
CREATE TABLE IF NOT EXISTS api_metrics_counts (
    date DATE PRIMARY KEY,
    hll_sketch BYTEA NOT NULL,
    total_count BIGINT NOT NULL DEFAULT 0,
    unique_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_counts_date 
ON api_metrics_counts(date);

COMMIT;