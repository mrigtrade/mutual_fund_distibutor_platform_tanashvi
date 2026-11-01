/**
 * BSE StAR MF v2.0 - Statutory Cut-Off & NAV Reconciliation Service
 * 
 * Enforces SEBI & AMFI Mutual Fund Cut-Off Rules in Indian Standard Time (IST / UTC+05:30):
 * 1. Liquid & Overnight Funds:
 *    - Cut-off: 13:30:00 IST (1:30 PM)
 *    - Same-day NAV applicable if transaction submitted and funds realized before 13:30 IST.
 * 2. Equity, Debt & Hybrid Funds:
 *    - Cut-off: 15:00:00 IST (3:00 PM)
 *    - Same-day closing NAV applicable if transaction submitted and funds realized before 15:00 IST.
 * 3. After-Hours Orders & Holidays:
 *    - Orders submitted after cut-off roll over to Next Business Day (T+1).
 *    - Weekend (Saturday/Sunday) orders roll over to next Monday.
 */

export interface CutoffCheckResult {
  isSameDayNav: boolean;
  orderTimestampIst: string;
  effectiveCutoffTime: string;
  applicableNavDate: string; // YYYY-MM-DD
  reason: string;
}

export class CutoffReconciliationService {
  public static readonly LIQUID_CUTOFF_TIME = '13:30:00';
  public static readonly STANDARD_CUTOFF_TIME = '15:00:00';
  public static readonly IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

  /**
   * Evaluates NAV applicability based on scheme category, order timestamp, and payment realization timestamp
   * strictly evaluated against Indian Standard Time (IST).
   * 
   * @param schemeCategory Category (e.g., 'Liquid Fund', 'Overnight Fund', 'Equity', 'Debt')
   * @param orderTime ISO timestamp of order creation
   * @param paymentConfirmationTime Optional ISO timestamp of payment confirmation
   * @param customCutoffTime Optional scheme-specific cutoff override from Scheme Master
   */
  public static evaluateNavCutoff(
    schemeCategory: string,
    orderTime: string | Date = new Date(),
    paymentConfirmationTime?: string | Date,
    customCutoffTime?: string
  ): CutoffCheckResult {
    const oDate = new Date(orderTime);
    const effectiveUtc = paymentConfirmationTime
      ? new Date(Math.max(oDate.getTime(), new Date(paymentConfirmationTime).getTime()))
      : oDate;

    // Convert UTC to IST
    const istTime = new Date(effectiveUtc.getTime() + this.IST_OFFSET_MS);

    const isLiquidOrOvernight =
      schemeCategory.toLowerCase().includes('liquid') ||
      schemeCategory.toLowerCase().includes('overnight');

    const cutoffStr = customCutoffTime || (isLiquidOrOvernight ? this.LIQUID_CUTOFF_TIME : this.STANDARD_CUTOFF_TIME);
    const [cHours, cMinutes, cSeconds] = cutoffStr.split(':').map(Number);
    const cutoffSecondsInDay = cHours * 3600 + cMinutes * 60 + (cSeconds || 0);

    // Current seconds in day (IST)
    const currentSecondsInDay = istTime.getUTCHours() * 3600 + istTime.getUTCMinutes() * 60 + istTime.getUTCSeconds();
    const isBeforeCutoff = currentSecondsInDay <= cutoffSecondsInDay;

    const dayOfWeek = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let isSameDayNav = false;
    let applicableDate = new Date(istTime);
    let reason = '';

    if (isWeekend) {
      isSameDayNav = false;
      const daysToAdd = dayOfWeek === 6 ? 2 : 1; // Sat -> Mon (2 days), Sun -> Mon (1 day)
      applicableDate.setUTCDate(applicableDate.getUTCDate() + daysToAdd);
      reason = `Order received on Weekend (${dayOfWeek === 6 ? 'Saturday' : 'Sunday'} IST). Rolled over to next business day.`;
    } else if (isBeforeCutoff) {
      isSameDayNav = true;
      reason = `Order and payment realized before ${cutoffStr} IST cut-off. Same-day NAV applicable.`;
    } else {
      isSameDayNav = false;
      // Rolled over to Next Day
      applicableDate.setUTCDate(applicableDate.getUTCDate() + 1);
      // If next day is weekend, roll over to Monday
      if (applicableDate.getUTCDay() === 6) applicableDate.setUTCDate(applicableDate.getUTCDate() + 2);
      if (applicableDate.getUTCDay() === 0) applicableDate.setUTCDate(applicableDate.getUTCDate() + 1);
      reason = `Order/Payment realized after ${cutoffStr} IST cut-off. Rolled over to next business day.`;
    }

    const year = applicableDate.getUTCFullYear();
    const month = String(applicableDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(applicableDate.getUTCDate()).padStart(2, '0');
    const applicableNavDateStr = `${year}-${month}-${day}`;

    return {
      isSameDayNav,
      orderTimestampIst: istTime.toISOString().replace('Z', '+05:30'),
      effectiveCutoffTime: cutoffStr,
      applicableNavDate: applicableNavDateStr,
      reason
    };
  }

  /**
   * Computes allotted units from total transaction amount and confirmed allotted NAV.
   * Rounds to 4 decimal places as per AMFI/RTA standard.
   */
  public static calculateAllottedUnits(amount: number, nav: number, precision = 4): number {
    if (!nav || nav <= 0) {
      throw new Error('NAV value must be greater than zero to calculate units.');
    }
    const units = amount / nav;
    return parseFloat(units.toFixed(precision));
  }
}
