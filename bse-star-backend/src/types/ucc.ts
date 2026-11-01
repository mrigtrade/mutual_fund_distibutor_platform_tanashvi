/**
 * BSE StAR MF v2.0 - UCC (Unique Client Code) Type Definitions
 * 
 * Complies with BSE StAR MF v2 Specifications:
 * - Separation of Physical vs. Demat client onboarding
 * - Strict support for up to 5 nominees with minor/guardian tracking
 * - CKYC and FATCA compliance
 * - Multi-tenant distributor isolation
 */

export type HoldingNature = 'SI' | 'JO' | 'AS'; // Single, Joint, Anyone or Survivor
export type TaxCode = '01' | '02' | '03' | string; // 01 Individual, 02 HUF, etc.
export type DepositoryType = 'CDSL' | 'NSDL';
export type Gender = 'M' | 'F' | 'O';
export type BankAccountType = 'SB' | 'CA' | 'NRE' | 'NRO';
export type NomineeRank = 1 | 2 | 3 | 4 | 5;

export interface UccNominee {
  nomineeRank: NomineeRank;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  nominationPercent: number; // Sum across nominees must equal 100%
  nominationRelation: string; // '01' Spouse, '02' Son, '03' Daughter, etc.
  isPanExempt: boolean;
  pan?: string;
  panExemptCategory?: string;
  panExemptRefNo?: string;
  isMinor: boolean;
  guardian?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dob?: string;
    relation?: string;
    pan?: string;
    isPanExempt?: boolean;
  };
}

export interface UccHolder {
  holderRank: 1 | 2 | 3;
  pan: string;
  isPanExempt: boolean;
  panExemptCategory?: string;
  ckycNumber?: string;
  kycType: 'C' | 'K'; // CKYC or KRA
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  occupationCode: string; // '01' Business, '02' Services, '03' Professional, etc.
  fatherName?: string;
  spouseName?: string;
  contactNumber: string;
  countryCode: string;
  whoseContactNumber: 'SE' | 'SP' | 'DC' | 'DP'; // Self, Spouse, Dependent Child, Dependent Parent
  emailAddress: string;
  whoseEmailAddress: 'SE' | 'SP' | 'DC' | 'DP';
  contactType: 'PR';
}

export interface UccBankAccount {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: BankAccountType;
  accountOwner: 'SELF';
  isDefault: boolean;
  pennyDropStatus?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXEMPT';
  pennyDropName?: string;
  chequeLeafBlobRef?: string;
}

export interface UccAddress {
  addressType: 'COMMUNICATION' | 'FOREIGN' | 'PERMANENT';
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UccFatca {
  holderRank: 1 | 2 | 3;
  placeOfBirth: string;
  countryOfBirth: string;
  wealthSourceCode: string;
  incomeSlabCode: string;
  netWorthAmount?: number;
  netWorthDate?: string;
  politicallyExposed: 'N' | 'Y' | 'R';
  isSelfDeclared: boolean;
  taxResidency: Array<{
    country: string;
    taxIdNo?: string;
    taxIdType?: string;
  }>;
}

export interface UccInvestorProfile {
  id?: string;
  tenantId: string;
  clientCode: string;
  holdingNature: HoldingNature;
  taxCode: TaxCode;
  taxStatusDesc?: string;
  rdmpIdcwPayMode: '01' | '02' | '03'; // 01 Cheque, 02 Direct Credit, 03 NEFT/RTGS
  
  // Physical vs. Demat Client Isolation
  isClientPhysical: boolean;
  isClientDemat: boolean;
  dematDetails?: {
    depositoryType: DepositoryType;
    dpId: string;
    dematClientId: string;
  };

  // Nomination
  isNominationOpted: boolean;
  nominationAuthMode: 'O' | 'P';
  nominees: UccNominee[]; // Max 5

  // Holders
  holders: UccHolder[]; // Max 3

  // Bank Accounts
  bankAccounts: UccBankAccount[]; // Max 5

  // Addresses & FATCA
  communicationAddress: UccAddress;
  foreignAddress?: UccAddress;
  fatcaDeclarations: UccFatca[];

  // Routing defaults
  defaultSubBrokerCode?: string;
  defaultSubBrokerArn?: string;
  defaultEuin?: string;

  // BSE Status
  bseStatus?: 'DRAFT' | 'PENDING_SUBMISSION' | 'SUBMITTED_TO_BSE' | 'ACTIVE_APPROVED' | 'REJECTED_BY_BSE' | 'DEACTIVATED';
  bseAofRefNo?: string;
}

