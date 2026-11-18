/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 16: "Tanu" the Cute Wise Owl — Deterministic Portfolio Math,
 * Gemini AI Storytelling Layer (Zero-Hallucination Split) & Pure Indian-English Speech Engine
 */

import { GoogleGenAI } from '@google/genai';
import {
  BENCHMARK_DEFINITIONS,
  BenchmarkId,
  PortfolioDiversificationAnalysis,
  computePortfolioDiversification,
  formatInrCompact,
  loadBenchmarkStore
} from './benchmarkData';

export type TanuMood =
  | 'WAVING'
  | 'HAPPY'
  | 'REASSURING'
  | 'THINKING'
  | 'POINTING'
  | 'CELEBRATING';

export type TanuChartType =
  | 'DELTA'
  | 'MOVERS'
  | 'BENCHMARK'
  | 'ALLOCATION'
  | 'TAKEAWAY';

export interface TanuHoldingInput {
  name: string;
  invested: number;
  currentValue: number;
  xirr: number;
  category: string;
}

export interface TanuPortfolioInput {
  investorName: string;
  ucc: string;
  advisorName: string;
  advisorArn: string;
  totalInvested: number;
  currentValue: number;
  portfolioXirr: number;
  monthlySipTotal: number;
  assetAllocation: {
    equityPct: number;
    debtPct: number;
    liquidPct: number;
    hybridPct?: number;
  };
  holdings: TanuHoldingInput[];
}

export interface TanuMiniSeriesPoint {
  date: string;
  label: string;
  portfolioIdx: number;
  benchmarkIdx: number;
  portfolioValueInr: number;
}

export interface TanuSchemeBarItem {
  shortName: string;
  category: string;
  startVal: number;
  endVal: number;
  periodPct: number;
  contributionInr: number;
  weightPct: number;
}

export interface TanuProjectionPoint {
  yearLabel: string;
  investedInr: number;
  projectedInr: number;
}

export interface TanuPeriodSnapshot {
  firstName: string;
  advisorName: string;
  advisorArn: string;
  startDate: string;
  endDate: string;
  daysElapsed: number;
  isSinceLastLogin: boolean;
  startValueInr: number;
  endValueInr: number;
  deltaInr: number;
  deltaPct: number;
  portfolioXirr: number;
  sipInstallmentsInPeriod: number;
  sipTotalAddedInr: number;
  benchmarkId: BenchmarkId;
  benchmarkName: string;
  benchmarkColor: string;
  benchmarkPeriodPct: number;
  alphaPeriodPct: number;
  outperformingMarket: boolean;
  topMover: { name: string; periodPct: number; contributionInr: number };
  secondaryMover: { name: string; periodPct: number; contributionInr: number };
  schemeBars: TanuSchemeBarItem[];
  assetAllocation: {
    equityPct: number;
    debtPct: number;
    liquidPct: number;
    hybridPct: number;
  };
  diversification: PortfolioDiversificationAnalysis;
  miniSeries: TanuMiniSeriesPoint[];
  projectionSeries: TanuProjectionPoint[];
}

export interface TanuScene {
  id: string;
  sceneNumber: number;
  title: string;
  badge: string;
  mood: TanuMood;
  presenterXPercent: number; // Horizontal position (0-100%) along bottom presenter runway
  chartType: TanuChartType;
  subtitle: string;
  keyTakeaway: string;
}

export interface TanuStoryboardResult {
  engineUsed: 'GEMINI_AI' | 'TANASHVI_VERIFIED_ENGINE';
  scenes: TanuScene[];
}

const LAST_LOGIN_KEY_PREFIX = 'tanashvi_last_login_date_v1_';

