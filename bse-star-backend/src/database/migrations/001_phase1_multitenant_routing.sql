-- ============================================================================
-- Tanashvi Fintech Private Limited (ARN-347849)
-- B2B Mutual Fund Transaction Platform - BSE StAR MF v2 Integration
-- Phase 1 Migration: Multi-Tenant MFD Architecture, ARN/EUIN Routing & Security
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean schema namespace
CREATE SCHEMA IF NOT EXISTS tanashvi_core;

-- ----------------------------------------------------------------------------
-- 1. Tenants Table (Mutual Fund Distributor Entities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(32) NOT NULL UNIQUE, -- E.g., 'TANASHVI_HO', 'MFD_WEALTH_01'
    organization_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'PUBLIC_LTD', 'LLP')),
    
    -- AMFI / ARN Compliance Fields
    arn_number VARCHAR(32) NOT NULL UNIQUE,     -- Main ARN (e.g. 'ARN-347849' for Tanashvi)
    arn_valid_from DATE NOT NULL,
    arn_valid_upto DATE NOT NULL,
    amfi_registered_email VARCHAR(255) NOT NULL,
    amfi_registered_mobile VARCHAR(20) NOT NULL,
    gstin VARCHAR(20),
    pan VARCHAR(10) NOT NULL,
    
    -- Multi-Tenancy Hierarchy & Billing
    is_platform_owner BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for Tanashvi Fintech Private Limited
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'TERMINATED')),
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (tier IN ('FREE_TRIAL', 'STANDARD', 'ENTERPRISE', 'INTERNAL')),
    
    -- Contact & Address
    registered_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    compliance_officer JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_arn ON tanashvi_core.tenants(arn_number);
CREATE INDEX idx_tenants_status ON tanashvi_core.tenants(status);

-- ----------------------------------------------------------------------------
-- 2. Tenant BSE StAR MF Credentials & Key Vault References
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.tenant_bse_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    
    -- BSE Gateway Identifiers
    member_code VARCHAR(32) NOT NULL DEFAULT '714114', -- Tanashvi Member Code 714114
    bse_username VARCHAR(100) NOT NULL,                 -- E.g. 'member/714114/admin'
    bse_password_vault_id VARCHAR(255) NOT NULL,        -- Pointer to KMS / Secret Manager
    bse_fingerprint VARCHAR(64) NOT NULL,               -- BSE Fingerprint (X-API-Org-ID checksum)
    
    -- Cryptographic Keys (PEM storage or Cloud KMS Key references)
    member_private_key_vault_ref VARCHAR(255) NOT NULL, -- KMS ARN or secure encrypted blob
    member_public_key_pem TEXT NOT NULL,
    bse_public_key_pem TEXT NOT NULL,
    
    -- Gateway Environment
    environment VARCHAR(10) NOT NULL DEFAULT 'UAT' CHECK (environment IN ('DEMO', 'UAT', 'PROD')),
    static_ip_whitelist TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_env UNIQUE (tenant_id, environment)
);

-- ----------------------------------------------------------------------------
-- 3. Tenant Sub-Brokers / Branch Desks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.tenant_sub_brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    
    sub_broker_code VARCHAR(32) NOT NULL, -- Maps to mem_details.sub_br_code in BSE v2
    sub_broker_arn VARCHAR(32),           -- Maps to mem_details.sub_br_arn in BSE v2
    branch_name VARCHAR(150) NOT NULL,
    branch_city VARCHAR(100),
    branch_state VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_sub_code UNIQUE (tenant_id, sub_broker_code)
);

CREATE INDEX idx_sub_brokers_tenant ON tanashvi_core.tenant_sub_brokers(tenant_id);

-- ----------------------------------------------------------------------------
-- 4. Tenant EUIN Master (Employee Unique Identification Number - SEBI Mandatory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.tenant_euins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    sub_broker_id UUID REFERENCES tanashvi_core.tenant_sub_brokers(id) ON DELETE SET NULL,
    
    euin_number VARCHAR(16) NOT NULL, -- E.g. 'E123456'
    holder_name VARCHAR(150) NOT NULL,
    holder_mobile VARCHAR(20),
    holder_email VARCHAR(255),
    valid_from DATE NOT NULL,
    valid_upto DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_tenant_euin UNIQUE (tenant_id, euin_number)
);

CREATE INDEX idx_euins_tenant ON tanashvi_core.tenant_euins(tenant_id);
CREATE INDEX idx_euins_number ON tanashvi_core.tenant_euins(euin_number);

