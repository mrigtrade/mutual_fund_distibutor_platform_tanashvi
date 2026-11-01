import React, { useState } from 'react';
import { Mandate, ClientUcc, BseCredentials } from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import { Plus, CreditCard, ExternalLink, ShieldCheck, CheckCircle2, Clock, Copy, Check } from 'lucide-react';

interface MandateManagerProps {
  mandates: Mandate[];
  clients: ClientUcc[];
  credentials: BseCredentials;
  onMandateAdded: (mandate: Mandate) => void;
}

export const MandateManager: React.FC<MandateManagerProps> = ({
  mandates,
  clients,
  credentials,
  onMandateAdded
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState(clients[0]?.clientCode || '');
  const [maxLimit, setMaxLimit] = useState(100000);
  const [mandateType, setMandateType] = useState<'E_NACH' | 'NETBANKING' | 'PHYSICAL'>('E_NACH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateMandate = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.clientCode === selectedClientCode);
    if (!client) return;

    setIsSubmitting(true);
    try {
      const newMandate = await BseApiService.createMandate({
        client,
        maxLimit: Number(maxLimit),
        mandateType
      }, credentials);
      onMandateAdded(newMandate);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
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
            e-NACH & e-Mandate Master (NPCI)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered auto-debit authorizations for XSIP executions through BSE StAR MF
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Register New e-Mandate</span>
        </button>
      </div>

      {/* Mandate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mandates.map((m) => (
          <div
            key={m.mandateId}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-sm font-bold text-white">{m.mandateId}</span>
              </div>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                  m.status === 'APPROVED'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                }`}
              >
                {m.status === 'APPROVED' ? 'NPCI ACTIVE' : 'PENDING E-SIGN'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-300 font-semibold">{m.clientName}</div>
              <div className="text-slate-400 font-mono text-[11px]">{m.clientCode}</div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank & Acc:</span>
                <span className="text-slate-200">{m.bankName} ({m.bankAccount})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">UMRN:</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  {m.umrn.slice(0, 10)}...
                  <button
                    onClick={() => handleCopy(m.umrn, m.mandateId)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy UMRN"
                  >
                    {copiedId === m.mandateId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Debit Limit:</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  ₹{m.maxLimit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="text-slate-300">{m.mandateType}</span>
              </div>
            </div>

            {m.status === 'PENDING_AUTH' && m.authUrl && (
              <div className="pt-2">
                <a
                  href={m.authUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-semibold rounded flex items-center justify-center gap-1.5 border border-amber-400/30 transition-colors"
                >
                  <span>Complete NPCI NetBanking Auth</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Register Mandate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Create e-NACH Mandate</h2>
                <p className="text-xs text-slate-400">NPCI DigiLocker / NetBanking Auto-Debit Mandate</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMandate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Client UCC</label>
                <select
                  value={selectedClientCode}
                  onChange={(e) => setSelectedClientCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono"
                >
                  {clients.map(c => (
                    <option key={c.clientCode} value={c.clientCode}>
                      {c.clientCode} - {c.fullName} ({c.primaryBank.bankName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mandate Type</label>
                <select
                  value={mandateType}
                  onChange={(e) => setMandateType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                >
                  <option value="E_NACH">e-NACH (Instant Aadhaar / NetBanking e-Sign)</option>
                  <option value="NETBANKING">NetBanking Standing Instruction Biller</option>
                  <option value="PHYSICAL">Physical NACH Form Upload</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Maximum Debit Cap per Transaction (₹)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-sm"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Typically ₹50,000 to ₹1,00,000 for retail SIP transactions
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering on BSE...' : 'Submit to BSE Mandate Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
