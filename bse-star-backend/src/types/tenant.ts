/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Multi-Tenant Context & MFD Attribution Types
 */

export interface TenantContext {
  tenantId: string;
  tenantCode: string;
  organizationName: string;
  arnNumber: string;        // Principal AMFI ARN (e.g., 'ARN-347849' for Tanashvi)
  isPlatformOwner: boolean; // True if Tanashvi Master Tenant
  subBrokerArn?: string;    // Sub-broker MFD ARN if child tenant
  subBrokerCode?: string;   // Sub-broker branch / desk code
  euin?: string;            // Relationship Manager's EUIN (e.g., 'E123456')
  euinFlag: boolean;        // 'Y' for advisory transactions, 'N' if execution only
}

export const DEFAULT_TANASHVI_TENANT: TenantContext = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  tenantCode: 'TANASHVI_HO',
  organizationName: 'Tanashvi Fintech Private Limited',
  arnNumber: 'ARN-347849',
  isPlatformOwner: true,
  euin: 'E123456',
  euinFlag: true
};

