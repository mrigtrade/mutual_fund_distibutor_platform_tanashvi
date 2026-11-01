-- ============================================================================
-- Tanashvi Fintech B2B Mutual Fund Platform
-- Phase 11: Mutual Fund Research & Analytics Database Schema
-- Parity with AdvisorKhoj MF Research Engine
-- ============================================================================

-- Historical NAV Time Series (Daily close values for schemes & benchmarks)
CREATE TABLE IF NOT EXISTS scheme_historical_navs (
    id SERIAL PRIMARY KEY,
    scheme_code VARCHAR(32) NOT NULL,
    nav_date DATE NOT NULL,
    nav_value NUMERIC(14, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_scheme_nav_date UNIQUE (scheme_code, nav_date)
);

CREATE INDEX IF NOT EXISTS idx_hist_nav_scheme_date ON scheme_historical_navs (scheme_code, nav_date);

-- Underlying Stock & Debt Portfolio Holdings (for Overlap & Scheme Comparison)
CREATE TABLE IF NOT EXISTS scheme_portfolio_holdings (
    id SERIAL PRIMARY KEY,
    scheme_code VARCHAR(32) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    isin VARCHAR(16),
    sector VARCHAR(128) NOT NULL,
    weight_pct NUMERIC(6, 2) NOT NULL,
    asset_class VARCHAR(32) DEFAULT 'EQUITY', -- EQUITY, DEBT, CASH_EQUIVALENT
    as_of_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holdings_scheme_date ON scheme_portfolio_holdings (scheme_code, as_of_date);

-- Pre-computed Research Snapshot Metrics
CREATE TABLE IF NOT EXISTS scheme_research_metrics (
    scheme_code VARCHAR(32) PRIMARY KEY,
    category VARCHAR(128) NOT NULL,
    aum_crores NUMERIC(12, 2) NOT NULL,
    expense_ratio_pct NUMERIC(5, 2) NOT NULL,
    fund_manager VARCHAR(255) NOT NULL,
    inception_date DATE NOT NULL,
    standard_deviation_3y NUMERIC(6, 2),
    sharpe_ratio_3y NUMERIC(6, 2),
    beta_3y NUMERIC(6, 2),
    alpha_3y NUMERIC(6, 2),
    return_1m NUMERIC(6, 2),
    return_3m NUMERIC(6, 2),
    return_6m NUMERIC(6, 2),
    return_1y NUMERIC(6, 2),
    return_3y NUMERIC(6, 2),
    return_5y NUMERIC(6, 2),
    return_inception NUMERIC(6, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
