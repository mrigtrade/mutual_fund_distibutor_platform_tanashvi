/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 16: "Tanu" the Cute Wise Owl — Interactive Animated Portfolio Storyteller Modal
 *
 * Features:
 *  - Walks smoothly across the stage & pulls out animated charts per scene
 *  - Default date window = Investor's Last Login Date -> Today (fully customizable)
 *  - Indian English (en-IN) voice narration toggle + always-visible Live Subtitles
 *  - Zero-Hallucination Split: Deterministic math + Gemini AI narrative (with instant offline fallback)
 *  - Prominent AI & SEBI Compliance Caveat Banner (educational only, never buy/sell advice)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Send,
  MessageCircle,
  CheckCircle2,
  Subtitles,
  PhoneCall
} from 'lucide-react';
import { TanuOwlMascot } from './TanuOwlMascot';
import {
  TanuMood,
  TanuPortfolioInput,
  TanuScene,
  askTanuQuestion,
  computePeriodSnapshot,
  formatNiceDate,
  generateTanuStoryboard,
  getLastLoginDate,
  saveCurrentVisitDate,
  selectIndianEnglishVoice,
  speakTanuDialogue,
  stopTanuSpeech
} from '../utils/tanuStoryEngine';
import { BenchmarkId, formatInrCompact } from '../utils/benchmarkData';

interface TanuStoryWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: TanuPortfolioInput;
  launchedByMfd?: boolean;
}

type DatePreset = 'LAST_LOGIN' | '30D' | '3M' | '1Y' | 'CUSTOM';

