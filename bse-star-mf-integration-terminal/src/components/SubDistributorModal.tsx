/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849, BSE Member 714114)
 * Multi-Tenant 4-Category Role & Session Switcher Modal
 */

import React, { useState } from 'react';
import { SubDistributor, ActiveUserSession } from '../types/bse';
import { 
  X, 
  Users, 
  UserCheck, 
  Shield, 
  Plus, 
  CheckCircle, 
  ArrowRight, 
  Briefcase,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

interface SubDistributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subDistributors: SubDistributor[];
  currentSession: ActiveUserSession;
  onSwitchSession: (session: ActiveUserSession) => void;
  onAddSubDistributor: (sub: SubDistributor) => void;
  masterMemberId: string;
}

export const SubDistributorModal: React.FC<SubDistributorModalProps> = ({
  isOpen,
  onClose,
  subDistributors,
  currentSession,
  onSwitchSession,
  onAddSubDistributor,
  masterMemberId
}) => {
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE'>('LIST');

  // New sub distributor form
  const [subBrokerCode, setSubBrokerCode] = useState(`SUB-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [euin, setEuin] = useState(`E${Math.floor(100000 + Math.random() * 900000)}`);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [commissionShare, setCommissionShare] = useState(70);

  if (!isOpen) return null;

  // Category 4: Tanashvi Promoters & Super-Admin
  const handleSelectPromoter = () => {
    onSwitchSession({
      role: 'PLATFORM_SUPER_ADMIN',
      name: 'Tanashvi Promoters & Super-Admin',
      memberId: masterMemberId,
      roleTitle: 'Tanashvi Platform HQ (BSE Member 714114)'
    });
    onClose();
  };

  // Category 1: Standalone MFD Subscriber
  const handleSelectStandaloneMfd = () => {
    onSwitchSession({
      role: 'MFD_STANDALONE',
      name: 'Apex Wealth Advisors (ARN-198420)',
      memberId: masterMemberId,
      subBrokerCode: 'APEX-PUN-01',
      euin: 'E294810',
      roleTitle: 'Standalone MFD Subscriber'
    });
    onClose();
  };

  // Category 2: Network MFD / Sub-Broker
  const handleSelectSub = (sub: SubDistributor) => {
    onSwitchSession({
      role: 'SUB_DISTRIBUTOR',
      subDistributorId: sub.id,
      subBrokerCode: sub.subBrokerCode,
      euin: sub.euin,
      name: sub.name,
      memberId: masterMemberId,
      roleTitle: `Sub-Broker: ${sub.name}`
    });
    onClose();
  };

  // Category 3: End Investor / Client
  const handleSelectInvestor = () => {
    onSwitchSession({
      role: 'CLIENT_INVESTOR',
      name: 'Ramesh Sharma (Investor)',
      clientCode: 'UCC-RAMESH-001',
      pan: 'AAAPS1234K',
      memberId: masterMemberId,
      roleTitle: 'Client Investor (Ramesh Sharma)'
    });
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: SubDistributor = {
      id: subBrokerCode,
      subBrokerCode,
      name,
      contactPerson,
      euin: euin.toUpperCase(),
      email,
      mobile,
      commissionShare: Number(commissionShare),
      activeStatus: 'ACTIVE',
      totalAum: 0,
      totalOrders: 0,
      mappedClientsCount: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    onAddSubDistributor(newSub);
    handleSelectSub(newSub);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a192f]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#c5a059]" />
            <div>
              <h2 className="text-base font-semibold text-white">Platform Roles & Personas Switcher</h2>
              <p className="text-xs text-slate-400">Switch workspace view between all 4 platform subscriber & user categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeView === 'LIST' ? (
            <div className="space-y-4">
              {/* Category 4: Tanashvi Promoters & Super-Admin */}
              <div
                onClick={handleSelectPromoter}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  currentSession.role === 'PLATFORM_SUPER_ADMIN' || currentSession.role === 'MASTER_MFD'
                    ? 'border-purple-500/80 bg-purple-950/20 text-white shadow-lg'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Category 4: Tanashvi Promoters & Super-Admin</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                          Platform Master (ARN-347849)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Executive oversight: 42 subscribed MFDs, ₹148.65 Cr platform AUM, 24h BSE transaction velocity, SEBI Regulation 25 audit logs.
                      </p>
                    </div>
                  </div>
                  {(currentSession.role === 'PLATFORM_SUPER_ADMIN' || currentSession.role === 'MASTER_MFD') && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-[11px] font-semibold rounded flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Active View
                    </span>
                  )}
                </div>
              </div>

              {/* Category 1: MFD Standalone */}
              <div
                onClick={handleSelectStandaloneMfd}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  currentSession.role === 'MFD_STANDALONE'
                    ? 'border-blue-500/80 bg-blue-950/20 text-white shadow-lg'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Category 1: MFD Standalone Subscriber</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40">
                          Apex Wealth (ARN-198420)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Independent distributor subscriber serving own clients. Full access to UCC onboarding, Order Engine, Mandates, Proposal Carts, and Calculators.
                      </p>
                    </div>
                  </div>
                  {currentSession.role === 'MFD_STANDALONE' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[11px] font-semibold rounded flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Active View
                    </span>
                  )}
                </div>
              </div>

              {/* Category 2: Institutional MFD with Sub-Brokers */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Category 2: MFD with Sub-Brokers Network</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          Multi-Branch Network
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Distributor with branch desks and sub-brokers. Switch below to simulate an active RM/Sub-Broker session:
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('CREATE')}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Add Sub-Broker</span>
                  </button>
                </div>

                {/* Sub-distributor list cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {subDistributors.map((sub) => {
                    const isSelected = currentSession.role === 'SUB_DISTRIBUTOR' && currentSession.subDistributorId === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSelectSub(sub)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-950/30 text-white'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-white text-xs">{sub.name}</div>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          Code: {sub.subBrokerCode} · EUIN: {sub.euin}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          Share: {sub.commissionShare}% · Clients: {sub.mappedClientsCount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: End Investor / Client */}
              <div
                onClick={handleSelectInvestor}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  currentSession.role === 'CLIENT_INVESTOR'
                    ? 'border-amber-400/80 bg-amber-950/20 text-white shadow-lg'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Category 3: End Investor / Client Portal</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-400/40">
                          Ramesh Sharma (UCC-RAMESH-001)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Client view: Consolidated portfolio valuation (₹3.84L), SIP debit calendar, pending proposal carts with one-click payment, and Capital Gains ITR reports.
                      </p>
                    </div>
                  </div>
                  {currentSession.role === 'CLIENT_INVESTOR' && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-semibold rounded flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Active View
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Create Sub Distributor Form */
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Register New Sub-Distributor Branch / RM</h3>
                <button
                  type="button"
                  onClick={() => setActiveView('LIST')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to Roles
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sub-Broker Code (BSE)</label>
                  <input
                    type="text"
                    required
                    value={subBrokerCode}
                    onChange={(e) => setSubBrokerCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">AMFI EUIN (Mandatory)</label>
                  <input
                    type="text"
                    required
                    value={euin}
                    onChange={(e) => setEuin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Distributor / Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Wealth Advisory Services"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Singhania"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Commission Share (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={commissionShare}
                    onChange={(e) => setCommissionShare(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="advisor@apexwealth.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveView('LIST')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c5a059] text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 cursor-pointer"
                >
                  Save & Switch to Sub-Broker
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
