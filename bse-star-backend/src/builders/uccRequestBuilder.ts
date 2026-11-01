/**
 * BSE StAR MF v2.0 - UCC Request Builder
 * 
 * Transforms internal UccInvestorProfile domain entity into exact BSE v2 /api/v2/add_ucc JSON payload.
 * Fully supports:
 * - Physical vs. Demat separation
 * - Single, Joint, Anyone/Survivor holding
 * - Up to 5 Nominees with Minor Guardian details
 * - FATCA & CKYC declarations
 * - AMFI MFD Regulatory attribution
 */

import { UccInvestorProfile, UccNominee, UccHolder } from '../types/ucc.js';

export interface BseUccRequestPayload {
  data: {
    member_code: {
      member_id: string;
    };
    investor: {
      client_code: string;
    };
    holding_nature: string;       // "SI", "JO", "AS"
    tax_code: string;             // "01", etc.
    rdmp_idcw_pay_mode: string;   // "01", "02", "03"
    is_client_physical: boolean;
    is_client_demat: boolean;
    is_nomination_opted: boolean;
    nomination_auth_mode: string; // "O" or "P"
    comm_mode: string;            // "E" or "P"
    onboarding: string;           // "Z"
    holder: any[];
    comm_addr: {
      address_line_1: string;
      address_line_2?: string;
      address_line_3?: string;
      comm_mode: string;
      postalcode: string;
      city?: string;
      state?: string;
    };
    bank_account: Array<{
      ifsc_code: string;
      bank_acc_num: string;
      bank_acc_type: string;
      account_owner: string;
    }>;
    fatca: any[];
    depository?: {
      depository: string;
      dp_id: string;
      client_id: string;
    };
  };
}

export class UccRequestBuilder {
  /**
   * Builds the official BSE StAR MF v2 /add_ucc JSON payload.
   * 
   * @param profile Internal UccInvestorProfile domain object
   * @param memberCode Primary BSE Member Code (defaults to Tanashvi '714114')
   */
  public static buildAddUccRequest(
    profile: UccInvestorProfile,
    memberCode = '714114'
  ): BseUccRequestPayload {
    // 1. Transform Nominees (Up to 5)
    const formattedNominees = profile.nominees.map((nom: UccNominee) => {
      const nomObj: any = {
        person: {
          first_name: nom.firstName,
          middle_name: nom.middleName || '',
          last_name: nom.lastName,
          dob: nom.dob
        },
        nomination_percent: nom.nominationPercent.toString(),
        nomination_relation: nom.nominationRelation,
        is_pan_exempt: nom.isPanExempt,
        is_minor: nom.isMinor
      };

      if (nom.pan) {
        nomObj.identifier = [
          {
            identifier_type: nom.isPanExempt ? 'pan_exempt_ref_no' : 'pan',
            identifier_number: nom.isPanExempt ? nom.panExemptRefNo || '' : nom.pan
          }
        ];
      }

      if (nom.isMinor && nom.guardian) {
        nomObj.guardian = {
          first_name: nom.guardian.firstName,
          middle_name: nom.guardian.middleName || '',
          last_name: nom.guardian.lastName,
          Dob: nom.guardian.dob || '1980-01-01',
          relation: nom.guardian.relation || 'Parent',
          is_pan_exempt: nom.guardian.isPanExempt || false,
          identifier: nom.guardian.pan
            ? [
                {
                  identifier_type: 'pan',
                  identifier_number: nom.guardian.pan
                }
              ]
            : []
        };
      }

      return nomObj;
    });

    // 2. Transform Holders (Primary + Joint)
    const formattedHolders = profile.holders.map((holder: UccHolder) => {
      return {
        holder_rank: holder.holderRank.toString(),
        occ_code: holder.occupationCode || '01',
        auth_mode: 'M',
        is_pan_exempt: holder.isPanExempt,
        identifier: [
          {
            identifier_type: holder.isPanExempt ? 'pan_exempt' : 'pan',
            identifier_number: holder.pan
          }
        ],
        kyc_type: holder.kycType,
        ckyc_number: holder.ckycNumber || '',
        person: {
          first_name: holder.firstName,
          middle_name: holder.middleName || '',
          last_name: holder.lastName,
          dob: holder.dob,
          gender: holder.gender
        },
        contact: [
          {
            contact_number: holder.contactNumber,
            country_code: holder.countryCode || '91',
            whose_contact_number: holder.whoseContactNumber || 'SE',
            email_address: holder.emailAddress,
            whose_email_address: holder.whoseEmailAddress || 'SE',
            contact_type: holder.contactType || 'PR'
          }
        ],
        nomination: formattedNominees
      };
    });

    // 3. Transform Bank Accounts
    const formattedBanks = profile.bankAccounts.map((b) => ({
      ifsc_code: b.ifscCode,
      bank_acc_num: b.accountNumber,
      bank_acc_type: b.accountType,
      account_owner: b.accountOwner || 'SELF'
    }));

    // 4. Transform FATCA Declarations
    const formattedFatca = profile.fatcaDeclarations.map((f) => ({
      holder_rank: f.holderRank.toString(),
      place_of_birth: f.placeOfBirth,
      country_of_birth: f.countryOfBirth || 'India',
      wealth_source: f.wealthSourceCode || '01',
      income_slab: f.incomeSlabCode || '31',
      net_worth: f.netWorthAmount || 0,
      date_of_net_worth: f.netWorthDate || new Date().toISOString().slice(0, 10),
      politically_exposed: f.politicallyExposed || 'N',
      is_self_declared: f.isSelfDeclared,
      data_source: 'P',
      tax_residency: f.taxResidency.map((tr) => ({
        Country: tr.country,
        tax_id_no: tr.taxIdNo || '',
        tax_id_type: tr.taxIdType || 'A'
      }))
    }));

    // 5. Build Complete Request Body
    const requestPayload: BseUccRequestPayload = {
      data: {
        member_code: {
          member_id: memberCode
        },
        investor: {
          client_code: profile.clientCode
        },
        holding_nature: profile.holdingNature,
        tax_code: profile.taxCode,
        rdmp_idcw_pay_mode: profile.rdmpIdcwPayMode || '02',
        is_client_physical: profile.isClientPhysical,
        is_client_demat: profile.isClientDemat,
        is_nomination_opted: profile.isNominationOpted,
        nomination_auth_mode: profile.nominationAuthMode || 'O',
        comm_mode: 'E',
        onboarding: 'Z',
        holder: formattedHolders,
        comm_addr: {
          address_line_1: profile.communicationAddress.addressLine1,
          address_line_2: profile.communicationAddress.addressLine2 || '',
          address_line_3: profile.communicationAddress.addressLine3 || '',
          comm_mode: 'E',
          postalcode: profile.communicationAddress.postalCode,
          city: profile.communicationAddress.city,
          state: profile.communicationAddress.state
        },
        bank_account: formattedBanks,
        fatca: formattedFatca
      }
    };

    // Include depository account if Demat is active
    if (profile.isClientDemat && profile.dematDetails) {
      requestPayload.data.depository = {
        depository: profile.dematDetails.depositoryType,
        dp_id: profile.dematDetails.dpId,
        client_id: profile.dematDetails.dematClientId
      };
    }

    return requestPayload;
  }
}

