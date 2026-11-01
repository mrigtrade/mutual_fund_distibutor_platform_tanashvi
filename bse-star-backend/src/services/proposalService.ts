/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * MFD Proposal Basket & Magic Cart Link Execution Service
 * 
 * Enables Mutual Fund Distributors to:
 * 1. Curate bespoke investment baskets (Lumpsums + SIPs)
 * 2. Route with statutory ARN / EUIN attribution
 * 3. Generate authenticated shareable "Magic Cart Links"
 * 4. Batch-execute approved proposals against BSE StAR MF v2
 * 
 * Enshrines Core Mandate: Zero Live Dependency with simulated execution fallback.
 */

import crypto from 'crypto';
import { 
  MfdProposal, 
  MfdProposalItem, 
  CreateProposalDTO, 
  ProposalStatus 
} from '../types/proposal.js';
import { MutualFundOrder, SystematicRegistration } from '../types/order.js';
import { AmfiNavService } from './amfiNavService.js';
import { BseGatewayService } from './bseGatewayService.js';

export class ProposalService {
  private static instance: ProposalService;

  // In-memory proposal storage
  private proposalsMap = new Map<string, MfdProposal>();
  private tokenIndex = new Map<string, string>(); // token -> proposalId

  private amfiNavService: AmfiNavService;
  private bseGateway: BseGatewayService;

  private constructor() {
    this.amfiNavService = AmfiNavService.getInstance();
    this.bseGateway = BseGatewayService.getInstance();
  }

