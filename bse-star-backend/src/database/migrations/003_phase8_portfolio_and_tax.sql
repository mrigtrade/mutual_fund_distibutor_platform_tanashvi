-- ============================================================================
-- Tanashvi Fintech Private Limited (ARN-347849)
-- B2B Mutual Fund Transaction Platform - BSE StAR MF v2 Integration
-- Phase 8 Migration: Client Portfolio Tracking, CAS Ingestion & Capital Gains Tax
-- Compliant with SEBI regulations & Union Budget 2024 Income Tax Rules:
-- 1. Equity STCG: 20% (w.e.f July 23, 2024; formerly 15%)
-- 2. Equity LTCG: 12.5% (w.e.f July 23, 2024; formerly 10%)
-- 3. Equity LTCG Exemption: INR 1,25,000 per financial year (formerly INR 1,00,000)
-- 4. Section 112A Grandfathering (31-Jan-2018 NAV fair market value)
-- 5. Section 50AA Specified Debt Mutual Funds (post April 1, 2023 slab-rate taxation)
-- 6. Investor Folios, Holdings, CAS Imports & FIFO Lot Matching
-- ============================================================================

-- ============================================================================
-- SECTION 1: INVESTOR FOLIOS & HOLDINGS
-- ============================================================================

-- 1.1 Investor Folios Master
CREATE TABLE IF NOT EXISTS tanashvi_core.investor_folios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    ucc_id UUID NOT NULL REFERENCES tanashvi_core.ucc_investors(id) ON DELETE CASCADE,
    
    folio_number VARCHAR(64) NOT NULL,
    amc_code VARCHAR(32) NOT NULL,
    amc_name VARCHAR(150) NOT NULL,
    rta_code VARCHAR(20) NOT NULL DEFAULT 'CAMS' CHECK (rta_code IN ('CAMS', 'KFINTECH', 'FRANKLIN', 'OTHER')),
    holding_nature VARCHAR(10) NOT NULL DEFAULT 'SI' CHECK (holding_nature IN ('SI', 'JO', 'AS')),
    pan VARCHAR(10) NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'DORMANT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_ucc_folio_amc UNIQUE (tenant_id, ucc_id, folio_number, amc_code)
);

CREATE INDEX idx_folios_tenant ON tanashvi_core.investor_folios(tenant_id);
CREATE INDEX idx_folios_ucc ON tanashvi_core.investor_folios(ucc_id);
CREATE INDEX idx_folios_number ON tanashvi_core.investor_folios(folio_number);
CREATE INDEX idx_folios_pan ON tanashvi_core.investor_folios(pan);

