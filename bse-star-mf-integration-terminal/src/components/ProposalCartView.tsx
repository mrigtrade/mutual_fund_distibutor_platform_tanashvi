import React, { useState } from 'react';
import { ShoppingCart, Plus, Link, Send, CheckCircle2, ArrowRight, ShieldCheck, Copy, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { MOCK_SCHEMES } from '../data/mockBseData';

export const ProposalCartView: React.FC = () => {
  const [clientCode, setClientCode] = useState('UCC-RAMESH-001');
  const [investorName, setInvestorName] = useState('Ramesh Sharma');
  const [proposalTitle, setProposalTitle] = useState('2026 Core Wealth Creation Basket');
  const [mfdArn] = useState('ARN-347849');
  const [mfdEuin] = useState('E123456');

  // New item draft state
  const [selectedSchemeCode, setSelectedSchemeCode] = useState(MOCK_SCHEMES[0].schemeCode);
  const [newItemType, setNewItemType] = useState<'LUMPSUM' | 'SIP'>('SIP');
  const [newItemAmount, setNewItemAmount] = useState(5000);
  const [newItemSipDay, setNewItemSipDay] = useState(10);

  const [items, setItems] = useState<Array<{
    type: 'LUMPSUM' | 'SIP';
    schemeName: string;
    schemeCode: string;
    amount: number;
    sipDay?: number;
  }>>([
    {
      type: 'LUMPSUM',
      schemeName: 'HDFC Top 100 Fund - Direct Plan - Growth',
      schemeCode: '119551',
      amount: 25000
    },
    {
      type: 'SIP',
      schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
      schemeCode: '122639',
      amount: 10000,
      sipDay: 10
    }
  ]);

  const [createdProposal, setCreatedProposal] = useState<{
    id: string;
    shareUrl: string;
    token: string;
    status: 'SENT_TO_INVESTOR' | 'VIEWED' | 'EXECUTED';
    bseOrderNo?: string;
    bseRegNo?: string;
    paymentUrl?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const totalLumpsum = items
    .filter(i => i.type === 'LUMPSUM')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalSip = items
    .filter(i => i.type === 'SIP')
    .reduce((sum, i) => sum + i.amount, 0);

  const handleAddItem = () => {
    const scheme = MOCK_SCHEMES.find(s => s.schemeCode === selectedSchemeCode);
    if (!scheme) return;
    setItems([
      ...items,
      {
        type: newItemType,
        schemeName: scheme.schemeName,
        schemeCode: scheme.schemeCode,
        amount: Number(newItemAmount),
        sipDay: newItemType === 'SIP' ? newItemSipDay : undefined
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerateLink = () => {
    const proposalId = `PROP-${Date.now().toString().slice(-6)}`;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setCreatedProposal({
      id: proposalId,
      shareUrl: `https://tanashvi.com/invest/cart/${proposalId}?token=${token}`,
      token,
      status: 'SENT_TO_INVESTOR'
    });
  };

  const handleSimulateInvestorClick = () => {
    if (createdProposal) {
      setCreatedProposal({
        ...createdProposal,
        status: 'VIEWED'
      });
    }
  };

  const handleSimulateExecution = () => {
    if (createdProposal) {
      setCreatedProposal({
        ...createdProposal,
        status: 'EXECUTED',
        bseOrderNo: `BBO-${Date.now().toString().slice(-6)}`,
        bseRegNo: `REG-${Date.now().toString().slice(-6)}`,
        paymentUrl: `https://bsestarmfdemo.bseindia.com/PaymentGateway?orderNo=BBO-714114&amt=${totalLumpsum}`
      });
    }
  };

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs text-[#c5a059] uppercase tracking-widest font-semibold">
              Tanashvi MFD Suite · Magic Cart Links
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            Distributor Proposal Cart Builder
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Curate bespoke investment baskets with statutory ARN-347849 & EUIN E123456 attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-[#c5a059]">ARN: {mfdArn}</span>
          <span className="text-slate-600">|</span>
          <span>EUIN: {mfdEuin}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cart Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              1. Investor & Proposal Meta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Client UCC</label>
                <input
                  type="text"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Investor Name</label>
                <input
                  type="text"
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Scheme Basket */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                2. Curated Scheme Basket
              </h3>
              <span className="text-xs text-slate-400 font-mono">{items.length} Schemes Selected</span>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        it.type === 'LUMPSUM'
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {it.type}
                      </span>
                      <span className="text-xs font-semibold text-white">{it.schemeName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      AMFI Code: {it.schemeCode} {it.sipDay ? `· Scheduled on the ${it.sipDay}th of every month` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono font-bold text-white text-sm">
                      {formatInr(it.amount)}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                      title="Remove scheme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Scheme Form */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider block">
                + Add Scheme to Basket
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <select
                    value={selectedSchemeCode}
                    onChange={(e) => setSelectedSchemeCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                  >
                    {MOCK_SCHEMES.map((s) => (
                      <option key={s.schemeCode} value={s.schemeCode}>
                        {s.schemeName} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                  >
                    <option value="SIP">SIP</option>
                    <option value="LUMPSUM">Lumpsum</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(Number(e.target.value))}
                    step="500"
                    placeholder="Amount ₹"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    onClick={handleAddItem}
                    className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-[#c5a059] hover:text-slate-950 text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Totals & Action */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 space-y-1">
                <div>Total Fresh Lumpsum: <strong className="text-white font-mono">{formatInr(totalLumpsum)}</strong></div>
                <div>Total Monthly SIP: <strong className="text-emerald-400 font-mono">{formatInr(totalSip)}/mo</strong></div>
              </div>

              <button
                onClick={handleGenerateLink}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#c5a059] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#dfc282] transition cursor-pointer shadow-lg"
              >
                <Link className="w-4 h-4" />
                Generate Magic Cart Link
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Magic Cart Preview & Live Simulator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 space-y-5">
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#c5a059]" />
              Magic Link Status
            </h3>

            {!createdProposal ? (
              <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Click "Generate Magic Cart Link" to create an investor link with ARN-347849 attribution.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Generated Cart Link</span>
                  <div className="p-2.5 bg-slate-950 border border-slate-700 rounded font-mono text-[11px] text-amber-300 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">{createdProposal.shareUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdProposal.shareUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Cart Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    createdProposal.status === 'EXECUTED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : (createdProposal.status === 'VIEWED' ? 'bg-sky-950 text-sky-300 border border-sky-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30')
                  }`}>
                    {createdProposal.status}
                  </span>
                </div>

                {/* Simulation Controls for testing */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    Simulate Investor Flow
                  </span>

                  {createdProposal.status === 'SENT_TO_INVESTOR' && (
                    <button
                      onClick={handleSimulateInvestorClick}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Investor Opens Magic Link (Viewed)
                    </button>
                  )}

                  {createdProposal.status === 'VIEWED' && (
                    <button
                      onClick={handleSimulateExecution}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Investor Clicks "Approve & Invest"
                    </button>
                  )}

                  {createdProposal.status === 'EXECUTED' && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2 text-[11px] text-emerald-200">
                      <div className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>BSE StAR MF Execution Complete!</span>
                      </div>
                      <div>Lumpsum Order: <span className="font-mono">{createdProposal.bseOrderNo}</span></div>
                      <div>SIP Reg No: <span className="font-mono">{createdProposal.bseRegNo}</span></div>
                      {createdProposal.paymentUrl && (
                        <a
                          href={createdProposal.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1 text-[#c5a059] underline font-medium"
                        >
                          Open BSE Payment Gateway Link &rarr;
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

