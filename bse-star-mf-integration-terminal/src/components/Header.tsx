import { BseCredentials, ActiveUserSession } from '../types/bse';
import { Server, Settings, CheckCircle2, AlertTriangle, ShieldCheck, Users, UserCheck } from 'lucide-react';
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
  const navItems = [
    { id: 'orders', label: 'Order Engine' },
    { id: 'proposals', label: 'Proposal Cart' },
    { id: 'calculators', label: 'Calculators' },
    { id: 'portfolio', label: 'Portfolio & Tax' },
    { id: 'schemes', label: 'Scheme Master' },
    { id: 'clients', label: 'UCC Clients' },
    { id: 'mandates', label: 'Mandates' },
    { id: 'book', label: 'Order Book' },
    { id: 'subdistributors', label: 'Sub-Brokers' },
    { id: 'testbench', label: 'API Testbench' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a192f] border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Tanashvi Brand Logo & Emblem */}
        <TanashviLogo variant="header" />

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
              currentSession.role === 'SUB_DISTRIBUTOR'
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Switch between Master MFD and Sub-Distributor logins"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">
              {currentSession.role === 'SUB_DISTRIBUTOR'
                ? `${currentSession.subBrokerCode}`
                : 'Master MFD'}
            </span>
          </button>

          <button
            onClick={onOpenDoc}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer hover:bg-slate-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connection Specs</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer border ${
              credentials.connectionStatus === 'CONNECTED'
                ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{credentials.environment.toUpperCase()}: {credentials.memberId}</span>
            {credentials.connectionStatus === 'CONNECTED' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-Distributor Active Context Strip */}
      {currentSession.role === 'SUB_DISTRIBUTOR' && (
        <div className="bg-emerald-950/80 border-t border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                Operating as Sub-Distributor: <strong className="text-white">{currentSession.name}</strong> [Code: <strong className="text-amber-300">{currentSession.subBrokerCode}</strong> · EUIN: <strong className="text-white">{currentSession.euin}</strong>]
              </span>
            </div>
            <button
              onClick={onOpenSessionModal}
              className="text-[11px] underline text-emerald-400 hover:text-white cursor-pointer font-sans"
            >
              Change Login
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sub-Nav */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-4 px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`whitespace-nowrap py-1 cursor-pointer ${
              currentTab === item.id ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
