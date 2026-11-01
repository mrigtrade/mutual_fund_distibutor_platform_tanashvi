/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Life-Stage & Goal Planners Mathematical Engine
 * 
 * Implements:
 * 1. Become a Crorepati Planner (Corpus / Timeline trajectory)
 * 2. Child Education & Higher Studies Planner (Higher education inflation model)
 * 3. Comprehensive Retirement Planning Engine (Two-phase accumulation & distribution)
 */

import {
  CrorepatiInput,
  CrorepatiResult,
  ChildEducationInput,
  ChildEducationResult,
  RetirementInput,
  RetirementResult
} from './calculatorTypes.js';
import { SipCalculator } from './sipCalculators.js';

export class GoalCalculator {
  /**
   * Become a Crorepati Planner:
   * Determines either the required monthly SIP to achieve ₹1 Crore (or N Crores)
   * in a given timeframe, or the timeline needed for a given monthly SIP.
   */
  public static calculateCrorepati(input: CrorepatiInput): CrorepatiResult {
    const targetCrores = input.targetCrores || 1;
    const targetAmount = targetCrores * 10000000; // 1 Crore = 10,00,0000 INR
    const expectedRate = input.expectedAnnualReturnRate;
    const currentSavings = input.currentSavings || 0;

    let tenureYears = input.tenureYears || 15;
    let requiredMonthlySip = 0;
    let yearsToReachGoal = tenureYears;

    const r = expectedRate / (12 * 100);

    // If tenure is specified, calculate required SIP
    if (input.tenureYears && !input.monthlyInvestment) {
      tenureYears = input.tenureYears;
      const totalMonths = tenureYears * 12;

      // Future value of existing savings at retirement/target
      const fvCurrentSavings = currentSavings * Math.pow(1 + expectedRate / 100, tenureYears);
      const netTarget = Math.max(0, targetAmount - fvCurrentSavings);

      if (netTarget > 0) {
        const factor = r === 0 ? totalMonths : ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
        requiredMonthlySip = Math.ceil(netTarget / factor);
      }
      yearsToReachGoal = tenureYears;
    } else if (input.monthlyInvestment) {
      // If monthly SIP is specified, find months to reach Crorepati
      requiredMonthlySip = input.monthlyInvestment;
      let balance = currentSavings;
      let monthCount = 0;

      while (balance < targetAmount && monthCount < 1200) { // Max 100 years guard
        monthCount++;
        balance = (balance + requiredMonthlySip) * (1 + r);
      }

      yearsToReachGoal = Number((monthCount / 12).toFixed(1));
      tenureYears = Math.ceil(monthCount / 12);
    }

    const sipResult = SipCalculator.calculateSip({
      monthlyInvestment: requiredMonthlySip,
      expectedAnnualReturnRate: expectedRate,
      tenureYears: Math.max(1, Math.ceil(yearsToReachGoal))
    });

    const totalInvestment = sipResult.totalInvestment + currentSavings;
    const wealthCreated = sipResult.totalMaturityValue - totalInvestment;

    return {
      targetAmount,
      expectedAnnualReturnRate: expectedRate,
      currentSavings,
      tenureYears: Math.ceil(yearsToReachGoal),
      requiredMonthlySip,
      totalInvestment,
      wealthCreated,
      yearsToReachGoal,
      schedule: sipResult.schedule
    };
  }

