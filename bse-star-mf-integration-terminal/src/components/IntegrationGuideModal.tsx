import React from 'react';
import { X, ShieldCheck, CheckCircle2, ArrowRight, Server, FileText, Lock } from 'lucide-react';

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">BSE StAR MF Official API Integration Architecture</h2>
              <p className="text-xs text-slate-400">Technical specifications and production onboarding guide</p>
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
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Executive Summary */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-2 text-slate-300">
            <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Full Support for BSE StAR MF Official API Connection</span>
            </div>
            <p>
              Yes! This application is engineered to interface directly with the official BSE StAR MF APIs across both <strong>UAT Demo Sandbox</strong> and <strong>Live Production</strong> environments.
            </p>
          </div>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>1. Credentials & Auth</span>
              </div>
              <p className="text-xs text-slate-400">
                Requires your <strong>Member Code (ARN / Broker ID)</strong>, <strong>User ID</strong>, <strong>Member Password</strong>, and the <strong>PassKey</strong> issued by the BSE Tech Desk.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>2. IP Whitelisting</span>
              </div>
              <p className="text-xs text-slate-400">
                BSE firewall strictly validates static server IPs on Port 443. Whitelist your production server IP with BSE StAR MF Support to route live orders without proxy blocks.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>3. Client UCC & KYC</span>
              </div>
              <p className="text-xs text-slate-400">
                Every trade requires an active Unique Client Code (UCC) with verified PAN, Bank IFSC, FATCA compliance, and Nominee details registered via the UCC API.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Payment & e-NACH Mandates</span>
              </div>
              <p className="text-xs text-slate-400">
                Lumpsum orders generate instant UPI/NetBanking payment URLs. Systematic Investment Plans (XSIP) utilize approved NPCI e-Mandates with UMRN tracking.
              </p>
            </div>
          </div>

          {/* Step-by-Step Flow */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Standard BSE StAR MF Order Flow
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
              <li><strong className="text-slate-200">UCC Onboarding:</strong> Client details uploaded via <code>ClientRegistration_UCC</code>. BSE validates PAN against KRA.</li>
              <li><strong className="text-slate-200">Order Dispatch:</strong> Purchase, SIP, or Switch routed via <code>MFOrderEntry</code> / <code>XSIPOrderEntry</code>. BSE assigns a BBO number.</li>
              <li><strong className="text-slate-200">Payment Authorization:</strong> Investor pays via BSE StAR Payment Gateway (UPI / Netbanking) or auto-debit via e-NACH mandate.</li>
              <li><strong className="text-slate-200">SEBI Cutoff & Allotment:</strong> Orders confirmed prior to 15:00 IST receive today's closing NAV with settlement in T+1/T+2 days.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Close Guide
          </button>
          <button
            onClick={() => { onClose(); onOpenSettings(); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
          >
            <span>Open API Credentials Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
