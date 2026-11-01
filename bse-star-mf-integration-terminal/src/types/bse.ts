export type Environment = 'uat' | 'prod';

export interface BseCredentials {
  memberId: string; // e.g. ARN-102938 or BSE Broker Code
  userId: string; // User ID provided by BSE StAR MF
  password: string; // Member password
  passKey: string; // PassKey / API Auth Token provided by BSE
  environment: Environment;
  customGatewayUrl?: string;
  isConfigured: boolean;
  lastTestedAt?: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR';
}

export type TaxStatus = 'RI' | 'NRI' | 'MN' | 'CO' | 'HUF'; // Resident Individual, Non Resident, Minor, Corporate, HUF
export type HoldingNature = 'SI' | 'AS' | 'JT'; // Single, Anyone or Survivor, Joint

export interface BankAccount {
  accountNumber: string;
  accountType: 'SB' | 'CA' | 'NRE' | 'NRO'; // Savings, Current, NRE, NRO
  ifsc: string;
  bankName: string;
  branchName: string;
}

export interface NomineeDetails {
  name: string;
  relationship: string;
  dateOfBirth?: string;
  allocationPercentage: number;
}

export interface SubDistributor {
  id: string; // e.g. 'SUB-101'
  subBrokerCode: string; // Sub-broker Code / Sub-ARN
  name: string; // Firm / Advisor Name
  contactPerson: string;
  euin: string; // AMFI EUIN e.g. 'E294810'
  email: string;
  mobile: string;
  commissionShare: number; // Percentage share e.g. 70%
  activeStatus: 'ACTIVE' | 'SUSPENDED';
  totalAum: number;
  totalOrders: number;
  mappedClientsCount: number;
  createdAt: string;
}

export type UserRole = 
  | 'PLATFORM_SUPER_ADMIN' // Category 4: Tanashvi Promoters & Platform Owners (ARN-347849)
  | 'MASTER_MFD'           // Tanashvi Principal MFD View
  | 'MFD_STANDALONE'       // Category 1: Standalone MFD Subscriber
  | 'MFD_NETWORK'          // Category 2: MFD with Sub-Brokers & Branch Desks
  | 'SUB_DISTRIBUTOR'      // Category 2: Sub-Broker / RM
  | 'CLIENT_INVESTOR';     // Category 3: End Investor / Client (e.g. Ramesh Sharma)

export interface ActiveUserSession {
  role: UserRole;
  subDistributorId?: string;
  subBrokerCode?: string;
  euin?: string;
  name: string;
  memberId: string; // Master Member Code (714114)
  clientCode?: string; // For CLIENT_INVESTOR
  pan?: string;        // For CLIENT_INVESTOR
  tenantCode?: string; // Tenant Identifier
  roleTitle?: string;
}

export type KraStatus = 'KYC_VALIDATED' | 'KYC_REGISTERED' | 'KYC_ON_HOLD' | 'NOT_KYC';
export type KraAgency = 'CVL_KRA' | 'CAMS_KRA' | 'NDML_KRA' | 'NSE_KRA' | 'KARVY_KRA';

export interface KycRecord {
  id: string; // e.g. KYC-202610-001
  pan: string;
  clientName: string;
  dob: string;
  mobile: string;
  email: string;
  kraStatus: KraStatus;
  kraAgency: KraAgency;
  ckycKin?: string; // 14-digit Central KYC Number
  panAadhaarLinked: boolean;
  ipvCompleted: boolean;
  pennyDropVerified: boolean;
  bseUccCreated: boolean;
  associatedClientCode?: string;
  subBrokerCode?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankVerification?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    beneficiaryName: string;
    nameMatchScore: number; // e.g. 98%
  };
  lastUpdated: string;
}

export interface ClientUcc {
  clientCode: string; // Unique Client Code (UCC) e.g. CL904812
  fullName: string;
  pan: string;
  email: string;
  mobile: string;
  dob: string;
  taxStatus: TaxStatus;
  holdingNature: HoldingNature;
  primaryBank: BankAccount;
  nominee?: NomineeDetails;
  fatcaCompliant: boolean;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  aofStatus: 'APPROVED' | 'SUBMITTED' | 'PENDING_UPLOAD';
  subBrokerCode?: string; // Mapped Sub-Broker / Sub-Distributor
  euin?: string; // Associated EUIN
  createdAt: string;
}

export type SchemeCategory = 
  | 'Equity: Large Cap'
  | 'Equity: Flexi Cap'
  | 'Equity: Mid Cap'
  | 'Equity: Small Cap'
  | 'Debt: Liquid'
  | 'Debt: Corporate Bond'
  | 'Hybrid: Aggressive'
  | 'Index / ETF';

export interface Scheme {
  schemeCode: string; // BSE Scheme code e.g. '119551'
  isin: string;
  schemeName: string;
  amc: string;
  category: SchemeCategory;
  nav: number;
  navDate: string;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  minLumpsum: number;
  minSip: number;
  cutoffTime: string; // '15:00 IST' or '13:30 IST'
  settlementCycle: 'T+1' | 'T+2';
  expenseRatio: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  isSipAllowed: boolean;
  isSwitchAllowed: boolean;
  isRedemptionAllowed: boolean;
}

export type OrderType = 
  | 'LUMPSUM_PURCHASE'
  | 'ADDITIONAL_PURCHASE'
  | 'SIP'
  | 'XSIP'
  | 'REDEMPTION'
  | 'SWITCH';

export type OrderStatus = 
  | 'PLACED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ALLOTTED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BseOrder {
  orderId: string; // Internal Order Id
  bseOrderNo: string; // BSE assigned Order No / BBO
  clientCode: string;
  clientName: string;
  schemeCode: string;
  schemeName: string;
  targetSchemeCode?: string; // For switch orders
  targetSchemeName?: string;
  orderType: OrderType;
  amount: number;
  units?: number;
  folioNumber?: string;
  dpType: 'PHYSICAL' | 'DEMAT';
  status: OrderStatus;
  paymentMode: 'UPI' | 'NETBANKING' | 'NEFT_RTGS' | 'MANDATE';
  paymentRef?: string;
  paymentUrl?: string;
  mandateId?: string; // Associated mandate if XSIP
  sipFrequency?: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
  sipInstallments?: number;
  sipStartDate?: string;
  subBrokerCode?: string; // BSE StAR MF SubBrokerCode
  euin?: string; // BSE StAR MF EUIN
  euinFlag?: 'Y' | 'N'; // BSE StAR MF EUIN Declaration Flag
  timestamp: string;
  remarks?: string;
}

export interface Mandate {
  mandateId: string; // e.g. MDT-88201
  clientCode: string;
  clientName: string;
  umrn: string; // Unique Mandate Reference Number (NPCI)
  bankAccount: string;
  bankName: string;
  ifsc: string;
  mandateType: 'E_NACH' | 'NETBANKING' | 'PHYSICAL';
  maxLimit: number;
  status: 'APPROVED' | 'PENDING_AUTH' | 'REJECTED';
  authUrl?: string;
  expiryDate: string;
  createdAt: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  service: string;
  requestPayload: string;
  responsePayload: string;
  statusCode: number;
  latencyMs: number;
  status: 'SUCCESS' | 'ERROR';
}
