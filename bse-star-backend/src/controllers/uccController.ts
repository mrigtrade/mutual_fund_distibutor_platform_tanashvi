/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Investor UCC Controller
 */

import { Request, Response, NextFunction } from 'express';
import { BseGatewayService } from '../services/bseGatewayService.js';
import { UccInvestorProfile, UccHolder, UccNominee, UccBankAccount, UccFatca, UccAddress } from '../types/ucc.js';
import { AppError } from '../middleware/errorHandler.js';

export class UccController {
  public static async registerUcc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = req.body;

      const clientCode = b.clientCode || b.client_code;
      if (!clientCode) {
        throw new AppError('client_code is mandatory', 400, 'VALIDATION_ERROR');
      }

      // Map Primary Holder
      const primaryHolderRaw = b.primaryHolder || b.primary_holder || (b.holders && b.holders[0]);
      if (!primaryHolderRaw || !primaryHolderRaw.pan) {
        throw new AppError('primary_holder with PAN is mandatory', 400, 'VALIDATION_ERROR');
      }

      const holders: UccHolder[] = [
        {
          holderRank: 1,
          pan: primaryHolderRaw.pan,
          isPanExempt: primaryHolderRaw.isPanExempt ?? primaryHolderRaw.is_pan_exempt ?? false,
          ckycNumber: primaryHolderRaw.ckycNumber || primaryHolderRaw.ckyc_number,
          kycType: primaryHolderRaw.kycType || primaryHolderRaw.kyc_type || 'C',
          firstName: primaryHolderRaw.firstName || primaryHolderRaw.first_name || '',
          middleName: primaryHolderRaw.middleName || primaryHolderRaw.middle_name,
          lastName: primaryHolderRaw.lastName || primaryHolderRaw.last_name || '',
          dob: primaryHolderRaw.dob || primaryHolderRaw.date_of_birth || '1985-01-01',
          gender: primaryHolderRaw.gender || 'M',
          occupationCode: primaryHolderRaw.occupationCode || primaryHolderRaw.occupation_code || '01',
          fatherName: primaryHolderRaw.fatherName || primaryHolderRaw.father_name,
          contactNumber: primaryHolderRaw.contactNumber || primaryHolderRaw.mobile_number || '9876543210',
          countryCode: primaryHolderRaw.countryCode || primaryHolderRaw.country_code || '91',
          whoseContactNumber: primaryHolderRaw.whoseContactNumber || primaryHolderRaw.whose_contact_number || 'SE',
          emailAddress: primaryHolderRaw.emailAddress || primaryHolderRaw.email || 'investor@example.com',
          whoseEmailAddress: primaryHolderRaw.whoseEmailAddress || primaryHolderRaw.whose_email_address || 'SE',
          contactType: 'PR'
        }
      ];

      // Map Nominees (up to 5)
      const rawNominees = b.nominees || [];
      const nominees: UccNominee[] = rawNominees.map((n: any, idx: number) => ({
        nomineeRank: (n.nomineeRank || n.nominee_rank || idx + 1) as any,
        firstName: n.firstName || n.first_name || (n.nominee_name ? n.nominee_name.split(' ')[0] : 'Nominee'),
        middleName: n.middleName || n.middle_name || '',
        lastName: n.lastName || n.last_name || (n.nominee_name ? n.nominee_name.split(' ').slice(1).join(' ') : 'Name'),
        dob: n.dob || n.date_of_birth || '1990-01-01',
        nominationPercent: n.nominationPercent ?? n.allocation_percentage ?? n.nomination_percent ?? 0,
        nominationRelation: n.nominationRelation || n.relationship || '01',
        isPanExempt: n.isPanExempt ?? n.is_pan_exempt ?? true,
        pan: n.pan,
        isMinor: n.isMinor ?? n.is_minor ?? false,
        guardian: (n.isMinor || n.is_minor) ? {
          firstName: n.guardianFirstName || n.guardian_first_name || (n.guardian_name ? n.guardian_name.split(' ')[0] : 'Guardian'),
          lastName: n.guardianLastName || n.guardian_last_name || (n.guardian_name ? n.guardian_name.split(' ').slice(1).join(' ') : 'Name'),
          relation: n.guardianRelation || n.guardian_relationship || '01',
          pan: n.guardianPan || n.guardian_pan
        } : undefined
      }));

