import React, { useState } from 'react';
import { PieChart, TrendingUp, ShieldCheck, FileText, CheckCircle2, AlertCircle, Download, ArrowUpRight, DollarSign } from 'lucide-react';

export const PortfolioTaxView: React.FC = () => {
  const [selectedFy, setSelectedFy] = useState<'2024-2025' | '2025-2026'>('2024-2025');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'tax' | 'cas'>('tax');

  // Ramesh Sharma Seed Data (matching AdvisorKhoj prompt)
  const portfolioSummary = {
    investorName: 'Ramesh Sharma',
    pan: 'AAAPS1234K',
    ucc: 'UCC-RAMESH-001',
    totalInvested: 208926.24,
    currentValue: 384858.51,
    absoluteGain: 175932.27,
    absoluteReturnPct: 84.21,
    portfolioXirr: 9.46,
    assetAllocation: {
      equityPct: 90.98,
      debtPct: 4.40,
      liquidPct: 4.62
    }
  };

  const realizedTaxData = {
    fy: selectedFy,
    regime: 'BUDGET_2024',
    totalRealizedSales: 237906.50,
    totalCost: 125200.00,
    grossGain: 112706.50,
    equityStcg: {
      gain: 0,
      ratePct: 20.0,
      tax: 0
    },
    equityLtcg: {
      gain: 97851.50,
      exemptionApplied: 97851.50, // Out of ₹1,25,000
      annualLimit: 125000,
      netTaxable: 0,
      ratePct: 12.5,
      tax: 0
    },
    debtSec50aa: {
      gain: 1355.00,
      ratePct: 30.0,
      tax: 406.50,
      note: 'Deemed STCG under Section 50AA (purchased post 01-Apr-2023)'
    },
    cessAmount: 16.26,
    totalTaxLiability: 422.76,
    fifoLots: [
      {
        scheme: 'HDFC Top 100 Fund - Regular Plan - Growth',
        purchaseDate: '2017-06-15',
        saleDate: '2024-08-20',
        units: 200,
        purchaseNav: 450.00,
        fmv31Jan2018: 540.00,
        adjustedCostNav: 540.00,
        saleNav: 985.42,
        gainType: 'LTCG',
        taxRate: '12.5%',
        gain: 89084.00,
        isGrandfathered: true
      },
      {
        scheme: 'Parag Parikh Flexi Cap Fund - Regular Plan - Growth',
        purchaseDate: '2022-01-10',
        saleDate: '2024-09-05',
        units: 150,
        purchaseNav: 50.00,
        saleNav: 78.45,
        gainType: 'LTCG',
        taxRate: '12.5%',
        gain: 4267.50,
        isGrandfathered: false
      },
      {
        scheme: 'HDFC Short Term Debt Fund - Regular Plan - Growth',
        purchaseDate: '2023-05-10',
        saleDate: '2024-11-15',
        units: 400,
        purchaseNav: 25.50,
        saleNav: 28.20,
        gainType: 'STCG (Sec 50AA)',
        taxRate: '30.0% (Slab)',
        gain: 1355.00,
        isGrandfathered: false
      }
    ]
  };

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (AdvisorKhoj Feature Banner) */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#0a192f] via-[#0d213f] to-[#0a192f] border border-[#c5a059]/40 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-white">
                  {portfolioSummary.investorName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 font-semibold">
                  PAN: {portfolioSummary.pan}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  UCC: {portfolioSummary.ucc}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                AMFI Registered Distributor ARN-347849 · BSE StAR MF v2 Portfolio Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tax')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow ${
                activeTab === 'tax'
                  ? 'bg-[#c5a059] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Capital Gains Report
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-[#c5a059] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Holdings & XIRR
            </button>
          </div>
        </div>
      </div>

      {/* Capital Gains View */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          {/* Statutory Regime Info Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Union Budget 2024-25 Income Tax Regime Active</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Post-July 23, 2024: Equity STCG @ 20%, LTCG @ 12.5% with ₹1,25,000 annual exemption limit. Section 112A grandfathering applied.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Assessment FY:</span>
              <select
                value={selectedFy}
                onChange={(e) => setSelectedFy(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-[#c5a059]"
              >
                <option value="2024-2025">FY 2024-2025</option>
                <option value="2025-2026">FY 2025-2026</option>
              </select>
            </div>
          </div>

          {/* Tax Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0a192f] border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Realized Sales</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.totalRealizedSales)}
              </span>
              <span className="text-[11px] text-slate-500">Gross Gain: {formatInr(realizedTaxData.grossGain)}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block">Equity LTCG (Exempt)</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.equityLtcg.gain)}
              </span>
              <span className="text-[11px] text-emerald-300">
                100% covered by ₹1.25L Exemption
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-amber-500/30">
              <span className="text-xs text-amber-400 block">Section 50AA Debt STCG</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.debtSec50aa.gain)}
              </span>
              <span className="text-[11px] text-amber-300">Taxed at 30% slab rate</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 bg-[#c5a059]/5">
              <span className="text-xs text-[#c5a059] block">Total Tax Liability</span>
              <span className="text-xl font-mono font-bold text-[#c5a059] mt-1 block">
                {formatInr(realizedTaxData.totalTaxLiability)}
              </span>
              <span className="text-[11px] text-slate-400">Includes 4% Health & Ed Cess</span>
            </div>
          </div>

          {/* FIFO Matched Lots Table */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
              <span>FIFO Redemption Lot Matching Schedule (Budget 2024 Rules)</span>
              <span className="text-xs font-mono font-normal text-slate-400">3 Transactions Matched</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Scheme Name</th>
                    <th className="py-2.5 px-3">Purchase Date</th>
                    <th className="py-2.5 px-3">Redemption Date</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Purchase NAV</th>
                    <th className="py-2.5 px-3">Sale NAV</th>
                    <th className="py-2.5 px-3">Gain Type</th>
                    <th className="py-2.5 px-3 text-right">Taxable Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {realizedTaxData.fifoLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-white max-w-xs truncate">
                        {lot.scheme}
                        {lot.isGrandfathered && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            Sec 112A Grandfathered (FMV ₹{lot.fmv31Jan2018})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{lot.purchaseDate}</td>
                      <td className="py-3 px-3 text-slate-300">{lot.saleDate}</td>
                      <td className="py-3 px-3 text-white">{lot.units}</td>
                      <td className="py-3 px-3 text-slate-300">₹{lot.purchaseNav.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-300">₹{lot.saleNav.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          lot.gainType.includes('LTCG') 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        }`}>
                          {lot.gainType} ({lot.taxRate})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatInr(lot.gain)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio & XIRR View */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 space-y-5">
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
              Asset Allocation & XIRR
            </h3>

            <div>
              <span className="text-xs text-slate-400 block">Portfolio XIRR</span>
              <span className="text-4xl font-serif font-bold text-white mt-1 block">
                {portfolioSummary.portfolioXirr}% <span className="text-sm font-sans font-normal text-slate-400">p.a.</span>
              </span>
              <span className="text-xs text-emerald-400 block mt-1">
                Absolute Gain: +{formatInr(portfolioSummary.absoluteGain)} (+{portfolioSummary.absoluteReturnPct}%)
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Equity Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.equityPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#c5a059] h-full" style={{ width: `${portfolioSummary.assetAllocation.equityPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Debt Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.debtPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full" style={{ width: `${portfolioSummary.assetAllocation.debtPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Liquid / Cash Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.liquidPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${portfolioSummary.assetAllocation.liquidPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-serif font-bold text-white">Current Active Holdings</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">HDFC Top 100 Fund - Regular Growth</span>
                  <span className="text-slate-400">300.00 units · Latest NAV ₹985.42</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold block">{formatInr(300 * 985.42)}</span>
                  <span className="text-emerald-400">XIRR: 14.2%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Parag Parikh Flexi Cap Fund - Regular Growth</span>
                  <span className="text-slate-400">695.19 units · Latest NAV ₹78.45</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold block">{formatInr(695.19 * 78.45)}</span>
                  <span className="text-emerald-400">XIRR: 18.5%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">HDFC Short Term Debt Fund - Regular Growth</span>
                  <span className="text-slate-400">600.00 units · Latest NAV ₹28.20</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold block">{formatInr(600 * 28.20)}</span>
                  <span className="text-sky-400">XIRR: 7.2%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">ICICI Prudential Liquid Fund - Regular Growth</span>
                  <span className="text-slate-400">50.00 units · Latest NAV ₹355.50</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold block">{formatInr(50 * 355.50)}</span>
                  <span className="text-emerald-400">XIRR: 6.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

