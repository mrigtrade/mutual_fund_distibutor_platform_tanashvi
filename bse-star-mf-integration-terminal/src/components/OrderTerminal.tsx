import React, { useState, useEffect } from 'react';
import { ClientUcc, Scheme, BseCredentials, BseOrder, Mandate, ActiveUserSession, SubDistributor } from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import { Send, CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Clock, AlertCircle, UserCheck } from 'lucide-react';

interface OrderTerminalProps {
  clients: ClientUcc[];
  schemes: Scheme[];
  mandates: Mandate[];
  credentials: BseCredentials;
  currentSession: ActiveUserSession;
  subDistributors: SubDistributor[];
  initialScheme?: Scheme | null;
  initialOrderType?: 'LUMPSUM' | 'SIP' | null;
  onOrderPlaced: (order: BseOrder) => void;
  onNavigateToClients: () => void;
}

export const OrderTerminal: React.FC<OrderTerminalProps> = ({
  clients,
  schemes,
  mandates,
  credentials,
  currentSession,
  subDistributors,
  initialScheme,
  initialOrderType,
  onOrderPlaced,
  onNavigateToClients
}) => {
  // If in Sub-Distributor mode, restrict/prioritize clients belonging to this sub-broker
  const visibleClients = currentSession.role === 'SUB_DISTRIBUTOR'
    ? clients.filter(c => c.subBrokerCode === currentSession.subBrokerCode || !c.subBrokerCode)
    : clients;

  const [selectedClientCode, setSelectedClientCode] = useState<string>(visibleClients[0]?.clientCode || '');
  const [selectedSubBrokerCode, setSelectedSubBrokerCode] = useState<string>(
    currentSession.role === 'SUB_DISTRIBUTOR' ? (currentSession.subBrokerCode || '') : 'DIRECT'
  );

  useEffect(() => {
    if (visibleClients.length > 0 && !visibleClients.some(c => c.clientCode === selectedClientCode)) {
      setSelectedClientCode(visibleClients[0].clientCode);
    }
  }, [currentSession, visibleClients, selectedClientCode]);

  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>(
    initialScheme?.schemeCode || schemes[0]?.schemeCode || ''
  );
  const [targetSchemeCode, setTargetSchemeCode] = useState<string>(schemes[1]?.schemeCode || '');
  
  const [activeTab, setActiveTab] = useState<'LUMPSUM' | 'XSIP' | 'REDEMPTION' | 'SWITCH'>(
    initialOrderType === 'SIP' ? 'XSIP' : 'LUMPSUM'
  );

  const [amount, setAmount] = useState<number>(initialScheme?.minLumpsum || 5000);
  const [units, setUnits] = useState<string>('');
  const [dpType, setDpType] = useState<'PHYSICAL' | 'DEMAT'>('PHYSICAL');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NETBANKING' | 'NEFT_RTGS' | 'MANDATE'>('UPI');
  
  // XSIP Specific
  const [sipFrequency, setSipFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'QUARTERLY'>('MONTHLY');
  const [sipStartDate, setSipStartDate] = useState<string>('2026-11-05');
  const [sipInstallments, setSipInstallments] = useState<number>(60);
  const [selectedMandateId, setSelectedMandateId] = useState<string>(mandates[0]?.mandateId || '');
  const [firstOrderToday, setFirstOrderToday] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<BseOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedClient = visibleClients.find(c => c.clientCode === selectedClientCode) || visibleClients[0];
  const selectedScheme = schemes.find(s => s.schemeCode === selectedSchemeCode) || schemes[0];
  const targetScheme = schemes.find(s => s.schemeCode === targetSchemeCode) || schemes[1];

  const clientMandates = mandates.filter(m => m.clientCode === selectedClientCode && m.status === 'APPROVED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedClient) {
      setErrorMessage('Please select or register a Client UCC first');
      return;
    }

    if (!selectedScheme) {
      setErrorMessage('Please select an authorized Mutual Fund scheme');
      return;
    }

    setIsSubmitting(true);

    const subObj = subDistributors.find(s => s.subBrokerCode === selectedSubBrokerCode);
    const effectiveSubBrokerCode = currentSession.role === 'SUB_DISTRIBUTOR'
      ? (currentSession.subBrokerCode || '')
      : (selectedSubBrokerCode !== 'DIRECT' ? selectedSubBrokerCode : '');
    const effectiveEuin = currentSession.role === 'SUB_DISTRIBUTOR'
      ? (currentSession.euin || '')
      : (subObj?.euin || '');

    try {
      if (activeTab === 'LUMPSUM') {
        const order = await BseApiService.placeOrder({
          client: selectedClient,
          scheme: selectedScheme,
          orderType: 'LUMPSUM_PURCHASE',
          amount: Number(amount),
          paymentMode,
          dpType,
          subBrokerCode: effectiveSubBrokerCode,
          euin: effectiveEuin
        }, credentials);
        setSubmittedOrder(order);
        onOrderPlaced(order);
      } else if (activeTab === 'XSIP') {
        if (!selectedMandateId && clientMandates.length === 0) {
          throw new Error('No approved e-NACH Mandate found for this client. Please create a mandate first.');
        }
        const order = await BseApiService.registerXsip({
          client: selectedClient,
          scheme: selectedScheme,
          mandateId: selectedMandateId || clientMandates[0]?.mandateId || 'MDT-DEFAULT',
          installmentAmount: Number(amount),
          frequency: sipFrequency,
          startDate: sipStartDate,
          installments: Number(sipInstallments),
          firstOrderToday,
          subBrokerCode: effectiveSubBrokerCode,
          euin: effectiveEuin
        }, credentials);
        setSubmittedOrder(order);
        onOrderPlaced(order);
      } else if (activeTab === 'REDEMPTION') {
        const order = await BseApiService.placeOrder({
          client: selectedClient,
          scheme: selectedScheme,
          orderType: 'REDEMPTION',
          amount: Number(amount),
          units: units ? Number(units) : undefined,
          paymentMode: 'MANDATE',
          dpType,
          subBrokerCode: effectiveSubBrokerCode,
          euin: effectiveEuin
        }, credentials);
        setSubmittedOrder(order);
        onOrderPlaced(order);
      } else if (activeTab === 'SWITCH') {
        const order = await BseApiService.placeOrder({
          client: selectedClient,
          scheme: selectedScheme,
          orderType: 'SWITCH',
          amount: Number(amount),
          targetScheme,
          paymentMode: 'MANDATE',
          dpType,
          subBrokerCode: effectiveSubBrokerCode,
          euin: effectiveEuin
        }, credentials);
        setSubmittedOrder(order);
        onOrderPlaced(order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with BSE StAR MF API');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Status / Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            BSE StAR MF Order Routing Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mutual fund transaction gateway via Member <span className="text-amber-400 font-mono">{credentials.memberId}</span> ({credentials.environment.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-300">
            Cutoff Window: <span className="text-emerald-400 font-semibold">OPEN (T+1 NAV)</span>
          </div>
        </div>
      </div>

      {/* Main Order Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Builder */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Order Type Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('LUMPSUM'); setSubmittedOrder(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'LUMPSUM'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lumpsum Purchase
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('XSIP'); setSubmittedOrder(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'XSIP'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              XSIP (e-Mandate)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('REDEMPTION'); setSubmittedOrder(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'REDEMPTION'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Redemption
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('SWITCH'); setSubmittedOrder(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'SWITCH'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Switch Scheme
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Broker / Sub-Broker Attribution Block */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              {currentSession.role === 'SUB_DISTRIBUTOR' ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">Order Routing Attribution:</span>
                    <span className="font-semibold text-white">{currentSession.name}</span>
                  </div>
                  <div className="font-mono text-emerald-400 font-bold">
                    [{currentSession.subBrokerCode} · EUIN: {currentSession.euin}]
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Broker / Sub-Distributor Tag:</span>
                  </div>
                  <select
                    value={selectedSubBrokerCode}
                    onChange={(e) => setSelectedSubBrokerCode(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  >
                    <option value="DIRECT">Direct MFD (No Sub-Broker Attribution)</option>
                    {subDistributors.map((sub) => (
                      <option key={sub.id} value={sub.subBrokerCode}>
                        {sub.subBrokerCode} — {sub.name} (EUIN: {sub.euin})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 1. Client UCC Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Investor / Client UCC
                </label>
                <button
                  type="button"
                  onClick={onNavigateToClients}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  + Register New UCC
                </button>
              </div>
              <select
                value={selectedClientCode}
                onChange={(e) => setSelectedClientCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400 font-mono"
              >
                {visibleClients.map((c) => (
                  <option key={c.clientCode} value={c.clientCode}>
                    {c.clientCode} - {c.fullName} (PAN: {c.pan}) {c.subBrokerCode ? `[Sub: ${c.subBrokerCode}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Scheme Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'SWITCH' ? 'Source Scheme (Switch Out)' : 'Mutual Fund Scheme'}
              </label>
              <select
                value={selectedSchemeCode}
                onChange={(e) => {
                  setSelectedSchemeCode(e.target.value);
                  const scheme = schemes.find(s => s.schemeCode === e.target.value);
                  if (scheme && activeTab === 'LUMPSUM') {
                    setAmount(scheme.minLumpsum);
                  } else if (scheme && activeTab === 'XSIP') {
                    setAmount(scheme.minSip);
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400"
              >
                {schemes.map((s) => (
                  <option key={s.schemeCode} value={s.schemeCode}>
                    [{s.schemeCode}] {s.schemeName} — NAV: ₹{s.nav.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Scheme (Switch only) */}
            {activeTab === 'SWITCH' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Scheme (Switch In within same AMC)
                </label>
                <select
                  value={targetSchemeCode}
                  onChange={(e) => setTargetSchemeCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400"
                >
                  {schemes.filter(s => s.schemeCode !== selectedSchemeCode).map((s) => (
                    <option key={s.schemeCode} value={s.schemeCode}>
                      [{s.schemeCode}] {s.schemeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Amount & Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {activeTab === 'XSIP' ? 'Monthly Installment (₹)' : 'Investment Amount (₹)'}
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-base focus:outline-hidden focus:border-amber-400 tabular-nums"
                  required
                />
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Min: ₹{activeTab === 'XSIP' ? selectedScheme?.minSip : selectedScheme?.minLumpsum}
                </div>
              </div>

              {activeTab === 'REDEMPTION' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Redemption Units (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Leave blank to redeem by Amount"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-base focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Holding Nature / DP Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDpType('PHYSICAL')}
                      className={`py-2 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                        dpType === 'PHYSICAL'
                          ? 'border-amber-400 bg-amber-950/30 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Physical (SOA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDpType('DEMAT')}
                      className={`py-2 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                        dpType === 'DEMAT'
                          ? 'border-amber-400 bg-amber-950/30 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Demat (NSDL/CDSL)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* XSIP Specific Fields */}
            {activeTab === 'XSIP' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  BSE StAR MF XSIP Scheduling
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Frequency</label>
                    <select
                      value={sipFrequency}
                      onChange={(e) => setSipFrequency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="QUARTERLY">Quarterly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SIP Debit Date</label>
                    <select
                      value={sipStartDate}
                      onChange={(e) => setSipStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                    >
                      <option value="2026-11-01">1st of Month</option>
                      <option value="2026-11-05">5th of Month</option>
                      <option value="2026-11-10">10th of Month</option>
                      <option value="2026-11-15">15th of Month</option>
                      <option value="2026-11-20">20th of Month</option>
                      <option value="2026-11-25">25th of Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Total Installments</label>
                    <select
                      value={sipInstallments}
                      onChange={(e) => setSipInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                      <option value={120}>120 Months (10 Years)</option>
                      <option value={360}>360 Months (Perpetual)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Select e-NACH Mandate (Auto-Debit Bank Account)
                  </label>
                  <select
                    value={selectedMandateId}
                    onChange={(e) => setSelectedMandateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-white font-mono"
                  >
                    {clientMandates.length > 0 ? (
                      clientMandates.map(m => (
                        <option key={m.mandateId} value={m.mandateId}>
                          {m.mandateId} — {m.bankName} ({m.bankAccount}) Max: ₹{m.maxLimit.toLocaleString('en-IN')}
                        </option>
                      ))
                    ) : (
                      <option value="">No approved mandate for this client (Click Mandates tab to add)</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="firstOrderToday"
                    checked={firstOrderToday}
                    onChange={(e) => setFirstOrderToday(e.target.checked)}
                    className="rounded text-amber-400 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="firstOrderToday" className="text-xs text-slate-300 cursor-pointer">
                    Execute 1st installment order immediately today (T+0 payment link)
                  </label>
                </div>
              </div>
            )}

            {/* Payment Method for Purchase */}
            {activeTab === 'LUMPSUM' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  BSE StAR Payment Gateway Channel
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center cursor-pointer transition-colors ${
                      paymentMode === 'UPI'
                        ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    UPI Instant
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('NETBANKING')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center cursor-pointer transition-colors ${
                      paymentMode === 'NETBANKING'
                        ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    NetBanking
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('NEFT_RTGS')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center cursor-pointer transition-colors ${
                      paymentMode === 'NEFT_RTGS'
                        ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    NEFT / RTGS
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Submitting to BSE StAR MF Gateway...'
                    : `Execute ${activeTab} Order via BSE API`}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Summary & Result Preview */}
        <div className="space-y-5">
          {/* Investor Verification Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Selected Investor Summary
            </h3>
            {selectedClient ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Code:</span>
                  <span className="text-white font-mono font-medium">{selectedClient.clientCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Investor:</span>
                  <span className="text-white font-medium">{selectedClient.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PAN Card:</span>
                  <span className="text-white font-mono">{selectedClient.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Linked Bank:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[160px]">
                    {selectedClient.primaryBank.bankName} (••••{selectedClient.primaryBank.accountNumber.slice(-4)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">KYC Status:</span>
                  <span className="text-emerald-400 font-semibold font-mono">SEBI KYC OK</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No client selected</p>
            )}
          </div>

          {/* Scheme Cutoff & NAV Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Order Execution Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">BSE Scheme Code:</span>
                <span className="text-amber-400 font-mono font-semibold">{selectedScheme?.schemeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current NAV:</span>
                <span className="text-white font-mono font-bold tabular-nums">₹{selectedScheme?.nav.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approx. Units:</span>
                <span className="text-white font-mono tabular-nums">
                  {selectedScheme ? (amount / selectedScheme.nav).toFixed(3) : '0.000'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SEBI Cutoff:</span>
                <span className="text-slate-300 font-mono">{selectedScheme?.cutoffTime}</span>
              </div>
            </div>
          </div>

          {/* Order Placement Confirmation Card */}
          {submittedOrder && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Order Placed on BSE StAR MF</span>
              </div>

              <div className="text-xs space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">BSE Order No:</span>
                  <span className="text-white font-bold">{submittedOrder.bseOrderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Internal Ref:</span>
                  <span className="text-slate-300">{submittedOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-emerald-300 font-bold">₹{submittedOrder.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {submittedOrder.paymentUrl && (
                <div className="pt-2">
                  <a
                    href={submittedOrder.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Authorize Payment via BSE PG</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    BSE StAR Payment Gateway Link active
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
