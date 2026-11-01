/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849, BSE Member 714114)
 * Role 3: End Investor / Client Portal View
 */

import React, { useState } from 'react';
import { 
  User, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  ShoppingCart, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  Building2,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { exportToCsv, exportToExcelXls, exportReportToPdf } from '../utils/exportUtils';

export const InvestorPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'sips' | 'proposals' | 'tax'>('holdings');
  const [cartExecuted, setCartExecuted] = useState(false);

  const investor = {
    name: 'Ramesh Sharma',
    pan: 'AAAPS1234K',
    ucc: 'UCC-RAMESH-001',
    distributorName: 'Tanashvi Wealth Advisory',
    arn: 'ARN-347849',
    euin: 'E123456',
    totalInvested: 208926.24,
    currentValue: 384858.51,
    absoluteGain: 175932.27,
    absoluteReturnPct: 84.21,
    portfolioXirr: 15.46,
    activeSipTotal: 15000,
    allocation: {
      equityPct: 90.98,
      debtPct: 4.40,
      liquidPct: 4.62
    },
    holdings: [
      { name: 'HDFC Top 100 Fund - Regular Growth', category: 'Equity: Large Cap', units: 300.0, buyNav: 450.00, nav: 985.42, invested: 135000, curVal: 295626, xirr: 14.2 },
      { name: 'Parag Parikh Flexi Cap Fund - Regular Growth', category: 'Equity: Flexi Cap', units: 695.19, buyNav: 50.00, nav: 78.45, invested: 34759, curVal: 54537, xirr: 18.5 },
      { name: 'HDFC Short Term Debt Fund - Regular Growth', category: 'Debt: Short Term', units: 600.0, buyNav: 24.50, nav: 28.20, invested: 14700, curVal: 16920, xirr: 7.2 },
      { name: 'ICICI Prudential Liquid Fund - Regular Growth', category: 'Debt: Liquid', units: 50.0, buyNav: 320.00, nav: 355.50, invested: 16000, curVal: 17775, xirr: 6.8 }
    ],
    sips: [
      { scheme: 'Parag Parikh Flexi Cap Fund', amount: 10000, debitDay: '10th of every month', nextDebit: '10-Nov-2026', mandate: 'MDT-88201', bank: 'HDFC Bank (...0481)', status: 'ACTIVE' },
      { scheme: 'HDFC Top 100 Fund', amount: 5000, debitDay: '15th of every month', nextDebit: '15-Nov-2026', mandate: 'MDT-88201', bank: 'HDFC Bank (...0481)', status: 'ACTIVE' }
    ],
    proposal: {
      id: 'PROP-2026-8812',
      title: '2026 Core Wealth Creation Basket',
      advisorNotes: 'Recommended top-up for your retirement goal. Includes 1 lumpsum allocation and 1 new monthly SIP.',
      items: [
        { type: 'LUMPSUM', scheme: 'HDFC Top 100 Fund - Growth', amount: 25000 },
        { type: 'SIP', scheme: 'Parag Parikh Flexi Cap Fund - Growth', amount: 10000, sipDay: 10 }
      ],
      totalLumpsum: 25000,
      totalSip: 10000
    }
  };

  // --- Export Handlers ---
  const handleExportHoldingsPdf = () => {
    const headers = ['Scheme Name', 'Category', 'Units', 'Buy NAV', 'Current NAV', 'Invested', 'Current Value', 'XIRR'];
    const rows = investor.holdings.map(h => [
      h.name,
      h.category,
      h.units.toFixed(2),
      `₹${h.buyNav.toFixed(2)}`,
      `₹${h.nav.toFixed(2)}`,
      `₹${h.invested.toLocaleString()}`,
      `₹${h.curVal.toLocaleString()}`,
      `${h.xirr}%`
    ]);

    exportReportToPdf({
      title: 'Mutual Fund Portfolio Statement',
      subtitle: `Serviced by: ${investor.distributorName} (${investor.arn})`,
      clientName: investor.name,
      pan: investor.pan,
      ucc: investor.ucc,
      summaryCards: [
        { label: 'Current Value', value: `₹${Math.round(investor.currentValue).toLocaleString()}` },
        { label: 'Invested Capital', value: `₹${Math.round(investor.totalInvested).toLocaleString()}` },
        { label: 'Net Profit', value: `+₹${Math.round(investor.absoluteGain).toLocaleString()}` },
        { label: 'Portfolio XIRR', value: `${investor.portfolioXirr}% p.a.` }
      ],
      headers,
      rows,
      filename: `portfolio_statement_${investor.name.toLowerCase().replace(/ /g, '_')}.pdf`,
      footerNotes: [
        'Valuations based on latest available NAVs from BSE StAR MF.',
        'XIRR calculated based on cash-flow purchase dates and current valuation.'
      ]
    });
  };

  const handleExportHoldingsXls = () => {
    const headers = ['Scheme Name', 'Category', 'Units', 'Buy NAV', 'Current NAV', 'Invested Amount', 'Current Valuation', 'XIRR %'];
    const rows = investor.holdings.map(h => [
      h.name,
      h.category,
      h.units,
      h.buyNav,
      h.nav,
      h.invested,
      h.curVal,
      h.xirr
    ]);
    exportToExcelXls(
      `portfolio_${investor.name.toLowerCase().replace(/ /g, '_')}.xls`,
      'Holdings',
      headers,
      rows,
      {
        title: 'Investor Portfolio Valuation Report',
        clientName: investor.name,
        pan: investor.pan,
        subtitle: `Total Portfolio: ₹${Math.round(investor.currentValue).toLocaleString()}`
      }
    );
  };

  const handleExportTaxPdf = () => {
    const headers = ['Scheme Name', 'Buy Date', 'Sell Date', 'Units', 'Gain Type', 'Gain (₹)', 'Tax Rate', 'Tax Payable'];
    const rows = [
      ['HDFC Top 100 Fund - Growth', '15-Jun-2017', '20-Aug-2024', 200, 'LTCG (Grandfathered)', '₹89,084.00', '12.5%', '₹0.00 (Exempt)'],
      ['Parag Parikh Flexi Cap Fund', '10-Jan-2022', '05-Sep-2024', 150, 'LTCG', '₹4,267.50', '12.5%', '₹0.00 (Exempt)'],
      ['HDFC Short Term Debt Fund', '15-Apr-2023', '20-Aug-2024', 300, 'STCG (Sec 50AA)', '₹1,355.00', '30.0%', '₹406.50']
    ];

    exportReportToPdf({
      title: 'Capital Gains Tax Statement (FY 2024-25)',
      subtitle: 'Prepared under Section 112A (Equity LTCG) & Section 50AA (Debt STCG)',
      clientName: investor.name,
      pan: investor.pan,
      ucc: investor.ucc,
      summaryCards: [
        { label: 'Total Realized Gain', value: '₹1,12,706.50' },
        { label: 'Sec 112A Exemption', value: '₹97,851.50' },
        { label: 'Net Taxable Gain', value: '₹1,355.00' },
        { label: 'Total Tax Liability', value: '₹422.76' }
      ],
      headers,
      rows,
      filename: `capital_gains_tax_${investor.name.toLowerCase().replace(/ /g, '_')}.pdf`,
      footerNotes: [
        'Equity Long Term Capital Gains under ₹1,25,000 are fully exempt under Section 112A (Finance Act 2024).',
        'Section 50AA applied on Debt Funds purchased on or after 01-Apr-2023.'
      ]
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner - Client Profile */}
      <div className="bg-gradient-to-r from-[#0a192f] via-slate-900 to-[#1e1b4b] border border-[#c5a059]/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c5a059] to-amber-600 flex items-center justify-center font-serif text-xl font-bold text-slate-950 shadow-md shrink-0">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Category 3: End Investor Portal
                </span>
                <span className="text-xs font-mono text-slate-400">PAN: {investor.pan}</span>
                <span className="text-xs font-mono text-slate-400">· UCC: {investor.ucc}</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
                Welcome, {investor.name}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Mutual Fund Advisor: <span className="text-[#c5a059] font-medium">{investor.distributorName}</span> ({investor.arn} · EUIN {investor.euin})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportHoldingsPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Statement (PDF)</span>
            </button>
            <button
              onClick={handleExportHoldingsXls}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export XLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Investor KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 mb-1">Portfolio Current Value</div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{Math.round(investor.currentValue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Invested: ₹{Math.round(investor.totalInvested).toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Wealth Gain</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            +₹{Math.round(investor.absoluteGain).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +{investor.absoluteReturnPct}% Absolute Gain
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 mb-1">Portfolio XIRR</div>
          <div className="text-2xl font-bold text-[#c5a059] font-mono">
            {investor.portfolioXirr}% p.a.
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Annualized Compounded Return</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Monthly SIPs</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            ₹{investor.activeSipTotal.toLocaleString()}/mo
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Auto-debit via e-NACH</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'holdings'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>My Holdings & Allocation</span>
        </button>

        <button
          onClick={() => setActiveTab('sips')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'sips'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>SIP Calendar ({investor.sips.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'proposals'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Pending Proposals</span>
          {!cartExecuted && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'tax'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tax Statement (ITR)</span>
        </button>
      </div>

      {/* Tab 1: Holdings */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {/* Asset Allocation Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">Asset Allocation</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Equity ({investor.allocation.equityPct}%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Debt ({investor.allocation.debtPct}%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Liquid ({investor.allocation.liquidPct}%)</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${investor.allocation.equityPct}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${investor.allocation.debtPct}%` }} className="bg-blue-500 h-full" />
              <div style={{ width: `${investor.allocation.liquidPct}%` }} className="bg-amber-500 h-full" />
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Mutual Fund Scheme</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3 text-right">Buy NAV</th>
                    <th className="px-4 py-3 text-right">Current NAV</th>
                    <th className="px-4 py-3 text-right">Invested Value</th>
                    <th className="px-4 py-3 text-right">Current Valuation</th>
                    <th className="px-4 py-3 text-right">XIRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {investor.holdings.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{h.name}</td>
                      <td className="px-4 py-3 text-slate-400">{h.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{h.units.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">₹{h.buyNav.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-white font-medium">₹{h.nav.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">₹{h.invested.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">₹{h.curVal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#c5a059] font-semibold">{h.xirr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SIPs */}
      {activeTab === 'sips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investor.sips.map((sip, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{sip.scheme}</h4>
                    <span className="text-xs text-slate-400">{sip.debitDay}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {sip.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Monthly Amount:</span>
                    <span className="font-bold text-white ml-1.5">₹{sip.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Next Debit:</span>
                    <span className="font-medium text-amber-400 ml-1.5">{sip.nextDebit}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-800/60 p-2 rounded flex items-center justify-between">
                  <span>e-NACH Mandate: {sip.mandate}</span>
                  <span>{sip.bank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Proposals */}
      {activeTab === 'proposals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                Proposal from Advisor
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{investor.proposal.title}</h3>
              <p className="text-xs text-slate-300 mt-0.5">{investor.proposal.advisorNotes}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Basket Ref:</span>
              <div className="font-mono text-xs text-amber-400 font-semibold">{investor.proposal.id}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proposed Investments:</h4>
            {investor.proposal.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-800/80 rounded-lg flex items-center justify-between border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.type === 'SIP' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.type}
                  </span>
                  <div>
                    <div className="font-medium text-white text-xs">{item.scheme}</div>
                    {item.sipDay && <div className="text-[11px] text-slate-400">Debit date: {item.sipDay}th of month</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">₹{item.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">{item.type === 'SIP' ? '/month' : 'one-time'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Total Execution Amount: <span className="font-bold text-white text-sm">₹{investor.proposal.totalLumpsum.toLocaleString()} Lumpsum</span> + <span className="font-bold text-white text-sm">₹{investor.proposal.totalSip.toLocaleString()}/mo SIP</span>
            </div>

            {cartExecuted ? (
              <div className="px-4 py-2 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Proposal Approved & BSE Orders Queued!</span>
              </div>
            ) : (
              <button
                onClick={() => setCartExecuted(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Approve & Pay via BSE UPI / NetBanking</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Tax Statement */}
      {activeTab === 'tax' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Capital Gains Tax Statement (FY 2024-25)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready for ITR-2 filing under Section 112A (Equity LTCG) and Section 50AA (Debt STCG).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTaxPdf}
                className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Tax PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <span className="text-[11px] text-slate-400">Total Realized Gain</span>
              <div className="text-base font-bold text-white font-mono">₹1,12,706.50</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <span className="text-[11px] text-emerald-400">Sec 112A Exemption</span>
              <div className="text-base font-bold text-emerald-400 font-mono">₹97,851.50</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <span className="text-[11px] text-slate-400">Taxable Debt STCG</span>
              <div className="text-base font-bold text-amber-400 font-mono">₹1,355.00</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <span className="text-[11px] text-slate-400">Net Tax Liability</span>
              <div className="text-base font-bold text-white font-mono">₹422.76</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
