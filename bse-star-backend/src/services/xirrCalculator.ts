/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * High-Precision Cashflow XIRR (Extended Internal Rate of Return) Calculator
 * 
 * Computes annualized return for irregular mutual fund cashflows (SIPs, lumpsums,
 * redemptions, dividend payouts, and current portfolio terminal value).
 * Implements Newton-Raphson with bounded Bisection fallback for 100% convergence.
 */

export interface CashFlow {
  date: string | Date; // YYYY-MM-DD or Date object
  amount: number;      // Negative for outflows (investments), positive for inflows (redemptions / current value)
}

export class XirrCalculator {
  private static readonly MAX_ITERATIONS = 100;
  private static readonly TOLERANCE = 1e-7;

  /**
   * Calculates the XIRR percentage for a series of irregular cashflows.
   * Returns percentage value (e.g., 14.85 for 14.85% p.a.).
   * Returns 0 if calculation cannot be performed (e.g. all inflows or all outflows).
   */
  public static calculate(cashflows: CashFlow[]): number {
    if (!cashflows || cashflows.length < 2) {
      return 0;
    }

    // Normalize and sort by date ascending
    const normalized = cashflows
      .map(cf => ({
        date: cf.date instanceof Date ? cf.date : new Date(cf.date),
        amount: Number(cf.amount)
      }))
      .filter(cf => !isNaN(cf.date.getTime()) && !isNaN(cf.amount) && cf.amount !== 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (normalized.length < 2) {
      return 0;
    }

    const startDate = normalized[0].date;
    const endDate = normalized[normalized.length - 1].date;
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // If total period is less than 1 day, cannot annualize meaningful rate
    if (totalDays < 1) {
      return 0;
    }

    let hasPositive = false;
    let hasNegative = false;
    for (const cf of normalized) {
      if (cf.amount > 0) hasPositive = true;
      if (cf.amount < 0) hasNegative = true;
    }

    // Must have at least one cash outflow and one cash inflow
    if (!hasPositive || !hasNegative) {
      return 0;
    }

    // Convert dates to fractional years elapsed since startDate
    const flows = normalized.map(cf => ({
      years: (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.0),
      amount: cf.amount
    }));

    // Step 1: Try Newton-Raphson with an initial guess
    const initialGuess = this.computeInitialGuess(normalized, totalDays);
    const nrResult = this.newtonRaphson(flows, initialGuess);

    if (nrResult !== null && !isNaN(nrResult) && isFinite(nrResult)) {
      return Math.round(nrResult * 10000) / 100; // Returns e.g. 15.45%
    }

    // Step 2: Fallback to robust Bisection Search
    const bisectionResult = this.bisection(flows);
    if (bisectionResult !== null && !isNaN(bisectionResult) && isFinite(bisectionResult)) {
      return Math.round(bisectionResult * 10000) / 100;
    }

    return 0;
  }

  /**
   * Evaluates Net Present Value for a discount rate r.
   * NPV(r) = sum( C_i / (1 + r)^y_i )
   */
  private static npv(flows: { years: number; amount: number }[], r: number): number {
    if (r <= -1.0) return Number.NEGATIVE_INFINITY;
    let sum = 0;
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];
      if (flow.years === 0) {
        sum += flow.amount;
      } else {
        sum += flow.amount / Math.pow(1 + r, flow.years);
      }
    }
    return sum;
  }

  /**
   * First derivative of NPV with respect to discount rate r.
   * NPV'(r) = sum( -y_i * C_i / (1 + r)^(y_i + 1) )
   */
  private static npvDerivative(flows: { years: number; amount: number }[], r: number): number {
    if (r <= -1.0) return Number.NEGATIVE_INFINITY;
    let sum = 0;
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];
      if (flow.years !== 0) {
        sum -= (flow.years * flow.amount) / Math.pow(1 + r, flow.years + 1);
      }
    }
    return sum;
  }

  /**
   * Computes an educated initial guess based on total inflow vs outflow ratio.
   */
  private static computeInitialGuess(flows: { date: Date; amount: number }[], totalDays: number): number {
    let totalInvested = 0;
    let totalReturns = 0;
    for (const f of flows) {
      if (f.amount < 0) totalInvested += Math.abs(f.amount);
      else totalReturns += f.amount;
    }

    if (totalInvested === 0) return 0.1;
    const simpleReturn = (totalReturns - totalInvested) / totalInvested;
    const years = totalDays / 365.0;
    const annualizedGuess = years > 0 ? simpleReturn / years : 0.1;
    
    // Clamp to reasonable starting range [-0.5, 0.5]
    return Math.max(-0.5, Math.min(0.5, annualizedGuess));
  }

  /**
   * Newton-Raphson Solver
   */
  private static newtonRaphson(flows: { years: number; amount: number }[], guess: number): number | null {
    let r = guess;

    for (let i = 0; i < this.MAX_ITERATIONS; i++) {
      if (r <= -0.999) {
        return null; // Hit domain boundary, fall back to bisection
      }

      const fVal = this.npv(flows, r);
      if (Math.abs(fVal) < this.TOLERANCE) {
        return r;
      }

      const fPrime = this.npvDerivative(flows, r);
      if (Math.abs(fPrime) < 1e-12) {
        return null; // Flat slope, fall back
      }

      const nextR = r - fVal / fPrime;

      if (Math.abs(nextR - r) < this.TOLERANCE) {
        return nextR;
      }

      r = nextR;
    }

    return null;
  }

  /**
   * Robust Bisection Solver
   */
  private static bisection(flows: { years: number; amount: number }[]): number | null {
    let low = -0.999;
    let high = 10.0; // 1000% p.a.

    let fLow = this.npv(flows, low);
    let fHigh = this.npv(flows, high);

    // If high bound doesn't cross zero, try increasing it
    if (fLow * fHigh > 0) {
      high = 50.0;
      fHigh = this.npv(flows, high);
      if (fLow * fHigh > 0) {
        return null;
      }
    }

    for (let i = 0; i < this.MAX_ITERATIONS; i++) {
      const mid = (low + high) / 2.0;
      const fMid = this.npv(flows, mid);

      if (Math.abs(fMid) < this.TOLERANCE || (high - low) / 2.0 < this.TOLERANCE) {
        return mid;
      }

      if (fLow * fMid < 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }

    return (low + high) / 2.0;
  }
}