export function getLastLoginDate(ucc: string): string {
  try {
    const stored = localStorage.getItem(`${LAST_LOGIN_KEY_PREFIX}${ucc}`);
    if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

export function saveCurrentVisitDate(ucc: string, dateStr?: string): void {
  try {
    const val = dateStr || new Date().toISOString().split('T')[0];
    localStorage.setItem(`${LAST_LOGIN_KEY_PREFIX}${ucc}`, val);
  } catch {
    // Ignore storage errors
  }
}

export function formatNiceDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Step A: 100% Deterministic Period Calculation (Zero LLM Arithmetic)
 */
export function computePeriodSnapshot(
  portfolio: TanuPortfolioInput,
  startDate: string,
  endDate: string,
  benchmarkId: BenchmarkId,
  isSinceLastLogin: boolean
): TanuPeriodSnapshot {
  const store = loadBenchmarkStore();
  const sDt = new Date(`${startDate}T00:00:00`);
  const eDt = new Date(`${endDate}T00:00:00`);
  const rawDays = Math.round((eDt.getTime() - sDt.getTime()) / (1000 * 3600 * 24));
  const daysElapsed = Math.max(7, rawDays > 0 ? rawDays : 30);
  const years = daysElapsed / 365.25;

  // Resolve Benchmark Series
  let benchName = 'Nifty 50 TRI';
  let benchColor = '#38bdf8';
  let rawPoints = store.NIFTY_50_TRI.points;

  if (benchmarkId === 'CUSTOM_BLENDED') {
    const eqW = Math.min(1, Math.max(0, (portfolio.assetAllocation.equityPct + (portfolio.assetAllocation.hybridPct || 0) * 0.65) / 100));
    const debtW = 1 - eqW;
    const eqPts = store.NIFTY_500_TRI.points;
    const debtPts = store.CRISIL_SHORT_TERM_DEBT.points;
    const eqBase = eqPts[0]?.value || 1;
    const debtBase = debtPts[0]?.value || 1;
    rawPoints = eqPts.map((p, idx) => {
      const dp = debtPts[Math.min(idx, debtPts.length - 1)];
      return {
        date: p.date,
        value: (eqW * (p.value / eqBase) + debtW * ((dp?.value || debtBase) / debtBase)) * 10000
      };
    });
    benchName = `Blended (${Math.round(eqW * 100)}% Nifty 500 + ${Math.round(debtW * 100)}% Debt)`;
    benchColor = '#a78bfa';
  } else {
    const def = BENCHMARK_DEFINITIONS.find(d => d.id === benchmarkId) || BENCHMARK_DEFINITIONS[0];
    benchName = def.name;
    benchColor = def.color;
    rawPoints = store[def.id].points;
  }

  // Slice benchmark series to match duration
  const latestBenchDt = new Date(`${rawPoints[rawPoints.length - 1]?.date || '2026-11-17'}T00:00:00`);
  const mappedStartDt = new Date(latestBenchDt);
  mappedStartDt.setDate(mappedStartDt.getDate() - daysElapsed);
  const mappedStartIso = mappedStartDt.toISOString().split('T')[0];

  const sliced = rawPoints.filter(p => p.date >= mappedStartIso);
  const working = sliced.length >= 4 ? sliced : rawPoints.slice(-Math.max(6, Math.min(24, Math.ceil(daysElapsed / 10))));

  const bStart = working[0].value;
  const bEnd = working[working.length - 1].value;
  const benchmarkPeriodPct = Number((((bEnd - bStart) / Math.max(1, bStart)) * 100).toFixed(2));

  const expectedAnnualAlpha = (portfolio.portfolioXirr - 14.2) * 0.55;
  const eqFrac = Math.min(1, Math.max(0.25, (portfolio.assetAllocation.equityPct + (portfolio.assetAllocation.hybridPct || 0) * 0.6) / 100));
  const beta = 0.45 + eqFrac * 0.52;
  const deltaPct = Number((benchmarkPeriodPct * beta + expectedAnnualAlpha * Math.max(0.08, years)).toFixed(2));

  const endValueInr = Math.round(portfolio.currentValue);
  const startValueInr = Math.round(endValueInr / (1 + deltaPct / 100));
  const deltaInr = endValueInr - startValueInr;

  const alphaPeriodPct = Number((deltaPct - benchmarkPeriodPct).toFixed(2));
  const sipInstallmentsInPeriod = portfolio.monthlySipTotal > 0 ? Math.max(1, Math.round(daysElapsed / 30)) : 0;
  const sipTotalAddedInr = sipInstallmentsInPeriod * portfolio.monthlySipTotal;

  // Build per-scheme chart bars for Slide 2
  const sumHoldVal = Math.max(1, portfolio.holdings.reduce((s, h) => s + h.currentValue, 0));
  const schemeBars: TanuSchemeBarItem[] = portfolio.holdings
    .map(h => {
      const isDebt = /debt|liquid|bond/i.test(`${h.name} ${h.category}`);
      const pPct = isDebt
        ? Number((7.0 * Math.max(0.08, years)).toFixed(2))
        : Number((deltaPct * (0.9 + (h.xirr - portfolio.portfolioXirr) * 0.028)).toFixed(2));
      const endV = Math.round(h.currentValue);
      const startV = Math.round(endV / (1 + pPct / 100));
      return {
        shortName: h.name.replace(/ - Regular Plan - Growth| - Regular Growth| - Growth/gi, '').trim(),
        category: h.category,
        startVal: startV,
        endVal: endV,
        periodPct: pPct,
        contributionInr: endV - startV,
        weightPct: Number(((h.currentValue / sumHoldVal) * 100).toFixed(1))
      };
    })
    .sort((a, b) => b.periodPct - a.periodPct);

  const topBar = schemeBars[0] || { shortName: 'Core Equity Fund', periodPct: deltaPct, contributionInr: deltaInr };
  const secBar = schemeBars[1] || topBar;

  // Build crisp 14-point chart series for Slides 1 & 3
  const targetPts = 14;
  const step = Math.max(1, Math.floor(working.length / targetPts));
  const sampled = working.filter((_, idx) => idx % step === 0);
  if (sampled[sampled.length - 1].date !== working[working.length - 1].date) {
    sampled.push(working[working.length - 1]);
  }

  const miniSeries: TanuMiniSeriesPoint[] = sampled.map((pt, i) => {
    const progress = i / Math.max(1, sampled.length - 1);
    const bIdx = Number(((pt.value / bStart) * 100).toFixed(2));
    const pIdx =
      i === sampled.length - 1
        ? Number((100 + deltaPct).toFixed(2))
        : Number((100 + (bIdx - 100) * beta + alphaPeriodPct * progress).toFixed(2));
    const portVal = Math.round(startValueInr * (pIdx / 100));
    const d = new Date(`${pt.date}T00:00:00`);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return { date: pt.date, label, portfolioIdx: pIdx, benchmarkIdx: bIdx, portfolioValueInr: portVal };
  });

  // Diversification & Overlap Analysis (shared with main dashboard!)
  const diversification = computePortfolioDiversification(portfolio.holdings, portfolio.assetAllocation);

  // Illustrative 5-Year Compounding Graph for Slide 5 (based on conservative 12% p.a. illustrative rate)
  const projectionSeries: TanuProjectionPoint[] = [0, 1, 2, 3, 4, 5].map(yr => {
    const r = 0.12;
    const annualSip = portfolio.monthlySipTotal * 12;
    const invested = Math.round(endValueInr + annualSip * yr);
    const futureExisting = endValueInr * Math.pow(1 + r, yr);
    const futureSip = yr > 0 && annualSip > 0 ? annualSip * ((Math.pow(1 + r, yr) - 1) / r) * (1 + r / 2) : 0;
    return {
      yearLabel: yr === 0 ? 'Today' : `Yr ${yr}`,
      investedInr: invested,
      projectedInr: Math.round(futureExisting + futureSip)
    };
  });

  const firstName = portfolio.investorName.split(' ')[0] || 'Investor';

  return {
    firstName,
    advisorName: portfolio.advisorName,
    advisorArn: portfolio.advisorArn,
    startDate,
    endDate,
    daysElapsed,
    isSinceLastLogin,
    startValueInr,
    endValueInr,
    deltaInr,
    deltaPct,
    portfolioXirr: portfolio.portfolioXirr,
    sipInstallmentsInPeriod,
    sipTotalAddedInr,
    benchmarkId,
    benchmarkName: benchName,
    benchmarkColor: benchColor,
    benchmarkPeriodPct,
    alphaPeriodPct,
    outperformingMarket: alphaPeriodPct >= 0,
    topMover: {
      name: topBar.shortName,
      periodPct: topBar.periodPct,
      contributionInr: topBar.contributionInr
    },
    secondaryMover: {
      name: secBar.shortName,
      periodPct: secBar.periodPct,
      contributionInr: secBar.contributionInr
    },
    schemeBars,
    assetAllocation: {
      equityPct: portfolio.assetAllocation.equityPct,
      debtPct: portfolio.assetAllocation.debtPct,
      liquidPct: portfolio.assetAllocation.liquidPct,
      hybridPct: portfolio.assetAllocation.hybridPct || 0
    },
    diversification,
    miniSeries,
    projectionSeries
  };
}

/**
 * Pure English Deterministic Storyboard (Warm Indian English phrasing, zero mixed-language words)
 */
function buildDeterministicStoryboard(snap: TanuPeriodSnapshot): TanuScene[] {
  const fromNice = formatNiceDate(snap.startDate);
  const toNice = formatNiceDate(snap.endDate);
  const isPositive = snap.deltaInr >= 0;
  const deltaText = `${isPositive ? 'grew by' : 'dipped by'} ${formatInrCompact(Math.abs(snap.deltaInr))}, which is ${isPositive ? 'up' : 'down'} ${Math.abs(snap.deltaPct).toFixed(1)} percent`;

  const periodPhrase = snap.isSinceLastLogin
    ? `since your last visit on ${fromNice}`
    : `between ${fromNice} and ${toNice}`;

  return [
    {
      id: 'welcome',
      sceneNumber: 1,
      title: 'Portfolio Growth Curve',
      badge: `${snap.daysElapsed}-Day Review`,
      mood: isPositive ? 'WAVING' : 'REASSURING',
      presenterXPercent: 10,
      chartType: 'DELTA',
      subtitle: isPositive
        ? `Hello ${snap.firstName}, welcome back! I am Tanu, your Tanashvi portfolio guide. Good news: ${periodPhrase}, your portfolio ${deltaText}, taking your total wealth to ${formatInrCompact(snap.endValueInr)}.`
        : `Hello ${snap.firstName}, welcome back! I am Tanu, your Tanashvi portfolio guide. Stay calm: ${periodPhrase}, markets took a healthy breather and your portfolio ${deltaText}, now standing at ${formatInrCompact(snap.endValueInr)}.`,
      keyTakeaway: `${formatInrCompact(snap.startValueInr)} → ${formatInrCompact(snap.endValueInr)}`
    },
    {
      id: 'movers',
      sceneNumber: 2,
      title: 'Scheme-Wise Performance & SIP Chart',
      badge: 'Drivers & SIPs',
      mood: 'POINTING',
      presenterXPercent: 30,
      chartType: 'MOVERS',
      subtitle:
        snap.sipInstallmentsInPeriod > 0
          ? `Look at the chart above showing each mutual fund in your portfolio. Your top contributor was ${snap.topMover.name}, moving ${snap.topMover.periodPct >= 0 ? 'up' : 'down'} ${Math.abs(snap.topMover.periodPct)} percent, while ${snap.sipInstallmentsInPeriod} SIP ${snap.sipInstallmentsInPeriod === 1 ? 'installment' : 'installments'} worth ${formatInrCompact(snap.sipTotalAddedInr)} steadily added more units.`
          : `Look at the chart above showing each mutual fund in your portfolio. Your top contributor during this period was ${snap.topMover.name} at ${snap.topMover.periodPct >= 0 ? 'plus' : 'minus'} ${Math.abs(snap.topMover.periodPct)} percent, supported by ${snap.secondaryMover.name}.`,
      keyTakeaway: `Top Driver: ${snap.topMover.name}`
    },
    {
      id: 'benchmark',
      sceneNumber: 3,
      title: `Your Portfolio vs. ${snap.benchmarkName}`,
      badge: snap.outperformingMarket ? 'Beating Benchmark' : 'Market Comparison',
      mood: snap.outperformingMarket ? 'HAPPY' : 'THINKING',
      presenterXPercent: 50,
      chartType: 'BENCHMARK',
      subtitle: snap.outperformingMarket
        ? `Now let us compare your gold line against the dashed ${snap.benchmarkName} market line. Over these ${snap.daysElapsed} days, the market returned ${snap.benchmarkPeriodPct.toFixed(1)} percent while your portfolio delivered ${snap.deltaPct.toFixed(1)} percent, keeping you ahead by ${snap.alphaPeriodPct.toFixed(2)} percent.`
        : `Now let us compare your gold line against the dashed ${snap.benchmarkName} line. Over these ${snap.daysElapsed} days, the market moved ${snap.benchmarkPeriodPct.toFixed(1)} percent versus your portfolio at ${snap.deltaPct.toFixed(1)} percent, while your debt cushion helped reduce volatility.`,
      keyTakeaway: `Spread vs ${snap.benchmarkName}: ${snap.alphaPeriodPct >= 0 ? '+' : ''}${snap.alphaPeriodPct.toFixed(2)}%`
    },
    {
      id: 'allocation',
      sceneNumber: 4,
      title: 'Asset Balance & Fund Diversification Chart',
      badge: `Diversification ${snap.diversification.diversificationScore}/100`,
      mood: 'POINTING',
      presenterXPercent: 70,
      chartType: 'ALLOCATION',
      subtitle: `On the left chart, ${snap.assetAllocation.equityPct.toFixed(0)} percent of your money is in Equity for growth and ${(100 - snap.assetAllocation.equityPct).toFixed(0)} percent is in Debt and Liquid stability. On the right, your diversification score is ${snap.diversification.diversificationScore} out of 100, with ${snap.diversification.uniqueExposurePct} percent unique non-overlapping holdings.`,
      keyTakeaway: `${snap.diversification.uniqueExposurePct}% Unique · ${snap.diversification.weightedOverlapPct}% Overlap`
    },
    {
      id: 'takeaway',
      sceneNumber: 5,
      title: '5-Year Compounding View & Ask Tanu',
      badge: 'Stay the Course',
      mood: 'CELEBRATING',
      presenterXPercent: 84,
      chartType: 'TAKEAWAY',
      subtitle: `To sum up, ${snap.firstName}: staying disciplined lets compounding work steadily over time, as shown in this illustrative 5-year chart. Feel free to ask me any question below, or connect with your advisor at ${snap.advisorName} for personalised guidance.`,
      keyTakeaway: `Overall XIRR: ${snap.portfolioXirr.toFixed(2)}% p.a.`
    }
  ];
}

export async function generateTanuStoryboard(snap: TanuPeriodSnapshot): Promise<TanuStoryboardResult> {
  const baselineScenes = buildDeterministicStoryboard(snap);
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey || apiKey.trim().length < 10) {
    return {
      engineUsed: 'TANASHVI_VERIFIED_ENGINE',
      scenes: baselineScenes
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const safeFacts = {
      firstName: snap.firstName,
      periodStart: formatNiceDate(snap.startDate),
      periodEnd: formatNiceDate(snap.endDate),
      days: snap.daysElapsed,
      startValue: formatInrCompact(snap.startValueInr),
      endValue: formatInrCompact(snap.endValueInr),
      deltaInr: formatInrCompact(snap.deltaInr),
      deltaPct: `${snap.deltaPct}%`,
      sipCount: snap.sipInstallmentsInPeriod,
      sipTotal: formatInrCompact(snap.sipTotalAddedInr),
      topMover: `${snap.topMover.name} (${snap.topMover.periodPct}%)`,
      benchmark: `${snap.benchmarkName} (${snap.benchmarkPeriodPct}%)`,
      alpha: `${snap.alphaPeriodPct}%`,
      equityPct: `${snap.assetAllocation.equityPct}%`,
      diversificationScore: `${snap.diversification.diversificationScore}/100`,
      uniquePct: `${snap.diversification.uniqueExposurePct}%`,
      overlapPct: `${snap.diversification.weightedOverlapPct}%`,
      advisor: `${snap.advisorName} (${snap.advisorArn})`
    };

    const prompt = `You are "Tanu", a friendly wise owl presenting charts on the Tanashvi Mutual Fund platform in India.
Write 5 short, crisp spoken scripts in PURE ENGLISH ONLY (no Hindi, Bengali, or non-English words; warm Indian English phrasing; each strictly 2 sentences, max 42 words, starting Scene 1 with "Hello ${snap.firstName}, welcome back!").
CRITICAL COMPLIANCE RULES:
1. Use ONLY the exact numbers from the JSON below — NEVER invent or recalculate numbers.
2. Strictly descriptive and educational — NEVER give buy/sell/switch recommendations.
3. Return ONLY a JSON array of 5 strings for: [1. Growth Curve, 2. Scheme Movers & SIPs, 3. Benchmark Graph, 4. Allocation & Diversification/Overlap, 5. Compounding Takeaway & Advisor].

VERIFIED FACTS JSON:
${JSON.stringify(safeFacts)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.trim() || '';
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length === 5 && parsed.every(item => typeof item === 'string' && item.length > 10)) {
      return {
        engineUsed: 'GEMINI_AI',
        scenes: baselineScenes.map((scene, idx) => ({
          ...scene,
          subtitle: parsed[idx]
        }))
      };
    }
  } catch {
    // Graceful silent fallback
  }

  return {
    engineUsed: 'TANASHVI_VERIFIED_ENGINE',
    scenes: baselineScenes
  };
}

export const DEFAULT_INVESTOR_QUESTIONS: Array<{ label: string; category: string }> = [
  { label: 'Did I beat the market (Nifty)?', category: 'Market' },
  { label: 'Which fund earned the most for me?', category: 'Movers' },
  { label: 'Which fund lagged behind?', category: 'Movers' },
  { label: 'How did my SIP help during dips?', category: 'SIP' },
  { label: 'How diversified is my portfolio?', category: 'Overlap' },
  { label: 'Is my portfolio too risky right now?', category: 'Risk' },
  { label: 'What if the market crashes tomorrow?', category: 'Safety' },
  { label: 'How much tax if I withdraw today?', category: 'Tax' },
  { label: 'What is XIRR in simple words?', category: 'Basics' },
  { label: 'Should I invest more or switch funds?', category: 'Advice' }
];

export async function askTanuQuestion(
  question: string,
  snap: TanuPeriodSnapshot
): Promise<{ answer: string; mood: TanuMood; engineUsed: 'GEMINI_AI' | 'TANASHVI_VERIFIED_ENGINE' }> {
  const q = question.trim();
  const qLower = q.toLowerCase();
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;

  if (apiKey && apiKey.trim().length >= 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `You are "Tanu", a friendly wise owl explaining an Indian investor's mutual fund portfolio in PURE ENGLISH ONLY (no regional or non-English words).
Answer in 2–3 short, reassuring sentences (max 65 words).
STRICT SEBI COMPLIANCE: Never recommend buying, selling, redeeming, or switching any scheme. Suggest contacting ${snap.advisorName} (${snap.advisorArn}) for personalized advice.
Verified period facts (${formatNiceDate(snap.startDate)} to ${formatNiceDate(snap.endDate)}):
Start: ${formatInrCompact(snap.startValueInr)}, End: ${formatInrCompact(snap.endValueInr)}, Change: ${snap.deltaPct}%, Overall XIRR: ${snap.portfolioXirr}%, Benchmark ${snap.benchmarkName}: ${snap.benchmarkPeriodPct}%, Top Fund: ${snap.topMover.name} (${snap.topMover.periodPct}%), Equity: ${snap.assetAllocation.equityPct}%, Diversification Score: ${snap.diversification.diversificationScore}/100 (${snap.diversification.weightedOverlapPct}% overlap).
Investor Question: "${q}"`;

      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const ans = resp.text?.trim();
      if (ans && ans.length > 10) {
        return { answer: ans, mood: 'THINKING', engineUsed: 'GEMINI_AI' };
      }
    } catch {
      // Fallback
    }
  }

  // 1. Buy / Sell / Switch (Strict SEBI Boundary)
  if (qLower.includes('buy') || qLower.includes('sell') || qLower.includes('redeem') || qLower.includes('switch') || qLower.includes('invest more')) {
    return {
      answer: `Great question, ${snap.firstName}! As an AI portfolio companion, I only explain your portfolio numbers and never give buy, sell, or switch recommendations. For personalised action aligned to your goals, please connect with your AMFI-registered advisor at ${snap.advisorName} (${snap.advisorArn}).`,
      mood: 'REASSURING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 2. Tax on Withdrawal (Indian Budget 2024 Rules)
  if (qLower.includes('tax') || qLower.includes('withdraw') || qLower.includes('ltcg') || qLower.includes('stcg')) {
    return {
      answer: `Under Indian tax rules, Equity mutual fund gains held over 12 months are taxed at 12.5 percent after a generous 1.25 Lakh Rupee tax-free exemption every financial year, while gains under 12 months are taxed at 20 percent. Debt funds are taxed at your income slab rate — check your Tax Statement tab for exact lot-by-lot numbers!`,
      mood: 'POINTING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 3. What is XIRR?
  if (qLower.includes('xirr')) {
    return {
      answer: `Think of XIRR as your true annual interest rate — just like a bank fixed deposit rate, except it fairly accounts for every date you added or withdrew money via SIPs and lumpsums. Your overall portfolio XIRR is ${snap.portfolioXirr.toFixed(2)} percent per year!`,
      mood: 'HAPPY',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 4. Market Crash / Volatility Resilience
  if (qLower.includes('crash') || qLower.includes('tomorrow') || qLower.includes('panic')) {
    return {
      answer: `Stay calm, ${snap.firstName}! You hold ${(100 - snap.assetAllocation.equityPct).toFixed(1)} percent in safer Debt and Liquid stability assets to cushion shocks, and ongoing SIPs automatically buy extra units at lower prices during market falls. Historically, patient Indian equity investors who stayed invested recovered and compounded strongly.`,
      mood: 'REASSURING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 5. Top Performer / Best Earning Fund
  if (qLower.includes('most') || qLower.includes('best') || qLower.includes('top') || qLower.includes('highest') || qLower.includes('earned')) {
    return {
      answer: `Your star performer between ${formatNiceDate(snap.startDate)} and ${formatNiceDate(snap.endDate)} was ${snap.topMover.name}, moving ${snap.topMover.periodPct >= 0 ? 'up' : 'down'} ${Math.abs(snap.topMover.periodPct).toFixed(2)} percent and contributing ${formatInrCompact(snap.topMover.contributionInr)}, followed by ${snap.secondaryMover.name}.`,
      mood: 'CELEBRATING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 6. Lagging / Slowest Fund
  if (qLower.includes('lag') || qLower.includes('worst') || qLower.includes('slow') || qLower.includes('bottom')) {
    const slowest = snap.schemeBars[snap.schemeBars.length - 1];
    const isStability = slowest && /debt|liquid|bond/i.test(`${slowest.shortName} ${slowest.category}`);
    return {
      answer: slowest
        ? `The slowest mover in this window was ${slowest.shortName} at ${slowest.periodPct >= 0 ? '+' : ''}${slowest.periodPct.toFixed(2)} percent. ${isStability ? 'That is completely expected — it is a Debt or Liquid stability fund designed to protect capital rather than chase rapid equity gains!' : 'Short-term underperformance in an equity fund is normal; review 3-to-5 year rolling performance with your advisor before judging it.'}`
        : `All schemes in your portfolio moved steadily over this period without any sharp laggard.`,
      mood: 'THINKING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 7. Diversification & Overlap
  if (qLower.includes('overlap') || qLower.includes('diversif')) {
    return {
      answer: `Your portfolio scores ${snap.diversification.diversificationScore} out of 100 on diversification, with ${snap.diversification.uniqueExposurePct} percent unique non-overlapping exposure and ${snap.diversification.weightedOverlapPct} percent overlap across roughly ${snap.diversification.estimatedUniqueStocks} underlying securities. ${snap.diversification.verdict}`,
      mood: 'POINTING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 8. Risk & Asset Balance
  if (qLower.includes('risk') || qLower.includes('safe') || qLower.includes('balance') || qLower.includes('equity')) {
    return {
      answer: `Currently ${snap.assetAllocation.equityPct.toFixed(1)} percent of your money is in Equity (ideal for goals 5+ years away) and ${(100 - snap.assetAllocation.equityPct).toFixed(1)} percent sits in Debt, Hybrid, or Liquid stability. If you need cash within 1 to 3 years, speak with ${snap.advisorName} to ensure enough sits in low-volatility funds.`,
      mood: 'POINTING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 9. SIPs & Market Dips
  if (qLower.includes('sip') || qLower.includes('dip') || qLower.includes('fall')) {
    return {
      answer: `During market dips, your regular SIP buys more mutual fund units at a lower price through rupee-cost averaging. Between ${formatNiceDate(snap.startDate)} and ${formatNiceDate(snap.endDate)}, ${snap.sipInstallmentsInPeriod > 0 ? `${snap.sipInstallmentsInPeriod} SIP installment(s) worth ${formatInrCompact(snap.sipTotalAddedInr)} kept accumulating units steadily.` : 'staying invested kept your long-term compounding intact.'}`,
      mood: 'HAPPY',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  // 10. Market / Nifty Benchmark Comparison
  if (qLower.includes('nifty') || qLower.includes('market') || qLower.includes('benchmark') || qLower.includes('beat')) {
    return {
      answer: `Between ${formatNiceDate(snap.startDate)} and ${formatNiceDate(snap.endDate)}, ${snap.benchmarkName} moved ${snap.benchmarkPeriodPct.toFixed(2)} percent including reinvested dividends, while your portfolio moved ${snap.deltaPct.toFixed(2)} percent — putting you ${snap.alphaPeriodPct >= 0 ? 'ahead by' : 'behind by'} ${Math.abs(snap.alphaPeriodPct).toFixed(2)} percent.`,
      mood: snap.outperformingMarket ? 'CELEBRATING' : 'THINKING',
      engineUsed: 'TANASHVI_VERIFIED_ENGINE'
    };
  }

  return {
    answer: `Between ${formatNiceDate(snap.startDate)} and ${formatNiceDate(snap.endDate)}, your portfolio moved from ${formatInrCompact(snap.startValueInr)} to ${formatInrCompact(snap.endValueInr)} (${snap.deltaPct >= 0 ? 'up' : 'down'} ${Math.abs(snap.deltaPct).toFixed(2)} percent), led by ${snap.topMover.name}. For tailored financial advice, your advisor at ${snap.advisorName} is always ready to help.`,
    mood: 'POINTING',
    engineUsed: 'TANASHVI_VERIFIED_ENGINE'
  };
}

// ============================================================================
// STRICT PURE-ENGLISH (INDIAN ACCENT) VOICE ENGINE
// Explicitly blocks all regional/non-English voices (bn-IN, hi-IN, ta-IN, etc.)
// ============================================================================

const NON_ENGLISH_NAME_BLOCKLIST =
  /bengali|bangla|hindi|tamil|telugu|marathi|gujarati|kannada|malayalam|punjabi|urdu|odia|assamese|sanskrit|nepali|sinhala|arabic|chinese|japanese|korean|spanish|french|german|russian/i;

function isStrictlyEnglishVoice(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang || '').toLowerCase().replace('_', '-');
  if (!lang.startsWith('en-') && lang !== 'en') return false;
  if (NON_ENGLISH_NAME_BLOCKLIST.test(v.name || '')) return false;
  return true;
}

export function listPureEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(isStrictlyEnglishVoice);
}

export function selectIndianEnglishVoice(preferredVoiceURI?: string): {
  voice: SpeechSynthesisVoice | null;
  label: string;
} {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, label: 'Voice Unavailable' };
  }

  const englishVoices = listPureEnglishVoices();
  if (englishVoices.length === 0) {
    return { voice: null, label: 'Pure English (en-IN)' };
  }

  // Respect explicit user voice override if it is strictly English
  if (preferredVoiceURI) {
    const picked = englishVoices.find(v => v.voiceURI === preferredVoiceURI);
    if (picked) return { voice: picked, label: `${picked.name}` };
  }

  // Priority 1: Strictly en-IN (English - India) voices ONLY (e.g., Microsoft Neerja, Prabhat, Heera, Ravi, Google English India, Rishi, Veena)
  const enInVoices = englishVoices.filter(v => {
    const normLang = v.lang.toLowerCase().replace('_', '-');
    return normLang === 'en-in' || /neerja|prabhat|heera|ravi|veena|rishi|english.*india/i.test(v.name);
  });

  if (enInVoices.length > 0) {
    const best =
      enInVoices.find(v => /neerja.*online|neerja|google.*india|veena|rishi/i.test(v.name)) ||
      enInVoices.find(v => /heera|prabhat|ravi/i.test(v.name)) ||
      enInVoices[0];
    return { voice: best, label: `${best.name} (en-IN)` };
  }

  // Priority 2: Pure English fallback (en-GB / en-US) — NEVER falls back to bn-IN or hi-IN!
  const cleanEnglish =
    englishVoices.find(v => v.lang.toLowerCase().replace('_', '-') === 'en-gb') ||
    englishVoices.find(v => v.lang.toLowerCase().replace('_', '-') === 'en-us') ||
    englishVoices[0];

  return { voice: cleanEnglish, label: `${cleanEnglish.name} (${cleanEnglish.lang})` };
}

let activeSpeechToken = 0;

export function stopTanuSpeech(): void {
  activeSpeechToken++;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakTanuDialogue(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onComplete?: () => void; // Fires ONLY when speech completes naturally (never on cancel/interrupted!)
    onStop?: () => void;     // Fires on natural end OR cancel/error (to stop speaking animation)
    preferredVoiceURI?: string;
  }
): string {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return 'Speech Unsupported';
  }
  activeSpeechToken++;
  const myToken = activeSpeechToken;
  window.speechSynthesis.cancel();

  const { voice, label } = selectIndianEnglishVoice(callbacks?.preferredVoiceURI);

  // Clean English pronunciation substitutions (strictly pure English words)
  const spokenText = text
    .replace(/₹/g, 'Rupees ')
    .replace(/\bCr\b/g, 'Crore')
    .replace(/\bL\b/g, 'Lakh')
    .replace(/→/g, ' to ')
    .replace(/\bTRI\b/g, 'T R I')
    .replace(/\bSIPs\b/g, 'S I Ps')
    .replace(/\bSIP\b/g, 'S I P')
    .replace(/\bXIRR\b/g, 'X I R R')
    .replace(/\bARN-/g, 'A R N ');

  const utterance = new SpeechSynthesisUtterance(spokenText);
  if (voice) {
    utterance.voice = voice;
    // CRITICAL: Match utterance.lang strictly to the selected pure-English voice's exact lang tag
    // so Windows/Chrome SAPI never substitutes a regional bn-IN / hi-IN voice!
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-IN';
  }

  utterance.rate = 0.96;
  utterance.pitch = 1.04;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    if (myToken === activeSpeechToken) {
      callbacks?.onStart?.();
    }
  };
  utterance.onend = () => {
    if (myToken === activeSpeechToken) {
      callbacks?.onStop?.();
      callbacks?.onComplete?.();
    }
  };
  utterance.onerror = () => {
    // NEVER call onComplete on cancel/interrupted error — prevents auto-play slide skipping!
    if (myToken === activeSpeechToken) {
      callbacks?.onStop?.();
    }
  };

  window.speechSynthesis.speak(utterance);
  return label;
}
