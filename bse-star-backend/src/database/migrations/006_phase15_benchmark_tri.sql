-- =============================================================================
-- Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
-- Phase 15 Migration: Multi-Benchmark Total Return Index (TRI) Data Store
-- Supports daily automated EOD sync, NSE/BSE CSV imports, and manual overrides
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS tanashvi_research;

CREATE TABLE IF NOT EXISTS tanashvi_research.benchmark_indices (
    benchmark_id        VARCHAR(50) PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    short_name          VARCHAR(60)  NOT NULL,
    category            VARCHAR(40)  NOT NULL,
    provider            VARCHAR(80)  NOT NULL,
    description         TEXT,
    amfi_proxy_code     VARCHAR(20),
    amfi_proxy_name     VARCHAR(200),
    nse_index_name      VARCHAR(120),
    data_source         VARCHAR(40)  NOT NULL DEFAULT 'LOCAL_SEED_FIXTURE',
    latest_nav_date     DATE,
    latest_value        NUMERIC(16, 4),
    last_synced_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tanashvi_research.benchmark_tri_history (
    id                  BIGSERIAL PRIMARY KEY,
    benchmark_id        VARCHAR(50)  NOT NULL REFERENCES tanashvi_research.benchmark_indices(benchmark_id) ON DELETE CASCADE,
    nav_date            DATE         NOT NULL,
    tri_value           NUMERIC(16, 4) NOT NULL,
    source              VARCHAR(40)  NOT NULL DEFAULT 'LOCAL_SEED_FIXTURE',
    ingested_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_benchmark_nav_date UNIQUE (benchmark_id, nav_date)
);

CREATE INDEX IF NOT EXISTS idx_benchmark_tri_history_lookup
    ON tanashvi_research.benchmark_tri_history (benchmark_id, nav_date DESC);

CREATE TABLE IF NOT EXISTS tanashvi_research.benchmark_sync_audit (
    sync_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_id        VARCHAR(50) NOT NULL,
    trigger_mode        VARCHAR(40) NOT NULL, -- 'CRON_EOD', 'ADMIN_MANUAL', 'CSV_IMPORT'
    source_used         VARCHAR(40) NOT NULL,
    rows_upserted       INTEGER     NOT NULL DEFAULT 0,
    latest_date         DATE,
    status              VARCHAR(30) NOT NULL,
    remarks             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
