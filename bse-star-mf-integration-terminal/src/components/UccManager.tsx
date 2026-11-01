import React, { useState } from 'react';
import { ClientUcc, BseCredentials, TaxStatus, HoldingNature, ActiveUserSession, SubDistributor } from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import { Plus, UserCheck, ShieldCheck, Search, Check, AlertCircle, Building2, User, FileText, ArrowRight } from 'lucide-react';

interface UccManagerProps {
  clients: ClientUcc[];
  credentials: BseCredentials;
  currentSession: ActiveUserSession;
  subDistributors: SubDistributor[];
  onClientAdded: (client: ClientUcc) => void;
  onTradeWithClient: (client: ClientUcc) => void;
  onNavigateToKyc?: () => void;
}

export const UccManager: React.FC<UccManagerProps> = ({
  clients,
  credentials,
  currentSession,
  subDistributors,
  onClientAdded,
  onTradeWithClient,
  onNavigateToKyc
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSubBroker, setFilterSubBroker] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Client Form State
  const [clientCode, setClientCode] = useState(`CL${Math.floor(100000 + Math.random() * 900000)}`);
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [taxStatus, setTaxStatus] = useState<TaxStatus>('RI');
  const [holdingNature, setHoldingNature] = useState<HoldingNature>('SI');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'SB' | 'CA'>('SB');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [mappedSubBroker, setMappedSubBroker] = useState<string>(
    currentSession.role === 'SUB_DISTRIBUTOR' ? (currentSession.subBrokerCode || '') : 'DIRECT'
  );

  const filteredClients = clients.filter((c) => {
    // If in Sub-Distributor mode, only show their clients
    if (currentSession.role === 'SUB_DISTRIBUTOR' && c.subBrokerCode !== currentSession.subBrokerCode) {
      return false;
    }

    if (filterSubBroker !== 'ALL' && c.subBrokerCode !== filterSubBroker) {
      return false;
    }

    return (
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(search.toLowerCase()) ||
      c.pan.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const subObj = subDistributors.find(s => s.subBrokerCode === mappedSubBroker);
    const assignedSubCode = currentSession.role === 'SUB_DISTRIBUTOR'
      ? currentSession.subBrokerCode
      : (mappedSubBroker !== 'DIRECT' ? mappedSubBroker : undefined);
    const assignedEuin = currentSession.role === 'SUB_DISTRIBUTOR'
      ? currentSession.euin
      : subObj?.euin;

    const newClient: ClientUcc = {
      clientCode,
      fullName,
      pan: pan.toUpperCase(),
      email,
      mobile,
      dob,
      taxStatus,
      holdingNature,
      primaryBank: {
        accountNumber,
        accountType,
        ifsc: ifsc.toUpperCase(),
        bankName: bankName || 'Standard Chartered / Indian Bank',
        branchName: 'Main Corporate Branch'
      },
      nominee: nomineeName ? {
        name: nomineeName,
        relationship: nomineeRelation,
        allocationPercentage: 100
      } : undefined,
      fatcaCompliant: true,
      kycStatus: 'VERIFIED',
      aofStatus: 'APPROVED',
      subBrokerCode: assignedSubCode,
      euin: assignedEuin,
      createdAt: new Date().toISOString()
    };

    try {
      await BseApiService.registerUcc(newClient, credentials);
      onClientAdded(newClient);
      setShowAddModal(false);
      // Reset
      setClientCode(`CL${Math.floor(100000 + Math.random() * 900000)}`);
      setFullName('');
      setPan('');
      setEmail('');
      setMobile('');
      setAccountNumber('');
      setIfsc('');
    } catch (err: any) {
      setStatusMessage(err.message || 'Error creating UCC on BSE StAR MF');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Unique Client Code (UCC) Master
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            SEBI & BSE StAR MF registered investor profiles, KYC verification & bank linkages
            {currentSession.role === 'SUB_DISTRIBUTOR' && (
              <span className="text-emerald-400 font-mono ml-1">
                (Filtered for Sub-Distributor: {currentSession.subBrokerCode})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToKyc && (
            <button
              onClick={onNavigateToKyc}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify e-KYC / KRA First</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register New UCC with BSE</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Client Code, Investor Name, or PAN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400"
          />
        </div>

        {currentSession.role === 'MASTER_MFD' && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 shrink-0">Sub-Distributor:</span>
            <select
              value={filterSubBroker}
              onChange={(e) => setFilterSubBroker(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Partners & Direct</option>
              {subDistributors.map((sub) => (
                <option key={sub.id} value={sub.subBrokerCode}>
                  {sub.subBrokerCode} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Client Code</th>
                <th className="py-3 px-4">Investor Name</th>
                <th className="py-3 px-4">PAN & Tax Status</th>
                <th className="py-3 px-4">Sub-Broker / EUIN</th>
                <th className="py-3 px-4">Linked Bank & IFSC</th>
                <th className="py-3 px-4">BSE KYC / AOF</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredClients.map((client) => (
                <tr key={client.clientCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-amber-400">
                    {client.clientCode}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-white">{client.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{client.mobile}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{client.pan}</div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      {client.taxStatus === 'RI' ? 'Resident Individual' : client.taxStatus} · {client.holdingNature === 'SI' ? 'Single' : 'Joint'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    {client.subBrokerCode ? (
                      <div>
                        <div className="font-mono font-semibold text-amber-400">{client.subBrokerCode}</div>
                        <div className="text-[10px] text-slate-400 font-mono">EUIN: {client.euin || 'E100000'}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">Direct MFD</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-300 font-sans">{client.primaryBank.bankName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ••••{client.primaryBank.accountNumber.slice(-4)} · {client.primaryBank.ifsc}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>BSE Verified</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      FATCA: Active
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onTradeWithClient(client)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Trade</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add UCC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Register New UCC (Unique Client Code)</h2>
                <p className="text-xs text-slate-400">Directly syncs to BSE StAR MF Client Registration Master</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client UCC Code</label>
                  <input
                    type="text"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-amber-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name (as per PAN)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kaushik Ghosh"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile (+91)</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98301 44520"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="font-semibold text-slate-200">Primary Bank & Payout Account</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank Ltd"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100289148201"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0000060"
                      maxLength={11}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Account Type</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    >
                      <option value="SB">Savings Bank (SB)</option>
                      <option value="CA">Current Account (CA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Nominee details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nominee Name</label>
                  <input
                    type="text"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="Full Nominee Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Relationship</label>
                  <select
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                  </select>
                </div>
              </div>

              {statusMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded text-rose-300">
                  {statusMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering with BSE...' : 'Submit UCC to BSE StAR MF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
