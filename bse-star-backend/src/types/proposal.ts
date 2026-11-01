/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * MFD Proposal Basket & Investment Cart Types
 */

export interface MfdProposalItem {
  id: string;
  proposal_id: string;
  item_type: 'LUMPSUM' | 'SIP';
  scheme_code: string;
  scheme_name: string;
  isin?: string;
  folio_number?: string;
  amount: number;
  sip_frequency?: 'd' | 'w' | 'm' | 'q';
  sip_day?: number;
  sip_installments?: number;
  mandate_id?: string;
  bse_order_ref_id?: string;
  bse_reg_no?: string;
  execution_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'PAYMENT_PENDING';
  payment_url?: string;
  error_message?: string;
  created_at: string;
}

export type ProposalStatus = 
  | 'DRAFT' 
  | 'SENT_TO_INVESTOR' 
  | 'VIEWED' 
  | 'ACCEPTED' 
  | 'EXECUTING' 
  | 'EXECUTED' 
  | 'PARTIALLY_EXECUTED' 
  | 'REJECTED' 
  | 'EXPIRED';

export interface MfdProposal {
  id: string;
  tenant_id: string;
  mfd_arn: string;
  mfd_euin: string;
  sub_broker_code?: string;
  client_code: string;
  investor_name: string;
  investor_email?: string;
  investor_mobile?: string;
  proposal_title: string;
  notes?: string;
  total_lumpsum_amount: number;
  total_monthly_sip_amount: number;
  share_token: string;
  magic_cart_url: string;
  status: ProposalStatus;
  expires_at: string;
  viewed_at?: string;
  accepted_at?: string;
  items: MfdProposalItem[];
  execution_summary?: {
    total_orders_placed: number;
    total_sips_registered: number;
    failed_items: number;
    payment_links: Array<{ scheme: string; amount: number; url: string }>;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateProposalItemDTO {
  item_type: 'LUMPSUM' | 'SIP';
  scheme_code: string;
  scheme_name?: string;
  isin?: string;
  folio_number?: string;
  amount: number;
  sip_frequency?: 'd' | 'w' | 'm' | 'q';
  sip_day?: number;
  sip_installments?: number;
  mandate_id?: string;
}

export interface CreateProposalDTO {
  client_code: string;
  investor_name: string;
  investor_email?: string;
  investor_mobile?: string;
  proposal_title: string;
  notes?: string;
  mfd_arn?: string;
  mfd_euin?: string;
  sub_broker_code?: string;
  expiry_days?: number;
  items: CreateProposalItemDTO[];
}

