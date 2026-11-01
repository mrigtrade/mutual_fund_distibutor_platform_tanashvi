/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * SIP, Step-Up SIP & Target SIP Mathematical Engine
 * 
 * Financial compounding formulas adhering strictly to SEBI & AMFI standards:
 * Future Value of SIP: FV = P * [ ((1 + r)^n - 1) / r ] * (1 + r)
 * where r = monthly rate, n = number of months, P = monthly installment.
 */

import {
  SipCalculationInput,
  SipCalculationResult,
  StepUpSipInput,
  StepUpSipResult,
  TargetSipInput,
  TargetSipResult,
  YearlyScheduleItem
} from './calculatorTypes.js';

export class SipCalculator {
  /**
   * Calculates Future Value, Total Investment, and Year-by-Year Schedule for Regular SIP.
   */
  public static calculateSip(input: SipCalculationInput): SipCalculationResult {
    const { monthlyInvestment, expectedAnnualReturnRate, tenureYears } = input;

    if (monthlyInvestment <= 0) throw new Error('Monthly investment must be greater than zero');
    if (tenureYears <= 0) throw new Error('Tenure must be at least 1 year');
    if (expectedAnnualReturnRate < 0) throw new Error('Expected return rate cannot be negative');

    const totalMonths = tenureYears * 12;
    const monthlyRate = expectedAnnualReturnRate === 0 ? 0 : expectedAnnualReturnRate / (12 * 100);

    let currentBalance = 0;
    let cumulativeInvestment = 0;
    const schedule: YearlyScheduleItem[] = [];

    let currentYearInvestment = 0;
    let currentYearInterest = 0;
    let cumulativeInterest = 0;

    for (let month = 1; month <= totalMonths; month++) {
      cumulativeInvestment += monthlyInvestment;
      currentYearInvestment += monthlyInvestment;

      // Compound at start of month (annuity due)
      const interestForMonth = (currentBalance + monthlyInvestment) * monthlyRate;
      currentBalance = currentBalance + monthlyInvestment + interestForMonth;
      currentYearInterest += interestForMonth;
      cumulativeInterest += interestForMonth;

      if (month % 12 === 0) {
        const year = month / 12;
        schedule.push({
          year,
          annualInvestment: Math.round(currentYearInvestment),
          cumulativeInvestment: Math.round(cumulativeInvestment),
          interestEarnedYearly: Math.round(currentYearInterest),
          cumulativeInterest: Math.round(cumulativeInterest),
          endOfYearBalance: Math.round(currentBalance)
        });
        currentYearInvestment = 0;
        currentYearInterest = 0;
      }
    }

    const totalInvestment = Math.round(monthlyInvestment * totalMonths);
    const totalMaturityValue = Math.round(currentBalance);
    const estimatedReturns = totalMaturityValue - totalInvestment;
    const wealthGainMultiplier = Number((totalMaturityValue / totalInvestment).toFixed(2));

    return {
      monthlyInvestment,
      expectedAnnualReturnRate,
      tenureYears,
      totalInvestment,
      estimatedReturns,
      totalMaturityValue,
      wealthGainMultiplier,
      schedule
    };
  }

