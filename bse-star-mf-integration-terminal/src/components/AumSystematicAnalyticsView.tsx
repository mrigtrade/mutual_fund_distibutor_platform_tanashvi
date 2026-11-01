/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849, BSE Member 714114)
 * AUM, SIP, STP & SWP Systematic Book Analytics Engine
 * Active across Category 1 (Standalone MFD), Category 2 (Network MFD), and Category 4 (Tanashvi HQ)
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Repeat, 
  ArrowRightLeft, 
  ArrowDownRight, 
  PieChart, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Users, 
  Layers, 
  Clock,
  Briefcase
} from 'lucide-react';
import { ActiveUserSession, SubDistributor } from '../types/bse';
import { exportToCsv, exportToExcelXls, exportReportToPdf } from '../utils/exportUtils';

interface SystematicRecord {
  id: string;
  clientName: string;
  clientCode: string;
  subBrokerName?: string;
  type: 'SIP' | 'STP' | 'SWP';
  sourceScheme: string;
  targetScheme?: string;
  monthlyAmount: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
  debitDay: number;
  mandateId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRING_SOON';
}

const MOCK_SYSTEMATIC_LEDGER: SystematicRecord[] = [
  {
    id: 'SYS-001',
    clientName: 'Ramesh Sharma',
    clientCode: 'UCC-RAMESH-001',
    subBrokerName: 'Tanashvi Wealth Desk',
    type: 'SIP',
    sourceScheme: 'Parag Parikh Flexi Cap Fund - Regular Growth',
    monthlyAmount: 10000,
    frequency: 'MONTHLY',
    debitDay: 10,
    mandateId: 'MDT-88201',
    startDate: '2023-01-10',
    endDate: '2035-12-10',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-002',
    clientName: 'Ramesh Sharma',
    clientCode: 'UCC-RAMESH-001',
    subBrokerName: 'Tanashvi Wealth Desk',
    type: 'SIP',
    sourceScheme: 'HDFC Top 100 Fund - Regular Growth',
    monthlyAmount: 5000,
    frequency: 'MONTHLY',
    debitDay: 15,
    mandateId: 'MDT-88201',
    startDate: '2023-02-15',
    endDate: '2030-02-15',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-003',
    clientName: 'Sunita Mehta',
    clientCode: 'UCC-SUNITA-002',
    subBrokerName: 'Amit Wealth Management',
    type: 'SIP',
    sourceScheme: 'Nippon India Small Cap Fund - Regular Growth',
    monthlyAmount: 25000,
    frequency: 'MONTHLY',
    debitDay: 5,
    mandateId: 'MDT-77104',
    startDate: '2022-04-05',
    endDate: '2032-04-05',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-004',
    clientName: 'Sunita Mehta',
    clientCode: 'UCC-SUNITA-002',
    subBrokerName: 'Amit Wealth Management',
    type: 'STP',
    sourceScheme: 'ICICI Prudential Liquid Fund - Growth',
    targetScheme: 'Motilal Oswal Midcap Fund - Regular Growth',
    monthlyAmount: 50000,
    frequency: 'MONTHLY',
    debitDay: 10,
    mandateId: 'INTERNAL-FOLIO-STP',
    startDate: '2024-01-10',
    endDate: '2025-06-10',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-005',
    clientName: 'Col. Vikramaditya Rathore',
    clientCode: 'UCC-VIKRAM-003',
    subBrokerName: 'Pooja Financial Services',
    type: 'SWP',
    sourceScheme: 'ICICI Prudential Balanced Advantage Fund - Growth',
    monthlyAmount: 45000,
    frequency: 'MONTHLY',
    debitDay: 1,
    mandateId: 'BANK-CREDIT-SWP',
    startDate: '2021-06-01',
    endDate: '2036-06-01',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-006',
    clientName: 'Priya Narang',
    clientCode: 'UCC-PRIYA-004',
    subBrokerName: 'Vertex Capital',
    type: 'SIP',
    sourceScheme: 'Quant Active Fund - Regular Growth',
    monthlyAmount: 15000,
    frequency: 'MONTHLY',
    debitDay: 10,
    mandateId: 'MDT-99412',
    startDate: '2023-08-10',
    endDate: '2038-08-10',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-007',
    clientName: 'Deepak Varma',
    clientCode: 'UCC-DEEPAK-005',
    subBrokerName: 'Tanashvi Wealth Desk',
    type: 'STP',
    sourceScheme: 'HDFC Short Term Debt Fund - Growth',
    targetScheme: 'HDFC Top 100 Fund - Regular Growth',
    monthlyAmount: 25000,
    frequency: 'MONTHLY',
    debitDay: 15,
    mandateId: 'INTERNAL-FOLIO-STP',
    startDate: '2024-03-15',
    endDate: '2025-09-15',
    status: 'ACTIVE'
  },
  {
    id: 'SYS-008',
    clientName: 'Meenakshi Iyer',
    clientCode: 'UCC-MEENAKSHI-006',
    subBrokerName: 'Amit Wealth Management',
    type: 'SWP',
    sourceScheme: 'SBI Bluechip Fund - Regular Growth',
    monthlyAmount: 30000,
    frequency: 'MONTHLY',
    debitDay: 25,
    mandateId: 'BANK-CREDIT-SWP',
    startDate: '2022-11-25',
    endDate: '2032-11-25',
    status: 'ACTIVE'
  }
];