  public static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  /**
   * Creates a new MFD Proposal Basket and generates a shareable Magic Cart Link.
   */
  public async createProposal(tenantId: string, dto: CreateProposalDTO): Promise<MfdProposal> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Proposal must contain at least one investment item (Lumpsum or SIP).');
    }

    await this.amfiNavService.syncSchemes();

    const proposalId = `PROP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shareToken = crypto.randomBytes(24).toString('hex');
    const expiryDays = dto.expiry_days || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    const mfdArn = dto.mfd_arn || 'ARN-347849'; // Default to Tanashvi Master ARN
    const mfdEuin = dto.mfd_euin || 'E123456';

    let totalLumpsum = 0;
    let totalSip = 0;

    const items: MfdProposalItem[] = [];

    for (let i = 0; i < dto.items.length; i++) {
      const it = dto.items[i];
      const itemId = `ITEM-${proposalId}-${i + 1}`;

      // Resolve scheme name and ISIN from AMFI catalog if missing
      let schemeName = it.scheme_name || '';
      let isin = it.isin;

      const schemeRecord = this.amfiNavService.getScheme(it.scheme_code);
      if (schemeRecord) {
        if (!schemeName) schemeName = schemeRecord.schemeName;
        if (!isin) isin = schemeRecord.isinGrowth;
      }

      if (!schemeName) {
        schemeName = `Mutual Fund Scheme (${it.scheme_code})`;
      }

      const amount = Number(it.amount);
      if (it.item_type === 'LUMPSUM') {
        totalLumpsum += amount;
      } else {
        totalSip += amount;
      }

      items.push({
        id: itemId,
        proposal_id: proposalId,
        item_type: it.item_type,
        scheme_code: it.scheme_code,
        scheme_name: schemeName,
        isin,
        folio_number: it.folio_number,
        amount,
        sip_frequency: it.sip_frequency || 'm',
        sip_day: it.sip_day || 10,
        sip_installments: it.sip_installments || 120, // 10 years default
        mandate_id: it.mandate_id,
        execution_status: 'PENDING',
        created_at: new Date().toISOString()
      });
    }

    const proposal: MfdProposal = {
      id: proposalId,
      tenant_id: tenantId,
      mfd_arn: mfdArn,
      mfd_euin: mfdEuin,
      sub_broker_code: dto.sub_broker_code,
      client_code: dto.client_code,
      investor_name: dto.investor_name,
      investor_email: dto.investor_email,
      investor_mobile: dto.investor_mobile,
      proposal_title: dto.proposal_title,
      notes: dto.notes,
      total_lumpsum_amount: Math.round(totalLumpsum * 100) / 100,
      total_monthly_sip_amount: Math.round(totalSip * 100) / 100,
      share_token: shareToken,
      magic_cart_url: `https://tanashvi.com/invest/cart/${proposalId}?token=${shareToken}`,
      status: 'SENT_TO_INVESTOR',
      expires_at: expiresAt,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.proposalsMap.set(proposalId, proposal);
    this.tokenIndex.set(shareToken, proposalId);

    return proposal;
  }

  /**
   * Retrieves proposal by its secret share token.
   * Automatically transitions status from SENT_TO_INVESTOR to VIEWED.
   */
  public async getProposalByToken(shareToken: string): Promise<MfdProposal | null> {
    const proposalId = this.tokenIndex.get(shareToken);
    if (!proposalId) return null;

    const proposal = this.proposalsMap.get(proposalId);
    if (!proposal) return null;

    // Check expiration
    if (new Date() > new Date(proposal.expires_at) && proposal.status !== 'EXECUTED') {
      proposal.status = 'EXPIRED';
      return proposal;
    }

    // Mark viewed
    if (proposal.status === 'SENT_TO_INVESTOR') {
      proposal.status = 'VIEWED';
      proposal.viewed_at = new Date().toISOString();
      proposal.updated_at = new Date().toISOString();
    }

    return proposal;
  }

  /**
   * Retrieves proposal by ID.
   */
  public async getProposalById(proposalId: string): Promise<MfdProposal | null> {
    return this.proposalsMap.get(proposalId) || null;
  }

  /**
   * Lists all proposals created for a tenant / MFD.
   */
  public async listProposals(tenantId: string, mfdArn?: string): Promise<MfdProposal[]> {
    const list: MfdProposal[] = [];
    for (const p of this.proposalsMap.values()) {
      if (p.tenant_id === tenantId) {
        if (!mfdArn || p.mfd_arn === mfdArn) {
          list.push(p);
        }
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Investor approves and executes the proposal cart.
   * Automatically decomposes into BSE Lumpsum Orders and Systematic SIPs.
   */
  public async executeProposal(
    proposalId: string,
    shareToken: string,
    paymentMode: 'UPI' | 'NETBANKING' | 'NEFT_RTGS' | 'MANDATE' = 'UPI'
  ): Promise<MfdProposal> {
    const proposal = await this.getProposalByToken(shareToken);
    if (!proposal || proposal.id !== proposalId) {
      throw new Error('Invalid proposal or expired share token.');
    }

    if (proposal.status === 'EXECUTED') {
      throw new Error('This proposal has already been executed.');
    }
    if (proposal.status === 'EXPIRED') {
      throw new Error('This proposal cart has expired.');
    }

    proposal.status = 'EXECUTING';
    proposal.accepted_at = new Date().toISOString();
    proposal.updated_at = new Date().toISOString();

    let ordersPlaced = 0;
    let sipsRegistered = 0;
    let failedItems = 0;
    const paymentLinks: Array<{ scheme: string; amount: number; url: string }> = [];

    for (const item of proposal.items) {
      try {
        if (item.item_type === 'LUMPSUM') {
          // Dispatch fresh lumpsum order to BSE gateway
          const orderRef = `ORD-CART-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const order: MutualFundOrder = {
            tenantId: proposal.tenant_id,
            uccId: proposal.client_code,
            uccClientCode: proposal.client_code,
            memOrdRefId: orderRef,
            orderType: 'PURCHASE',
            purchaseType: item.folio_number ? 'ADDITIONAL' : 'FRESH',
            orderSource: 'LUMPSUM',
            schemeBseCode: item.scheme_code,
            folioNumber: item.folio_number,
            physOrDemat: 'P',
            amount: item.amount,
            isUnits: false,
            allUnits: false,
            currency: 'INR',
            paymentMode: paymentMode,
            paymentStatus: 'PENDING',
            status: 'QUEUED_FOR_BSE',
            orderTimestamp: new Date().toISOString(),
            cutoffTime: '15:00:00',
            isSameDayNav: true,
            traceId: crypto.randomUUID(),
            regulatory: {
              subBrArn: proposal.mfd_arn,
              subBrCode: proposal.sub_broker_code,
              euin: proposal.mfd_euin,
              euinFlag: true
            }
          };

          const { bseResponse } = await this.bseGateway.createOrder(order);
          const bseData = bseResponse.data || bseResponse;

          item.bse_order_ref_id = bseData.bse_order_no || bseData.bseOrderNo || orderRef;
          item.payment_url = bseData.payment_url || `https://bsestarmfdemo.bseindia.com/PaymentGateway?orderNo=${item.bse_order_ref_id}&amt=${item.amount}`;
          item.execution_status = 'PAYMENT_PENDING';
          ordersPlaced++;

          if (item.payment_url) {
            paymentLinks.push({
              scheme: item.scheme_name,
              amount: item.amount,
              url: item.payment_url
            });
          }
        } else if (item.item_type === 'SIP') {
          // Dispatch systematic SIP to BSE gateway
          const sipRef = `SIP-CART-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 10); // Start in 10 days
          const startDateStr = startDate.toISOString().split('T')[0];

          const sxp: SystematicRegistration = {
            tenantId: proposal.tenant_id,
            uccId: proposal.client_code,
            uccClientCode: proposal.client_code,
            memSxpRefId: sipRef,
            sxpType: 'SIP',
            srcSchemeBseCode: item.scheme_code,
            srcFolio: item.folio_number,
            physOrDemat: 'P',
            frequency: (item.sip_frequency || 'm') as any,
            installmentAmount: item.amount,
            isUnits: false,
            installmentDay: item.sip_day || 10,
            startDate: startDateStr,
            isPerpetual: true,
            totalInstallments: item.sip_installments || 120,
            firstOrderToday: false,
            mandateId: item.mandate_id,
            hasTopup: false,
            regulatory: {
              subBrArn: proposal.mfd_arn,
              subBrCode: proposal.sub_broker_code,
              euin: proposal.mfd_euin,
              euinFlag: true
            },
            status: 'SUBMITTED_TO_BSE'
          };

          const bseRes = await this.bseGateway.registerSxp(sxp);
          const sxpData = bseRes.data || bseRes;

          item.bse_reg_no = sxpData.bse_reg_no || sxpData.bseRegNo || `REG-${Date.now().toString().slice(-6)}`;
          item.execution_status = 'SUCCESS';
          sipsRegistered++;
        }
      } catch (err: any) {
        item.execution_status = 'FAILED';
        item.error_message = err.message || 'Execution error';
        failedItems++;
      }
    }

    proposal.status = failedItems === 0 
      ? 'EXECUTED' 
      : (ordersPlaced > 0 || sipsRegistered > 0 ? 'PARTIALLY_EXECUTED' : 'REJECTED');

    proposal.execution_summary = {
      total_orders_placed: ordersPlaced,
      total_sips_registered: sipsRegistered,
      failed_items: failedItems,
      payment_links: paymentLinks
    };

    proposal.updated_at = new Date().toISOString();
    return proposal;
  }
}