  /**
   * Calculates Future Value for Step-Up / Top-Up SIP (increasing monthly SIP every 12 months).
   */
  public static calculateStepUpSip(input: StepUpSipInput): StepUpSipResult {
    const { initialMonthlyInvestment, stepUpType, stepUpValue, expectedAnnualReturnRate, tenureYears } = input;

    if (initialMonthlyInvestment <= 0) throw new Error('Initial monthly investment must be positive');
    if (tenureYears <= 0) throw new Error('Tenure must be at least 1 year');
    if (stepUpValue < 0) throw new Error('Step-up value cannot be negative');

    const totalMonths = tenureYears * 12;
    const monthlyRate = expectedAnnualReturnRate === 0 ? 0 : expectedAnnualReturnRate / (12 * 100);

    let currentMonthlySip = initialMonthlyInvestment;
    let currentBalance = 0;
    let cumulativeInvestment = 0;
    let cumulativeInterest = 0;
    const schedule: YearlyScheduleItem[] = [];

    let currentYearInvestment = 0;
    let currentYearInterest = 0;

    for (let month = 1; month <= totalMonths; month++) {
      // Step-up occurs at the beginning of each new year (month 13, 25, 37...)
      if (month > 1 && (month - 1) % 12 === 0) {
        if (stepUpType === 'PERCENT') {
          currentMonthlySip = currentMonthlySip * (1 + stepUpValue / 100);
        } else {
          currentMonthlySip += stepUpValue;
        }
      }

      cumulativeInvestment += currentMonthlySip;
      currentYearInvestment += currentMonthlySip;

      const interestForMonth = (currentBalance + currentMonthlySip) * monthlyRate;
      currentBalance = currentBalance + currentMonthlySip + interestForMonth;
      currentYearInterest += interestForMonth;
      cumulativeInterest += interestForMonth;

      if (month % 12 === 0) {
        const year = month / 12;
        schedule.push({
          year,
          annualInvestment: Math.round(currentYearInvestment),
          cumulativeInvestment: Math.round(cumulativeInvestment),
          interestEarnedYearly: Math.round(currentYearInterest),
          cumulativeInterest: Math.round(cumulativeInterest),
          endOfYearBalance: Math.round(currentBalance)
        });
        currentYearInvestment = 0;
        currentYearInterest = 0;
      }
    }

    const totalInvestment = Math.round(cumulativeInvestment);
    const totalMaturityValue = Math.round(currentBalance);
    const estimatedReturns = totalMaturityValue - totalInvestment;
    const wealthGainMultiplier = Number((totalMaturityValue / totalInvestment).toFixed(2));

    // Calculate baseline normal SIP for comparison
    const normalSip = this.calculateSip({
      monthlyInvestment: initialMonthlyInvestment,
      expectedAnnualReturnRate,
      tenureYears
    });

    const stepUpExtraWealthGain = totalMaturityValue - normalSip.totalMaturityValue;

    return {
      monthlyInvestment: initialMonthlyInvestment,
      expectedAnnualReturnRate,
      tenureYears,
      stepUpType,
      stepUpValue,
      finalYearMonthlyInvestment: Math.round(currentMonthlySip),
      totalInvestment,
      estimatedReturns,
      totalMaturityValue,
      wealthGainMultiplier,
      normalSipComparisonValue: normalSip.totalMaturityValue,
      stepUpExtraWealthGain,
      schedule
    };
  }

  /**
   * Reverse SIP: Computes required monthly investment to accumulate target corpus.
   */
  public static calculateTargetSip(input: TargetSipInput): TargetSipResult {
    const { targetCorpus, expectedAnnualReturnRate, tenureYears, annualStepUpPercent = 0 } = input;

    if (targetCorpus <= 0) throw new Error('Target corpus must be positive');
    if (tenureYears <= 0) throw new Error('Tenure must be at least 1 year');

    // If no step up, use closed form annuity formula
    if (annualStepUpPercent === 0) {
      const totalMonths = tenureYears * 12;
      const r = expectedAnnualReturnRate === 0 ? 0 : expectedAnnualReturnRate / (12 * 100);

      let requiredMonthly: number;
      if (r === 0) {
        requiredMonthly = targetCorpus / totalMonths;
      } else {
        const factor = ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
        requiredMonthly = targetCorpus / factor;
      }

      const sipResult = this.calculateSip({
        monthlyInvestment: Math.ceil(requiredMonthly),
        expectedAnnualReturnRate,
        tenureYears
      });

      return {
        targetCorpus,
        tenureYears,
        expectedAnnualReturnRate,
        requiredMonthlyInvestment: Math.ceil(requiredMonthly),
        totalInvestment: sipResult.totalInvestment,
        estimatedReturns: sipResult.estimatedReturns,
        annualStepUpPercent: 0,
        schedule: sipResult.schedule
      };
    }

    // Binary search to find initial monthly investment with step-up
    let low = 100;
    let high = targetCorpus;
    let bestMonthly = low;

    for (let iter = 0; iter < 50; iter++) {
      const mid = (low + high) / 2;
      const res = this.calculateStepUpSip({
        initialMonthlyInvestment: mid,
        stepUpType: 'PERCENT',
        stepUpValue: annualStepUpPercent,
        expectedAnnualReturnRate,
        tenureYears
      });

      if (Math.abs(res.totalMaturityValue - targetCorpus) < 1000) {
        bestMonthly = mid;
        break;
      }

      if (res.totalMaturityValue < targetCorpus) {
        low = mid;
      } else {
        high = mid;
        bestMonthly = mid;
      }
    }

    const stepUpResult = this.calculateStepUpSip({
      initialMonthlyInvestment: Math.ceil(bestMonthly),
      stepUpType: 'PERCENT',
      stepUpValue: annualStepUpPercent,
      expectedAnnualReturnRate,
      tenureYears
    });

    return {
      targetCorpus,
      tenureYears,
      expectedAnnualReturnRate,
      requiredMonthlyInvestment: Math.ceil(bestMonthly),
      totalInvestment: stepUpResult.totalInvestment,
      estimatedReturns: stepUpResult.estimatedReturns,
      annualStepUpPercent,
      schedule: stepUpResult.schedule
    };
  }
}

