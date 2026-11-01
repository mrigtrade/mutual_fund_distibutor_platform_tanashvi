/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849, BSE Member 714114)
 * Role 4: Platform Promoters & Super-Admin Executive View
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Database,
  Search,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { exportToCsv, exportToExcelXls, exportReportToPdf } from '../utils/exportUtils';

interface TenantMfd {
  id: string;
  tenantCode: string;
  orgName: string;
  category: 'STANDALONE' | 'NETWORK';
  arn: string;
  city: string;
  clientCount: number;
  aumCr: number;
  subBrokersCount: number;
  euinCount: number;
  monthlyOrders: number;
  tier: 'STANDARD' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PENDING';
  joinedDate: string;
}

const MOCK_TENANTS: TenantMfd[] = [
  {
    id: 'TEN-001',
    tenantCode: 'TANASHVI_INTERNAL',
    orgName: 'Tanashvi Wealth Management Desk',
    category: 'NETWORK',
    arn: 'ARN-347849',
    city: 'Mumbai',
    clientCount: 2450,
    aumCr: 38.5,
    subBrokersCount: 4,
    euinCount: 12,
    monthlyOrders: 540,
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    joinedDate: '2024-01-15'
  },
  {
    id: 'TEN-002',
    tenantCode: 'APEX_WEALTH_01',
    orgName: 'Apex Wealth Advisors',
    category: 'STANDALONE',
    arn: 'ARN-198420',
    city: 'Pune',
    clientCount: 820,
    aumCr: 14.2,
    subBrokersCount: 0,
    euinCount: 2,
    monthlyOrders: 185,
    tier: 'STANDARD',
    status: 'ACTIVE',
    joinedDate: '2024-03-20'
  },
  {
    id: 'TEN-003',
    tenantCode: 'BLUECHIP_FIN_02',
    orgName: 'Bluechip Financial Distribution Pvt Ltd',
    category: 'NETWORK',
    arn: 'ARN-221094',
    city: 'Bengaluru',
    clientCount: 3100,
    aumCr: 42.8,
    subBrokersCount: 8,
    euinCount: 24,
    monthlyOrders: 820,
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    joinedDate: '2024-02-10'
  },
  {
    id: 'TEN-004',
    tenantCode: 'PRAGATI_CAP_03',
    orgName: 'Pragati Capital & Investments',
    category: 'STANDALONE',
    arn: 'ARN-154920',
    city: 'Ahmedabad',
    clientCount: 650,
    aumCr: 9.8,
    subBrokersCount: 0,
    euinCount: 1,
    monthlyOrders: 130,
    tier: 'STANDARD',
    status: 'ACTIVE',
    joinedDate: '2024-05-18'
  },
  {
    id: 'TEN-005',
    tenantCode: 'KUBER_DIST_04',
    orgName: 'Kuber Mutual Distributors LLP',
    category: 'NETWORK',
    arn: 'ARN-289410',
    city: 'Delhi NCR',
    clientCount: 1950,
    aumCr: 26.5,
    subBrokersCount: 5,
    euinCount: 15,
    monthlyOrders: 490,
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    joinedDate: '2024-04-01'
  },
  {
    id: 'TEN-006',
    tenantCode: 'SHREE_FIN_05',
    orgName: 'Shree Wealth Consultancy',
    category: 'STANDALONE',
    arn: 'ARN-249811',
    city: 'Jaipur',
    clientCount: 410,
    aumCr: 6.85,
    subBrokersCount: 0,
    euinCount: 1,
    monthlyOrders: 95,
    tier: 'STANDARD',
    status: 'ACTIVE',
    joinedDate: '2024-07-22'
  },
  {
    id: 'TEN-007',
    tenantCode: 'VERTEX_CAP_06',
    orgName: 'Vertex Capital Partners',
    category: 'STANDALONE',
    arn: 'ARN-312095',
    city: 'Hyderabad',
    clientCount: 880,
    aumCr: 10.0,
    subBrokersCount: 0,
    euinCount: 2,
    monthlyOrders: 210,
    tier: 'STANDARD',
    status: 'ACTIVE',
    joinedDate: '2024-08-11'
  }
];

