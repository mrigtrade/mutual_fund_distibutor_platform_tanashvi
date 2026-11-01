import React, { useState } from 'react';
import { SubDistributor, ActiveUserSession } from '../types/bse';
import { Users, Plus, ShieldCheck, Briefcase, TrendingUp, DollarSign, LogIn, Check } from 'lucide-react';

interface SubDistributorManagerProps {
  subDistributors: SubDistributor[];
  currentSession: ActiveUserSession;
  onSwitchSession: (session: ActiveUserSession) => void;
  onOpenAddModal: () => void;
  masterMemberId: string;
}

export const SubDistributorManager: React.FC<SubDistributorManagerProps> = ({
  subDistributors,
  currentSession,
  onSwitchSession,
  onOpenAddModal,
  masterMemberId
}) => {
  const totalNetworkAum = subDistributors.reduce((acc, s) => acc + s.totalAum, 0);
  const totalOrders = subDistributors.reduce((acc, s) => acc + s.totalOrders, 0);

  const handleLoginAsSub = (sub: SubDistributor) => {
    onSwitchSession({
      role: 'SUB_DISTRIBUTOR',
      subDistributorId: sub.id,
      subBrokerCode: sub.subBrokerCode,
      euin: sub.euin,
      name: sub.name,
      memberId: masterMemberId
    });
  };

  const handleLoginAsMaster = () => {
    onSwitchSession({
      role: 'MASTER_MFD',
      name: 'Master MFD (Principal Admin)',
      memberId: masterMemberId
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Sub-Distributor & Channel Partner Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage sub-brokers, associate branch logins, EUIN mappings & commission allocations under Member <span className="text-amber-400 font-mono">{masterMemberId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentSession.role === 'SUB_DISTRIBUTOR' ? (
            <button
              onClick={handleLoginAsMaster}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              Switch back to Master MFD
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sub-Distributor</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Network Sub-Brokers</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">{subDistributors.length} Active</div>
          <div className="text-[11px] text-slate-500 font-mono">100% AMFI EUIN Verified</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Total Sub-Broker AUM</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ₹{(totalNetworkAum / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Consolidated across partners</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Orders Mobilized</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">{totalOrders}</div>
          <div className="text-[11px] text-slate-500 font-mono">Routed via BSE StAR MF</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Avg Commission Share</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">75%</div>
          <div className="text-[11px] text-slate-500 font-mono">Trail split model</div>
        </div>
      </div>

      {/* Sub-Distributor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subDistributors.map((sub) => {
          const isCurrentlyActive =
            currentSession.role === 'SUB_DISTRIBUTOR' &&
            currentSession.subBrokerCode === sub.subBrokerCode;

          return (
            <div
              key={sub.id}
              className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition-all ${
                isCurrentlyActive
                  ? 'border-emerald-500/80 bg-slate-900/95 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{sub.name}</h3>
                  <div className="text-xs text-slate-400">{sub.contactPerson}</div>
                </div>

                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isCurrentlyActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCurrentlyActive ? 'LOGGED IN' : 'ACTIVE'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-1 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sub-Broker Code:</span>
                  <span className="text-amber-400 font-bold">{sub.subBrokerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AMFI EUIN:</span>
                  <span className="text-slate-200 font-bold">{sub.euin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commission Share:</span>
                  <span className="text-slate-300">{sub.commissionShare}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobilized AUM:</span>
                  <span className="text-emerald-400 font-bold">₹{sub.totalAum.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-400 truncate max-w-[170px]">{sub.email}</span>
                </div>
              </div>

              <div className="pt-2">
                {isCurrentlyActive ? (
                  <div className="w-full py-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Current Session Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleLoginAsSub(sub)}
                    className="w-full py-2 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login as {sub.subBrokerCode}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Note on BSE StAR MF Sub-Distributor API */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>How BSE StAR MF Handles Sub-Distributors & EUIN</span>
        </div>
        <p>
          In BSE StAR MF, sub-distributors operate under the master broker's Member ID (ARN). When a sub-distributor registers a client or places an order, the BSE API automatically receives the sub-distributor's <code>SubBrokerCode</code>, <code>EUIN</code>, and <code>EUINFlag='Y'</code>. This guarantees exact commission attribution, client partitioning, and regulatory compliance with AMFI guidelines.
        </p>
      </div>
    </div>
  );
};
