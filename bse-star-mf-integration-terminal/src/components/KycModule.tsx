import React, { useState } from 'react';
import {
  KycRecord,
  ClientUcc,
  BseCredentials,
  ActiveUserSession,
  SubDistributor,
  KraStatus,
  KraAgency
} from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Camera,
  FileText,
  CreditCard,
  Building,
  ArrowRight,
  RefreshCw,
  Plus,
  ExternalLink,
  Lock,
  Smartphone,
  Eye,
  Check
} from 'lucide-react';

interface KycModuleProps {
  kycRecords: KycRecord[];
  credentials: BseCredentials;
  currentSession: ActiveUserSession;
  subDistributors: SubDistributor[];
  onKycCreated: (record: KycRecord) => void;
  onConvertToUcc: (record: KycRecord) => void;
}

export const KycModule: React.FC<KycModuleProps> = ({
  kycRecords,
  credentials,
  currentSession,
  subDistributors,
  onKycCreated,
  onConvertToUcc
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LOOKUP' | 'NEW_WIZARD' | 'PIPELINE'>('LOOKUP');

  // PAN Lookup State
  const [panSearch, setPanSearch] = useState('ABCDE1234F');
  const [isSearchingPan, setIsSearchingPan] = useState(false);
  const [panLookupResult, setPanLookupResult] = useState<KycRecord | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // 5-Step Fresh e-KYC Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardPan, setWizardPan] = useState('');
  const [wizardName, setWizardName] = useState('');
  const [wizardDob, setWizardDob] = useState('1992-05-15');
  const [wizardEmail, setWizardEmail] = useState('');
  const [wizardMobile, setWizardMobile] = useState('');
  const [wizardSubBroker, setWizardSubBroker] = useState<string>(
    currentSession.role === 'SUB_DISTRIBUTOR' ? (currentSession.subBrokerCode || '') : 'DIRECT'
  );

  // Step 2: Aadhaar Digilocker
  const [aadhaarNumber, setAadhaarNumber] = useState('8492 1029 4810');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [extractedAddress, setExtractedAddress] = useState({
    line1: 'Flat 302, Palm Beach Residency, Sector 14',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400703',
    country: 'India'
  });

  // Step 3: Penny Drop Bank
  const [bankAccount, setBankAccount] = useState('50100491028491');
  const [bankIfsc, setBankIfsc] = useState('HDFC0000060');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [isPennyDropRunning, setIsPennyDropRunning] = useState(false);
  const [pennyDropResult, setPennyDropResult] = useState<{
    success: boolean;
    beneficiaryName: string;
    matchScore: number;
  } | null>(null);

  // Step 4: IPV
  const [ipvOtp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isIpvCaptured, setIsIpvCaptured] = useState(false);

  // Step 5: Submission
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [completedKycRecord, setCompletedKycRecord] = useState<KycRecord | null>(null);

  // Handle PAN Lookup
  const handleSearchPan = async () => {
    if (!panSearch || panSearch.length < 10) {
      setLookupError('Please enter a valid 10-character PAN number');
      return;
    }
    setLookupError(null);
    setIsSearchingPan(true);
    setPanLookupResult(null);

    await new Promise((r) => setTimeout(r, 550));
    const cleanPan = panSearch.trim().toUpperCase();
    const existing = kycRecords.find((k) => k.pan.toUpperCase() === cleanPan);

    if (existing) {
      setPanLookupResult(existing);
    } else {
      // Generate realistic lookup for un-indexed PAN
      setPanLookupResult({
        id: 'KYC-QUERY-' + Math.floor(10000 + Math.random() * 90000),
        pan: cleanPan,
        clientName: 'INVESTOR ' + cleanPan.slice(0, 5),
        dob: '1990-01-01',
        mobile: '+91 98•••• •••10',
        email: 'in•••••@gmail.com',
        kraStatus: 'NOT_KYC',
        kraAgency: 'CVL_KRA',
        panAadhaarLinked: true,
        ipvCompleted: false,
        pennyDropVerified: false,
        bseUccCreated: false,
        lastUpdated: new Date().toISOString().slice(0, 10)
      });
    }
    setIsSearchingPan(false);
  };

  // Run Penny Drop
  const handleRunPennyDrop = async () => {
    setIsPennyDropRunning(true);
    await new Promise((r) => setTimeout(r, 650));
    setPennyDropResult({
      success: true,
      beneficiaryName: wizardName.toUpperCase() || 'INVESTOR VERIFIED',
      matchScore: 99
    });
    setIsPennyDropRunning(false);
  };

  // Finish e-KYC Wizard
  const handleFinishWizard = async () => {
    setIsSubmittingKyc(true);
    await new Promise((r) => setTimeout(r, 800));

    const newKyc: KycRecord = {
      id: `KYC-202610-${Math.floor(100 + Math.random() * 900)}`,
      pan: wizardPan.toUpperCase(),
      clientName: wizardName,
      dob: wizardDob,
      mobile: wizardMobile,
      email: wizardEmail,
      kraStatus: 'KYC_VALIDATED',
      kraAgency: 'CVL_KRA',
      ckycKin: '9' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      panAadhaarLinked: true,
      ipvCompleted: true,
      pennyDropVerified: true,
      bseUccCreated: false,
      subBrokerCode: currentSession.role === 'SUB_DISTRIBUTOR'
        ? currentSession.subBrokerCode
        : (wizardSubBroker !== 'DIRECT' ? wizardSubBroker : undefined),
      address: extractedAddress,
      bankVerification: {
        bankName,
        accountNumber: bankAccount,
        ifsc: bankIfsc.toUpperCase(),
        beneficiaryName: wizardName.toUpperCase(),
        nameMatchScore: 100
      },
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    onKycCreated(newKyc);
    setCompletedKycRecord(newKyc);
    setIsSubmittingKyc(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              SEBI KRA & e-KYC Onboarding Suite
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              BSE StAR MF Integrated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time KRA verification (CVL, CAMS, NDML, Karvy), CKYC registry lookup & paperless Aadhaar/DigiLocker onboarding
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveSubTab('LOOKUP')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'LOOKUP'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PAN / KRA Status Check
          </button>
          <button
            onClick={() => setActiveSubTab('NEW_WIZARD')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'NEW_WIZARD'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Fresh e-KYC Wizard
          </button>
          <button
            onClick={() => setActiveSubTab('PIPELINE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'PIPELINE'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            KYC Pipeline ({kycRecords.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: PAN & KRA STATUS LOOKUP */}
      {activeSubTab === 'LOOKUP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Box */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Instant SEBI KRA Query</h2>
              <p className="text-xs text-slate-400 mt-1">
                Verify whether a client is already KYC validated across India's 5 licensed KRAs
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Investor PAN Card
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={panSearch}
                    onChange={(e) => setPanSearch(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-sm focus:outline-hidden focus:border-amber-400"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
                {lookupError && <p className="text-xs text-rose-400 mt-1">{lookupError}</p>}
              </div>

              <button
                type="button"
                onClick={handleSearchPan}
                disabled={isSearchingPan}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearchingPan ? 'animate-spin' : ''}`} />
                <span>{isSearchingPan ? 'Checking KRAs...' : 'Verify KYC Status across KRAs'}</span>
              </button>
            </div>

            {/* Quick PAN samples */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
              <span className="text-[11px] text-slate-500">Quick Test PANs:</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {['ABCDE1234F', 'BNYPS4910K', 'AWRPK8821N', 'BTYPS9912Q'].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPanSearch(p); }}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-amber-300 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            {panLookupResult ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">PAN: {panLookupResult.pan}</span>
                    <h3 className="text-lg font-bold text-white tracking-tight">{panLookupResult.clientName}</h3>
                  </div>

                  {/* KRA Status Badge */}
                  <div>
                    {panLookupResult.kraStatus === 'KYC_VALIDATED' && (
                      <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>KYC VALIDATED (SEBI COMPLIANT)</span>
                      </span>
                    )}
                    {panLookupResult.kraStatus === 'KYC_REGISTERED' && (
                      <span className="px-3 py-1 rounded bg-blue-950 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>KYC REGISTERED</span>
                      </span>
                    )}
                    {panLookupResult.kraStatus === 'KYC_ON_HOLD' && (
                      <span className="px-3 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>KYC ON-HOLD (REMEDIATION REQUIRED)</span>
                      </span>
                    )}
                    {panLookupResult.kraStatus === 'NOT_KYC' && (
                      <span className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                        NON-KYC (FRESH ONBOARDING NEEDED)
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-slate-500">Registered KRA Agency:</span>
                    <div className="text-white font-semibold">{panLookupResult.kraAgency.replace('_', ' ')}</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-slate-500">Central KYC (CKYC KIN):</span>
                    <div className="text-amber-400 font-semibold">{panLookupResult.ckycKin || 'Not Assigned'}</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-slate-500">PAN-Aadhaar Link:</span>
                    <div className={panLookupResult.panAadhaarLinked ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {panLookupResult.panAadhaarLinked ? '✓ Linked & Seeded' : '✗ Not Linked (SEBI Restrictive)'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-slate-500">BSE StAR MF UCC Status:</span>
                    <div className={panLookupResult.bseUccCreated ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {panLookupResult.bseUccCreated ? `UCC Created (${panLookupResult.associatedClientCode})` : 'UCC Not Created Yet'}
                    </div>
                  </div>
                </div>

                {/* Address if available */}
                {panLookupResult.address && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                    <span className="text-slate-500 font-mono">KRA Verified Permanent Address:</span>
                    <div className="text-slate-200 mt-1">
                      {panLookupResult.address.line1}, {panLookupResult.address.city}, {panLookupResult.address.state} - {panLookupResult.address.pincode}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  {panLookupResult.kraStatus === 'KYC_VALIDATED' && !panLookupResult.bseUccCreated && (
                    <button
                      onClick={() => onConvertToUcc(panLookupResult)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Directly Create BSE UCC for this Verified Investor</span>
                    </button>
                  )}

                  {panLookupResult.kraStatus === 'NOT_KYC' && (
                    <button
                      onClick={() => {
                        setWizardPan(panLookupResult.pan);
                        setActiveSubTab('NEW_WIZARD');
                      }}
                      className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start Fresh Paperless e-KYC Journey for this PAN</span>
                    </button>
                  )}

                  {panLookupResult.bseUccCreated && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 py-2 font-mono">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Investor is 100% ready for mutual fund orders on BSE StAR MF.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Enter a PAN card to query real-time KRA records</p>
                <p className="text-xs text-slate-500">
                  Integrates with CVL, CAMS, NDML, NSE, and Karvy KRAs
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: 5-STEP FRESH e-KYC WIZARD */}
      {activeSubTab === 'NEW_WIZARD' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Step Indicator Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Paperless 5-Step Digital e-KYC Wizard</h2>
              <p className="text-xs text-slate-400">UIDAI DigiLocker e-Aadhaar, Bank Penny Drop & Video IPV verification</p>
            </div>

            {/* Step Breadcrumb Numbers */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {[
                { num: 1, label: 'PAN' },
                { num: 2, label: 'DigiLocker' },
                { num: 3, label: 'Bank Test' },
                { num: 4, label: 'Video IPV' },
                { num: 5, label: 'e-Sign' }
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                    wizardStep === s.num
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : wizardStep > s.num
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <span>{s.num}. {s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: PAN & Identity */}
          {wizardStep === 1 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Step 1: Investor PAN & Tax Identity</span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Permanent Account Number (PAN)</label>
                <input
                  type="text"
                  value={wizardPan}
                  onChange={(e) => setWizardPan(e.target.value.toUpperCase())}
                  placeholder="e.g. DKRPM1104P"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono uppercase text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Full Legal Name (Exact as per PAN)</label>
                <input
                  type="text"
                  value={wizardName}
                  onChange={(e) => setWizardName(e.target.value)}
                  placeholder="e.g. Tanvi Mehra"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={wizardDob}
                    onChange={(e) => setWizardDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Mobile (+91)</label>
                  <input
                    type="tel"
                    value={wizardMobile}
                    onChange={(e) => setWizardMobile(e.target.value)}
                    placeholder="+91 98200 44102"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={wizardEmail}
                  onChange={(e) => setWizardEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white"
                />
              </div>

              {/* Sub Broker attribution */}
              {currentSession.role === 'MASTER_MFD' ? (
                <div>
                  <label className="block text-slate-300 mb-1">Sub-Distributor Attribution</label>
                  <select
                    value={wizardSubBroker}
                    onChange={(e) => setWizardSubBroker(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono"
                  >
                    <option value="DIRECT">Direct MFD (No Sub-Broker)</option>
                    {subDistributors.map((s) => (
                      <option key={s.id} value={s.subBrokerCode}>
                        {s.subBrokerCode} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-emerald-400">
                  Mapped to Sub-Broker: {currentSession.subBrokerCode} ({currentSession.name})
                </div>
              )}

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                disabled={!wizardPan || !wizardName}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer disabled:opacity-50 mt-2"
              >
                Proceed to DigiLocker Aadhaar e-KYC →
              </button>
            </div>
          )}

          {/* STEP 2: DigiLocker Aadhaar */}
          {wizardStep === 2 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Step 2: UIDAI DigiLocker Paperless e-KYC</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="text-slate-300">Aadhaar Paperless Offline XML (UIDAI Gateway)</div>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />

                {!isOtpSent ? (
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded cursor-pointer font-semibold"
                  >
                    Send UIDAI Aadhaar OTP
                  </button>
                ) : (
                  <div className="space-y-2 pt-2">
                    <span className="text-emerald-400">OTP sent to Aadhaar-registered mobile (••••9102)</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP (e.g. 582910)"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAadhaarVerified(true)}
                        className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isAadhaarVerified && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aadhaar Identity & Address Auto-Extracted</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] space-y-1">
                    <div>Address: {extractedAddress.line1}</div>
                    <div>City: {extractedAddress.city}, State: {extractedAddress.state}</div>
                    <div>PIN: {extractedAddress.pincode} · Country: {extractedAddress.country}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  disabled={!isAadhaarVerified}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer disabled:opacity-50"
                >
                  Proceed to Bank Penny Drop →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Penny Drop Bank Verification */}
          {wizardStep === 3 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Step 3: Bank Account Verification (IMPS Penny Drop)</span>
              </div>
              <p className="text-slate-400">
                SEBI mandates reverse penny drop (₹1 deposit) to authenticate beneficiary account title against PAN.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white font-mono uppercase"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunPennyDrop}
                disabled={isPennyDropRunning}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold rounded cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPennyDropRunning ? 'animate-spin' : ''}`} />
                <span>{isPennyDropRunning ? 'Executing ₹1 IMPS Penny Drop...' : 'Run Live Bank Penny Drop Check'}</span>
              </button>

              {pennyDropResult && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg space-y-1.5 font-mono">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Penny Drop Successful · Name Match: {pennyDropResult.matchScore}%</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Beneficiary Name: <strong className="text-white">{pennyDropResult.beneficiaryName}</strong>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  disabled={!pennyDropResult?.success}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer disabled:opacity-50"
                >
                  Proceed to Video IPV →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Video IPV */}
          {wizardStep === 4 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Step 4: SEBI In-Person Verification (IPV) & Liveness</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
                <div className="w-24 h-24 mx-auto rounded-full bg-slate-900 border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-400">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-slate-300 font-medium">Dynamic Verification OTP Stamp</div>
                  <div className="text-2xl font-mono font-bold text-amber-400 tracking-widest my-1">
                    {ipvOtp}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hold this OTP code or speak it during webcam capture as per SEBI IPV guidelines
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsIpvCaptured(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold cursor-pointer"
                >
                  {isIpvCaptured ? '✓ Live Selfie & Video Verified' : 'Capture Live IPV Photo'}
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(5)}
                  disabled={!isIpvCaptured}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer disabled:opacity-50"
                >
                  Proceed to e-Sign & Submit →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Digital Signature & Submit */}
          {wizardStep === 5 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Step 5: Signature & KRA Submission</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="text-slate-300">Digital Signature Pad (Draw or Auto-eSign)</div>
                <div className="h-28 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-500 font-serif italic text-xl">
                  {wizardName || 'Digital Signature'}
                </div>
                <div className="text-[11px] text-slate-500">
                  By clicking submit, investor consents to Aadhaar e-Sign on the BSE StAR MF Account Opening Form (AOF).
                </div>
              </div>

              {completedKycRecord ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-center">
                  <div className="text-emerald-400 font-bold text-sm">e-KYC Successfully Completed & Validated!</div>
                  <div className="text-slate-300 font-mono text-xs">
                    KRA Status: KYC VALIDATED · CKYC KIN: {completedKycRecord.ckycKin}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => onConvertToUcc(completedKycRecord)}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded cursor-pointer"
                    >
                      Convert to BSE StAR MF UCC Client Now →
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWizard}
                  disabled={isSubmittingKyc}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSubmittingKyc ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingKyc ? 'Submitting to KRA & CKYC...' : 'Complete e-KYC & Register with KRA'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: PIPELINE TRACKER */}
      {activeSubTab === 'PIPELINE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Investor & PAN</th>
                  <th className="py-3 px-4">KRA Status</th>
                  <th className="py-3 px-4">Agency & CKYC KIN</th>
                  <th className="py-3 px-4">Aadhaar & Bank Check</th>
                  <th className="py-3 px-4">Sub-Broker Tag</th>
                  <th className="py-3 px-4">BSE UCC State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {kycRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-white">{rec.clientName}</div>
                      <div className="text-[11px] text-amber-400 font-mono">{rec.pan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.kraStatus === 'KYC_VALIDATED' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          KYC VALIDATED
                        </span>
                      )}
                      {rec.kraStatus === 'KYC_REGISTERED' && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
                          KYC REGISTERED
                        </span>
                      )}
                      {rec.kraStatus === 'KYC_ON_HOLD' && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                          ON HOLD
                        </span>
                      )}
                      {rec.kraStatus === 'NOT_KYC' && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                          NON-KYC
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-sans">{rec.kraAgency.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-500">{rec.ckycKin || 'Pending KIN'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-[11px]">
                      <div className={rec.panAadhaarLinked ? 'text-emerald-400' : 'text-rose-400'}>
                        {rec.panAadhaarLinked ? '✓ Aadhaar Seeded' : '✗ Aadhaar Missing'}
                      </div>
                      <div className={rec.pennyDropVerified ? 'text-emerald-400' : 'text-slate-500'}>
                        {rec.pennyDropVerified ? '✓ Penny Drop OK' : '○ Bank Test Pending'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.subBrokerCode ? (
                        <span className="text-amber-400 font-bold">{rec.subBrokerCode}</span>
                      ) : (
                        <span className="text-slate-500 font-sans">Direct MFD</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {rec.bseUccCreated ? (
                        <span className="text-emerald-400 font-mono font-semibold">
                          {rec.associatedClientCode}
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Created</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!rec.bseUccCreated && rec.kraStatus === 'KYC_VALIDATED' ? (
                        <button
                          onClick={() => onConvertToUcc(rec)}
                          className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                        >
                          Create UCC
                        </button>
                      ) : rec.bseUccCreated ? (
                        <span className="text-slate-500 text-[11px]">Active on BSE</span>
                      ) : (
                        <button
                          onClick={() => {
                            setWizardPan(rec.pan);
                            setWizardName(rec.clientName);
                            setActiveSubTab('NEW_WIZARD');
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors cursor-pointer"
                        >
                          Complete KYC
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