export const TanuStoryWalkthroughModal: React.FC<TanuStoryWalkthroughModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  launchedByMfd = false
}) => {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const storedLastLogin = useMemo(() => getLastLoginDate(portfolio.ucc), [portfolio.ucc]);

  const [preset, setPreset] = useState<DatePreset>('LAST_LOGIN');
  const [startDate, setStartDate] = useState<string>(storedLastLogin);
  const [endDate, setEndDate] = useState<string>(todayIso);
  const [benchmarkId, setBenchmarkId] = useState<BenchmarkId>('NIFTY_50_TRI');

  // Storyboard & Playback state
  const [scenes, setScenes] = useState<TanuScene[]>([]);
  const [engineUsed, setEngineUsed] = useState<'GEMINI_AI' | 'TANASHVI_VERIFIED_ENGINE'>('TANASHVI_VERIFIED_ENGINE');
  const [sceneIdx, setSceneIdx] = useState<number>(0);
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);

  // Voice & Auto-Play controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceLabel, setVoiceLabel] = useState<string>('Indian English (en-IN)');
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Interactive Q&A state (Scene 5)
  const [qaInput, setQaInput] = useState<string>('');
  const [qaReply, setQaReply] = useState<{ question: string; answer: string; mood: TanuMood } | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [advisorPinged, setAdvisorPinged] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<number | null>(null);

  // Compute deterministic snapshot whenever dates/benchmark/portfolio change
  const snapshot = useMemo(
    () => computePeriodSnapshot(portfolio, startDate, endDate, benchmarkId, preset === 'LAST_LOGIN'),
    [portfolio, startDate, endDate, benchmarkId, preset]
  );

  // Load voices list eagerly when browser populates SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const refreshVoice = () => {
      const { label } = selectIndianEnglishVoice();
      setVoiceLabel(label);
    };
    refreshVoice();
    window.speechSynthesis.onvoiceschanged = refreshVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Build Storyboard whenever modal opens or snapshot changes
  useEffect(() => {
    if (!isOpen) {
      stopTanuSpeech();
      setIsSpeaking(false);
      return;
    }

    let cancelled = false;
    setIsLoadingStory(true);
    setQaReply(null);
    setAdvisorPinged(false);

    generateTanuStoryboard(snapshot).then(res => {
      if (cancelled) return;
      setScenes(res.scenes);
      setEngineUsed(res.engineUsed);
      setSceneIdx(0);
      setIsLoadingStory(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, snapshot]);

  // Save today's visit date when closing so next visit remembers this login date
  const handleClose = () => {
    stopTanuSpeech();
    setIsSpeaking(false);
    setAutoPlay(false);
    saveCurrentVisitDate(portfolio.ucc, todayIso);
    onClose();
  };

  // Trigger brief walking animation whenever Tanu changes scenes
  useEffect(() => {
    if (!isOpen || scenes.length === 0) return;
    setIsWalking(true);
    const t = window.setTimeout(() => setIsWalking(false), 750);
    return () => window.clearTimeout(t);
  }, [sceneIdx, isOpen, scenes.length]);

  const currentScene: TanuScene | undefined = scenes[sceneIdx];
  const activeSubtitleText = qaReply && sceneIdx === scenes.length - 1 ? qaReply.answer : currentScene?.subtitle || '';
  const activeMood: TanuMood =
    qaReply && sceneIdx === scenes.length - 1 ? qaReply.mood : currentScene?.mood || 'WAVING';

  // Speak active dialogue in Indian English when Sound is ON
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    if (!isOpen || !activeSubtitleText) {
      stopTanuSpeech();
      setIsSpeaking(false);
      return;
    }

    if (soundEnabled) {
      const label = speakTanuDialogue(activeSubtitleText, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          if (autoPlay && sceneIdx < scenes.length - 1) {
            autoPlayTimerRef.current = window.setTimeout(() => {
              setSceneIdx(prev => Math.min(scenes.length - 1, prev + 1));
            }, 900);
          }
        }
      });
      setVoiceLabel(label);
    } else {
      stopTanuSpeech();
      setIsSpeaking(false);
      if (autoPlay && sceneIdx < scenes.length - 1) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setSceneIdx(prev => Math.min(scenes.length - 1, prev + 1));
        }, 5500);
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        window.clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isOpen, activeSubtitleText, soundEnabled, autoPlay, sceneIdx, scenes.length]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => stopTanuSpeech();
  }, []);

  if (!isOpen) return null;

  // Date preset switcher
  const applyPreset = (nextPreset: DatePreset) => {
    setPreset(nextPreset);
    setEndDate(todayIso);
    const d = new Date(`${todayIso}T00:00:00`);
    if (nextPreset === 'LAST_LOGIN') {
      setStartDate(storedLastLogin);
    } else if (nextPreset === '30D') {
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (nextPreset === '3M') {
      d.setMonth(d.getMonth() - 3);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (nextPreset === '1Y') {
      d.setFullYear(d.getFullYear() - 1);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  const handleAskQuestion = async (qText: string) => {
    if (!qText.trim() || isAsking) return;
    setIsAsking(true);
    setAutoPlay(false);
    try {
      const res = await askTanuQuestion(qText, snapshot);
      setQaReply({ question: qText.trim(), answer: res.answer, mood: res.mood });
      setQaInput('');
    } finally {
      setIsAsking(false);
    }
  };

  const handleReplayScene = () => {
    if (soundEnabled && activeSubtitleText) {
      speakTanuDialogue(activeSubtitleText, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    }
    setIsWalking(true);
    window.setTimeout(() => setIsWalking(false), 650);
  };

  // Determine Tanu's layout alignment based on scene stagePosition
  const stagePos = currentScene?.stagePosition || 'center';
  const pointDir: 'left' | 'right' = stagePos === 'right' ? 'left' : 'right';

  // Mini SVG Benchmark Chart Geometry for Scene 3
  const miniSvgW = 360;
  const miniSvgH = 148;
  const miniPts = snapshot.miniSeries;
  const miniAll = miniPts.flatMap(p => [p.portfolioIdx, p.benchmarkIdx]);
  const miniMin = Math.min(...miniAll) - 0.8;
  const miniMax = Math.max(...miniAll) + 0.8;
  const miniSpan = Math.max(1, miniMax - miniMin);
  const mx = (i: number) => 26 + (i / Math.max(1, miniPts.length - 1)) * (miniSvgW - 44);
  const my = (v: number) => 16 + (miniSvgH - 38) - ((v - miniMin) / miniSpan) * (miniSvgH - 38);
  const miniPortPath = miniPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mx(i).toFixed(1)} ${my(p.portfolioIdx).toFixed(1)}`).join(' ');
  const miniBenchPath = miniPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mx(i).toFixed(1)} ${my(p.benchmarkIdx).toFixed(1)}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-4xl bg-[#091120] border border-[#c5a059]/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0a192f] via-[#13223d] to-[#0a192f] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center overflow-hidden">
              <TanuOwlMascot mood="HAPPY" size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-serif font-bold text-white">
                  Tanu · Your Wise Portfolio Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {engineUsed === 'GEMINI_AI' ? 'Gemini AI Narration' : 'Tanashvi Verified Story Engine'}
                </span>
                {launchedByMfd && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    MFD Client Review Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Walking <strong className="text-slate-200">{portfolio.investorName}</strong> through {formatNiceDate(startDate)} → {formatNiceDate(endDate)}
              </p>
            </div>
          </div>

          {/* Audio + Auto-Play + Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (!next) {
                  stopTanuSpeech();
                  setIsSpeaking(false);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={`Voice Narration (${voiceLabel})`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Sound On (en-IN)' : 'Sound Off'}</span>
            </button>

            <button
              onClick={() => setAutoPlay(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                autoPlay
                  ? 'bg-[#c5a059] text-slate-950 border-[#c5a059]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoPlay ? 'Playing' : 'Auto-Play'}</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close Tanu Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Window & Benchmark Strip */}
        <div className="px-5 py-2.5 bg-[#070d18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
              Period:
            </span>
            {(
              [
                { key: 'LAST_LOGIN', label: 'Since Last Login' },
                { key: '30D', label: '30 Days' },
                { key: '3M', label: '3 Months' },
                { key: '1Y', label: '1 Year' }
              ] as { key: DatePreset; label: string }[]
            ).map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  preset === p.key
                    ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => {
                setPreset('CUSTOM');
                setStartDate(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] font-mono text-slate-200"
            />
            <span className="text-slate-500">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayIso}
              onChange={e => {
                setPreset('CUSTOM');
                setEndDate(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] font-mono text-slate-200"
            />

            <select
              value={benchmarkId}
              onChange={e => setBenchmarkId(e.target.value as BenchmarkId)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-sky-300 font-medium"
              title="Select Market Benchmark for Scene 3"
            >
              <option value="NIFTY_50_TRI">vs Nifty 50 TRI</option>
              <option value="NIFTY_500_TRI">vs Nifty 500 TRI</option>
              <option value="NIFTY_MIDCAP_150_TRI">vs Midcap 150 TRI</option>
              <option value="CUSTOM_BLENDED">vs Blended (Auto-Mix)</option>
            </select>
          </div>
        </div>

        {/* MAIN ANIMATED STAGE — Tanu Walks Across & Pulls Out Charts */}
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-[radial-gradient(ellipse_at_top,_#162544_0%,_#091120_65%)] relative">
          {/* Subtle Stage Floor Line */}
          <div className="pointer-events-none absolute inset-x-8 bottom-3 h-px bg-gradient-to-r from-transparent via-[#c5a059]/30 to-transparent" />

          {isLoadingStory || !currentScene ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-300">
              <TanuOwlMascot mood="THINKING" isWalking size={115} />
              <p className="text-xs font-mono text-[#c5a059]">Tanu is reviewing your portfolio ledger...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scene Title Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40">
                    Scene {currentScene.sceneNumber} of {scenes.length} · {currentScene.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white">{currentScene.title}</h3>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                  {currentScene.keyTakeaway}
                </span>
              </div>

              {/* Interactive Stage Area: Dynamic Flexbox Order so Tanu Physically Walks Left / Center / Right! */}
              <div
                className={`min-h-[255px] flex flex-col ${
                  stagePos === 'right'
                    ? 'md:flex-row-reverse'
                    : stagePos === 'left'
                    ? 'md:flex-row'
                    : 'md:flex-row'
                } items-center justify-center gap-6 py-2`}
              >
                {/* Tanu Character with Smooth Spring Walking Layout Transition */}
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                  className="flex flex-col items-center shrink-0"
                >
                  <TanuOwlMascot
                    mood={activeMood}
                    isSpeaking={isSpeaking}
                    isWalking={isWalking}
                    pointDirection={pointDir}
                    size={155}
                  />
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-[#c5a059] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-[#c5a059]'}`} />
                    {isSpeaking ? 'Tanu is speaking...' : 'Tanu · Wise Owl'}
                  </div>
                </motion.div>

                {/* Pulled-Out Visual Chart / Insight Card (Slides onto Stage) */}
                <div className="flex-1 w-full max-w-xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentScene.id}-${benchmarkId}-${startDate}-${endDate}`}
                      initial={{ opacity: 0, x: stagePos === 'right' ? -36 : 36, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: stagePos === 'right' ? 36 : -36, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      className="bg-[#0d172a]/95 border border-slate-700/80 rounded-2xl p-5 shadow-xl"
                    >
                      {/* SCENE 1 CARD: Period Wealth Delta */}
                      {currentScene.chartType === 'DELTA' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Portfolio Movement ({snapshot.daysElapsed} Days)
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                                snapshot.deltaInr >= 0
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {snapshot.deltaInr >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {snapshot.deltaPct >= 0 ? '+' : ''}
                              {snapshot.deltaPct.toFixed(2)}%
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                              <span className="text-[10px] text-slate-400 block">{formatNiceDate(startDate)}</span>
                              <span className="text-base sm:text-lg font-mono font-bold text-slate-200 mt-1 block">
                                {formatInrCompact(snapshot.startValueInr)}
                              </span>
                            </div>
                            <div className="bg-[#c5a059]/10 border border-[#c5a059]/40 rounded-xl p-3">
                              <span className="text-[10px] text-[#c5a059] block font-semibold">Net Change</span>
                              <span
                                className={`text-base sm:text-lg font-mono font-bold mt-1 block ${
                                  snapshot.deltaInr >= 0 ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {snapshot.deltaInr >= 0 ? '+' : ''}
                                {formatInrCompact(snapshot.deltaInr)}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                              <span className="text-[10px] text-slate-400 block">{formatNiceDate(endDate)}</span>
                              <span className="text-base sm:text-lg font-mono font-bold text-white mt-1 block">
                                {formatInrCompact(snapshot.endValueInr)}
                              </span>
                            </div>
                          </div>

                          {/* Simple visual progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Starting Wealth</span>
                              <span>Current Wealth</span>
                            </div>
                            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '78%' }}
                                transition={{ duration: 0.7 }}
                                className="bg-slate-600 h-full"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '22%' }}
                                transition={{ duration: 0.9, delay: 0.25 }}
                                className={snapshot.deltaInr >= 0 ? 'bg-gradient-to-r from-[#c5a059] to-emerald-400 h-full' : 'bg-amber-500 h-full'}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SCENE 2 CARD: Top Movers & SIP Activity */}
                      {currentScene.chartType === 'MOVERS' && (
                        <div className="space-y-3.5">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Key Portfolio Drivers in This Window
                          </div>

                          <div className="space-y-2.5">
                            {[snapshot.topMover, snapshot.secondaryMover].map((m, idx) => (
                              <div key={`${m.name}-${idx}`} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="font-semibold text-white truncate pr-2">
                                    {idx === 0 ? '★ ' : '• '}
                                    {m.name}
                                  </span>
                                  <span
                                    className={`font-mono font-bold shrink-0 ${
                                      m.periodPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {m.periodPct >= 0 ? '+' : ''}
                                    {m.periodPct.toFixed(2)}% ({m.contributionInr >= 0 ? '+' : ''}
                                    {formatInrCompact(m.contributionInr)})
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.max(20, Math.abs(m.periodPct) * 14 + 35))}%` }}
                                    transition={{ duration: 0.75, delay: idx * 0.15 }}
                                    className={`h-full rounded-full ${idx === 0 ? 'bg-[#c5a059]' : 'bg-sky-400'}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              SIP Activity Executed
                            </span>
                            <span className="font-mono font-bold text-white">
                              {snapshot.sipInstallmentsInPeriod > 0
                                ? `${snapshot.sipInstallmentsInPeriod} SIP(s) · ${formatInrCompact(snapshot.sipTotalAddedInr)}`
                                : 'No SIPs scheduled'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* SCENE 3 CARD: Animated Mini Benchmark Line Chart */}
                      {currentScene.chartType === 'BENCHMARK' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-300">
                              Your Portfolio vs. <span style={{ color: snapshot.benchmarkColor }}>{snapshot.benchmarkName}</span>
                            </span>
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                                snapshot.outperformingMarket
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {snapshot.alphaPeriodPct >= 0 ? '+' : ''}
                              {snapshot.alphaPeriodPct.toFixed(2)}% Spread
                            </span>
                          </div>

                          <svg viewBox={`0 0 ${miniSvgW} ${miniSvgH}`} className="w-full h-auto">
                            {/* Grid */}
                            <line x1="26" y1="20" x2={miniSvgW - 18} y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                            <line x1="26" y1="68" x2={miniSvgW - 18} y2="68" stroke="#1e293b" strokeDasharray="3 3" />
                            <line x1="26" y1="116" x2={miniSvgW - 18} y2="116" stroke="#1e293b" strokeDasharray="3 3" />

                            {/* Animated Benchmark Curve */}
                            <motion.path
                              d={miniBenchPath}
                              fill="none"
                              stroke={snapshot.benchmarkColor}
                              strokeWidth="2.2"
                              strokeDasharray="5 4"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.9, ease: 'easeOut' }}
                            />

                            {/* Animated Portfolio Curve */}
                            <motion.path
                              d={miniPortPath}
                              fill="none"
                              stroke="#c5a059"
                              strokeWidth="3"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.0, ease: 'easeOut' }}
                            />

                            {/* X Labels */}
                            <text x="26" y={miniSvgH - 6} fill="#64748b" fontSize="9" fontFamily="monospace">
                              {miniPts[0]?.label}
                            </text>
                            <text x={miniSvgW - 18} y={miniSvgH - 6} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                              {miniPts[miniPts.length - 1]?.label}
                            </text>
                          </svg>

                          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                            <div className="bg-slate-900/90 border border-[#c5a059]/30 rounded-lg px-3 py-2 flex items-center justify-between">
                              <span className="text-slate-300">Portfolio</span>
                              <span className="text-[#c5a059] font-bold">
                                {snapshot.deltaPct >= 0 ? '+' : ''}
                                {snapshot.deltaPct.toFixed(2)}%
                              </span>
                            </div>
                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                              <span className="text-slate-300 truncate pr-1">{snapshot.benchmarkName}</span>
                              <span className="font-bold" style={{ color: snapshot.benchmarkColor }}>
                                {snapshot.benchmarkPeriodPct >= 0 ? '+' : ''}
                                {snapshot.benchmarkPeriodPct.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SCENE 4 CARD: Animated Mini Allocation Donut */}
                      {currentScene.chartType === 'ALLOCATION' && (
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                              <circle cx="60" cy="60" r="44" fill="none" stroke="#1e293b" strokeWidth="15" />
                              <motion.circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="none"
                                stroke="#c5a059"
                                strokeWidth="15"
                                strokeDasharray={`${(snapshot.assetAllocation.equityPct / 100) * 276.46} 276.46`}
                                initial={{ strokeDashoffset: 276.46 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="15"
                                strokeDasharray={`${((100 - snapshot.assetAllocation.equityPct) / 100) * 276.46} 276.46`}
                                strokeDashoffset={-(snapshot.assetAllocation.equityPct / 100) * 276.46}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-sm font-mono font-bold text-white">
                                {snapshot.assetAllocation.equityPct.toFixed(0)}%
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase">Equity</span>
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-2.5 text-xs">
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059]" />
                                Growth Engine (Equity)
                              </span>
                              <span className="font-mono font-bold text-[#c5a059]">
                                {snapshot.assetAllocation.equityPct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                                Stability Cushion (Debt / Liquid)
                              </span>
                              <span className="font-mono font-bold text-sky-300">
                                {(100 - snapshot.assetAllocation.equityPct).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SCENE 5 CARD: Interactive "Ask Tanu" Q&A + Human MFD Connect */}
                      {currentScene.chartType === 'TAKEAWAY' && (
                        <div className="space-y-3.5">
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-[#c5a059]" />
                            Ask Tanu a Quick Question (Plain English)
                          </div>

                          {/* One-Tap Starter Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'How did my SIP help in dips?',
                              'How did I do vs Nifty?',
                              'Is my equity balance safe?'
                            ].map(chip => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleAskQuestion(chip)}
                                disabled={isAsking}
                                className="px-2.5 py-1 rounded-full text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {/* Custom Question Form */}
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              handleAskQuestion(qaInput);
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={qaInput}
                              onChange={e => setQaInput(e.target.value)}
                              placeholder="Type any question about this period..."
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                            />
                            <button
                              type="submit"
                              disabled={isAsking || !qaInput.trim()}
                              className="px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d6b36e] text-slate-950 font-semibold text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Ask
                            </button>
                          </form>

                          {/* Human Advisor Handoff */}
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                              Need personalised rebalancing or goal advice?
                            </span>
                            <button
                              type="button"
                              onClick={() => setAdvisorPinged(true)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                advisorPinged
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              {advisorPinged ? 'Callback Requested!' : `Talk to ${portfolio.advisorName.split(' ')[0]}`}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LIVE SUBTITLES TELEPROMPTER & SCENE NAVIGATION */}
        <div className="px-5 py-4 bg-[#070e1b] border-t border-slate-800 space-y-3">
          {/* Subtitles Box */}
          <div className="bg-slate-950/90 border border-[#c5a059]/35 rounded-xl px-4 py-3 relative">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-[#c5a059]">
                <Subtitles className="w-3.5 h-3.5" />
                Tanu’s Dialogue Subtitles
                {qaReply && sceneIdx === scenes.length - 1 && (
                  <span className="text-sky-300 normal-case font-normal">
                    (Answering: “{qaReply.question}”)
                  </span>
                )}
              </span>
              <span className="font-mono text-slate-500">
                {soundEnabled ? `Voice: ${voiceLabel}` : 'Muted · Reading Subtitles'}
              </span>
            </div>
            <p className="text-sm sm:text-[15px] text-slate-100 leading-relaxed font-medium">
              “{activeSubtitleText}”
            </p>
          </div>

          {/* Scene Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Progress Dots */}
            <div className="flex items-center gap-1.5">
              {scenes.map((sc, i) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setQaReply(null);
                    setSceneIdx(i);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === sceneIdx ? 'w-7 bg-[#c5a059]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Scene ${i + 1}: ${sc.title}`}
                />
              ))}
            </div>

            {/* Prev / Replay / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQaReply(null);
                  setSceneIdx(prev => Math.max(0, prev - 1));
                }}
                disabled={sceneIdx === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <button
                onClick={handleReplayScene}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                title="Replay this scene's voice narration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Replay
              </button>

              {sceneIdx < scenes.length - 1 ? (
                <button
                  onClick={() => {
                    setQaReply(null);
                    setSceneIdx(prev => Math.min(scenes.length - 1, prev + 1));
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#c5a059] hover:bg-[#d7b570] text-slate-950 flex items-center gap-1 shadow cursor-pointer"
                >
                  Next Scene
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 shadow cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>

          {/* Permanent AI & SEBI Regulatory Caveat Banner */}
          <div className="bg-amber-500/8 border border-amber-500/25 rounded-lg px-3 py-2 flex items-start gap-2 text-[10px] text-slate-400 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">AI & SEBI Caveat:</strong> Tanu provides an AI-assisted, plain-English educational summary of historical portfolio figures computed deterministically from your ledger and SEBI-standard TRI benchmarks. This walkthrough is for informational purposes only, may not reflect intraday NAV moves, and does <strong>not</strong> constitute SEBI-registered investment advice or a buy/sell recommendation. Mutual fund investments are subject to market risks; consult your AMFI-registered distributor ({portfolio.advisorName}, {portfolio.advisorArn}) before making investment decisions.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
