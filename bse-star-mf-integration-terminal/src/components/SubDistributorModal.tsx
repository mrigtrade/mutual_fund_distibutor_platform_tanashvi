import React, { useState } from 'react';
import { SubDistributor, ActiveUserSession } from '../types/bse';
import { X, Users, UserCheck, Shield, Plus, CheckCircle, ArrowRight, Briefcase } from 'lucide-react';

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

  const handleSelectMaster = () => {
    onSwitchSession({
      role: 'MASTER_MFD',
      name: 'Master MFD (Principal Admin)',
      memberId: masterMemberId
    });
    onClose();
  };

  const handleSelectSub = (sub: SubDistributor) => {
    onSwitchSession({
      role: 'SUB_DISTRIBUTOR',
      subDistributorId: sub.id,
      subBrokerCode: sub.subBrokerCode,
      euin: sub.euin,
      name: sub.name,
      memberId: masterMemberId
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
    // Switch to the newly created sub-distributor
    handleSelectSub(newSub);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Distributor & Sub-Distributor Login Access</h2>
              <p className="text-xs text-slate-400">Switch workspace session between Master MFD and Sub-Brokers</p>
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
              {/* Option 1: Master MFD Admin */}
              <div
                onClick={handleSelectMaster}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  currentSession.role === 'MASTER_MFD'
                    ? 'border-amber-400/80 bg-amber-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                      ARN
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>Master MFD / Principal Member</span>
                        {currentSession.role === 'MASTER_MFD' && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Active Session
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        Member ID: {masterMemberId} · Full Access (All Clients & Global Orders)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Sub-Distributors Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Associated Sub-Distributors (Sub-Brokers)
                  </span>
                  <button
                    onClick={() => setActiveView('CREATE')}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Sub-Distributor</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {subDistributors.map((sub) => {
                    const isSelected =
                      currentSession.role === 'SUB_DISTRIBUTOR' &&
                      currentSession.subBrokerCode === sub.subBrokerCode;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSelectSub(sub)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500/80 bg-emerald-950/20 text-white'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold font-mono text-xs">
                              SUB
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span>{sub.name}</span>
                                {isSelected && (
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Active Sub Login
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                                <span>Code: <strong className="text-amber-400">{sub.subBrokerCode}</strong></span>
                                <span aria-hidden="true">·</span>
                                <span>EUIN: <strong className="text-slate-300">{sub.euin}</strong></span>
                                <span aria-hidden="true">·</span>
                                <span>Share: {sub.commissionShare}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono text-xs hidden sm:block">
                            <div className="text-slate-300">AUM: ₹{(sub.totalAum / 100000).toFixed(1)}L</div>
                            <div className="text-slate-500 text-[11px]">{sub.totalOrders} Orders</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Create Sub-Distributor Form */
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="font-semibold text-white text-sm">Register New Sub-Distributor (Sub-Broker)</div>
                <button
                  type="button"
                  onClick={() => setActiveView('LIST')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to List
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sub-Broker Code (BSE Tag)
                  </label>
                  <input
                    type="text"
                    value={subBrokerCode}
                    onChange={(e) => setSubBrokerCode(e.target.value)}
                    required
                    placeholder="e.g. SUB-104 or ARN-99412"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    EUIN (Employee Unique ID)
                  </label>
                  <input
                    type="text"
                    value={euin}
                    onChange={(e) => setEuin(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g. E184920"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Firm / Agency Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Apex Wealth Solutions"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact Advisor / Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="advisor@firm.in"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="+91 98200 00000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Brokerage Commission Split (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="95"
                      step="5"
                      value={commissionShare}
                      onChange={(e) => setCommissionShare(Number(e.target.value))}
                      className="flex-1 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-amber-400 text-sm w-12 text-right">
                      {commissionShare}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Sub-distributor receives {commissionShare}% of mutual fund trail brokerage; master distributor retains {100 - commissionShare}%.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveView('LIST')}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Save & Login as Sub-Distributor
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
