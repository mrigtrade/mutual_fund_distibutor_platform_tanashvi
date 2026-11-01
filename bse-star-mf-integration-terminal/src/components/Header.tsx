import { BseCredentials, ActiveUserSession } from '../types/bse';
import { Server, Settings, CheckCircle2, AlertTriangle, ShieldCheck, Users, UserCheck, Building2, User, Briefcase } from 'lucide-react';
import { TanashviLogo } from './TanashviLogo';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  credentials: BseCredentials;
  currentSession: ActiveUserSession;
  onOpenSettings: () => void;
  onOpenDoc: () => void;
  onOpenSessionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  credentials,
  currentSession,
  onOpenSettings,
  onOpenDoc,
  onOpenSessionModal
}) => {
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
              <button
                onClick={onOpenDoc}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer hover:bg-slate-800"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Specs</span>
              </button>

              <button
                onClick={onOpenSettings}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer border ${
                  credentials.connectionStatus === 'CONNECTED'
                    ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="font-mono">{credentials.environment.toUpperCase()}: {credentials.memberId}</span>
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
                <>Active Persona: <strong className="text-white">Category 4: Tanashvi Platform HQ & Promoters</strong> [Member: <strong className="text-[#c5a059]">714114</strong> · ARN: <strong className="text-white">ARN-347849</strong>]</>
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
