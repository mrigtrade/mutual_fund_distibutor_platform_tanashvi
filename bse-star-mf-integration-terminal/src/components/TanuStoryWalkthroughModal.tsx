/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 16: "Tanu" the Cute Wise Owl — Presentation-Style Animated Portfolio Storyteller
 *
 * Layout Architecture (Zero-Clipping Viewport Fit):
 *  - Compact Header + Period/Benchmark Strip
 *  - Full-Width Unobstructed Visual Graph / Chart Slide (Slides 1–5)
 *  - Dedicated Bottom Presenter Runway where Tanu walks smoothly below the slides
 *  - Compact Movie-Style Subtitles Bar (toggleable CC) + Navigation + SEBI/AI Caveat
 *  - Dedicated Right-Side "Chat with Tanu" Side Panel accessible from ANY slide
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
  GitCompare,
  PanelRightClose
} from 'lucide-react';
import { TanuOwlMascot } from './TanuOwlMascot';
import {
  DEFAULT_INVESTOR_QUESTIONS,
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'tanu';
  text: string;
  timestamp: string;
}

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

  // Voice (Strictly Pure English en-IN), Subtitles Toggle & Auto-Play
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voiceLabel, setVoiceLabel] = useState<string>('Pure English (en-IN)');
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Dedicated Right-Hand "Chat with Tanu" Drawer State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [qaInput, setQaInput] = useState<string>('');
  const [chatOverrideMood, setChatOverrideMood] = useState<TanuMood | null>(null);
  const [chatSubtitleText, setChatSubtitleText] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [advisorPinged, setAdvisorPinged] = useState<boolean>(false);

  const autoPlayTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const autoPlayRef = useRef<boolean>(autoPlay);
  const isChatOpenRef = useRef<boolean>(isChatOpen);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const sceneIdxRef = useRef<number>(sceneIdx);
  const scenesLenRef = useRef<number>(scenes.length);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    sceneIdxRef.current = sceneIdx;
  }, [sceneIdx]);

  useEffect(() => {
    scenesLenRef.current = scenes.length;
  }, [scenes.length]);

  const snapshot = useMemo(
    () => computePeriodSnapshot(portfolio, startDate, endDate, benchmarkId, preset === 'LAST_LOGIN'),
    [portfolio, startDate, endDate, benchmarkId, preset]
  );

  const clearAutoPlayTimer = () => {
    if (autoPlayTimerRef.current) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  // Load strictly Pure English voices
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
      clearAutoPlayTimer();
      stopTanuSpeech();
      setIsSpeaking(false);
      return;
    }

    let cancelled = false;
    clearAutoPlayTimer();
    stopTanuSpeech();
    setIsLoadingStory(true);
    setChatOverrideMood(null);
    setChatSubtitleText('');
    setAdvisorPinged(false);

    // Seed welcoming starter message in Chat drawer
    setChatMessages([
      {
        id: 'welcome-msg',
        sender: 'tanu',
        text: `Hello ${snapshot.firstName}! Click any common question below or type your own query about your portfolio between ${formatNiceDate(startDate)} and ${formatNiceDate(endDate)}.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

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
  }, [isOpen, snapshot, startDate, endDate]);

  // Auto-scroll chat drawer when messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleClose = () => {
    clearAutoPlayTimer();
    stopTanuSpeech();
    setIsSpeaking(false);
    setAutoPlay(false);
    setIsChatOpen(false);
    saveCurrentVisitDate(portfolio.ucc, todayIso);
    onClose();
  };

  // Presenter walking hop when switching slides
  useEffect(() => {
    if (!isOpen || scenes.length === 0) return;
    setIsWalking(true);
    const t = window.setTimeout(() => setIsWalking(false), 900);
    return () => window.clearTimeout(t);
  }, [sceneIdx, isOpen, scenes.length]);

  const currentScene: TanuScene | undefined = scenes[sceneIdx];
  const activeMood: TanuMood = chatOverrideMood || currentScene?.mood || 'WAVING';
  const displayedSubtitle = isChatOpen
    ? chatSubtitleText || `Chat mode active — pick a question on the right or type your own query for Tanu.`
    : currentScene?.subtitle || '';

  // SLIDE NARRATION EFFECT:
  // Triggered ONLY when slide index / storyboard / voice changes (NEVER when opening Chat or toggling Auto-Play!)
  useEffect(() => {
    clearAutoPlayTimer();
    if (!isOpen || isLoadingStory || !currentScene) {
      return;
    }

    // CRITICAL: If user has Chat open, do NOT replay slides — stay focused on user's chat query!
    if (isChatOpenRef.current) {
      return;
    }

    setChatOverrideMood(null);
    const slideNumberForClosure = sceneIdx;
    const totalSlides = scenes.length;

    if (soundEnabled) {
      const label = speakTanuDialogue(currentScene.subtitle, {
        preferredVoiceURI: selectedVoiceURI || undefined,
        onStart: () => setIsSpeaking(true),
        onStop: () => setIsSpeaking(false),
        // Fires ONLY when this exact slide completes speaking naturally (never on cancel/error!)
        onComplete: () => {
          if (
            autoPlayRef.current &&
            !isChatOpenRef.current &&
            slideNumberForClosure === sceneIdxRef.current &&
            slideNumberForClosure < totalSlides - 1
          ) {
            clearAutoPlayTimer();
            autoPlayTimerRef.current = window.setTimeout(() => {
              if (autoPlayRef.current && !isChatOpenRef.current) {
                setSceneIdx(slideNumberForClosure + 1);
              }
            }, 1050);
          }
        }
      });
      setVoiceLabel(label);
    } else {
      stopTanuSpeech();
      setIsSpeaking(false);
      if (autoPlayRef.current && slideNumberForClosure < totalSlides - 1) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          if (autoPlayRef.current && !isChatOpenRef.current) {
            setSceneIdx(slideNumberForClosure + 1);
          }
        }, 5500);
      }
    }

    return () => {
      clearAutoPlayTimer();
    };
  }, [isOpen, isLoadingStory, sceneIdx, scenes, soundEnabled, selectedVoiceURI]);

  // AUTO-PLAY TOGGLE HANDLER (Never cancels/restarts current slide speech!)
  const handleToggleAutoPlay = () => {
    const nextAuto = !autoPlay;
    setAutoPlay(nextAuto);
    autoPlayRef.current = nextAuto;

    if (!nextAuto) {
      clearAutoPlayTimer();
      return;
    }

    // If user clicks Auto while Chat is open, close Chat and resume from current slide cleanly
    if (isChatOpen) {
      setIsChatOpen(false);
      isChatOpenRef.current = false;
    }

    // If Tanu already finished speaking the current slide, smoothly step to next slide (or restart from 0 if on last slide)
    if (!isSpeakingRef.current && scenes.length > 0) {
      clearAutoPlayTimer();
      const delayMs = soundEnabled ? 650 : 4500;
      autoPlayTimerRef.current = window.setTimeout(() => {
        if (!autoPlayRef.current || isChatOpenRef.current) return;
        const cur = sceneIdxRef.current;
        if (cur < scenesLenRef.current - 1) {
          setSceneIdx(cur + 1);
        } else {
          setSceneIdx(0);
        }
      }, delayMs);
    }
  };

  // DEDICATED "CHAT WITH TANU" TOGGLE:
  // Opening Chat immediately halts slide playback so Slide 1 NEVER replays!
  const handleToggleChat = () => {
    const nextOpen = !isChatOpen;
    if (nextOpen) {
      clearAutoPlayTimer();
      stopTanuSpeech();
      setIsSpeaking(false);
      setAutoPlay(false);
      autoPlayRef.current = false;
      isChatOpenRef.current = true;
      setIsChatOpen(true);
      setChatOverrideMood('WAVING');
    } else {
      isChatOpenRef.current = false;
      setIsChatOpen(false);
      setChatOverrideMood(null);
      setChatSubtitleText('');
    }
  };

  useEffect(() => {
    return () => {
      clearAutoPlayTimer();
      stopTanuSpeech();
    };
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
    const trimmed = qText.trim();
    if (!trimmed || isAsking) return;

    clearAutoPlayTimer();
    stopTanuSpeech();
    setIsSpeaking(false);
    setAutoPlay(false);
    autoPlayRef.current = false;
    isChatOpenRef.current = true;
    setIsChatOpen(true);

    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: trimmed, timestamp: nowTime }]);
    setQaInput('');
    setIsAsking(true);
    setChatOverrideMood('THINKING');

    try {
      const res = await askTanuQuestion(trimmed, snapshot);
      setChatOverrideMood(res.mood);
      setChatSubtitleText(res.answer);
      setChatMessages(prev => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          sender: 'tanu',
          text: res.answer,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Speak ONLY Tanu's answer to the user's question (never Slide 1!)
      if (soundEnabled) {
        const label = speakTanuDialogue(res.answer, {
          preferredVoiceURI: selectedVoiceURI || undefined,
          onStart: () => setIsSpeaking(true),
          onStop: () => setIsSpeaking(false)
        });
        setVoiceLabel(label);
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleReplayScene = () => {
    const textToSpeak = isChatOpen && chatSubtitleText ? chatSubtitleText : currentScene?.subtitle || '';
    if (soundEnabled && textToSpeak) {
      speakTanuDialogue(textToSpeak, {
        preferredVoiceURI: selectedVoiceURI || undefined,
        onStart: () => setIsSpeaking(true),
        onStop: () => setIsSpeaking(false)
      });
    }
    setIsWalking(true);
    window.setTimeout(() => setIsWalking(false), 750);
  };

  // --- SVG Chart Geometry (Compact & Crisp so 100% of every chart stays visible without clipping!) ---
  const chartW = 700;
  const chartH = 175;
  const pts = snapshot.miniSeries;

  // Slide 1: Period Wealth Area Chart
  const s1Vals = pts.map(p => p.portfolioValueInr);
  const s1Min = Math.min(...s1Vals) * 0.985;
  const s1Max = Math.max(...s1Vals) * 1.015;
  const s1Span = Math.max(100, s1Max - s1Min);
  const s1x = (i: number) => 66 + (i / Math.max(1, pts.length - 1)) * (chartW - 88);
  const s1y = (v: number) => 16 + (chartH - 42) - ((v - s1Min) / s1Span) * (chartH - 42);
  const s1Line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s1x(i).toFixed(1)} ${s1y(p.portfolioValueInr).toFixed(1)}`).join(' ');
  const s1Area = `${s1Line} L ${s1x(pts.length - 1).toFixed(1)} ${chartH - 26} L 66 ${chartH - 26} Z`;

  // Slide 3: Dual-Line Benchmark Chart
  const s3All = pts.flatMap(p => [p.portfolioIdx - 100, p.benchmarkIdx - 100]);
  const s3Min = Math.min(0, ...s3All) - 0.8;
  const s3Max = Math.max(1, ...s3All) + 0.8;
  const s3Span = Math.max(1, s3Max - s3Min);
  const s3x = (i: number) => 56 + (i / Math.max(1, pts.length - 1)) * (chartW - 76);
  const s3y = (v: number) => 16 + (chartH - 42) - ((v - s3Min) / s3Span) * (chartH - 42);
  const s3PortPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s3x(i).toFixed(1)} ${s3y(p.portfolioIdx - 100).toFixed(1)}`).join(' ');
  const s3BenchPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${s3x(i).toFixed(1)} ${s3y(p.benchmarkIdx - 100).toFixed(1)}`).join(' ');

  const maxAbsSchemePct = Math.max(2, ...snapshot.schemeBars.map(b => Math.abs(b.periodPct)));
  const maxProjVal = Math.max(1, ...snapshot.projectionSeries.map(p => p.projectedInr));
  const presenterX = currentScene?.presenterXPercent ?? 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className={`w-full ${
          isChatOpen ? 'max-w-6xl' : 'max-w-5xl'
        } bg-[#091120] border border-[#c5a059]/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition-all duration-300`}
      >
        {/* 1. COMPACT TOP HEADER BAR */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#0a192f] via-[#13223d] to-[#0a192f] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center overflow-hidden shrink-0">
              <TanuOwlMascot mood="HAPPY" size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-serif font-bold text-white">
                  Tanu · Portfolio Presentation
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {engineUsed === 'GEMINI_AI' ? 'Gemini AI' : 'Verified Engine'}
                </span>
                {launchedByMfd && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    MFD Review
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                <strong className="text-slate-200">{portfolio.investorName}</strong> · {formatNiceDate(startDate)} → {formatNiceDate(endDate)}
              </p>
            </div>
          </div>

          {/* Right Controls: Sound, Voice, Subtitles CC, Auto-Play, Dedicated Chat Toggle, Close */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (!next) {
                  stopTanuSpeech();
                  setIsSpeaking(false);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={`Voice: ${voiceLabel}`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Voice On' : 'Muted'}</span>
            </button>

            {soundEnabled && englishVoices.length > 1 && (
              <select
                value={selectedVoiceURI}
                onChange={e => setSelectedVoiceURI(e.target.value)}
                className="max-w-[135px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 truncate"
                title="Pure English Voices"
              >
                {englishVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name.replace(/Microsoft |Google /g, '')} ({v.lang})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowSubtitles(v => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                showSubtitles
                  ? 'bg-slate-800 border-[#c5a059]/50 text-[#c5a059]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Toggle Dialogue Subtitles Bar"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>CC</span>
            </button>

            <button
              onClick={handleToggleAutoPlay}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                autoPlay
                  ? 'bg-[#c5a059] text-slate-950 border-[#c5a059]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoPlay ? 'Playing' : 'Auto'}</span>
            </button>

            {/* Dedicated Chat with Tanu Drawer Toggle (Available on EVERY Slide — halts slide playback!) */}
            <button
              onClick={handleToggleChat}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                isChatOpen
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/40'
              }`}
              title="Open dedicated Chat with Tanu side panel"
            >
              {isChatOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
              <span>Chat with Tanu</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. COMPACT PERIOD & BENCHMARK STRIP */}
        <div className="px-4 py-1.5 bg-[#070d18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3 h-3 text-[#c5a059]" />
              Window:
            </span>
            {(
              [
                { key: 'LAST_LOGIN', label: 'Last Login' },
                { key: '30D', label: '30D' },
                { key: '3M', label: '3M' },
                { key: '1Y', label: '1Y' }
              ] as { key: DatePreset; label: string }[]
            ).map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  preset === p.key
                    ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => {
                setPreset('CUSTOM');
                setStartDate(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-200"
            />
            <span className="text-slate-500 text-[10px]">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayIso}
              onChange={e => {
                setPreset('CUSTOM');
                setEndDate(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-200"
            />
            <select
              value={benchmarkId}
              onChange={e => setBenchmarkId(e.target.value as BenchmarkId)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-sky-300 font-medium"
            >
              <option value="NIFTY_50_TRI">vs Nifty 50 TRI</option>
              <option value="NIFTY_500_TRI">vs Nifty 500 TRI</option>
              <option value="NIFTY_MIDCAP_150_TRI">vs Midcap 150 TRI</option>
              <option value="CUSTOM_BLENDED">vs Blended Mix</option>
            </select>
          </div>
        </div>

        {/* 3. MAIN BODY: [LEFT: UNOBSTRUCTED SLIDE + TANU RUNWAY + SUBTITLES] | [RIGHT: DEDICATED CHAT PANEL] */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT STAGE COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-[radial-gradient(ellipse_at_top,_#162544_0%,_#091120_70%)]">
            {isLoadingStory || !currentScene ? (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-3 text-slate-300">
                <TanuOwlMascot mood="THINKING" isWalking size={96} />
                <p className="text-xs font-mono text-[#c5a059]">Tanu is preparing your visual presentation slides...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between px-4 sm:px-5 pt-3 pb-1">
                {/* SLIDE TITLE + FULL-WIDTH UNOBSTRUCTED CHART AREA */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40">
                        Slide {currentScene.sceneNumber}/{scenes.length} · {currentScene.badge}
                      </span>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-white">{currentScene.title}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#c5a059] font-semibold">{currentScene.keyTakeaway}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentScene.id}-${benchmarkId}-${startDate}-${endDate}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="bg-[#0c1629]/95 border border-slate-700/80 rounded-xl p-3.5 sm:p-4 shadow-xl"
                    >
                      {/* SLIDE 1: FULL-WIDTH PORTFOLIO VALUE AREA GRAPH */}
                      {currentScene.chartType === 'DELTA' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">
                                Start: <strong className="text-slate-200">{formatInrCompact(snapshot.startValueInr)}</strong>
                              </span>
                              <span className="text-slate-400">
                                Current: <strong className="text-white">{formatInrCompact(snapshot.endValueInr)}</strong>
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                snapshot.deltaInr >= 0
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {snapshot.deltaInr >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {snapshot.deltaInr >= 0 ? '+' : ''}
                              {formatInrCompact(snapshot.deltaInr)} ({snapshot.deltaPct >= 0 ? '+' : ''}
                              {snapshot.deltaPct.toFixed(2)}%)
                            </span>
                          </div>

                          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-h-[185px] h-auto" preserveAspectRatio="xMidYMid meet">
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
                                  <line x1="66" y1={y} x2={chartW - 22} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
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
                              transition={{ duration: 0.9, ease: 'easeOut' }}
                            />
                            <circle cx={s1x(0)} cy={s1y(pts[0].portfolioValueInr)} r="4.5" fill="#94a3b8" stroke="#091120" strokeWidth="2" />
                            <circle cx={s1x(pts.length - 1)} cy={s1y(pts[pts.length - 1].portfolioValueInr)} r="5.5" fill="#34d399" stroke="#091120" strokeWidth="2" />
                            <text x={s1x(0)} y={chartH - 7} fill="#64748b" fontSize="9.5" fontFamily="monospace">{pts[0]?.label}</text>
                            <text x={s1x(Math.floor(pts.length / 2))} y={chartH - 7} textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="monospace">{pts[Math.floor(pts.length / 2)]?.label}</text>
                            <text x={s1x(pts.length - 1)} y={chartH - 7} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">{pts[pts.length - 1]?.label}</text>
                          </svg>
                        </div>
                      )}

                      {/* SLIDE 2: SCHEME-WISE PERFORMANCE BAR CHART + SIP SUMMARY */}
                      {currentScene.chartType === 'MOVERS' && (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-slate-300 font-semibold">
                              Scheme-Wise Return & Value Impact ({snapshot.daysElapsed} Days)
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {snapshot.sipInstallmentsInPeriod > 0
                                ? `${snapshot.sipInstallmentsInPeriod} SIP(s) · +${formatInrCompact(snapshot.sipTotalAddedInr)}`
                                : 'Lumpsum Portfolio'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {snapshot.schemeBars.slice(0, 4).map((bar, idx) => {
                              const widthPct = Math.min(100, Math.max(12, (Math.abs(bar.periodPct) / maxAbsSchemePct) * 100));
                              const isUp = bar.periodPct >= 0;
                              return (
                                <div key={bar.shortName} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs gap-2">
                                    <span className="text-slate-200 font-medium truncate">
                                      {idx === 0 ? '★ ' : ''}
                                      {bar.shortName} <span className="text-[10px] text-slate-500">({bar.weightPct}%)</span>
                                    </span>
                                    <span className={`font-mono font-bold shrink-0 ${isUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {isUp ? '+' : ''}
                                      {bar.periodPct.toFixed(2)}% ({isUp ? '+' : ''}
                                      {formatInrCompact(bar.contributionInr)})
                                    </span>
                                  </div>
                                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${widthPct}%` }}
                                      transition={{ duration: 0.7, delay: idx * 0.1 }}
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
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                                <span className="w-4 h-0.5 bg-[#c5a059] inline-block" />
                                Portfolio ({snapshot.deltaPct >= 0 ? '+' : ''}{snapshot.deltaPct.toFixed(2)}%)
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-4 h-0.5 border-t-2 border-dashed inline-block" style={{ borderColor: snapshot.benchmarkColor }} />
                                {snapshot.benchmarkName} ({snapshot.benchmarkPeriodPct >= 0 ? '+' : ''}{snapshot.benchmarkPeriodPct.toFixed(2)}%)
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                snapshot.outperformingMarket
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              Spread: {snapshot.alphaPeriodPct >= 0 ? '+' : ''}
                              {snapshot.alphaPeriodPct.toFixed(2)}%
                            </span>
                          </div>

                          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-h-[185px] h-auto" preserveAspectRatio="xMidYMid meet">
                            {[0, 0.5, 1].map((t, k) => {
                              const val = s3Min + t * s3Span;
                              const y = s3y(val);
                              return (
                                <g key={k}>
                                  <line x1="56" y1={y} x2={chartW - 20} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
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
                              transition={{ duration: 0.85, ease: 'easeOut' }}
                            />
                            <motion.path
                              d={s3PortPath}
                              fill="none"
                              stroke="#c5a059"
                              strokeWidth="3.2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.95, ease: 'easeOut' }}
                            />
                            <circle cx={s3x(pts.length - 1)} cy={s3y(pts[pts.length - 1].portfolioIdx - 100)} r="5" fill="#c5a059" stroke="#091120" strokeWidth="2" />
                            <circle cx={s3x(pts.length - 1)} cy={s3y(pts[pts.length - 1].benchmarkIdx - 100)} r="4.5" fill={snapshot.benchmarkColor} stroke="#091120" strokeWidth="2" />
                            <text x={s3x(0)} y={chartH - 7} fill="#64748b" fontSize="9.5" fontFamily="monospace">{pts[0]?.label}</text>
                            <text x={s3x(Math.floor(pts.length / 2))} y={chartH - 7} textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="monospace">{pts[Math.floor(pts.length / 2)]?.label}</text>
                            <text x={s3x(pts.length - 1)} y={chartH - 7} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">{pts[pts.length - 1]?.label}</text>
                          </svg>
                        </div>
                      )}

                      {/* SLIDE 4: ASSET ALLOCATION DONUT + DIVERSIFICATION & OVERLAP GAUGE */}
                      {currentScene.chartType === 'ALLOCATION' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4">
                            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                              <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
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
                                  transition={{ duration: 0.8 }}
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
                            <div className="space-y-1.5 text-xs flex-1">
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

                          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <GitCompare className="w-3.5 h-3.5 text-[#c5a059]" />
                                Fund Diversification & Overlap
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                                {snapshot.diversification.diversificationScore}/100
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-emerald-400">Unique: {snapshot.diversification.uniqueExposurePct}%</span>
                                <span className="text-amber-400">Overlap: {snapshot.diversification.weightedOverlapPct}%</span>
                              </div>
                              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${snapshot.diversification.uniqueExposurePct}%` }}
                                  transition={{ duration: 0.8 }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#c5a059]"
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${snapshot.diversification.weightedOverlapPct}%` }}
                                  transition={{ duration: 0.8, delay: 0.15 }}
                                  className="h-full bg-amber-500/90"
                                />
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-300 leading-snug">
                              ~<strong className="text-white">{snapshot.diversification.estimatedUniqueStocks}</strong> unique stocks across {snapshot.diversification.assetClassesCount} asset classes.
                              {snapshot.diversification.pairs[0] && snapshot.diversification.pairs[0].overlapPct > 0 && (
                                <span className="block text-slate-400 mt-0.5">
                                  Top pair overlap: {snapshot.diversification.pairs[0].overlapPct}% ({snapshot.diversification.pairs[0].fundA} ↔ {snapshot.diversification.pairs[0].fundB}).
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SLIDE 5: FULL-WIDTH 5-YEAR COMPOUNDING BAR GRAPH (Chat cleanly lives in Right Drawer!) */}
                      {currentScene.chartType === 'TAKEAWAY' && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-semibold text-white">Illustrative 5-Year Wealth Compounding (@12% p.a.)</span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                (Current Corpus + Ongoing SIPs)
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[#c5a059] font-bold">
                                Yr 5 Est.: {formatInrCompact(snapshot.projectionSeries[snapshot.projectionSeries.length - 1].projectedInr)}
                              </span>
                              {!isChatOpen && (
                                <button
                                  type="button"
                                  onClick={handleToggleChat}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Open Chat with Tanu
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="h-36 flex items-end justify-between gap-3 pt-4 px-2">
                            {snapshot.projectionSeries.map((pt, idx) => {
                              const totalH = Math.max(18, (pt.projectedInr / maxProjVal) * 100);
                              const invH = Math.max(12, (pt.investedInr / pt.projectedInr) * 100);
                              return (
                                <div key={pt.yearLabel} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                  <span className="text-[10px] font-mono text-white font-semibold">
                                    {formatInrCompact(pt.projectedInr)}
                                  </span>
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${totalH}%` }}
                                    transition={{ duration: 0.65, delay: idx * 0.08 }}
                                    className="w-full max-w-[78px] rounded-t-lg overflow-hidden flex flex-col justify-end bg-gradient-to-t from-[#c5a059] to-emerald-400"
                                  >
                                    <div
                                      className="w-full bg-slate-700/80 border-t border-slate-500/50"
                                      style={{ height: `${invH}%` }}
                                      title={`Invested Base: ${formatInrCompact(pt.investedInr)}`}
                                    />
                                  </motion.div>
                                  <span className="text-[10px] font-mono text-slate-400">{pt.yearLabel}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/70">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" /> Capital Base</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#c5a059] inline-block" /> Compounding Gain</span>
                            </div>
                            <span className="font-mono text-emerald-400">Overall XIRR: {snapshot.portfolioXirr.toFixed(2)}% p.a.</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 4. DEDICATED BOTTOM PRESENTER RUNWAY — Tanu Walks Across Below the Slide! */}
                <div className="relative w-full h-[84px] mt-1 shrink-0 overflow-hidden">
                  <div className="absolute inset-x-4 bottom-2 h-1 rounded-full bg-gradient-to-r from-slate-800/40 via-[#c5a059]/40 to-slate-800/40" />

                  {scenes.map((sc, i) => (
                    <button
                      key={sc.id}
                      onClick={() => setSceneIdx(i)}
                      style={{ left: `${sc.presenterXPercent}%` }}
                      className={`absolute bottom-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        i === sceneIdx ? 'bg-[#c5a059] scale-125 shadow-[0_0_8px_#c5a059]' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Slide ${i + 1}: ${sc.title}`}
                    />
                  ))}

                  <motion.div
                    className="absolute bottom-0.5 -translate-x-1/2 pointer-events-none"
                    initial={false}
                    animate={{ left: `${presenterX}%` }}
                    transition={{ type: 'spring', stiffness: 70, damping: 16 }}
                  >
                    <TanuOwlMascot
                      mood={activeMood}
                      isSpeaking={isSpeaking}
                      isWalking={isWalking}
                      pointDirection="up"
                      size={78}
                    />
                  </motion.div>
                </div>
              </div>
            )}

            {/* 5. SLEEK NON-OVERLAPPING SUBTITLES + NAVIGATION + CAVEAT FOOTER */}
            <div className="px-4 py-2.5 bg-[#070e1b] border-t border-slate-800 space-y-2 shrink-0">
              {showSubtitles && (
                <div className="bg-slate-950/90 border border-[#c5a059]/30 rounded-lg px-3.5 py-2 flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#c5a059]/15 text-[#c5a059] text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    CC
                  </span>
                  <p className="text-xs sm:text-[13px] text-slate-100 leading-snug font-medium flex-1">
                    “{displayedSubtitle}”
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {scenes.map((sc, i) => (
                    <button
                      key={sc.id}
                      onClick={() => setSceneIdx(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === sceneIdx ? 'w-6 bg-[#c5a059]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Slide ${i + 1}: ${sc.title}`}
                    />
                  ))}
                  <span className="text-[10px] font-mono text-slate-500 ml-1.5 hidden sm:inline">
                    {soundEnabled ? voiceLabel : 'Muted'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSceneIdx(prev => Math.max(0, prev - 1))}
                    disabled={sceneIdx === 0}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <button
                    onClick={handleReplayScene}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Replay
                  </button>

                  {sceneIdx < scenes.length - 1 ? (
                    <button
                      onClick={() => setSceneIdx(prev => Math.min(scenes.length - 1, prev + 1))}
                      className="px-3.5 py-1 rounded-lg text-xs font-bold bg-[#c5a059] hover:bg-[#d7b570] text-slate-950 flex items-center gap-1 shadow cursor-pointer"
                    >
                      Next Slide
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="px-3.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 shadow cursor-pointer"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-amber-500/8 border border-amber-500/20 rounded px-2.5 py-1 flex items-center gap-2 text-[10px] text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate sm:whitespace-normal">
                  <strong className="text-amber-300">AI & SEBI Caveat:</strong> Educational summary from deterministic ledger & TRI data — not SEBI investment advice. Mutual fund investments are subject to market risks.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE DRAWER: DEDICATED "CHAT WITH TANU" PANEL (Accessible from ANY slide!) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 330, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full lg:w-[330px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#070e1c] flex flex-col max-h-[42vh] lg:max-h-none"
              >
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#c5a059]" />
                    <div>
                      <div className="text-xs font-bold text-white">Chat with Tanu</div>
                      <div className="text-[10px] text-slate-400">Plain-English Q&A · Pure English</div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleChat}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Hide Chat Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                  {chatMessages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-[#c5a059] text-slate-950 font-medium rounded-br-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">{m.timestamp}</span>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="text-[11px] font-mono text-[#c5a059] animate-pulse">Tanu is thinking...</div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Expanded 10 Common Investor Queries (One-Click Tray) */}
                <div className="px-3 py-2 border-t border-slate-800/80 bg-[#060b16]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Common Investor Questions</span>
                    <span className="text-[9px] text-slate-500 font-mono">{DEFAULT_INVESTOR_QUESTIONS.length} topics</span>
                  </div>
                  <div className="max-h-[112px] overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                    {DEFAULT_INVESTOR_QUESTIONS.map(q => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleAskQuestion(q.label)}
                        disabled={isAsking}
                        className="px-2 py-1 rounded-full text-[10px] bg-slate-900 hover:bg-slate-800 hover:border-[#c5a059]/60 text-slate-200 border border-slate-700/80 transition cursor-pointer text-left"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input + Human MFD Advisor Connect */}
                <div className="p-3 border-t border-slate-800 space-y-2">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleAskQuestion(qaInput);
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={qaInput}
                      onChange={e => setQaInput(e.target.value)}
                      placeholder="Ask Tanu a question..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !qaInput.trim()}
                      className="px-2.5 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d6b36e] text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setAdvisorPinged(true)}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      advisorPinged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {advisorPinged
                      ? 'Advisor Callback Requested!'
                      : `Talk to Advisor (${portfolio.advisorName.split(' ')[0]})`}
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