  /**
   * Child Higher Education & Marriage Planner:
   * Applies education inflation (typically 8-10%) to estimate future cost of college
   * and computes monthly SIP needed to build the fund before admission age.
   */
  public static calculateChildEducation(input: ChildEducationInput): ChildEducationResult {
    const {
      childCurrentAge,
      collegeStartAge,
      currentCostOfEducation,
      educationInflationRate,
      expectedReturnRate,
      existingSavings = 0
    } = input;

    if (collegeStartAge <= childCurrentAge) {
      throw new Error('College start age must be greater than child current age');
    }

    const yearsUntilCollege = collegeStartAge - childCurrentAge;

    // 1. Inflate education cost: FV = PV * (1 + inf)^years
    const futureCostOfEducation = Math.round(
      currentCostOfEducation * Math.pow(1 + educationInflationRate / 100, yearsUntilCollege)
    );

    // 2. Future value of existing dedicated savings
    const existingSavingsFutureValue = Math.round(
      existingSavings * Math.pow(1 + expectedReturnRate / 100, yearsUntilCollege)
    );

    // 3. Net fund needed
    const netEducationFundNeeded = Math.max(0, futureCostOfEducation - existingSavingsFutureValue);

    // 4. Calculate monthly SIP needed over yearsUntilCollege
    const targetSip = SipCalculator.calculateTargetSip({
      targetCorpus: netEducationFundNeeded,
      expectedAnnualReturnRate: expectedReturnRate,
      tenureYears: yearsUntilCollege
    });

    // 5. Calculate one-time lumpsum alternative today
    const lumpsumInvestmentTodayRequired = Math.round(
      netEducationFundNeeded / Math.pow(1 + expectedReturnRate / 100, yearsUntilCollege)
    );

    return {
      childCurrentAge,
      collegeStartAge,
      yearsUntilCollege,
      currentCost: currentCostOfEducation,
      futureCostOfEducation,
      existingSavingsFutureValue,
      netEducationFundNeeded,
      requiredMonthlySip: targetSip.requiredMonthlyInvestment,
      lumpsumInvestmentTodayRequired,
      schedule: targetSip.schedule
    };
  }

  /**
   * Comprehensive Retirement Planning Engine:
   * Models two phases:
   * - Accumulation Phase (until retirement age)
   * - Distribution Phase (from retirement until life expectancy)
   * Factoring post-retirement inflation and real returns.
   */
  public static calculateRetirement(input: RetirementInput): RetirementResult {
    const {
      currentAge,
      retirementAge,
      lifeExpectancyYears = 85,
      currentMonthlyExpense,
      inflationRateAnnual,
      preRetirementReturnRate,
      postRetirementReturnRate,
      existingRetirementSavings = 0
    } = input;

    if (retirementAge <= currentAge) {
      throw new Error('Retirement age must be greater than current age');
    }
    if (lifeExpectancyYears <= retirementAge) {
      throw new Error('Life expectancy must be greater than retirement age');
    }

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancyYears - retirementAge;

    const currentAnnualExpense = currentMonthlyExpense * 12;

    // 1. Future annual living expense at retirement year
    const annualExpenseAtRetirement = Math.round(
      currentAnnualExpense * Math.pow(1 + inflationRateAnnual / 100, yearsToRetirement)
    );
    const monthlyExpenseAtRetirement = Math.round(annualExpenseAtRetirement / 12);

    // 2. Real rate of return post-retirement
    // r_real = (1 + post_return) / (1 + inflation) - 1
    const postReturn = postRetirementReturnRate / 100;
    const inflation = inflationRateAnnual / 100;
    const realRate = (1 + postReturn) / (1 + inflation) - 1;

    // 3. Gross corpus needed at retirement (Present value of growing annuity due)
    let grossRetirementCorpusRequired: number;
    if (Math.abs(realRate) < 0.0001) {
      grossRetirementCorpusRequired = annualExpenseAtRetirement * yearsInRetirement;
    } else {
      const pvFactor = (1 - Math.pow(1 + realRate, -yearsInRetirement)) / realRate;
      grossRetirementCorpusRequired = annualExpenseAtRetirement * pvFactor * (1 + realRate);
    }
    grossRetirementCorpusRequired = Math.round(grossRetirementCorpusRequired);

    // 4. Compounded future value of existing savings
    const futureValueOfExistingSavings = Math.round(
      existingRetirementSavings * Math.pow(1 + preRetirementReturnRate / 100, yearsToRetirement)
    );

    // 5. Net corpus needed to accumulate
    const netRetirementCorpusNeeded = Math.max(
      0,
      grossRetirementCorpusRequired - futureValueOfExistingSavings
    );

    // 6. Monthly SIP required during accumulation phase
    const targetSip = SipCalculator.calculateTargetSip({
      targetCorpus: netRetirementCorpusNeeded,
      expectedAnnualReturnRate: preRetirementReturnRate,
      tenureYears: yearsToRetirement
    });

    return {
      currentAge,
      retirementAge,
      lifeExpectancyYears,
      yearsToRetirement,
      yearsInRetirement,
      currentAnnualExpense,
      monthlyExpenseAtRetirement,
      annualExpenseAtRetirement,
      grossRetirementCorpusRequired,
      futureValueOfExistingSavings,
      netRetirementCorpusNeeded,
      requiredMonthlySip: targetSip.requiredMonthlyInvestment,
      schedule: targetSip.schedule
    };
  }
}