-- ----------------------------------------------------------------------------
-- 5. Platform Users & RBAC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id) ON DELETE CASCADE,
    sub_broker_id UUID REFERENCES tanashvi_core.tenant_sub_brokers(id) ON DELETE SET NULL,
    assigned_euin_id UUID REFERENCES tanashvi_core.tenant_euins(id) ON DELETE SET NULL,
    
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20),
    
    role VARCHAR(32) NOT NULL CHECK (role IN (
        'SUPER_ADMIN',        -- Tanashvi Platform Engineers & Executives
        'TENANT_ADMIN',       -- Principal MFD Distributor / Business Owner
        'RELATIONSHIP_MGR',   -- Field RM placing orders with their EUIN
        'BACKOFFICE_STAFF',   -- Operations staff managing UCC and payment reconciliation
        'COMPLIANCE_VIEWER'   -- Auditor
    )),
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_tenant ON tanashvi_core.users(tenant_id);

-- ----------------------------------------------------------------------------
-- 6. BSE API Trace Audit Logs (Mandatory for Transaction Auditing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tanashvi_core.bse_api_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tanashvi_core.tenants(id),
    user_id UUID REFERENCES tanashvi_core.users(id),
    
    trace_id UUID NOT NULL,               -- X-STARMFv2-Trace-ID
    endpoint VARCHAR(255) NOT NULL,       -- E.g. '/api/order_new', '/api/v2/add_ucc'
    service_name VARCHAR(100) NOT NULL,   -- E.g. 'ORDER_PLACEMENT', 'UCC_REGISTRATION'
    
    -- Request details
    request_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    http_status_code INT,
    latency_ms INT,
    
    -- Regulatory routing captured in payload
    sub_br_arn VARCHAR(32),
    sub_br_code VARCHAR(32),
    euin VARCHAR(16),
    euin_flag BOOLEAN DEFAULT TRUE,
    
    -- Payloads (Sensitive PII like bank accounts / PAN are encrypted or hashed)
    request_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_payload_summary JSONB,
    response_payload_summary JSONB,
    bse_order_id VARCHAR(64),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'TIMEOUT', 'BSE_REJECTED')),
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_trace ON tanashvi_core.bse_api_audit_logs(trace_id);
CREATE INDEX idx_audit_tenant ON tanashvi_core.bse_api_audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_bse_order ON tanashvi_core.bse_api_audit_logs(bse_order_id);

-- ----------------------------------------------------------------------------
-- 7. PostgreSQL Row-Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------

-- Enable Row-Level Security on tenant-isolated tables
ALTER TABLE tanashvi_core.tenant_sub_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.tenant_euins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanashvi_core.bse_api_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy helper: Super-admin can see all, tenant users only see their tenant_id
CREATE OR REPLACE FUNCTION tanashvi_core.get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION tanashvi_core.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for sub-brokers
CREATE POLICY rls_tenant_sub_brokers ON tanashvi_core.tenant_sub_brokers
    FOR ALL
    USING (tanashvi_core.is_super_admin() OR tenant_id = tanashvi_core.get_current_tenant_id());

-- RLS Policy for EUINs
CREATE POLICY rls_tenant_euins ON tanashvi_core.tenant_euins
    FOR ALL
    USING (tanashvi_core.is_super_admin() OR tenant_id = tanashvi_core.get_current_tenant_id());

-- RLS Policy for Users
CREATE POLICY rls_users ON tanashvi_core.users
    FOR ALL
    USING (tanashvi_core.is_super_admin() OR tenant_id = tanashvi_core.get_current_tenant_id());

-- RLS Policy for Audit Logs
CREATE POLICY rls_bse_api_audit_logs ON tanashvi_core.bse_api_audit_logs
    FOR ALL
    USING (tanashvi_core.is_super_admin() OR tenant_id = tanashvi_core.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- 8. Initial Seed Data: Tanashvi Fintech Private Limited (Platform Master)
-- ----------------------------------------------------------------------------
INSERT INTO tanashvi_core.tenants (
    tenant_code,
    organization_name,
    entity_type,
    arn_number,
    arn_valid_from,
    arn_valid_upto,
    amfi_registered_email,
    amfi_registered_mobile,
    pan,
    is_platform_owner,
    status,
    tier
) VALUES (
    'TANASHVI_HQ',
    'Tanashvi Fintech Private Limited',
    'PVT_LTD',
    'ARN-347849',
    '2024-01-01',
    '2027-12-31',
    'compliance@tanashvifintech.com',
    '9876543210',
    'AABCT1234F',
    TRUE,
    'ACTIVE',
    'INTERNAL'
) ON CONFLICT (arn_number) DO NOTHING;

