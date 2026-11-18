/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 16: "Tanu" the Cute Wise Owl — Presentation-Style Animated Portfolio Storyteller
 *
 * Architecture:
 *  - Full-width visual Graph / Chart Slides on every single scene (Slides 1–5)
 *  - Tanu walks smoothly across the bottom presenter runway below the slides, pointing up at charts
 *  - Strictly pure English with Indian English (en-IN) accent + Always-Visible Live Subtitles
 *  - Zero-Hallucination Split: Deterministic math + optional Gemini AI narrative
 *  - Permanent AI & SEBI Compliance Caveat Banner
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
  PhoneCall,
  GitCompare
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
  listPureEnglishVoices,
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

  // Voice (Strictly Pure English en-IN) & Auto-Play controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voiceLabel, setVoiceLabel] = useState<string>('Pure English (en-IN)');
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Interactive Q&A state (Slide 5)
  const [qaInput, setQaInput] = useState<string>('');
  const [qaReply, setQaReply] = useState<{ question: string; answer: string; mood: TanuMood } | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [advisorPinged, setAdvisorPinged] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<number | null>(null);

  const snapshot = useMemo(
    () => computePeriodSnapshot(portfolio, startDate, endDate, benchmarkId, preset === 'LAST_LOGIN'),
    [portfolio, startDate, endDate, benchmarkId, preset]
  );

  // Load strictly Pure English voices when available
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const refreshVoices = () => {
      const pureEn = listPureEnglishVoices();
      setEnglishVoices(pureEn);
      const { voice, label } = selectIndianEnglishVoice(selectedVoiceURI || undefined);
      setVoiceLabel(label);
      if (!selectedVoiceURI && voice) {
        setSelectedVoiceURI(voice.voiceURI);
      }
    };
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI]);

  // Build Storyboard when modal opens or date/benchmark changes
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

  const handleClose = () => {
    stopTanuSpeech();
    setIsSpeaking(false);
    setAutoPlay(false);
    saveCurrentVisitDate(portfolio.ucc, todayIso);
    onClose();
  };

  // Trigger presenter walk cycle whenever Tanu walks to a new slide spot along the bottom runway
  useEffect(() => {
    if (!isOpen || scenes.length === 0) return;
    setIsWalking(true);
    const t = window.setTimeout(() => setIsWalking(false), 950);
    return () => window.clearTimeout(t);
  }, [sceneIdx, isOpen, scenes.length]);

  const currentScene: TanuScene | undefined = scenes[sceneIdx];
  const activeSubtitleText = qaReply && sceneIdx === scenes.length - 1 ? qaReply.answer : currentScene?.subtitle || '';
  const activeMood: TanuMood =
    qaReply && sceneIdx === scenes.length - 1 ? qaReply.mood : currentScene?.mood || 'WAVING';

  // Speak active slide dialogue in strict Pure English (Indian Accent)
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
        preferredVoiceURI: selectedVoiceURI || undefined,
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
      if (autoPlayTimerRef.current) window.clearTimeout(autoPlayTimerRef.current);
    };
  }, [isOpen, activeSubtitleText, soundEnabled, selectedVoiceURI, autoPlay, sceneIdx, scenes.length]);

  useEffect(() => {
    return () => stopTanuSpeech();
  }, []);

  if (!isOpen) return null;

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
        preferredVoiceURI: selectedVoiceURI || undefined,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    }
    setIsWalking(true);
    window.setTimeout(() => setIsWalking(false), 750);
  };

  // --- Geometry Helpers for Full-Width Slide Charts ---
  // Slide 1: Period Wealth Value Area Chart
  const s1W = 680;
  const s1H = 185;
  const s1Pts = snapshot.miniSeries;
  const s1Vals = s1Pts.map(p => p.portfolioValueInr);
  const s1Min = Math.min(...s1Vals) * 0.985;
  const s1Max = Math.max(...s1Vals) * 1.015;
  const s1Span = Math.max(100, s1Max - s1Min);
  const s1x = (i: number) => 66 + (i / Math.max(1, s1Pts.length - 1)) * (s1W - 88);
  const s1y = (v: number) => 18 + (s1H - 46) - ((v - s1Min) / s1Span) * (s1H - 46);
  const s1Line = s1Pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s1x(i).toFixed(1)} ${s1y(p.portfolioValueInr).toFixed(1)}`).join(' ');
  const s1Area = `${s1Line} L ${s1x(s1Pts.length - 1).toFixed(1)} ${s1H - 28} L 66 ${s1H - 28} Z`;

  // Slide 3: Full-Width Dual Benchmark Graph
  const s3W = 680;
  const s3H = 185;
  const s3All = s1Pts.flatMap(p => [p.portfolioIdx - 100, p.benchmarkIdx - 100]);
  const s3Min = Math.min(0, ...s3All) - 0.8;
  const s3Max = Math.max(1, ...s3All) + 0.8;
  const s3Span = Math.max(1, s3Max - s3Min);
  const s3x = (i: number) => 56 + (i / Math.max(1, s1Pts.length - 1)) * (s3W - 76);
  const s3y = (v: number) => 18 + (s3H - 46) - ((v - s3Min) / s3Span) * (s3H - 46);
  const s3PortPath = s1Pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s3x(i).toFixed(1)} ${s3y(p.portfolioIdx - 100).toFixed(1)}`).join(' ');
  const s3BenchPath = s1Pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s3x(i).toFixed(1)} ${s3y(p.benchmarkIdx - 100).toFixed(1)}`).join(' ');

  // Slide 2: Scheme Bar Scale
  const maxAbsSchemePct = Math.max(2, ...snapshot.schemeBars.map(b => Math.abs(b.periodPct)));

  // Slide 5: 5-Year Compounding Bar Scale
  const maxProjVal = Math.max(1, ...snapshot.projectionSeries.map(p => p.projectedInr));

  const presenterX = currentScene?.presenterXPercent ?? 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-4xl bg-[#091120] border border-[#c5a059]/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-[#0a192f] via-[#13223d] to-[#0a192f] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center overflow-hidden">
              <TanuOwlMascot mood="HAPPY" size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-serif font-bold text-white">
                  Tanu · Interactive Portfolio Presentation
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {engineUsed === 'GEMINI_AI' ? 'Gemini AI Narration' : 'Tanashvi Verified Engine'}
                </span>
                {launchedByMfd && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    MFD Client Review
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Presenting <strong className="text-slate-200">{portfolio.investorName}</strong> · {formatNiceDate(startDate)} → {formatNiceDate(endDate)}
              </p>
            </div>
          </div>

          {/* Pure English Audio + Voice Picker + Auto-Play + Close */}
          <div className="flex flex-wrap items-center gap-2">
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
              title={`Pure English Voice (${voiceLabel})`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'English Voice On' : 'Sound Off'}</span>
            </button>

            {soundEnabled && englishVoices.length > 1 && (
              <select
                value={selectedVoiceURI}
                onChange={e => setSelectedVoiceURI(e.target.value)}
                className="max-w-[155px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 truncate"
                title="Select Pure English Voice (Indian English prioritized)"
              >
                {englishVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name.replace(/Microsoft |Google /g, '')} ({v.lang})
                  </option>
                ))}
              </select>
            )}

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
              aria-label="Close Tanu Presentation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Window & Benchmark Controls */}
        <div className="px-5 py-2 bg-[#070d18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
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
            >
              <option value="NIFTY_50_TRI">vs Nifty 50 TRI</option>
              <option value="NIFTY_500_TRI">vs Nifty 500 TRI</option>
              <option value="NIFTY_MIDCAP_150_TRI">vs Midcap 150 TRI</option>
              <option value="CUSTOM_BLENDED">vs Blended (Auto-Mix)</option>
            </select>
          </div>
        </div>

        {/* MAIN PRESENTATION DECK + BOTTOM PRESENTER RUNWAY */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 bg-[radial-gradient(ellipse_at_top,_#162544_0%,_#091120_68%)] flex flex-col justify-between">
          {isLoadingStory || !currentScene ? (
            <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-300">
              <TanuOwlMascot mood="THINKING" isWalking size={110} />
              <p className="text-xs font-mono text-[#c5a059]">Tanu is preparing your visual presentation slides...</p>
            </div>
          ) : (
            <>
              {/* 1. FULL-WIDTH VISUAL CHART SLIDE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40">
                      Slide {currentScene.sceneNumber} / {scenes.length} · {currentScene.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-white">{currentScene.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-[#c5a059] font-semibold">{currentScene.keyTakeaway}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentScene.id}-${benchmarkId}-${startDate}-${endDate}`}
                    initial={{ opacity: 0, y: 12, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.985 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0c1629]/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl min-h-[235px] flex flex-col justify-center"
                  >
                    {/* SLIDE 1: ANIMATED PORTFOLIO VALUE AREA GRAPH */}
                    {currentScene.chartType === 'DELTA' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-slate-400">
                              Start ({formatNiceDate(startDate)}): <strong className="text-slate-200">{formatInrCompact(snapshot.startValueInr)}</strong>
                            </span>
                            <span className="text-slate-400">
                              Now ({formatNiceDate(endDate)}): <strong className="text-white">{formatInrCompact(snapshot.endValueInr)}</strong>
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                              snapshot.deltaInr >= 0
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {snapshot.deltaInr >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {snapshot.deltaInr >= 0 ? '+' : ''}
                            {formatInrCompact(snapshot.deltaInr)} ({snapshot.deltaPct >= 0 ? '+' : ''}
                            {snapshot.deltaPct.toFixed(2)}%)
                          </span>
                        </div>

                        <svg viewBox={`0 0 ${s1W} ${s1H}`} className="w-full h-auto">
                          <defs>
                            <linearGradient id="tanuS1Grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={snapshot.deltaInr >= 0 ? '#c5a059' : '#f59e0b'} stopOpacity="0.38" />
                              <stop offset="100%" stopColor="#c5a059" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {[0, 0.5, 1].map((t, k) => {
                            const val = s1Min + t * s1Span;
                            const y = s1y(val);
                            return (
                              <g key={k}>
                                <line x1="66" y1={y} x2={s1W - 22} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                                <text x="58" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9.5" fontFamily="monospace">
                                  {formatInrCompact(val)}
                                </text>
                              </g>
                            );
                          })}
                          <path d={s1Area} fill="url(#tanuS1Grad)" />
                          <motion.path
                            d={s1Line}
                            fill="none"
                            stroke="#c5a059"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.95, ease: 'easeOut' }}
                          />
                          {/* Start & End Markers */}
                          <circle cx={s1x(0)} cy={s1y(s1Pts[0].portfolioValueInr)} r="4.5" fill="#94a3b8" stroke="#091120" strokeWidth="2" />
                          <circle
                            cx={s1x(s1Pts.length - 1)}
                            cy={s1y(s1Pts[s1Pts.length - 1].portfolioValueInr)}
                            r="5.5"
                            fill="#34d399"
                            stroke="#091120"
                            strokeWidth="2"
                          />
                          <text x={s1x(0)} y={s1H - 8} fill="#64748b" fontSize="9.5" fontFamily="monospace">
                            {s1Pts[0]?.label}
                          </text>
                          <text x={s1x(Math.floor(s1Pts.length / 2))} y={s1H - 8} textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="monospace">
                            {s1Pts[Math.floor(s1Pts.length / 2)]?.label}
                          </text>
                          <text x={s1x(s1Pts.length - 1)} y={s1H - 8} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                            {s1Pts[s1Pts.length - 1]?.label}
                          </text>
                        </svg>
                      </div>
                    )}

                    {/* SLIDE 2: ANIMATED SCHEME PERFORMANCE BAR CHART + SIP GRAPH */}
                    {currentScene.chartType === 'MOVERS' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-300 font-semibold">
                            Scheme-Wise Return & Value Impact ({snapshot.daysElapsed} Days)
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {snapshot.sipInstallmentsInPeriod > 0
                              ? `${snapshot.sipInstallmentsInPeriod} SIP(s) Executed · +${formatInrCompact(snapshot.sipTotalAddedInr)}`
                              : 'Lumpsum Portfolio'}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {snapshot.schemeBars.slice(0, 4).map((bar, idx) => {
                            const widthPct = Math.min(100, Math.max(12, (Math.abs(bar.periodPct) / maxAbsSchemePct) * 100));
                            const isUp = bar.periodPct >= 0;
                            return (
                              <div key={bar.shortName} className="space-y-1">
                                <div className="flex items-center justify-between text-xs gap-2">
                                  <span className="text-slate-200 font-medium truncate">
                                    {idx === 0 ? '★ ' : ''}
                                    {bar.shortName} <span className="text-[10px] text-slate-500">({bar.weightPct}% wt)</span>
                                  </span>
                                  <span className={`font-mono font-bold shrink-0 ${isUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {isUp ? '+' : ''}
                                    {bar.periodPct.toFixed(2)}% ({isUp ? '+' : ''}
                                    {formatInrCompact(bar.contributionInr)})
                                  </span>
                                </div>
                                <div className="h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPct}%` }}
                                    transition={{ duration: 0.75, delay: idx * 0.12 }}
                                    className={`h-full rounded-full ${
                                      idx === 0
                                        ? 'bg-gradient-to-r from-[#c5a059] to-emerald-400'
                                        : isUp
                                        ? 'bg-sky-500/85'
                                        : 'bg-amber-500/85'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SLIDE 3: FULL-WIDTH DUAL-LINE BENCHMARK GRAPH */}
                    {currentScene.chartType === 'BENCHMARK' && (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                              <span className="w-4 h-0.5 bg-[#c5a059] inline-block" />
                              Your Portfolio ({snapshot.deltaPct >= 0 ? '+' : ''}{snapshot.deltaPct.toFixed(2)}%)
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-4 h-0.5 border-t-2 border-dashed inline-block" style={{ borderColor: snapshot.benchmarkColor }} />
                              {snapshot.benchmarkName} ({snapshot.benchmarkPeriodPct >= 0 ? '+' : ''}{snapshot.benchmarkPeriodPct.toFixed(2)}%)
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                              snapshot.outperformingMarket
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            Alpha Spread: {snapshot.alphaPeriodPct >= 0 ? '+' : ''}
                            {snapshot.alphaPeriodPct.toFixed(2)}%
                          </span>
                        </div>

                        <svg viewBox={`0 0 ${s3W} ${s3H}`} className="w-full h-auto">
                          {[0, 0.5, 1].map((t, k) => {
                            const val = s3Min + t * s3Span;
                            const y = s3y(val);
                            return (
                              <g key={k}>
                                <line x1="56" y1={y} x2={s3W - 20} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                                <text x="48" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9.5" fontFamily="monospace">
                                  {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                                </text>
                              </g>
                            );
                          })}
                          <motion.path
                            d={s3BenchPath}
                            fill="none"
                            stroke={snapshot.benchmarkColor}
                            strokeWidth="2.4"
                            strokeDasharray="6 4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                          />
                          <motion.path
                            d={s3PortPath}
                            fill="none"
                            stroke="#c5a059"
                            strokeWidth="3.2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.0, ease: 'easeOut' }}
                          />
                          <circle cx={s3x(s1Pts.length - 1)} cy={s3y(s1Pts[s1Pts.length - 1].portfolioIdx - 100)} r="5" fill="#c5a059" stroke="#091120" strokeWidth="2" />
                          <circle cx={s3x(s1Pts.length - 1)} cy={s3y(s1Pts[s1Pts.length - 1].benchmarkIdx - 100)} r="4.5" fill={snapshot.benchmarkColor} stroke="#091120" strokeWidth="2" />
                          <text x={s3x(0)} y={s3H - 8} fill="#64748b" fontSize="9.5" fontFamily="monospace">{s1Pts[0]?.label}</text>
                          <text x={s3x(Math.floor(s1Pts.length / 2))} y={s3H - 8} textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="monospace">{s1Pts[Math.floor(s1Pts.length / 2)]?.label}</text>
                          <text x={s3x(s1Pts.length - 1)} y={s3H - 8} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">{s1Pts[s1Pts.length - 1]?.label}</text>
                        </svg>
                      </div>
                    )}

                    {/* SLIDE 4: DUAL CHARTS — ASSET ALLOCATION DONUT + DIVERSIFICATION & OVERLAP GAUGE */}
                    {currentScene.chartType === 'ALLOCATION' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        {/* Left Chart: Asset Allocation Donut */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                              <circle cx="60" cy="60" r="44" fill="none" stroke="#1e293b" strokeWidth="14" />
                              <motion.circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="none"
                                stroke="#c5a059"
                                strokeWidth="14"
                                strokeDasharray={`${(snapshot.assetAllocation.equityPct / 100) * 276.46} 276.46`}
                                initial={{ strokeDashoffset: 276.46 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ duration: 0.85 }}
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="14"
                                strokeDasharray={`${((100 - snapshot.assetAllocation.equityPct) / 100) * 276.46} 276.46`}
                                strokeDashoffset={-(snapshot.assetAllocation.equityPct / 100) * 276.46}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-sm font-mono font-bold text-white">{snapshot.assetAllocation.equityPct.toFixed(0)}%</span>
                              <span className="text-[9px] text-slate-400 uppercase">Equity</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs flex-1">
                            <div className="font-semibold text-white">Growth vs. Stability Mix</div>
                            <div className="flex justify-between">
                              <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c5a059]" /> Equity</span>
                              <span className="font-mono font-bold text-[#c5a059]">{snapshot.assetAllocation.equityPct.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Debt / Liquid</span>
                              <span className="font-mono font-bold text-sky-300">{(100 - snapshot.assetAllocation.equityPct).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Chart: Diversification & Overlap Gauge */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <GitCompare className="w-3.5 h-3.5 text-[#c5a059]" />
                              Fund Diversification & Overlap
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                              {snapshot.diversification.diversificationScore}/100
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-emerald-400">Unique: {snapshot.diversification.uniqueExposurePct}%</span>
                              <span className="text-amber-400">Overlap: {snapshot.diversification.weightedOverlapPct}%</span>
                            </div>
                            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${snapshot.diversification.uniqueExposurePct}%` }}
                                transition={{ duration: 0.85 }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-[#c5a059]"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${snapshot.diversification.weightedOverlapPct}%` }}
                                transition={{ duration: 0.85, delay: 0.15 }}
                                className="h-full bg-amber-500/90"
                              />
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 leading-snug">
                            ~<strong className="text-white">{snapshot.diversification.estimatedUniqueStocks}</strong> unique stocks across {snapshot.diversification.assetClassesCount} asset classes.
                            {snapshot.diversification.pairs[0] && snapshot.diversification.pairs[0].overlapPct > 0 && (
                              <span className="block text-slate-400 mt-1">
                                Highest pair overlap: {snapshot.diversification.pairs[0].overlapPct}% ({snapshot.diversification.pairs[0].fundA} ↔ {snapshot.diversification.pairs[0].fundB}).
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 5: 5-YEAR COMPOUNDING BAR GRAPH + INTERACTIVE ASK TANU */}
                    {currentScene.chartType === 'TAKEAWAY' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
                        {/* Left Chart: Illustrative 5-Year Compounding Bar Graph */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white">Illustrative 5-Year Compounding (@12% p.a.)</span>
                            <span className="font-mono text-[#c5a059] font-bold">
                              {formatInrCompact(snapshot.projectionSeries[snapshot.projectionSeries.length - 1].projectedInr)}
                            </span>
                          </div>
                          <div className="h-28 flex items-end justify-between gap-2 pt-3 px-1">
                            {snapshot.projectionSeries.map((pt, idx) => {
                              const barH = Math.max(16, (pt.projectedInr / maxProjVal) * 100);
                              return (
                                <div key={pt.yearLabel} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                  <span className="text-[9px] font-mono text-slate-300">{formatInrCompact(pt.projectedInr)}</span>
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${barH}%` }}
                                    transition={{ duration: 0.65, delay: idx * 0.08 }}
                                    className={`w-full rounded-t-md ${
                                      idx === snapshot.projectionSeries.length - 1
                                        ? 'bg-gradient-to-t from-[#c5a059] to-emerald-400'
                                        : 'bg-[#c5a059]/70'
                                    }`}
                                  />
                                  <span className="text-[9.5px] font-mono text-slate-400">{pt.yearLabel}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right Panel: Interactive Ask Tanu + Advisor Callback */}
                        <div className="space-y-3">
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-[#c5a059]" />
                            Ask Tanu Anything About Your Portfolio
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'How diversified is my portfolio?',
                              'How did my SIP help?',
                              'How did I do vs Nifty?'
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
                              placeholder="Type a question in English..."
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
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Want personalised rebalancing advice?</span>
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
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 2. BOTTOM PRESENTER RUNWAY — Tanu Walks Across the Bottom of the Slides! */}
              <div className="relative w-full h-[112px] mt-2 overflow-hidden">
                {/* Stage Spotlight & Presenter Floor Track */}
                <div className="absolute inset-x-4 bottom-2.5 h-1.5 rounded-full bg-gradient-to-r from-slate-800/40 via-[#c5a059]/35 to-slate-800/40" />

                {/* Subtle Floor Stop Markers for Slides 1..5 */}
                {scenes.map((sc, i) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setQaReply(null);
                      setSceneIdx(i);
                    }}
                    style={{ left: `${sc.presenterXPercent}%` }}
                    className={`absolute bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      i === sceneIdx ? 'bg-[#c5a059] scale-125 shadow-[0_0_10px_#c5a059]' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Walk Tanu to Slide ${i + 1}: ${sc.title}`}
                  />
                ))}

                {/* Tanu Walking Smoothly Across the Bottom Runway */}
                <motion.div
                  className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  initial={false}
                  animate={{ left: `${presenterX}%` }}
                  transition={{ type: 'spring', stiffness: 68, damping: 16 }}
                >
                  <TanuOwlMascot
                    mood={activeMood}
                    isSpeaking={isSpeaking}
                    isWalking={isWalking}
                    pointDirection="up"
                    size={98}
                  />
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* LIVE SUBTITLES TELEPROMPTER & SCENE NAVIGATION */}
        <div className="px-5 py-3.5 bg-[#070e1b] border-t border-slate-800 space-y-2.5">
          {/* Subtitles Box */}
          <div className="bg-slate-950/90 border border-[#c5a059]/35 rounded-xl px-4 py-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-[#c5a059]">
                <Subtitles className="w-3.5 h-3.5" />
                Live Subtitles (Pure English)
                {qaReply && sceneIdx === scenes.length - 1 && (
                  <span className="text-sky-300 normal-case font-normal">
                    — Answering: “{qaReply.question}”
                  </span>
                )}
              </span>
              <span className="font-mono text-slate-500 truncate max-w-[260px]">
                {soundEnabled ? `Voice: ${voiceLabel}` : 'Muted · Subtitles Active'}
              </span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed font-medium">“{activeSubtitleText}”</p>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                  title={`Slide ${i + 1}: ${sc.title}`}
                />
              ))}
            </div>

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
                  Next Slide
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
          <div className="bg-amber-500/8 border border-amber-500/25 rounded-lg px-3 py-1.5 flex items-start gap-2 text-[10px] text-slate-400 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">AI & SEBI Caveat:</strong> Tanu provides an AI-assisted educational walkthrough of portfolio figures calculated deterministically from your ledger & TRI benchmarks. Illustrative projections are not guarantees. This summary is informational only and does <strong>not</strong> constitute SEBI-registered investment advice. Mutual fund investments are subject to market risks; consult {portfolio.advisorName} ({portfolio.advisorArn}) for personalized advice.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
