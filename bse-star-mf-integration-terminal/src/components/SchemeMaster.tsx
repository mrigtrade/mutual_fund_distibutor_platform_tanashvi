import React, { useState, useMemo } from 'react';
import { Scheme } from '../types/bse';
import { Search, Filter, TrendingUp, ArrowUpRight, Clock, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface SchemeMasterProps {
  schemes: Scheme[];
  onSelectSchemeForOrder: (scheme: Scheme, type: 'LUMPSUM' | 'SIP') => void;
}

export const SchemeMaster: React.FC<SchemeMasterProps> = ({
  schemes,
  onSelectSchemeForOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Schemes' },
    { id: 'Equity: Large Cap', label: 'Large Cap' },
    { id: 'Equity: Flexi Cap', label: 'Flexi Cap' },
    { id: 'Equity: Mid Cap', label: 'Mid Cap' },
    { id: 'Equity: Small Cap', label: 'Small Cap' },
    { id: 'Debt: Liquid', label: 'Liquid' },
    { id: 'Index / ETF', label: 'Index Funds' }
  ];

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const matchesSearch =
        s.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.schemeCode.includes(searchQuery) ||
        s.isin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.amc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [schemes, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              BSE StAR MF Scheme Master
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized mutual fund schemes available for order execution and SIP registration
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Today's Cutoff: <strong className="text-white">15:00 IST</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono">
              <span>Settlement: <strong className="text-emerald-400">T+1 Day</strong></span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, BSE code (e.g. 119551), ISIN, or AMC..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center overflow-x-auto gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scheme Cards / Table Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.schemeCode}
            className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Scheme Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-amber-400 font-semibold">BSE Code: {scheme.schemeCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>ISIN: {scheme.isin}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-300">{scheme.amc}</span>
                  <span aria-hidden="true">·</span>
                  <span>{scheme.category}</span>
                </div>

                <h3 className="text-base font-semibold text-white tracking-tight truncate">
                  {scheme.schemeName}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Min Purchase: <strong className="text-slate-200 font-mono">₹{scheme.minLumpsum.toLocaleString('en-IN')}</strong></span>
                  <span>Min SIP: <strong className="text-slate-200 font-mono">₹{scheme.minSip.toLocaleString('en-IN')}</strong></span>
                  <span>Expense: <strong className="text-slate-200 font-mono">{scheme.expenseRatio}%</strong></span>
                  <span>Risk: <strong className="text-slate-300">{scheme.riskLevel}</strong></span>
                </div>
              </div>

              {/* Middle Column: Performance & NAV */}
              <div className="flex items-center gap-6 sm:gap-8 border-y lg:border-y-0 lg:border-x border-slate-800/80 py-3 lg:py-0 lg:px-6">
                <div>
                  <div className="text-xs text-slate-400">Current NAV</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    ₹{scheme.nav.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{scheme.navDate}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">3Y CAGR</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums flex items-center justify-end">
                    +{scheme.threeYearReturn}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">1Y: +{scheme.oneYearReturn}%</div>
                </div>
              </div>

              {/* Right Column: Execution CTA buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectSchemeForOrder(scheme, 'LUMPSUM')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Buy Lumpsum
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSchemeForOrder(scheme, 'SIP')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  Start XSIP
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSchemes.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <p className="text-sm font-medium">No mutual fund schemes match your search criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try searching by BSE scheme code, fund house name, or category</p>
          </div>
        )}
      </div>
    </div>
  );
};
