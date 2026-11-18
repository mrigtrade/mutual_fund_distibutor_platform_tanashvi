import React, { useState } from 'react';
import { BseCredentials, ActiveUserSession } from '../types/bse';
import { LiveBseStatus } from '../services/liveBseUatClient';
import { Settings, CheckCircle2, AlertTriangle, ShieldCheck, Users, Building2, User, Briefcase, Radio, RefreshCw, ArrowUpRight, X } from 'lucide-react';
import { TanashviLogo } from './TanashviLogo';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  credentials: BseCredentials;
  currentSession: ActiveUserSession;
  liveBseStatus?: LiveBseStatus | null;
  isCheckingLiveBse?: boolean;
  onRefreshLiveBse?: () => void;
  onOpenSettings: () => void;
  onOpenDoc: () => void;
  onOpenSessionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  credentials,
  currentSession,
  liveBseStatus,
  isCheckingLiveBse = false,
  onRefreshLiveBse,
  onOpenSettings,
  onOpenDoc,
  onOpenSessionModal
}) => {
  const [showLivePopover, setShowLivePopover] = useState(false);
  // Dynamic navigation items based on the active role
  const getNavItems = () => {
    if (currentSession.role === 'CLIENT_INVESTOR') {
      return [
        { id: 'investor_portal', label: 'My Investor Portal' },
        { id: 'portfolio', label: 'Portfolio & Tax' },
        { id: 'calculators', label: 'Financial Calculators' }
      ];
    }

    if (currentSession.role === 'MFD_STANDALONE') {
      return [
        { id: 'aum_analytics', label: 'AUM & Systematic' },
        { id: 'orders', label: 'Order Engine' },
        { id: 'proposals', label: 'Proposal Cart' },
        { id: 'research', label: 'MF Research' },
        { id: 'calculators', label: 'Calculators' },
        { id: 'portfolio', label: 'Portfolio & Tax' },
        { id: 'schemes', label: 'Scheme Master' },
        { id: 'clients', label: 'UCC Clients' },
        { id: 'mandates', label: 'Mandates' },
        { id: 'book', label: 'Order Book' },
        { id: 'testbench', label: 'API Testbench' }
      ];
    }

    if (currentSession.role === 'SUB_DISTRIBUTOR') {
      return [
        { id: 'aum_analytics', label: 'AUM & Systematic' },
        { id: 'orders', label: 'Order Engine' },
        { id: 'proposals', label: 'Proposal Cart' },
        { id: 'research', label: 'MF Research' },
        { id: 'calculators', label: 'Calculators' },
        { id: 'portfolio', label: 'Portfolio & Tax' },
        { id: 'clients', label: 'UCC Clients' },
        { id: 'book', label: 'Order Book' },
        { id: 'subdistributors', label: 'My Branch Desk' }
      ];
    }

    // Default for PLATFORM_SUPER_ADMIN & MASTER_MFD (Tanashvi HQ)
    return [
      { id: 'promoter_hq', label: 'Promoter HQ' },
      { id: 'aum_analytics', label: 'AUM & Systematic' },
      { id: 'orders', label: 'Order Engine' },
      { id: 'proposals', label: 'Proposal Cart' },
      { id: 'research', label: 'MF Research' },
      { id: 'calculators', label: 'Calculators' },
      { id: 'portfolio', label: 'Portfolio & Tax' },
      { id: 'schemes', label: 'Scheme Master' },
      { id: 'clients', label: 'UCC Clients' },
      { id: 'mandates', label: 'Mandates' },
      { id: 'book', label: 'Order Book' },
      { id: 'subdistributors', label: 'Sub-Brokers' },
      { id: 'testbench', label: 'API Testbench' }
    ];
  };

  const navItems = getNavItems();

  // Role pill visual styles
  const getRoleBadge = () => {
    switch (currentSession.role) {
      case 'CLIENT_INVESTOR':
        return {
          bg: 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60',
          icon: <User className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Client: Ramesh'
        };
      case 'MFD_STANDALONE':
        return {
          bg: 'bg-blue-950/60 text-blue-300 border-blue-500/40 hover:bg-blue-900/60',
          icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
          label: 'MFD: Apex Wealth'
        };
      case 'SUB_DISTRIBUTOR':
        return {
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60',
          icon: <Users className="w-3.5 h-3.5 text-emerald-400" />,
          label: `Sub: ${currentSession.subBrokerCode || 'Branch'}`
        };
      default:
        return {
          bg: 'bg-purple-950/60 text-purple-200 border-purple-500/40 hover:bg-purple-900/60',
          icon: <Building2 className="w-3.5 h-3.5 text-[#c5a059]" />,
          label: 'Tanashvi HQ'
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-[#0a192f] border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Tanashvi Brand Logo & Emblem */}
        <TanashviLogo variant="header" />

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 text-sm font-medium overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer text-xs xl:text-sm ${
                currentTab === item.id
                  ? 'text-[#c5a059] border-b-2 border-[#c5a059] font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Connection Status & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User Session Switcher Button */}
          <button
            onClick={onOpenSessionModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border ${roleBadge.bg}`}
            title="Switch between the 4 platform user roles (Tanashvi HQ, Standalone MFD, Sub-Broker, End Investor)"
          >
            {roleBadge.icon}
            <span className="font-mono font-medium">{roleBadge.label}</span>
          </button>

          {currentSession.role !== 'CLIENT_INVESTOR' && (
            <>
              {/* Live BSE StAR MF v2.0 UAT Connection Badge + Diagnostics Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLivePopover((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer border ${
                    liveBseStatus?.authenticated
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                      : isCheckingLiveBse
                      ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                  title="Live BSE StAR MF v2.0 UAT Connection Status via Zero-Domain Proxy"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      liveBseStatus?.authenticated
                        ? 'bg-emerald-400 animate-pulse'
                        : isCheckingLiveBse
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-mono font-semibold">
                    {liveBseStatus?.authenticated
                      ? `LIVE BSE: ${liveBseStatus.memberId}`
                      : isCheckingLiveBse
                      ? 'BSE UAT...'
                      : 'SANDBOX'}
                  </span>
                </button>

                {showLivePopover && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Radio className={`w-4 h-4 ${liveBseStatus?.authenticated ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <div>
                          <div className="font-bold text-white text-xs">
                            {liveBseStatus?.authenticated
                              ? 'LIVE BSE StAR MF v2.0 UAT Connected'
                              : 'Running in Sandbox Fallback Mode'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Zero-Domain Vercel Proxy · tanashvi.in untouched
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLivePopover(false)}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {liveBseStatus?.authenticated ? (
                      <div className="space-y-1.5 font-mono text-[11px] bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Member ID / Type:</span>
                          <span className="text-emerald-300 font-semibold">{liveBseStatus.memberId} ({liveBseStatus.orgType})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Auth Protocol:</span>
                          <span className="text-white">RS256 Bearer JWT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Token TTL / Latency:</span>
                          <span className="text-amber-300">{Math.round(liveBseStatus.expiresInSec / 60)}m · {liveBseStatus.latencyMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Whitelisted Bridge:</span>
                          <span className="text-slate-200">130.210.57.235</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 shrink-0">Gateway:</span>
                          <span className="text-slate-300 truncate">{liveBseStatus.gateway}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800 flex flex-wrap gap-1">
                          {liveBseStatus.roles.map((r) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-200 text-[11px]">
                        Live BSE UAT bridge did not respond ({liveBseStatus?.error || 'checking...'}). All platform workflows continue smoothly with local sandbox data.
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {onRefreshLiveBse && (
                        <button
                          type="button"
                          onClick={onRefreshLiveBse}
                          disabled={isCheckingLiveBse}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingLiveBse ? 'animate-spin' : ''}`} />
                          <span>Re-Ping BSE</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowLivePopover(false);
                          onTabChange('schemes');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md cursor-pointer ml-auto"
                      >
                        <span>28,128 Live Schemes</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onOpenDoc}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer hover:bg-slate-800"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Specs</span>
              </button>

              <button
                onClick={onOpenSettings}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer border ${
                  credentials.connectionStatus === 'CONNECTED'
                    ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                }`}
                title="Configure BSE StAR MF Gateway Settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">{credentials.environment.toUpperCase()}: {credentials.memberId}</span>
                {credentials.connectionStatus === 'CONNECTED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Role Active Context Strip */}
      <div className={`border-t px-4 py-1.5 text-xs flex items-center justify-between ${
        currentSession.role === 'CLIENT_INVESTOR'
          ? 'bg-amber-950/70 border-amber-500/30 text-amber-200'
          : currentSession.role === 'MFD_STANDALONE'
          ? 'bg-blue-950/70 border-blue-500/30 text-blue-200'
          : currentSession.role === 'SUB_DISTRIBUTOR'
          ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-200'
          : 'bg-purple-950/70 border-purple-500/30 text-purple-200'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              currentSession.role === 'CLIENT_INVESTOR' ? 'bg-amber-400' :
              currentSession.role === 'MFD_STANDALONE' ? 'bg-blue-400' :
              currentSession.role === 'SUB_DISTRIBUTOR' ? 'bg-emerald-400' : 'bg-purple-400'
            }`} />
            <span>
              {currentSession.role === 'CLIENT_INVESTOR' && (
                <>Active Persona: <strong className="text-white">Category 3: End Investor (Ramesh Sharma)</strong> [PAN: <strong className="text-amber-300">{currentSession.pan || 'AAAPS1234K'}</strong> · UCC: <strong className="text-white">{currentSession.clientCode || 'UCC-RAMESH-001'}</strong>]</>
              )}
              {currentSession.role === 'MFD_STANDALONE' && (
                <>Active Persona: <strong className="text-white">Category 1: Standalone MFD (Apex Wealth)</strong> [ARN: <strong className="text-blue-300">ARN-198420</strong> · EUIN: <strong className="text-white">E294810</strong>]</>
              )}
              {currentSession.role === 'SUB_DISTRIBUTOR' && (
                <>Active Persona: <strong className="text-white">Category 2: Sub-Broker ({currentSession.name})</strong> [Branch Code: <strong className="text-emerald-300">{currentSession.subBrokerCode}</strong> · EUIN: <strong className="text-white">{currentSession.euin}</strong>]</>
              )}
              {(currentSession.role === 'PLATFORM_SUPER_ADMIN' || currentSession.role === 'MASTER_MFD') && (
                <>Active Persona: <strong className="text-white">Category 4: Tanashvi Platform HQ & Promoters</strong> [Member: <strong className="text-[#c5a059]">{credentials.memberId || '94515'}</strong> · ARN: <strong className="text-white">ARN-347849</strong>{liveBseStatus?.authenticated ? <> · <strong className="text-emerald-300">BSE UAT LIVE</strong></> : null}]</>
              )}
            </span>
          </div>
          <button
            onClick={onOpenSessionModal}
            className="text-[11px] underline hover:text-white cursor-pointer font-sans"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* Mobile Sub-Nav */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-4 px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`whitespace-nowrap py-1 cursor-pointer ${
              currentTab === item.id ? 'text-[#c5a059] font-semibold' : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