export const PromoterDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'telemetry' | 'audit' | 'revenue'>('tenants');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STANDALONE' | 'NETWORK'>('ALL');

  // Filtered tenants
  const filteredTenants = MOCK_TENANTS.filter(t => {
    const matchesSearch = 
      t.orgName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.arn.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.city.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Platform Aggregates
  const totalMfCount = MOCK_TENANTS.length;
  const totalAumCr = MOCK_TENANTS.reduce((sum, t) => sum + t.aumCr, 0);
  const totalClients = MOCK_TENANTS.reduce((sum, t) => sum + t.clientCount, 0);
  const totalSubBrokers = MOCK_TENANTS.reduce((sum, t) => sum + t.subBrokersCount, 0);
  const totalEuins = MOCK_TENANTS.reduce((sum, t) => sum + t.euinCount, 0);
  const totalMonthlyOrders = MOCK_TENANTS.reduce((sum, t) => sum + t.monthlyOrders, 0);

  // --- Export Handlers ---
  const handleExportCsv = () => {
    const headers = ['Tenant Code', 'Distributor Name', 'Category', 'ARN', 'City', 'Clients', 'AUM (Cr)', 'Sub-Brokers', 'EUINs', 'Monthly Orders', 'Tier', 'Status'];
    const rows = filteredTenants.map(t => [
      t.tenantCode,
      t.orgName,
      t.category,
      t.arn,
      t.city,
      t.clientCount,
      t.aumCr.toFixed(2),
      t.subBrokersCount,
      t.euinCount,
      t.monthlyOrders,
      t.tier,
      t.status
    ]);
    exportToCsv('tanashvi_mfd_subscribers_directory.csv', headers, rows);
  };

  const handleExportXls = () => {
    const headers = ['Tenant Code', 'Distributor Name', 'Category', 'ARN', 'City', 'Clients', 'AUM (Cr)', 'Sub-Brokers', 'EUINs', 'Monthly Orders', 'Tier', 'Status'];
    const rows = filteredTenants.map(t => [
      t.tenantCode,
      t.orgName,
      t.category,
      t.arn,
      t.city,
      t.clientCount,
      t.aumCr.toFixed(2),
      t.subBrokersCount,
      t.euinCount,
      t.monthlyOrders,
      t.tier,
      t.status
    ]);
    exportToExcelXls(
      'tanashvi_mfd_subscribers_directory.xls',
      'MFD Directory',
      headers,
      rows,
      {
        title: 'Tanashvi Platform Subscribers Directory',
        subtitle: `Aggregated AUM: ₹${totalAumCr.toFixed(2)} Cr across ${totalClients.toLocaleString()} investors`
      }
    );
  };

  const handleExportPdf = () => {
    const headers = ['Distributor Name', 'Category', 'ARN', 'City', 'Clients', 'AUM (Cr)', 'Sub-Br', 'Monthly Orders'];
    const rows = filteredTenants.map(t => [
      t.orgName,
      t.category,
      t.arn,
      t.city,
      t.clientCount.toLocaleString(),
      `₹${t.aumCr.toFixed(1)} Cr`,
      t.subBrokersCount,
      t.monthlyOrders.toLocaleString()
    ]);

    exportReportToPdf({
      title: 'Tanashvi Platform Promoter Executive Report',
      subtitle: 'Platform-wide Multi-Tenant MFD Aggregates & SEBI Regulatory Compliance',
      summaryCards: [
        { label: 'Subscribed MFDs', value: `${totalMfCount} Firms` },
        { label: 'Cumulative AUM', value: `₹${totalAumCr.toFixed(1)} Cr` },
        { label: 'Total Clients', value: totalClients.toLocaleString() },
        { label: 'Monthly Orders', value: totalMonthlyOrders.toLocaleString() }
      ],
      headers,
      rows,
      filename: 'tanashvi_platform_promoters_report.pdf',
      footerNotes: [
        'Data extracted from Tanashvi Core Multi-Tenant Database with PostgreSQL RLS.',
        'SEBI Registered Intermediary Audit Trail preserved under Regulation 25.',
        'BSE Member Code 714114 | Gateway: BSE StAR MF v2 Production Gateway.'
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-slate-900 to-[#1e1b4b] border border-[#c5a059]/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                Category 4: Tanashvi Promoters & Super-Admin
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                BSE Member: 714114
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
              Platform Master & Promoters Control Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Real-time oversight of all onboarded Mutual Fund Distributors (Standalone & Network), cumulative platform AUM, 
              BSE StAR MF transaction velocity, and SEBI regulatory audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </button>
            <button
              onClick={handleExportXls}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export XLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Primary Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Subscribed MFDs</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMfCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">4 Network</span> · 3 Standalone
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cumulative AUM</span>
            <TrendingUp className="w-4 h-4 text-[#c5a059]" />
          </div>
          <div className="text-2xl font-bold text-[#c5a059]">₹{totalAumCr.toFixed(2)} Cr</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>+14.8% MTD Growth</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Clients Served</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalClients.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all tenant MFDs</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Sub-Brokers & EUINs</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSubBrokers} / {totalEuins}</div>
          <div className="text-[11px] text-slate-400 mt-1">17 Branches · 56 RMs</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">SEBI Audit Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>100% Compliant</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">7-Year BSE Trace Retention</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Subscribed MFD Directory ({filteredTenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>BSE Gateway Live Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SEBI Audit Trail (Trace IDs)</span>
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'revenue'
              ? 'bg-[#c5a059] text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>SaaS Revenue & Billing</span>
        </button>
      </div>

      {/* Tab 1: MFD Directory */}
      {activeTab === 'tenants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by MFD Name, ARN, or City..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              {(['ALL', 'STANDALONE', 'NETWORK'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All MFDs' : cat === 'STANDALONE' ? 'Category 1: Standalone' : 'Category 2: Network'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Distributor Organization</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">AMFI ARN</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-right">Clients</th>
                  <th className="px-4 py-3 text-right">AUM (₹ Cr)</th>
                  <th className="px-4 py-3 text-center">Sub-Brokers</th>
                  <th className="px-4 py-3 text-right">Monthly BSE Orders</th>
                  <th className="px-4 py-3 text-center">SaaS Tier</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTenants.map((mfd) => (
                  <tr key={mfd.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{mfd.orgName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{mfd.tenantCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        mfd.category === 'NETWORK'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                      }`}>
                        {mfd.category === 'NETWORK' ? 'Network (Sub-Brokers)' : 'Standalone MFD'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-400 font-medium">
                      {mfd.arn}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{mfd.city}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{mfd.clientCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#c5a059]">₹{mfd.aumCr.toFixed(2)} Cr</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {mfd.subBrokersCount > 0 ? (
                        <span className="text-emerald-400 font-semibold">{mfd.subBrokersCount} branches</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{mfd.monthlyOrders.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {mfd.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: BSE Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>BSE Gateway Health</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Order Routing Gateway</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE (BSE v2)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Average API Latency</span>
                <span className="text-white font-mono font-semibold">318 ms</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Order Execution Success Rate</span>
                <span className="text-emerald-400 font-mono font-semibold">99.4%</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Static IP Whitelist Status</span>
                <span className="text-emerald-400 font-mono text-[11px]">115.114.120.45 (Active)</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-slate-400">JOSE Cryptographic Signing</span>
                <span className="text-amber-400 font-mono text-[11px]">RSA-OAEP-256 (Valid)</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Endpoint Real-Time Performance</span>
            </h3>
            <div className="space-y-3">
              {[
                { endpoint: 'POST /api/order_new', label: 'Order Placement Engine', calls: '1,420 calls/day', latency: '280ms', status: 'Healthy' },
                { endpoint: 'POST /api/v2/add_ucc', label: 'Client UCC Registration', calls: '480 calls/day', latency: '410ms', status: 'Healthy' },
                { endpoint: 'POST /api/sip_order_new', label: 'SIP / XSIP Registration', calls: '620 calls/day', latency: '340ms', status: 'Healthy' },
                { endpoint: 'POST /api/mandate_register', label: 'e-NACH Mandate Gateway', calls: '210 calls/day', latency: '520ms', status: 'Healthy' }
              ].map(ep => (
                <div key={ep.endpoint} className="p-3 bg-slate-800/60 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs text-amber-300 font-semibold">{ep.endpoint}</div>
                    <div className="text-[11px] text-slate-400">{ep.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-200">{ep.latency}</div>
                    <div className="text-[10px] text-emerald-400">{ep.calls}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SEBI Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Regulatory Audit Trail (SEBI Regulation 25 Compliance)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All transactions routed via Tanashvi Member 714114 are cryptographically logged with 7-year immutable retention.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">BSE Trace ID</th>
                  <th className="px-3 py-2.5">Tenant ARN</th>
                  <th className="px-3 py-2.5">Sub-Broker</th>
                  <th className="px-3 py-2.5">EUIN</th>
                  <th className="px-3 py-2.5">Endpoint</th>
                  <th className="px-3 py-2.5">Latency</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-[11px]">
                {[
                  { time: '17:34:12', trace: 'TRC-948102-BSE', arn: 'ARN-198420', sub: 'APEX-PUN-01', euin: 'E294810', ep: '/api/order_new', lat: '240ms', st: 'SUCCESS' },
                  { time: '17:31:05', trace: 'TRC-948099-BSE', arn: 'ARN-221094', sub: 'BLU-BLR-03', euin: 'E184029', ep: '/api/sip_order_new', lat: '310ms', st: 'SUCCESS' },
                  { time: '17:28:44', trace: 'TRC-948082-BSE', arn: 'ARN-347849', sub: 'TAN-HO-01', euin: 'E123456', ep: '/api/v2/add_ucc', lat: '420ms', st: 'SUCCESS' },
                  { time: '17:22:19', trace: 'TRC-948071-BSE', arn: 'ARN-289410', sub: 'KUB-DEL-02', euin: 'E309481', ep: '/api/mandate_register', lat: '510ms', st: 'SUCCESS' },
                  { time: '17:15:02', trace: 'TRC-948055-BSE', arn: 'ARN-312095', sub: 'VTX-HYD-01', euin: 'E220194', ep: '/api/order_new', lat: '295ms', st: 'SUCCESS' }
                ].map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-slate-400">{log.time}</td>
                    <td className="px-3 py-2 text-amber-400">{log.trace}</td>
                    <td className="px-3 py-2 text-white font-semibold">{log.arn}</td>
                    <td className="px-3 py-2 text-slate-300">{log.sub}</td>
                    <td className="px-3 py-2 text-emerald-400">{log.euin}</td>
                    <td className="px-3 py-2 text-slate-300">{log.ep}</td>
                    <td className="px-3 py-2 text-slate-400">{log.lat}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {log.st}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: SaaS Revenue */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Platform Commercial Model</span>
            </h3>
            <div className="p-4 bg-slate-800/60 rounded-lg space-y-2 text-xs text-slate-300">
              <div className="flex justify-between font-medium">
                <span>Standard MFD Tier (Standalone):</span>
                <span className="text-[#c5a059] font-bold">₹2,999 / month</span>
              </div>
              <p className="text-[11px] text-slate-400">Includes single ARN, unlimited UCCs, Proposal Cart, Tax harvesting engine.</p>
              
              <div className="flex justify-between font-medium pt-3 border-t border-slate-700">
                <span>Enterprise Network Tier (Multi-Branch):</span>
                <span className="text-[#c5a059] font-bold">₹7,999 / month</span>
              </div>
              <p className="text-[11px] text-slate-400">Includes multi-branch sub-brokers, RM EUIN tagging, commission split ledger.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Monthly Platform Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Active MFD Subscriptions MRR</span>
                <span className="text-white font-mono font-bold">₹44,993 / mo</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Platform AUM Attributed</span>
                <span className="text-[#c5a059] font-mono font-bold">₹148.65 Cr</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">BSE Transaction Settlement</span>
                <span className="text-emerald-400 font-mono font-semibold">T+1 Auto Allotment</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

