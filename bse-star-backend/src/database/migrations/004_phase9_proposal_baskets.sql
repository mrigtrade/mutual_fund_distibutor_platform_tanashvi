-- ============================================================================
-- Tanashvi Fintech Private Limited (ARN-347849)
-- B2B Mutual Fund Transaction Platform - BSE StAR MF v2 Integration
-- Phase 9 Migration: MFD Proposal Basket & Investment Cart Link Engine
-- Enables Mutual Fund Distributors to:
-- 1. Create multi-scheme investment baskets (Lumpsums + SIPs)
-- 2. Inject statutory ARN / EUIN attribution
-- 3. Generate authenticated shareable "Magic Cart Links" for investors
-- 4. Batch-execute approved proposals directly through BSE StAR MF v2
-- ============================================================================

CREATE TABLE IF NOT EXISTS tanashvi_core.mfd_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    
    -- Distributor Attribution
    mfd_arn VARCHAR(32) NOT NULL,
    mfd_euin VARCHAR(16) NOT NULL,
    sub_broker_code VARCHAR(32),
    
    -- Investor Details
    client_code VARCHAR(32) NOT NULL,
    investor_name VARCHAR(150) NOT NULL,
    investor_email VARCHAR(255),
    investor_mobile VARCHAR(20),
    
    -- Proposal Metadata
    proposal_title VARCHAR(200) NOT NULL,
    notes TEXT,
    total_lumpsum_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_monthly_sip_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Cryptographic Magic Cart Link Token
    share_token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT_TO_INVESTOR' CHECK (status IN (
        'DRAFT', 'SENT_TO_INVESTOR', 'VIEWED', 'ACCEPTED', 'EXECUTING', 'EXECUTED', 'PARTIALLY_EXECUTED', 'REJECTED', 'EXPIRED'
    )),
    expires_at TIMESTAMPTZ NOT NULL,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    -- Execution Results
    execution_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposals_tenant ON tanashvi_core.mfd_proposals(tenant_id);
CREATE INDEX idx_proposals_client ON tanashvi_core.mfd_proposals(client_code);
CREATE INDEX idx_proposals_token ON tanashvi_core.mfd_proposals(share_token);
CREATE INDEX idx_proposals_status ON tanashvi_core.mfd_proposals(status);

CREATE TABLE IF NOT EXISTS tanashvi_core.mfd_proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES tanashvi_core.mfd_proposals(id) ON DELETE CASCADE,
    
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('LUMPSUM', 'SIP')),
    scheme_code VARCHAR(32) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    isin VARCHAR(32),
    folio_number VARCHAR(64),
    
    amount NUMERIC(14, 2) NOT NULL,
    
    -- SIP Configuration
    sip_frequency VARCHAR(5) DEFAULT 'm' CHECK (sip_frequency IN ('d', 'w', 'm', 'q')),
    sip_day INT CHECK (sip_day BETWEEN 1 AND 31),
    sip_installments INT,
    mandate_id VARCHAR(64),
    
    -- BSE Order & Execution Reference
    bse_order_ref_id VARCHAR(64),
    bse_reg_no VARCHAR(64),
    execution_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (execution_status IN (
        'PENDING', 'SUCCESS', 'FAILED', 'PAYMENT_PENDING'
    )),
    payment_url TEXT,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prop_items_proposal ON tanashvi_core.mfd_proposal_items(proposal_id);
CREATE INDEX idx_prop_items_scheme ON tanashvi_core.mfd_proposal_items(scheme_code);

-- RLS Isolation
ALTER TABLE tanashvi_core.mfd_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.mfd_proposal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_proposals ON tanashvi_core.mfd_proposals
    FOR ALL USING (tenant_id = tanashvi_core.get_current_tenant_id());

CREATE POLICY tenant_isolation_proposal_items ON tanashvi_core.mfd_proposal_items
    FOR ALL USING (proposal_id IN (
        SELECT id FROM tanashvi_core.mfd_proposals WHERE tenant_id = tanashvi_core.get_current_tenant_id()
    ));

