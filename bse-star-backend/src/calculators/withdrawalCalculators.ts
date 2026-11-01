/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Lumpsum, SWP (Withdrawal) & STP (Transfer) Mathematical Engine
 */

import {
  LumpsumInput,
  LumpsumResult,
  SwpInput,
  SwpResult,
  StpInput,
  StpResult,
  YearlyScheduleItem
} from './calculatorTypes.js';

export class WithdrawalCalculator {
  /**
   * Lumpsum / Compounding Calculator:
   * FV = PV * (1 + r)^t
   */
  public static calculateLumpsum(input: LumpsumInput): LumpsumResult {
    const { investmentAmount, expectedAnnualReturnRate, tenureYears } = input;

    if (investmentAmount <= 0) throw new Error('Investment amount must be positive');
    if (tenureYears <= 0) throw new Error('Tenure must be at least 1 year');

    const rate = expectedAnnualReturnRate / 100;
    const schedule: YearlyScheduleItem[] = [];

    let currentBalance = investmentAmount;
    let cumulativeInterest = 0;

    for (let year = 1; year <= tenureYears; year++) {
      const yearStartBalance = currentBalance;
      const interestEarned = yearStartBalance * rate;
      currentBalance = yearStartBalance + interestEarned;
      cumulativeInterest += interestEarned;

      schedule.push({
        year,
        annualInvestment: year === 1 ? investmentAmount : 0,
        cumulativeInvestment: investmentAmount,
        interestEarnedYearly: Math.round(interestEarned),
        cumulativeInterest: Math.round(cumulativeInterest),
        endOfYearBalance: Math.round(currentBalance)
      });
    }

    const totalMaturityValue = Math.round(currentBalance);
    const estimatedReturns = totalMaturityValue - investmentAmount;
    const wealthGainMultiplier = Number((totalMaturityValue / investmentAmount).toFixed(2));

    return {
      investmentAmount,
      expectedAnnualReturnRate,
      tenureYears,
      totalMaturityValue,
      estimatedReturns,
      wealthGainMultiplier,
      schedule
    };
  }

  /**
   * SWP (Systematic Withdrawal Plan) Calculator:
   * Simulates monthly withdrawal while remaining corpus continues to compound.
   * Tracks potential capital depletion or perpetual growth.
   */
  public static calculateSwp(input: SwpInput): SwpResult {
    const { initialInvestment, monthlyWithdrawal, expectedAnnualReturnRate, tenureYears } = input;

    if (initialInvestment <= 0) throw new Error('Initial investment must be positive');
    if (monthlyWithdrawal <= 0) throw new Error('Monthly withdrawal must be positive');
    if (tenureYears <= 0) throw new Error('Tenure must be at least 1 year');

    const totalMonths = tenureYears * 12;
    const monthlyRate = expectedAnnualReturnRate / (12 * 100);

    let balance = initialInvestment;
    let totalWithdrawn = 0;
    let isExhausted = false;
    let exhaustionMonth: number | undefined;

    const annualSummary: YearlyScheduleItem[] = [];
    let yearlyInterest = 0;
    let cumulativeInterest = 0;
    let yearlyWithdrawn = 0;

    for (let month = 1; month <= totalMonths; month++) {
      if (balance <= 0) {
        if (!isExhausted) {
          isExhausted = true;
          exhaustionMonth = month - 1;
        }
        balance = 0;
      } else {
        // Interest accrues on balance
        const interest = balance * monthlyRate;
        balance = balance + interest;
        yearlyInterest += interest;
        cumulativeInterest += interest;

        // Withdrawal happens
        const actualWithdrawal = Math.min(balance, monthlyWithdrawal);
        balance -= actualWithdrawal;
        totalWithdrawn += actualWithdrawal;
        yearlyWithdrawn += actualWithdrawal;

        if (balance <= 0 && !isExhausted) {
          isExhausted = true;
          exhaustionMonth = month;
        }
      }

      if (month % 12 === 0) {
        const year = month / 12;
        annualSummary.push({
          year,
          annualInvestment: -Math.round(yearlyWithdrawn), // negative indicates net withdrawal
          cumulativeInvestment: Math.round(initialInvestment - totalWithdrawn),
          interestEarnedYearly: Math.round(yearlyInterest),
          cumulativeInterest: Math.round(cumulativeInterest),
          endOfYearBalance: Math.round(balance)
        });
        yearlyInterest = 0;
        yearlyWithdrawn = 0;
      }
    }

    const finalBalanceRemaining = Math.round(balance);
    const totalProfitGenerated = Math.round(totalWithdrawn + finalBalanceRemaining - initialInvestment);

    return {
      initialInvestment,
      monthlyWithdrawal,
      tenureYears,
      totalAmountWithdrawn: Math.round(totalWithdrawn),
      finalBalanceRemaining,
      totalProfitGenerated,
      isCorpusExhaustedEarly: isExhausted,
      exhaustionMonth,
      annualSummary
    };
  }

  /**
   * STP (Systematic Transfer Plan) Calculator:
   * Simulates transferring from Source fund (e.g. Liquid) to Target fund (e.g. Equity).
   */
  public static calculateStp(input: StpInput): StpResult {
    const {
      sourceInvestmentAmount,
      monthlyTransferAmount,
      sourceSchemeReturnRate,
      targetSchemeReturnRate,
      tenureMonths
    } = input;

    if (sourceInvestmentAmount <= 0) throw new Error('Source investment must be positive');
    if (monthlyTransferAmount <= 0) throw new Error('Monthly transfer must be positive');
    if (tenureMonths <= 0) throw new Error('Tenure must be at least 1 month');

    const sourceMonthlyRate = sourceSchemeReturnRate / (12 * 100);
    const targetMonthlyRate = targetSchemeReturnRate / (12 * 100);

    let sourceBalance = sourceInvestmentAmount;
    let targetBalance = 0;
    let totalTransferred = 0;

    for (let month = 1; month <= tenureMonths; month++) {
      if (sourceBalance <= 0) break;

      // Source generates monthly return
      sourceBalance += sourceBalance * sourceMonthlyRate;

      // Transfer amount
      const transfer = Math.min(sourceBalance, monthlyTransferAmount);
      sourceBalance -= transfer;
      totalTransferred += transfer;

      // Target receives transfer and compounds
      targetBalance = (targetBalance + transfer) * (1 + targetMonthlyRate);
    }

    const remainingSourceBalance = Math.round(sourceBalance);
    const targetMaturityValue = Math.round(targetBalance);
    const totalCombinedValue = remainingSourceBalance + targetMaturityValue;
    const netProfitGenerated = totalCombinedValue - sourceInvestmentAmount;

    return {
      sourceInvestmentAmount,
      monthlyTransferAmount,
      tenureMonths,
      totalTransferred: Math.round(totalTransferred),
      remainingSourceBalance,
      targetMaturityValue,
      totalCombinedValue,
      netProfitGenerated
    };
  }
}

