/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Financial Calculator Controller
 */

import { Request, Response, NextFunction } from 'express';
import { SipCalculator } from '../calculators/sipCalculators.js';
import { GoalCalculator } from '../calculators/goalCalculators.js';
import { WithdrawalCalculator } from '../calculators/withdrawalCalculators.js';
import { AppError } from '../middleware/errorHandler.js';

export class CalculatorController {
  /**
   * POST /api/v1/calculators/sip
   */
  public static calculateSip(req: Request, res: Response, next: NextFunction): void {
    try {
      const { monthlyInvestment, expectedAnnualReturnRate, tenureYears } = req.body;
      if (!monthlyInvestment || !expectedAnnualReturnRate || !tenureYears) {
        throw new AppError('monthlyInvestment, expectedAnnualReturnRate, and tenureYears are mandatory', 400);
      }

      const result = SipCalculator.calculateSip({
        monthlyInvestment: Number(monthlyInvestment),
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        tenureYears: Number(tenureYears)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/step-up-sip
   */
  public static calculateStepUpSip(req: Request, res: Response, next: NextFunction): void {
    try {
      const { initialMonthlyInvestment, stepUpType = 'PERCENT', stepUpValue, expectedAnnualReturnRate, tenureYears } = req.body;
      if (!initialMonthlyInvestment || stepUpValue === undefined || !expectedAnnualReturnRate || !tenureYears) {
        throw new AppError('initialMonthlyInvestment, stepUpValue, expectedAnnualReturnRate, and tenureYears are mandatory', 400);
      }

      const result = SipCalculator.calculateStepUpSip({
        initialMonthlyInvestment: Number(initialMonthlyInvestment),
        stepUpType,
        stepUpValue: Number(stepUpValue),
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        tenureYears: Number(tenureYears)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/target-sip
   */
  public static calculateTargetSip(req: Request, res: Response, next: NextFunction): void {
    try {
      const { targetCorpus, expectedAnnualReturnRate, tenureYears, annualStepUpPercent } = req.body;
      if (!targetCorpus || !expectedAnnualReturnRate || !tenureYears) {
        throw new AppError('targetCorpus, expectedAnnualReturnRate, and tenureYears are mandatory', 400);
      }

      const result = SipCalculator.calculateTargetSip({
        targetCorpus: Number(targetCorpus),
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        tenureYears: Number(tenureYears),
        annualStepUpPercent: annualStepUpPercent ? Number(annualStepUpPercent) : 0
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/crorepati
   */
  public static calculateCrorepati(req: Request, res: Response, next: NextFunction): void {
    try {
      const { targetCrores, expectedAnnualReturnRate, currentSavings, tenureYears, monthlyInvestment } = req.body;
      if (!expectedAnnualReturnRate) {
        throw new AppError('expectedAnnualReturnRate is mandatory', 400);
      }
      if (!tenureYears && !monthlyInvestment) {
        throw new AppError('Either tenureYears or monthlyInvestment must be provided', 400);
      }

      const result = GoalCalculator.calculateCrorepati({
        targetCrores: targetCrores ? Number(targetCrores) : 1,
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        currentSavings: currentSavings ? Number(currentSavings) : 0,
        tenureYears: tenureYears ? Number(tenureYears) : undefined,
        monthlyInvestment: monthlyInvestment ? Number(monthlyInvestment) : undefined
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/education
   */
  public static calculateChildEducation(req: Request, res: Response, next: NextFunction): void {
    try {
      const {
        childCurrentAge,
        collegeStartAge,
        currentCostOfEducation,
        educationInflationRate = 10,
        expectedReturnRate = 12,
        existingSavings = 0
      } = req.body;

      if (childCurrentAge === undefined || !collegeStartAge || !currentCostOfEducation) {
        throw new AppError('childCurrentAge, collegeStartAge, and currentCostOfEducation are mandatory', 400);
      }

      const result = GoalCalculator.calculateChildEducation({
        childCurrentAge: Number(childCurrentAge),
        collegeStartAge: Number(collegeStartAge),
        currentCostOfEducation: Number(currentCostOfEducation),
        educationInflationRate: Number(educationInflationRate),
        expectedReturnRate: Number(expectedReturnRate),
        existingSavings: Number(existingSavings)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/retirement
   */
  public static calculateRetirement(req: Request, res: Response, next: NextFunction): void {
    try {
      const {
        currentAge,
        retirementAge,
        lifeExpectancyYears = 85,
        currentMonthlyExpense,
        inflationRateAnnual = 6,
        preRetirementReturnRate = 12,
        postRetirementReturnRate = 8,
        existingRetirementSavings = 0
      } = req.body;

      if (!currentAge || !retirementAge || !currentMonthlyExpense) {
        throw new AppError('currentAge, retirementAge, and currentMonthlyExpense are mandatory', 400);
      }

      const result = GoalCalculator.calculateRetirement({
        currentAge: Number(currentAge),
        retirementAge: Number(retirementAge),
        lifeExpectancyYears: Number(lifeExpectancyYears),
        currentMonthlyExpense: Number(currentMonthlyExpense),
        inflationRateAnnual: Number(inflationRateAnnual),
        preRetirementReturnRate: Number(preRetirementReturnRate),
        postRetirementReturnRate: Number(postRetirementReturnRate),
        existingRetirementSavings: Number(existingRetirementSavings)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/lumpsum
   */
  public static calculateLumpsum(req: Request, res: Response, next: NextFunction): void {
    try {
      const { investmentAmount, expectedAnnualReturnRate, tenureYears } = req.body;
      if (!investmentAmount || !expectedAnnualReturnRate || !tenureYears) {
        throw new AppError('investmentAmount, expectedAnnualReturnRate, and tenureYears are mandatory', 400);
      }

      const result = WithdrawalCalculator.calculateLumpsum({
        investmentAmount: Number(investmentAmount),
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        tenureYears: Number(tenureYears)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/swp
   */
  public static calculateSwp(req: Request, res: Response, next: NextFunction): void {
    try {
      const { initialInvestment, monthlyWithdrawal, expectedAnnualReturnRate, tenureYears } = req.body;
      if (!initialInvestment || !monthlyWithdrawal || !expectedAnnualReturnRate || !tenureYears) {
        throw new AppError('initialInvestment, monthlyWithdrawal, expectedAnnualReturnRate, and tenureYears are mandatory', 400);
      }

      const result = WithdrawalCalculator.calculateSwp({
        initialInvestment: Number(initialInvestment),
        monthlyWithdrawal: Number(monthlyWithdrawal),
        expectedAnnualReturnRate: Number(expectedAnnualReturnRate),
        tenureYears: Number(tenureYears)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/calculators/stp
   */
  public static calculateStp(req: Request, res: Response, next: NextFunction): void {
    try {
      const {
        sourceInvestmentAmount,
        monthlyTransferAmount,
        sourceSchemeReturnRate = 6,
        targetSchemeReturnRate = 12,
        tenureMonths
      } = req.body;

      if (!sourceInvestmentAmount || !monthlyTransferAmount || !tenureMonths) {
        throw new AppError('sourceInvestmentAmount, monthlyTransferAmount, and tenureMonths are mandatory', 400);
      }

      const result = WithdrawalCalculator.calculateStp({
        sourceInvestmentAmount: Number(sourceInvestmentAmount),
        monthlyTransferAmount: Number(monthlyTransferAmount),
        sourceSchemeReturnRate: Number(sourceSchemeReturnRate),
        targetSchemeReturnRate: Number(targetSchemeReturnRate),
        tenureMonths: Number(tenureMonths)
      });

      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }
}