      // Map Bank Accounts
      const rawBanks = b.bankAccounts || b.bank_accounts || [];
      const bankAccounts: UccBankAccount[] = rawBanks.map((bk: any) => ({
        accountNumber: bk.accountNumber || bk.bank_acc_num || bk.account_number || '',
        ifscCode: bk.ifscCode || bk.ifsc_code || '',
        bankName: bk.bankName || bk.bank_name || 'HDFC Bank',
        branchName: bk.branchName || bk.branch_name,
        accountType: bk.accountType || bk.bank_acc_type || bk.account_type || 'SB',
        accountOwner: 'SELF',
        isDefault: bk.isDefault ?? bk.is_default ?? true
      }));

      // Map Communication Address
      const rawAddr = b.communicationAddress || b.communication_address || b.comm_addr || {};
      const commAddr: UccAddress = {
        addressType: 'COMMUNICATION',
        addressLine1: rawAddr.addressLine1 || rawAddr.address_line_1 || 'Sunshine Heights',
        city: rawAddr.city || 'Mumbai',
        state: rawAddr.state || 'MH',
        postalCode: rawAddr.postalCode || rawAddr.postalcode || rawAddr.pincode || '400001',
        country: rawAddr.country || 'IND'
      };

      // Map FATCA Declarations
      const rawFatca = b.fatcaDeclarations || b.fatca || {};
      const fatcaDeclarations: UccFatca[] = [
        {
          holderRank: 1,
          placeOfBirth: rawFatca.placeOfBirth || rawFatca.place_of_birth || 'Mumbai',
          countryOfBirth: rawFatca.countryOfBirth || rawFatca.country_of_birth || 'IND',
          wealthSourceCode: rawFatca.wealthSourceCode || rawFatca.wealth_source_code || '01',
          incomeSlabCode: rawFatca.incomeSlabCode || rawFatca.income_slab_code || '01',
          politicallyExposed: rawFatca.politicallyExposed || (rawFatca.is_politically_exposed ? 'Y' : 'N'),
          isSelfDeclared: true,
          taxResidency: [{ country: rawFatca.taxResidenceCountry || rawFatca.tax_residence_country || 'IND' }]
        }
      ];

      const profile: UccInvestorProfile = {
        tenantId: req.tenantContext.tenantId,
        clientCode,
        holdingNature: b.holdingNature || b.holding_pattern || 'SI',
        taxCode: b.taxCode || b.tax_status || '01',
        rdmpIdcwPayMode: b.rdmpIdcwPayMode || b.rdmp_idcw_pay_mode || '02',
        isClientPhysical: b.isClientPhysical ?? b.is_client_physical ?? true,
        isClientDemat: b.isClientDemat ?? b.is_client_demat ?? false,
        isNominationOpted: b.isNominationOpted ?? (nominees.length > 0),
        nominationAuthMode: b.nominationAuthMode || 'O',
        nominees,
        holders,
        bankAccounts,
        communicationAddress: commAddr,
        fatcaDeclarations
      };

      const bseService = BseGatewayService.getInstance();
      const bseResponse = await bseService.registerUcc(profile, req.tenantContext);

      const isSuccess = bseResponse.status === 200 || bseResponse.status === 'success' || bseResponse.data?.status === 'ACTIVE_APPROVED';

      res.status(isSuccess ? 201 : 400).json({
        success: isSuccess,
        data: {
          client_code: profile.clientCode,
          holding_nature: profile.holdingNature,
          is_client_demat: profile.isClientDemat,
          nominee_count: profile.nominees.length,
          tenant: {
            tenant_id: req.tenantContext.tenantId,
            tenant_code: req.tenantContext.tenantCode,
            arn: req.tenantContext.arnNumber
          },
          bse_response: bseResponse
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}
