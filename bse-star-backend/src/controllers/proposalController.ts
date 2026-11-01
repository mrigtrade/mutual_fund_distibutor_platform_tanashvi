/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * MFD Proposal Basket & Magic Cart Controller
 */

import { Request, Response, NextFunction } from 'express';
import { ProposalService } from '../services/proposalService.js';
import { CreateProposalDTO } from '../types/proposal.js';

export class ProposalController {
  private static proposalService = ProposalService.getInstance();

  /**
   * POST /api/v1/proposals/create
   * Creates a multi-scheme investment proposal with ARN/EUIN routing.
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const dto: CreateProposalDTO = req.body;

      if (!dto.client_code || !dto.proposal_title || !dto.items || dto.items.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROPOSAL_PAYLOAD',
            message: 'client_code, proposal_title, and at least one item are required.'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const proposal = await ProposalController.proposalService.createProposal(tenantId, dto);

      res.status(201).json({
        success: true,
        message: 'Investment proposal basket created successfully.',
        data: proposal,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/proposals/view
   * Investor opens Magic Cart Link with share token.
   * Query params: ?token=<share_token>
   */
  public static async view(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = (req.query.token as string) || '';
      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SHARE_TOKEN',
            message: 'Magic Cart share token is required in query params (?token=...).'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const proposal = await ProposalController.proposalService.getProposalByToken(token);
      if (!proposal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PROPOSAL_NOT_FOUND',
            message: 'Invalid or expired proposal link.'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: proposal,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/proposals/execute
   * Investor clicks "Approve & Invest".
   * Body: { proposal_id, share_token, payment_mode }
   */
  public static async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { proposal_id, share_token, payment_mode } = req.body;

      if (!proposal_id || !share_token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_EXECUTION_PARAMS',
            message: 'Both proposal_id and share_token are required for execution.'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const executed = await ProposalController.proposalService.executeProposal(
        proposal_id,
        share_token,
        payment_mode || 'UPI'
      );

      res.status(200).json({
        success: true,
        message: `Proposal execution completed with status: ${executed.status}`,
        data: executed,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/proposals/list
   * Lists proposals created by MFD.
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const mfdArn = req.query.mfd_arn as string | undefined;

      const list = await ProposalController.proposalService.listProposals(tenantId, mfdArn);

      res.status(200).json({
        success: true,
        count: list.length,
        data: list,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/proposals/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const proposal = await ProposalController.proposalService.getProposalById(id);

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PROPOSAL_NOT_FOUND',
            message: `Proposal ${id} not found.`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: proposal,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

