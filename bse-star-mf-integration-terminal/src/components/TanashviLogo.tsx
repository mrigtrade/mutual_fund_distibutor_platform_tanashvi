import React from 'react';

interface TanashviLogoProps {
  variant?: 'header' | 'hero' | 'compact' | 'footer';
  className?: string;
  showTagline?: boolean;
  showRegulatory?: boolean;
}

export const TanashviLogo: React.FC<TanashviLogoProps> = ({
  variant = 'header',
  className = '',
  showTagline = true,
  showRegulatory = true,
}) => {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#c5a059]/40 bg-[#0a192f] shadow-md flex items-center justify-center p-0.5">
          <img 
            src="/tanashvi_logo.jpeg" 
            alt="Tanashvi Logo" 
            className="w-full h-full object-cover object-center rounded"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-serif font-bold text-base tracking-wide text-white leading-tight">
            Tanashvi
          </span>
          <span className="text-[9px] font-sans text-[#c5a059] tracking-wider uppercase font-semibold">
            B2B Platform
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-[#0a192f] to-[#0b1320] border border-[#c5a059]/30 shadow-2xl ${className}`}>
        {/* Emblem Container with subtle gold glow */}
        <div className="relative mb-3 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#c5a059]/20 to-[#8e9e8b]/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#c5a059]/60 bg-[#0a192f] shadow-inner p-1 flex items-center justify-center">
            <img 
              src="/tanashvi_logo.jpeg" 
              alt="Tanashvi Emblem" 
              className="w-full h-full object-cover object-center rounded-lg"
            />
          </div>
        </div>

        {/* Brand Typography */}
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-0.5">
          Tanashvi
        </h1>
        
        {showTagline && (
          <div className="flex items-center gap-2 my-1">
            <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#c5a059]"></span>
            <span className="font-serif text-sm text-[#c5a059] font-medium tracking-widest">
              भवतः हिताय
            </span>
            <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#c5a059]"></span>
          </div>
        )}

        <p className="text-xs text-slate-300 font-sans tracking-wide mt-1 max-w-sm">
          Bespoke Wealth Management & Mutual Fund Platform
        </p>

        {showRegulatory && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">
              ARN-347849
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              BSE Member 714114
            </span>
            <span className="text-slate-400">
              Tanashvi Fintech Private Limited
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default: 'header' variant
  return (
    <div className={`flex items-center gap-3 shrink-0 select-none ${className}`}>
      {/* Brand Icon / Logo image badge */}
      <div className="relative group cursor-pointer">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#c5a059]/50 bg-[#0a192f] shadow-md flex items-center justify-center p-0.5 hover:border-[#c5a059] transition-colors">
          <img 
            src="/tanashvi_logo.jpeg" 
            alt="Tanashvi" 
            className="w-full h-full object-cover object-center rounded"
          />
        </div>
      </div>

      {/* Brand Names & Regulatory Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight text-white leading-none">
            Tanashvi
          </span>
          {showTagline && (
            <span className="hidden sm:inline-block text-[11px] font-serif text-[#c5a059] bg-[#c5a059]/10 px-1.5 py-0.5 rounded border border-[#c5a059]/25 font-medium leading-none">
              भवतः हिताय
            </span>
          )}
        </div>

        {showRegulatory && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans tracking-tight mt-1 leading-none">
            <span className="text-[#8e9e8b] font-medium">B2B MF Platform</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-300">ARN-347849</span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline font-mono text-slate-400">BSE 714114</span>
          </div>
        )}
      </div>
    </div>
  );
};

