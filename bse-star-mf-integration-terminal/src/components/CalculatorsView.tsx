import React, { useState } from 'react';
import { Calculator, TrendingUp, Award, GraduationCap, Compass, DollarSign, ArrowDownRight, RefreshCw, ArrowRight } from 'lucide-react';

export const CalculatorsView: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<'sip' | 'stepup' | 'crorepati' | 'education' | 'retirement' | 'swp' | 'stp'>('crorepati');

  // Crorepati State
  const [croreTarget, setCroreTarget] = useState(10000000); // 1 Cr
  const [croreYears, setCroreYears] = useState(12);
  const [croreReturn, setCroreReturn] = useState(13.0);

  // SIP State
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipYears, setSipYears] = useState(10);
  const [sipRate, setSipRate] = useState(12.0);
  const [stepUpPct, setStepUpPct] = useState(10);

  // Education State
  const [currentCost, setCurrentCost] = useState(2500000); // 25 Lakhs
  const [childAge, setChildAge] = useState(3);
  const [collegeAge, setCollegeAge] = useState(18);
  const [eduInflation, setEduInflation] = useState(10.0);
  const [eduReturn, setEduReturn] = useState(12.0);

  // Retirement State
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [lifeSpan, setLifeSpan] = useState(85);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [infRate, setInfRate] = useState(6.0);
  const [preRetReturn, setPreRetReturn] = useState(12.0);
  const [postRetReturn, setPostRetReturn] = useState(8.0);

  // Crorepati Math
  const croreMonths = croreYears * 12;
  const croreMonthlyRate = croreReturn / 12 / 100;
  const croreSip = Math.round(
    croreTarget /
      (((Math.pow(1 + croreMonthlyRate, croreMonths) - 1) / croreMonthlyRate) * (1 + croreMonthlyRate))
  );
  const croreTotalInvested = croreSip * croreMonths;
  const croreWealthCreated = croreTarget - croreTotalInvested;

  // Standard vs Step-Up SIP Math
  const sipMonths = sipYears * 12;
  const sipMonthlyRate = sipRate / 12 / 100;
  const normalSipMaturity = Math.round(
    sipAmount * (((Math.pow(1 + sipMonthlyRate, sipMonths) - 1) / sipMonthlyRate) * (1 + sipMonthlyRate))
  );
  const normalTotalInvested = sipAmount * sipMonths;

  // Step-up estimation
  let stepUpInvested = 0;
  let stepUpMaturity = 0;
  let currentMonthly = sipAmount;
  for (let yr = 1; yr <= sipYears; yr++) {
    for (let m = 1; m <= 12; m++) {
      const remainingMonths = sipMonths - ((yr - 1) * 12 + m) + 1;
      stepUpInvested += currentMonthly;
      stepUpMaturity += currentMonthly * Math.pow(1 + sipMonthlyRate, remainingMonths);
    }
    currentMonthly = Math.round(currentMonthly * (1 + stepUpPct / 100));
  }
  stepUpMaturity = Math.round(stepUpMaturity);

  // Child Education Math
  const eduYears = Math.max(1, collegeAge - childAge);
  const futureEduCost = Math.round(currentCost * Math.pow(1 + eduInflation / 100, eduYears));
  const eduMonthlyRate = eduReturn / 12 / 100;
  const eduMonths = eduYears * 12;
  const requiredEduSip = Math.round(
    futureEduCost /
      (((Math.pow(1 + eduMonthlyRate, eduMonths) - 1) / eduMonthlyRate) * (1 + eduMonthlyRate))
  );

  // Retirement Math
  const accumYears = retireAge - currentAge;
  const distYears = lifeSpan - retireAge;
  const expenseAtRetirement = Math.round(monthlyExpense * Math.pow(1 + infRate / 100, accumYears));
  const realPostRate = (1 + postRetReturn / 100) / (1 + infRate / 100) - 1;
  const realMonthlyRate = realPostRate / 12;
  const distMonths = distYears * 12;
  const requiredRetirementCorpus = Math.round(
    expenseAtRetirement * ((1 - Math.pow(1 + realMonthlyRate, -distMonths)) / realMonthlyRate)
  );
  const accumMonths = accumYears * 12;
  const preRetMonthlyRate = preRetReturn / 12 / 100;
  const requiredRetirementSip = Math.round(
    requiredRetirementCorpus /
      (((Math.pow(1 + preRetMonthlyRate, accumMonths) - 1) / preRetMonthlyRate) * (1 + preRetMonthlyRate))
  );

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs text-[#c5a059] uppercase tracking-widest font-semibold">
              Tanashvi Advisory Suite · भवतः हिताय
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            Mutual Fund Financial & Goal Planners
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            SEBI & AMFI compliant goal modeling for MFD client consultations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveCalc('crorepati')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer ${
              activeCalc === 'crorepati'
                ? 'bg-[#c5a059] text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Become a Crorepati
          </button>
          <button
            onClick={() => setActiveCalc('stepup')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer ${
              activeCalc === 'stepup'
                ? 'bg-[#c5a059] text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Step-Up SIP
          </button>
          <button
            onClick={() => setActiveCalc('education')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer ${
              activeCalc === 'education'
                ? 'bg-[#c5a059] text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Child Education
          </button>
          <button
            onClick={() => setActiveCalc('retirement')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer ${
              activeCalc === 'retirement'
                ? 'bg-[#c5a059] text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Retirement
          </button>
        </div>
      </div>

      {/* Calculator Body */}
      {activeCalc === 'crorepati' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c5a059]" />
              Target & Timeframe
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Target Corpus</span>
                <span className="font-mono text-white font-semibold">{formatInr(croreTarget)}</span>
              </div>
              <input
                type="range"
                min="2500000"
                max="50000000"
                step="500000"
                value={croreTarget}
                onChange={(e) => setCroreTarget(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Investment Horizon</span>
                <span className="font-mono text-white font-semibold">{croreYears} Years</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={croreYears}
                onChange={(e) => setCroreYears(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Expected Annual Return</span>
                <span className="font-mono text-white font-semibold">{croreReturn}%</span>
              </div>
              <input
                type="range"
                min="8"
                max="20"
                step="0.5"
                value={croreReturn}
                onChange={(e) => setCroreReturn(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#c5a059] uppercase tracking-wider">Required Monthly Contribution</span>
              <div className="text-4xl font-serif font-bold text-white mt-1">
                {formatInr(croreSip)} <span className="text-sm font-sans font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                By investing {formatInr(croreSip)} every month for {croreYears} years at an expected {croreReturn}% annual return, your corpus will reach {formatInr(croreTarget)}.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Invested</span>
                <span className="font-mono text-sm font-semibold text-white mt-0.5 block">{formatInr(croreTotalInvested)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-[#8e9e8b] block">Wealth Created</span>
                <span className="font-mono text-sm font-semibold text-[#8e9e8b] mt-0.5 block">+{formatInr(croreWealthCreated)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-[#c5a059] block">Growth Multiplier</span>
                <span className="font-mono text-sm font-semibold text-[#c5a059] mt-0.5 block">
                  {(croreTarget / croreTotalInvested).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up SIP Calculator */}
      {activeCalc === 'stepup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#c5a059]" />
              SIP & Annual Step-Up
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Initial Monthly SIP</span>
                <span className="font-mono text-white font-semibold">{formatInr(sipAmount)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Annual Step-Up</span>
                <span className="font-mono text-[#c5a059] font-semibold">+{stepUpPct}% / yr</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={stepUpPct}
                onChange={(e) => setStepUpPct(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Duration</span>
                <span className="font-mono text-white font-semibold">{sipYears} Years</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#c5a059] uppercase tracking-wider">Step-Up SIP Maturity Value</span>
              <div className="text-4xl font-serif font-bold text-white mt-1">
                {formatInr(stepUpMaturity)}
              </div>
              <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                ⭐ Stepping up by {stepUpPct}% annually generates an extra <strong>{formatInr(stepUpMaturity - normalSipMaturity)}</strong> over a normal fixed SIP!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Normal Fixed SIP Maturity</span>
                <span className="font-mono text-base font-semibold text-slate-300 mt-1 block">{formatInr(normalSipMaturity)}</span>
                <span className="text-[10px] text-slate-500">Invested: {formatInr(normalTotalInvested)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-[#c5a059]/30 bg-[#c5a059]/5">
                <span className="text-xs text-[#c5a059]">Step-Up SIP Maturity</span>
                <span className="font-mono text-base font-semibold text-white mt-1 block">{formatInr(stepUpMaturity)}</span>
                <span className="text-[10px] text-slate-400">Invested: {formatInr(stepUpInvested)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Education Planner */}
      {activeCalc === 'education' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#c5a059]" />
              Education Goal Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Current Cost of Higher Ed</span>
                <span className="font-mono text-white font-semibold">{formatInr(currentCost)}</span>
              </div>
              <input
                type="range"
                min="500000"
                max="10000000"
                step="250000"
                value={currentCost}
                onChange={(e) => setCurrentCost(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Child's Current Age</label>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">College Entry Age</label>
                <input
                  type="number"
                  min="16"
                  max="25"
                  value={collegeAge}
                  onChange={(e) => setCollegeAge(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Education Inflation</span>
                <span className="font-mono text-amber-400 font-semibold">{eduInflation}% p.a.</span>
              </div>
              <input
                type="range"
                min="6"
                max="14"
                step="0.5"
                value={eduInflation}
                onChange={(e) => setEduInflation(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#c5a059] uppercase tracking-wider">Required Monthly SIP for College</span>
              <div className="text-4xl font-serif font-bold text-white mt-1">
                {formatInr(requiredEduSip)} <span className="text-sm font-sans font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                In {eduYears} years, higher education costing {formatInr(currentCost)} today will inflate to <strong>{formatInr(futureEduCost)}</strong> at {eduInflation}% inflation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Future Cost at Admission</span>
                <span className="font-mono text-base font-semibold text-rose-300 mt-1 block">{formatInr(futureEduCost)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-[#c5a059]/30">
                <span className="text-xs text-[#c5a059]">Total Out-of-Pocket Invested</span>
                <span className="font-mono text-base font-semibold text-white mt-1 block">{formatInr(requiredEduSip * eduMonths)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retirement Planner */}
      {activeCalc === 'retirement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#c5a059]" />
              Retirement Profile
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Current Monthly Expense</span>
                <span className="font-mono text-white font-semibold">{formatInr(monthlyExpense)}</span>
              </div>
              <input
                type="range"
                min="20000"
                max="250000"
                step="5000"
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                className="w-full accent-[#c5a059]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Current Age</label>
                <input
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Retire Age</label>
                <input
                  type="number"
                  value={retireAge}
                  onChange={(e) => setRetireAge(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Life Expectancy</label>
                <input
                  type="number"
                  value={lifeSpan}
                  onChange={(e) => setLifeSpan(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#c5a059] uppercase tracking-wider">Required Monthly SIP (Next {accumYears} Years)</span>
              <div className="text-4xl font-serif font-bold text-white mt-1">
                {formatInr(requiredRetirementSip)} <span className="text-sm font-sans font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                At age {retireAge}, your monthly expense of {formatInr(monthlyExpense)} will grow to <strong>{formatInr(expenseAtRetirement)}/mo</strong>. A total retirement corpus of <strong>{formatInr(requiredRetirementCorpus)}</strong> is required to sustain payouts till age {lifeSpan}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Net Retirement Corpus Needed</span>
                <span className="font-mono text-base font-semibold text-[#c5a059] mt-1 block">{formatInr(requiredRetirementCorpus)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">First Month Pension</span>
                <span className="font-mono text-base font-semibold text-white mt-1 block">{formatInr(expenseAtRetirement)}/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