-- 1.2 Investor Scheme Holdings (Aggregated Current State)
CREATE TABLE IF NOT EXISTS tanashvi_core.investor_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    ucc_id UUID NOT NULL REFERENCES tanashvi_core.ucc_investors(id) ON DELETE CASCADE,
    folio_id UUID NOT NULL REFERENCES tanashvi_core.investor_folios(id) ON DELETE CASCADE,
    
    scheme_code VARCHAR(32) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    isin VARCHAR(32),
    amfi_code VARCHAR(32),
    asset_class VARCHAR(20) NOT NULL CHECK (asset_class IN ('EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'OTHER')),
    sub_category VARCHAR(100),
    
    total_units NUMERIC(16, 4) NOT NULL DEFAULT 0,
    average_purchase_nav NUMERIC(14, 4) NOT NULL DEFAULT 0,
    invested_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    latest_nav NUMERIC(14, 4),
    latest_nav_date DATE,
    current_valuation NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unrealized_gain NUMERIC(14, 2) NOT NULL DEFAULT 0,
    absolute_return_pct NUMERIC(8, 4) NOT NULL DEFAULT 0,
    xirr_pct NUMERIC(8, 4),
    
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_folio_scheme UNIQUE (tenant_id, folio_id, scheme_code)
);

CREATE INDEX idx_holdings_tenant ON tanashvi_core.investor_holdings(tenant_id);
CREATE INDEX idx_holdings_ucc ON tanashvi_core.investor_holdings(ucc_id);
CREATE INDEX idx_holdings_folio ON tanashvi_core.investor_holdings(folio_id);
CREATE INDEX idx_holdings_isin ON tanashvi_core.investor_holdings(isin);
CREATE INDEX idx_holdings_asset_class ON tanashvi_core.investor_holdings(asset_class);

-- ============================================================================
-- SECTION 2: PORTFOLIO TRANSACTIONS & FIFO LOT TRACKING
-- ============================================================================

-- 2.1 Individual Transaction Ledger (Inflows, Outflows, FIFO available units)
CREATE TABLE IF NOT EXISTS tanashvi_core.portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    ucc_id UUID NOT NULL REFERENCES tanashvi_core.ucc_investors(id) ON DELETE CASCADE,
    folio_id UUID NOT NULL REFERENCES tanashvi_core.investor_folios(id) ON DELETE CASCADE,
    holding_id UUID REFERENCES tanashvi_core.investor_holdings(id) ON DELETE SET NULL,
    
    scheme_code VARCHAR(32) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    isin VARCHAR(32),
    asset_class VARCHAR(20) NOT NULL CHECK (asset_class IN ('EQUITY', 'DEBT', 'HYBRID', 'LIQUID', 'OTHER')),
    
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'PURCHASE', 'ADDITIONAL_PURCHASE', 'SIP', 'REDEMPTION', 
        'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND_PAYOUT', 'DIVIDEND_REINVESTMENT', 
        'STP_IN', 'STP_OUT', 'SWP'
    )),
    
    units NUMERIC(16, 4) NOT NULL,
    nav NUMERIC(14, 4) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    stamp_duty NUMERIC(10, 2) DEFAULT 0,
    stt NUMERIC(10, 2) DEFAULT 0,
    
    -- FIFO Tracking Field: Tracks how many unredeemed units remain in this purchase lot
    available_units NUMERIC(16, 4) NOT NULL DEFAULT 0,
    
    -- Fair Market Value on 31-Jan-2018 for Section 112A grandfathering
    fmv_31jan2018 NUMERIC(14, 4),
    
    -- Cross-references to BSE execution or CAS statement
    bse_order_no VARCHAR(32),
    cas_reference_no VARCHAR(64),
    source VARCHAR(20) NOT NULL DEFAULT 'BSE' CHECK (source IN ('BSE', 'CAS_IMPORT', 'MANUAL')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pf_trans_tenant ON tanashvi_core.portfolio_transactions(tenant_id);
CREATE INDEX idx_pf_trans_ucc ON tanashvi_core.portfolio_transactions(ucc_id);
CREATE INDEX idx_pf_trans_folio ON tanashvi_core.portfolio_transactions(folio_id);
CREATE INDEX idx_pf_trans_date ON tanashvi_core.portfolio_transactions(transaction_date);
CREATE INDEX idx_pf_trans_scheme ON tanashvi_core.portfolio_transactions(scheme_code);
CREATE INDEX idx_pf_trans_fifo ON tanashvi_core.portfolio_transactions(ucc_id, scheme_code, available_units) WHERE available_units > 0;

-- ============================================================================
-- SECTION 3: CAPITAL GAINS REALIZED LEDGER (BUDGET 2024 RULES)
-- ============================================================================

-- 3.1 Realized Capital Gains Records (Matched FIFO Redemption Lots)
CREATE TABLE IF NOT EXISTS tanashvi_core.capital_gains_realized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    ucc_id UUID NOT NULL REFERENCES tanashvi_core.ucc_investors(id) ON DELETE CASCADE,
    folio_id UUID NOT NULL REFERENCES tanashvi_core.investor_folios(id) ON DELETE CASCADE,
    
    redemption_tx_id UUID NOT NULL REFERENCES tanashvi_core.portfolio_transactions(id) ON DELETE CASCADE,
    purchase_tx_id UUID NOT NULL REFERENCES tanashvi_core.portfolio_transactions(id) ON DELETE CASCADE,
    
    financial_year VARCHAR(10) NOT NULL, -- e.g. '2024-2025', '2025-2026'
    scheme_code VARCHAR(32) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    isin VARCHAR(32),
    asset_class VARCHAR(20) NOT NULL,
    
    units_matched NUMERIC(16, 4) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_nav NUMERIC(14, 4) NOT NULL,
    purchase_cost NUMERIC(14, 2) NOT NULL,
    
    sale_date DATE NOT NULL,
    sale_nav NUMERIC(14, 4) NOT NULL,
    sale_value NUMERIC(14, 2) NOT NULL,
    
    holding_days INT NOT NULL,
    gain_type VARCHAR(10) NOT NULL CHECK (gain_type IN ('STCG', 'LTCG')),
    gross_gain NUMERIC(14, 2) NOT NULL,
    
    -- Section 112A Grandfathering
    is_grandfathered BOOLEAN NOT NULL DEFAULT FALSE,
    fmv_31jan2018 NUMERIC(14, 4),
    grandfathered_cost NUMERIC(14, 2),
    
    -- Section 50AA Debt Flag
    is_sec_50aa_debt BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Tax Computations under Budget 2024
    taxable_gain NUMERIC(14, 2) NOT NULL,
    applicable_tax_rate_pct NUMERIC(6, 2) NOT NULL, -- 20.00% for STCG post July 23 2024; 12.50% for LTCG post July 23 2024
    base_tax NUMERIC(14, 2) NOT NULL,
    cess_amount NUMERIC(14, 2) NOT NULL,            -- 4% Health & Education Cess
    total_tax NUMERIC(14, 2) NOT NULL,
    budget_regime VARCHAR(20) NOT NULL DEFAULT 'BUDGET_2024',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cg_realized_tenant ON tanashvi_core.capital_gains_realized(tenant_id);
CREATE INDEX idx_cg_realized_ucc ON tanashvi_core.capital_gains_realized(ucc_id);
CREATE INDEX idx_cg_realized_fy ON tanashvi_core.capital_gains_realized(financial_year);
CREATE INDEX idx_cg_realized_gain_type ON tanashvi_core.capital_gains_realized(gain_type);

-- ============================================================================
-- SECTION 4: CAS (CONSOLIDATED ACCOUNT STATEMENT) IMPORT AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS tanashvi_core.cas_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    ucc_id UUID NOT NULL REFERENCES tanashvi_core.ucc_investors(id) ON DELETE CASCADE,
    
    statement_source VARCHAR(20) NOT NULL DEFAULT 'CAMS' CHECK (statement_source IN ('CAMS', 'KFINTECH', 'CDSL', 'NSDL', 'OTHER')),
    statement_period_from DATE,
    statement_period_to DATE,
    investor_pan VARCHAR(10) NOT NULL,
    investor_email VARCHAR(255),
    
    folios_imported INT NOT NULL DEFAULT 0,
    transactions_imported INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    raw_payload_summary JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cas_imports_tenant ON tanashvi_core.cas_imports(tenant_id);
CREATE INDEX idx_cas_imports_ucc ON tanashvi_core.cas_imports(ucc_id);
CREATE INDEX idx_cas_imports_pan ON tanashvi_core.cas_imports(investor_pan);

-- ============================================================================
-- SECTION 5: ROW-LEVEL SECURITY (RLS) FOR MULTI-TENANCY
-- ============================================================================

ALTER TABLE tanashvi_core.investor_folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.investor_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.capital_gains_realized ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.cas_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_folios ON tanashvi_core.investor_folios
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

CREATE POLICY tenant_isolation_holdings ON tanashvi_core.investor_holdings
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

CREATE POLICY tenant_isolation_transactions ON tanashvi_core.portfolio_transactions
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

CREATE POLICY tenant_isolation_capital_gains ON tanashvi_core.capital_gains_realized
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

CREATE POLICY tenant_isolation_cas_imports ON tanashvi_core.cas_imports
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

