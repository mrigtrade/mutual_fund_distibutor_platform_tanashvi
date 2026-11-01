/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund & Financial Goal Calculator Types
 * 
 * Provides types and response structures for:
 * - SIP, Step-Up SIP, and Target SIP Calculators
 * - Crorepati, Retirement, and Child Education Goal Planners
 * - Lumpsum, SWP, and STP Wealth Engine
 */

export interface YearlyScheduleItem {
  year: number;
  annualInvestment: number;
  cumulativeInvestment: number;
  interestEarnedYearly: number;
  cumulativeInterest: number;
  endOfYearBalance: number;
}

// ----------------------------------------------------------------------------
// 1. SIP Calculator Types
// ----------------------------------------------------------------------------
export interface SipCalculationInput {
  monthlyInvestment: number;
  expectedAnnualReturnRate: number; // e.g. 12 for 12%
  tenureYears: number;
}

export interface SipCalculationResult {
  monthlyInvestment: number;
  expectedAnnualReturnRate: number;
  tenureYears: number;
  totalInvestment: number;
  estimatedReturns: number;
  totalMaturityValue: number;
  wealthGainMultiplier: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 2. Step-Up / Top-Up SIP Calculator Types
// ----------------------------------------------------------------------------
export interface StepUpSipInput {
  initialMonthlyInvestment: number;
  stepUpType: 'PERCENT' | 'AMOUNT';
  stepUpValue: number; // e.g. 10 for 10% or 1000 for ₹1000
  expectedAnnualReturnRate: number;
  tenureYears: number;
}

export interface StepUpSipResult extends SipCalculationResult {
  stepUpType: 'PERCENT' | 'AMOUNT';
  stepUpValue: number;
  finalYearMonthlyInvestment: number;
  normalSipComparisonValue: number; // Compares against flat SIP to show value of stepping up
  stepUpExtraWealthGain: number;
}

// ----------------------------------------------------------------------------
// 3. Target Amount SIP (Reverse SIP) Types
// ----------------------------------------------------------------------------
export interface TargetSipInput {
  targetCorpus: number;
  expectedAnnualReturnRate: number;
  tenureYears: number;
  annualStepUpPercent?: number; // Optional annual step-up percentage
}

export interface TargetSipResult {
  targetCorpus: number;
  tenureYears: number;
  expectedAnnualReturnRate: number;
  requiredMonthlyInvestment: number;
  totalInvestment: number;
  estimatedReturns: number;
  annualStepUpPercent: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 4. Become A Crorepati Calculator Types
// ----------------------------------------------------------------------------
export interface CrorepatiInput {
  targetCrores?: number; // Default 1 (₹1,00,00,000)
  expectedAnnualReturnRate: number;
  currentSavings?: number;
  tenureYears?: number;       // If tenure specified, calculate required SIP
  monthlyInvestment?: number; // If monthly SIP specified, calculate years to Crorepati
}

export interface CrorepatiResult {
  targetAmount: number;
  expectedAnnualReturnRate: number;
  currentSavings: number;
  tenureYears: number;
  requiredMonthlySip: number;
  totalInvestment: number;
  wealthCreated: number;
  yearsToReachGoal: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 5. Retirement Planning Calculator Types
// ----------------------------------------------------------------------------
export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancyYears?: number; // Default 85
  currentMonthlyExpense: number;
  inflationRateAnnual: number;  // e.g. 6 for 6%
  preRetirementReturnRate: number;  // e.g. 12% during accumulation
  postRetirementReturnRate: number; // e.g. 8% during distribution
  existingRetirementSavings?: number;
}

export interface RetirementResult {
  currentAge: number;
  retirementAge: number;
  lifeExpectancyYears: number;
  yearsToRetirement: number;
  yearsInRetirement: number;
  currentAnnualExpense: number;
  monthlyExpenseAtRetirement: number;
  annualExpenseAtRetirement: number;
  grossRetirementCorpusRequired: number;
  futureValueOfExistingSavings: number;
  netRetirementCorpusNeeded: number;
  requiredMonthlySip: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 6. Children Education / Marriage Planner Types
// ----------------------------------------------------------------------------
export interface ChildEducationInput {
  childCurrentAge: number;
  collegeStartAge: number;      // e.g. 18
  currentCostOfEducation: number;
  educationInflationRate: number; // e.g. 10%
  expectedReturnRate: number;     // e.g. 12%
  existingSavings?: number;
}

export interface ChildEducationResult {
  childCurrentAge: number;
  collegeStartAge: number;
  yearsUntilCollege: number;
  currentCost: number;
  futureCostOfEducation: number;
  existingSavingsFutureValue: number;
  netEducationFundNeeded: number;
  requiredMonthlySip: number;
  lumpsumInvestmentTodayRequired: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 7. Lumpsum & Compounding Calculator Types
// ----------------------------------------------------------------------------
export interface LumpsumInput {
  investmentAmount: number;
  expectedAnnualReturnRate: number;
  tenureYears: number;
}

export interface LumpsumResult {
  investmentAmount: number;
  expectedAnnualReturnRate: number;
  tenureYears: number;
  totalMaturityValue: number;
  estimatedReturns: number;
  wealthGainMultiplier: number;
  schedule: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 8. SWP (Systematic Withdrawal Plan) Types
// ----------------------------------------------------------------------------
export interface SwpMonthlyScheduleItem {
  month: number;
  startingBalance: number;
  interestEarned: number;
  withdrawalAmount: number;
  endingBalance: number;
}

export interface SwpInput {
  initialInvestment: number;
  monthlyWithdrawal: number;
  expectedAnnualReturnRate: number;
  tenureYears: number;
}

export interface SwpResult {
  initialInvestment: number;
  monthlyWithdrawal: number;
  tenureYears: number;
  totalAmountWithdrawn: number;
  finalBalanceRemaining: number;
  totalProfitGenerated: number;
  isCorpusExhaustedEarly: boolean;
  exhaustionMonth?: number;
  annualSummary: YearlyScheduleItem[];
}

// ----------------------------------------------------------------------------
// 9. STP (Systematic Transfer Plan) Types
// ----------------------------------------------------------------------------
export interface StpInput {
  sourceInvestmentAmount: number;
  monthlyTransferAmount: number;
  sourceSchemeReturnRate: number; // e.g. 6% (Liquid Fund)
  targetSchemeReturnRate: number; // e.g. 12% (Equity Fund)
  tenureMonths: number;
}

export interface StpResult {
  sourceInvestmentAmount: number;
  monthlyTransferAmount: number;
  tenureMonths: number;
  totalTransferred: number;
  remainingSourceBalance: number;
  targetMaturityValue: number;
  totalCombinedValue: number;
  netProfitGenerated: number;
}