interface AumSystematicAnalyticsViewProps {
  currentSession: ActiveUserSession;
  subDistributors: SubDistributor[];
}

export const AumSystematicAnalyticsView: React.FC<AumSystematicAnalyticsViewProps> = ({
  currentSession,
  subDistributors
}) => {
  const [selectedType, setSelectedType] = useState<'ALL' | 'SIP' | 'STP' | 'SWP'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Scoped Data Multipliers based on Role
  const isSuperAdmin = currentSession.role === 'PLATFORM_SUPER_ADMIN' || currentSession.role === 'MASTER_MFD';
  const isNetwork = currentSession.role === 'MFD_NETWORK' || currentSession.role === 'SUB_DISTRIBUTOR';
  
  // Dynamic totals based on Persona
  const bookMetrics = isSuperAdmin
    ? {
        roleLabel: 'Category 4: Platform-Wide Consolidated Book (All 42 Subscribed MFDs)',
        totalAumCr: 148.65,
        mtdNetInflowCr: 12.4,
        monthlySipBook: 14200000, // ₹1.42 Cr/mo
        activeSipCount: 4820,
        monthlyStpBook: 4850000,  // ₹48.5 Lakhs/mo
        activeStpCount: 185,
        monthlySwpBook: 3280000,  // ₹32.8 Lakhs/mo
        activeSwpCount: 124,
        sip13MPersistence: 91.4,
        avgTicket: 2946
      }
    : isNetwork
    ? {
        roleLabel: `Category 2: Network Firm Book (${currentSession.name})`,
        totalAumCr: 38.50,
        mtdNetInflowCr: 3.8,
        monthlySipBook: 3680000, // ₹36.8 Lakhs/mo
        activeSipCount: 1120,
        monthlyStpBook: 1250000, // ₹12.5 Lakhs/mo
        activeStpCount: 48,
        monthlySwpBook: 840000,  // ₹8.4 Lakhs/mo
        activeSwpCount: 32,
        sip13MPersistence: 92.8,
        avgTicket: 3285
      }
    : {
        roleLabel: `Category 1: Standalone Distributor Book (${currentSession.name})`,
        totalAumCr: 14.20,
        mtdNetInflowCr: 1.4,
        monthlySipBook: 1480000, // ₹14.8 Lakhs/mo
        activeSipCount: 440,
        monthlyStpBook: 420000,  // ₹4.2 Lakhs/mo
        activeStpCount: 18,
        monthlySwpBook: 280000,  // ₹2.8 Lakhs/mo
        activeSwpCount: 12,
        sip13MPersistence: 89.6,
        avgTicket: 3363
      };

  // Asset class split
  const assetClassSplit = [
    { label: 'Equity Schemes', pct: 68.4, color: 'bg-[#c5a059]' },
    { label: 'Debt Schemes', pct: 18.2, color: 'bg-sky-500' },
    { label: 'Hybrid / BAF Schemes', pct: 9.8, color: 'bg-purple-500' },
    { label: 'Liquid & Overnight', pct: 3.6, color: 'bg-emerald-500' }
  ];

  // AMC Concentration
  const amcConcentration = [
    { name: 'HDFC Mutual Fund', sharePct: 26.4, aumCr: (bookMetrics.totalAumCr * 0.264).toFixed(1) },
    { name: 'ICICI Prudential Mutual Fund', sharePct: 22.8, aumCr: (bookMetrics.totalAumCr * 0.228).toFixed(1) },
    { name: 'Parag Parikh (PPFAS) MF', sharePct: 18.2, aumCr: (bookMetrics.totalAumCr * 0.182).toFixed(1) },
    { name: 'SBI Mutual Fund', sharePct: 14.5, aumCr: (bookMetrics.totalAumCr * 0.145).toFixed(1) },
    { name: 'Nippon India Mutual Fund', sharePct: 10.1, aumCr: (bookMetrics.totalAumCr * 0.101).toFixed(1) },
    { name: 'Others (Kotak, Quant, Tata)', sharePct: 8.0, aumCr: (bookMetrics.totalAumCr * 0.08).toFixed(1) }
  ];

  // Filtered systematic records
  const filteredRecords = MOCK_SYSTEMATIC_LEDGER.filter(r => {
    const matchesType = selectedType === 'ALL' || r.type === selectedType;
    const matchesSearch = 
      r.clientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.clientCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.sourceScheme.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export handlers
  const handleExportPdf = () => {
    const headers = ['Client Name', 'UCC', 'Type', 'Mutual Fund Scheme', 'Amount / Month', 'Debit Day', 'Mandate Ref', 'Status'];
    const rows = filteredRecords.map(r => [
      r.clientName,
      r.clientCode,
      r.type,
      r.targetScheme ? `${r.sourceScheme} -> ${r.targetScheme}` : r.sourceScheme,
      `₹${r.monthlyAmount.toLocaleString()}`,
      `${r.debitDay}th of month`,
      r.mandateId,
      r.status
    ]);

    exportReportToPdf({
      title: 'AUM & Systematic (SIP / STP / SWP) Book Analytics',
      subtitle: bookMetrics.roleLabel,
      summaryCards: [
        { label: 'Total AUM', value: `₹${bookMetrics.totalAumCr.toFixed(2)} Cr` },
        { label: 'Monthly SIP Book', value: formatInr(bookMetrics.monthlySipBook) },
        { label: 'Monthly STP Book', value: formatInr(bookMetrics.monthlyStpBook) },
        { label: 'Monthly SWP Book', value: formatInr(bookMetrics.monthlySwpBook) }
      ],
      headers,
      rows,
      filename: `aum_systematic_analytics_${currentSession.role.toLowerCase()}.pdf`,
      footerNotes: [
        'Systematic book captures BSE StAR MF v2 XSIP, STP, and SWP active registrations.',
        'Transactions executed under Tanashvi BSE Member 714114 · AMFI ARN-347849.'
      ]
    });
  };

  const handleExportXls = () => {
    const headers = ['Client Name', 'UCC', 'Type', 'Source Scheme', 'Target Scheme', 'Monthly Amount (INR)', 'Debit Day', 'Mandate Ref', 'Status'];
    const rows = filteredRecords.map(r => [
      r.clientName,
      r.clientCode,
      r.type,
      r.sourceScheme,
      r.targetScheme || 'N/A',
      r.monthlyAmount,
      r.debitDay,
      r.mandateId,
      r.status
    ]);

    exportToExcelXls(
      `systematic_ledger_${currentSession.role.toLowerCase()}.xls`,
      'Systematic Book',
      headers,
      rows,
      {
        title: 'Systematic Investment Plan (SIP/STP/SWP) Ledger',
        subtitle: `Monthly Systematic Run-Rate: ${formatInr(bookMetrics.monthlySipBook + bookMetrics.monthlyStpBook)} / month`
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-slate-900 to-[#1e1b4b] border border-[#c5a059]/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 uppercase tracking-wider">
                Systematic Wealth Inflow Engine
              </span>
              <span className="text-xs font-mono text-slate-400">AMFI ARN-347849 · BSE Member 714114</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
              AUM & Systematic (SIP / STP / SWP) Analytics
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              {bookMetrics.roleLabel}. Comprehensive monitoring of distributor book valuation, monthly systematic inflows, capital transfers, and retirement cashflow mandates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </button>
            <button
              onClick={handleExportXls}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export XLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Systematic KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total AUM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Assets Under Management (AUM)</span>
            <TrendingUp className="w-4 h-4 text-[#c5a059]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{bookMetrics.totalAumCr.toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>+₹{bookMetrics.mtdNetInflowCr.toFixed(1)} Cr MTD Net Sales</span>
          </div>
        </div>

        {/* Monthly SIP Book */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly SIP Book</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatInr(bookMetrics.monthlySipBook)}<span className="text-xs text-slate-400 font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{bookMetrics.activeSipCount.toLocaleString()} Live SIPs</span>
            <span className="text-slate-300 font-medium">Avg: ₹{bookMetrics.avgTicket.toLocaleString()}</span>
          </div>
        </div>

        {/* Active STP Book */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly STP Book (Transfers)</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {formatInr(bookMetrics.monthlyStpBook)}<span className="text-xs text-slate-400 font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{bookMetrics.activeStpCount} Live STPs</span>
            <span className="text-sky-300">Liquid &rarr; Equity</span>
          </div>
        </div>

        {/* Monthly SWP Book */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly SWP Book (Cashflow)</span>
            <ArrowDownRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {formatInr(bookMetrics.monthlySwpBook)}<span className="text-xs text-slate-400 font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{bookMetrics.activeSwpCount} Live SWPs</span>
            <span className="text-emerald-400 font-medium">{bookMetrics.sip13MPersistence}% 13M Retention</span>
          </div>
        </div>
      </div>

      {/* Asset Class & AMC Concentration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Class Allocation */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#c5a059]" />
              <span>AUM Asset Class Split</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">₹{bookMetrics.totalAumCr} Cr</span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            {assetClassSplit.map((item, idx) => (
              <div key={idx} style={{ width: `${item.pct}%` }} className={`${item.color} h-full`} />
            ))}
          </div>

          <div className="space-y-2 pt-2 text-xs">
            {assetClassSplit.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-mono text-white font-semibold">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* AMC Concentration */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>AMC Concentration</span>
            </h3>
            <span className="text-xs text-slate-400">Top 5 Fund Houses</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {amcConcentration.map((amc, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium text-white">{amc.name}</span>
                  <span className="font-mono text-[#c5a059] font-bold">₹{amc.aumCr} Cr ({amc.sharePct}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#c5a059] h-full" style={{ width: `${amc.sharePct * 3.5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Systematic Debit Day Calendar */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Systematic Cashflow Timing</span>
            </h3>
            <span className="text-xs text-slate-400">Debit Dates</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { day: '1st - 5th of Month', share: '32%', desc: 'Salary credit cycle investments', color: 'bg-emerald-500' },
              { day: '10th of Month (Peak)', share: '44%', desc: 'Highest volume XSIP mandate debit day', color: 'bg-[#c5a059]' },
              { day: '15th of Month', share: '16%', desc: 'Mid-month systematic allocations', color: 'bg-sky-500' },
              { day: '25th of Month', share: '8%', desc: 'Month-end SWP and STP debits', color: 'bg-purple-500' }
            ].map((timing, idx) => (
              <div key={idx} className="p-2.5 bg-slate-800/60 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{timing.day}</div>
                  <div className="text-[10px] text-slate-400">{timing.desc}</div>
                </div>
                <div className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                  {timing.share}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Systematic Ledger & Active Mandates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>Live Systematic Ledger (SIP, STP & SWP)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active automated transaction schedules registered with BSE StAR MF and NPCI e-NACH.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search Client or Scheme..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              {(['ALL', 'SIP', 'STP', 'SWP'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                    selectedType === type
                      ? 'bg-[#c5a059] text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'ALL' ? 'All Plans' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Client / UCC</th>
                <th className="px-4 py-3">Plan Type</th>
                <th className="px-4 py-3">Mutual Fund Scheme(s)</th>
                <th className="px-4 py-3 text-right">Monthly Amount</th>
                <th className="px-4 py-3 text-center">Debit Day</th>
                <th className="px-4 py-3">e-NACH Mandate</th>
                <th className="px-4 py-3">Tenure</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{r.clientName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{r.clientCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.type === 'SIP'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : r.type === 'STP'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                    }`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.sourceScheme}</div>
                    {r.targetScheme && (
                      <div className="text-[11px] text-sky-400 mt-0.5 flex items-center gap-1">
                        <span>&rarr; Target:</span> {r.targetScheme}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    ₹{r.monthlyAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-amber-400 font-semibold">
                    {r.debitDay}th
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {r.mandateId}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {r.startDate.slice(0, 7)} to {r.endDate.slice(0, 7)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

