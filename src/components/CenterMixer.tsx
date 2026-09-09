import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Shield,
  Split,
  Play,
  Pause,
  Repeat,
  RotateCcw,
  Headphones,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  Check,
  Square,
  Trash2,
  Plus,
} from 'lucide-react';
import { RewindTransitionState } from '../types.ts';

interface CenterMixerProps {
  deckAOn: boolean;
  deckBOn: boolean;
  deckAPlaying: boolean;
  deckBPlaying: boolean;
  deckAVolume: number;
  deckBVolume: number;
  masterVolume: number;
  crossfader: number; // 0 to 100
  exclusiveMode: boolean;
  activeDeck: 'A' | 'B';
  isRemixMode: boolean;
  onToggleRemix: () => void;
  // Remix Transition system props
  isTransitioning?: boolean;
  transitionProgress?: number; // 0 to 100
  transitionFrom?: 'A' | 'B';
  transitionTo?: 'A' | 'B';
  transitionDuration?: number; // seconds
  onStartRemixTransition: () => void;
  onCancelRemixTransition?: () => void;
  onSetTransitionDuration?: (sec: number) => void;
  // Rewind Mix system props
  onRewindMix?: () => void;
  rewindTransitionState?: RewindTransitionState;
  onCustomAudioChange?: (url: string | null) => void;
  soundOverlay?: {
    soundFile: { name: string; url: string } | null;
    status: 'READY' | 'PLAYING';
    onFileSelected: (file: File) => void;
    onPlaySound: () => void;
    onStopSound: () => void;
    onRemoveSound: () => void;
  };
  masterMuted?: boolean;
  onToggleDeckA: () => void;
  onToggleDeckB: () => void;
  onUpdateCrossfader: (pos: number) => void;
  onUpdateMasterVolume: (vol: number) => void;
  onToggleExclusiveMode: () => void;
  onPlayActiveDeck?: () => void;
  onCueActiveDeck?: () => void;
  onLoopActiveDeck?: () => void;
  onSyncActiveDeck?: () => void;
  onToggleMasterMute?: () => void;
}

export const CenterMixer: React.FC<CenterMixerProps> = ({
  deckAOn,
  deckBOn,
  deckAPlaying,
  deckBPlaying,
  deckAVolume,
  deckBVolume,
  masterVolume,
  crossfader,
  exclusiveMode,
  activeDeck,
  isRemixMode,
  onToggleRemix,
  isTransitioning = false,
  transitionProgress = 0,
  transitionFrom,
  transitionTo,
  transitionDuration = 4,
  onStartRemixTransition,
  onCancelRemixTransition,
  onSetTransitionDuration,
  onRewindMix,
  rewindTransitionState,
  onCustomAudioChange,
  soundOverlay,
  masterMuted = false,
  onToggleDeckA,
  onToggleDeckB,
  onUpdateCrossfader,
  onUpdateMasterVolume,
  onToggleExclusiveMode,
  onPlayActiveDeck,
  onCueActiveDeck,
  onLoopActiveDeck,
  onSyncActiveDeck,
  onToggleMasterMute,
}) => {
  // Local Rewind Audio Upload State & Audio Reference
  const [customAudio, setCustomAudio] = useState<{
    file: File;
    name: string;
    url: string;
    duration: string;
  } | null>(null);
  const [audioStatus, setAudioStatus] = useState<'READY' | 'PLAYING' | 'PAUSED' | 'STOPPED'>('READY');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up local audio element on unmount or file change
  useEffect(() => {
    return () => {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.src = '';
        localAudioRef.current = null;
      }
    };
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (customAudio?.url) {
      URL.revokeObjectURL(customAudio.url);
    }

    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.src = '';
      localAudioRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    const newAudioElem = new Audio(objectUrl);
    newAudioElem.preload = 'metadata';

    const updateDuration = () => {
      const dur = Math.round(newAudioElem.duration);
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        const m = Math.floor(dur / 60);
        const s = dur % 60;
        const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        setCustomAudio((prev) => (prev ? { ...prev, duration: formatted } : null));
      }
    };

    newAudioElem.addEventListener('loadedmetadata', updateDuration);
    newAudioElem.addEventListener('durationchange', updateDuration);
    newAudioElem.onended = () => {
      newAudioElem.currentTime = 0;
      setAudioStatus('READY');
    };
    newAudioElem.onpause = () => {
      setAudioStatus((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev));
    };
    try {
      newAudioElem.load();
    } catch {}
    localAudioRef.current = newAudioElem;

    setCustomAudio({
      file,
      name: file.name,
      url: objectUrl,
      duration: '00:00',
    });
    setAudioStatus('READY');
    onCustomAudioChange?.(objectUrl);

    // Reset input value so re-selecting same file fires onChange
    e.target.value = '';
  };

  const handlePlayAudio = () => {
    if (!localAudioRef.current && customAudio?.url) {
      const newAudioElem = new Audio(customAudio.url);
      newAudioElem.onended = () => {
        newAudioElem.currentTime = 0;
        setAudioStatus('READY');
      };
      newAudioElem.onpause = () => {
        setAudioStatus((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev));
      };
      localAudioRef.current = newAudioElem;
    }
    if (localAudioRef.current) {
      localAudioRef.current
        .play()
        .then(() => {
          setAudioStatus('PLAYING');
        })
        .catch((err) => {
          console.warn('Playback prevented or file error:', err);
        });
    }
  };

  const handlePauseAudio = () => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      setAudioStatus('PAUSED');
    }
  };

  const handleStopAudio = () => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.currentTime = 0;
      setAudioStatus('STOPPED');
    }
  };

  const handleRemoveAudio = () => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.src = '';
      localAudioRef.current = null;
    }
    if (customAudio?.url) {
      URL.revokeObjectURL(customAudio.url);
    }
    setCustomAudio(null);
    setAudioStatus('READY');
    onCustomAudioChange?.(null);
  };

  // Determine current playing deck and next transition target deck
  const currentDeck: 'A' | 'B' = (() => {
    if (deckAPlaying && !deckBPlaying) return 'A';
    if (deckBPlaying && !deckAPlaying) return 'B';
    return crossfader < 50 ? 'A' : 'B';
  })();
  const nextDeck: 'A' | 'B' = currentDeck === 'A' ? 'B' : 'A';

  // Calculate live volume progression display for transition
  const liveTransitionFrom = transitionFrom || currentDeck;
  const liveTransitionTo = transitionTo || nextDeck;
  const volFrom = Math.round(100 - transitionProgress);
  const volTo = Math.round(transitionProgress);

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3 md:p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/60 pointer-events-none" />

      {/* Mixer Header: Brand badge & Exclusive Mode */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          <span className="font-black text-xs tracking-widest text-slate-200 uppercase">
            MASTER SECTION
          </span>
        </div>

        {/* Exclusive Deck Mode Button (Disabled while Remix Mode is ON) */}
        <button
          id="exclusive-mode-toggle"
          onClick={onToggleExclusiveMode}
          disabled={isRemixMode}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition border ${
            isRemixMode
              ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800'
              : exclusiveMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={
            isRemixMode
              ? 'Exclusive Mode disabled: Remix Mode plays both decks simultaneously'
              : 'Exclusive Deck Mode: Only one deck plays at a time'
          }
        >
          <Shield className="w-3 h-3" />
          <span>EXCLUSIVE: {isRemixMode ? 'OFF (REMIX)' : exclusiveMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 1. Large Professional REMIX TRANSITION Control */}
      <div className="relative z-10 py-2.5 flex flex-col gap-2">
        {/* Main REMIX TRANSITION Button */}
        <div className="relative group flex items-stretch gap-2">
          <button
            id="remix-transition-btn"
            type="button"
            onClick={onStartRemixTransition}
            className={`w-full py-3 px-3.5 rounded-xl font-black tracking-wider transition-all duration-200 relative overflow-hidden select-none border-2 cursor-pointer shadow-xl active:scale-[0.98] ${
              isTransitioning
                ? 'bg-slate-900 border-fuchsia-400 text-white shadow-[0_0_25px_rgba(217,70,239,0.7)] ring-2 ring-fuchsia-500/50'
                : 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-white border-fuchsia-500/60 hover:border-fuchsia-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            }`}
            title="🎧 REMIX TRANSITION: Smoothly fade OUT the current deck and fade IN the next deck while both keep playing"
          >
            {/* Animated progress bar fill during active transition */}
            {isTransitioning && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/50 via-purple-600/50 to-cyan-500/50 transition-all duration-75 pointer-events-none"
                style={{ width: `${transitionProgress}%` }}
              />
            )}

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg transition-transform ${
                    isTransitioning
                      ? 'bg-fuchsia-500 text-slate-950 animate-pulse'
                      : 'bg-fuchsia-500/20 text-fuchsia-300'
                  }`}
                >
                  <Headphones className="w-5 h-5" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black tracking-widest uppercase flex items-center gap-1.5">
                      <span>🎧 REMIX TRANSITION</span>
                    </span>
                    {isTransitioning && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-400 text-slate-950 font-bold uppercase tracking-wider animate-pulse">
                        FADING
                      </span>
                    )}
                  </div>

                  {isTransitioning ? (
                    <div className="text-[10px] font-mono text-fuchsia-200 flex items-center gap-1.5 pt-0.5">
                      <span className={liveTransitionFrom === 'A' ? 'text-cyan-300 font-bold' : 'text-orange-300 font-bold'}>
                        DECK {liveTransitionFrom}: {volFrom}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-white" />
                      <span className={liveTransitionTo === 'A' ? 'text-cyan-300 font-bold' : 'text-orange-300 font-bold'}>
                        DECK {liveTransitionTo}: {volTo}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5 pt-0.5">
                      <span>FADE OUT</span>
                      <strong className={currentDeck === 'A' ? 'text-cyan-400' : 'text-orange-400'}>
                        DECK {currentDeck}
                      </strong>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      <span>FADE IN</span>
                      <strong className={nextDeck === 'A' ? 'text-cyan-400' : 'text-orange-400'}>
                        DECK {nextDeck}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Status or Progress % */}
              <div className="flex items-center gap-2">
                {isTransitioning ? (
                  <span className="text-xs font-mono font-black text-fuchsia-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-fuchsia-500/50">
                    {transitionProgress}%
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-1 rounded-md font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {currentDeck} ➔ {nextDeck}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Separate Cancel / Stop Transition Button */}
          {isTransitioning && onCancelRemixTransition && (
            <button
              id="cancel-remix-transition-btn"
              type="button"
              onClick={onCancelRemixTransition}
              className="px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-600/50 flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-lg active:scale-95 shrink-0"
              title="Cancel transition"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider">STOP</span>
            </button>
          )}
        </div>

        {/* Transition Speed Selector & Remix Mode Sub-Strip */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              SPEED:
            </span>
            {[2, 4, 8, 16].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onSetTransitionDuration?.(sec)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                  transitionDuration === sec
                    ? 'bg-fuchsia-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title={`Set transition duration to ${sec} seconds`}
              >
                {sec}s{sec === 4 ? ' (BEAT)' : ''}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleRemix}
            className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 border transition cursor-pointer ${
              isRemixMode
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle dual deck simultaneous playback mode"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRemixMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span>DUAL PLAYBACK: {isRemixMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Center Mixer Body: Deck ON/OFF Toggles & Master Volume */}
      <div className="relative z-10 py-3 grid grid-cols-3 gap-2 items-center">
        {/* Deck A ON / OFF Large Button */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-cyan-400 tracking-wider">DECK A POWER</span>
          <button
            id="deck-a-power-btn"
            onClick={onToggleDeckA}
            className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg ${
              deckAOn
                ? 'bg-gradient-to-b from-cyan-500 to-cyan-700 text-slate-950 border border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95'
                : 'bg-slate-900/90 text-slate-500 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${deckAOn ? 'bg-slate-950 animate-ping' : 'bg-slate-700'}`} />
            <span>A {deckAOn ? 'ON' : 'OFF'}</span>
          </button>
          <span className="text-[9px] font-mono text-slate-400">
            {deckAPlaying ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>

        {/* Master Volume Slider & VU Meter */}
        <div className="flex flex-col items-center gap-1 px-1">
          <div className="flex items-center justify-between w-full text-[10px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              MASTER
            </span>
            <span className="font-bold text-white">{masterVolume}%</span>
          </div>

          <input
            id="master-volume-slider"
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => onUpdateMasterVolume(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Master VU Meter LED Animation */}
          <div className="w-full flex items-center justify-center gap-0.5 pt-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const isActiveA = deckAPlaying && (deckAVolume * (100 - crossfader) / 5000) * 12 > i;
              const isActiveB = deckBPlaying && (deckBVolume * crossfader / 5000) * 12 > i;
              const isActive = (isActiveA || isActiveB) && masterVolume > 0;
              const isPeak = i >= 10;
              const isMid = i >= 7;

              let color = 'bg-slate-800';
              if (isActive) {
                if (isPeak) color = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
                else if (isMid) color = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]';
                else color = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]';
              }

              return (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-xs transition-colors duration-75 ${color}`}
                />
              );
            })}
          </div>
        </div>

        {/* Deck B ON / OFF Large Button */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-orange-400 tracking-wider">DECK B POWER</span>
          <button
            id="deck-b-power-btn"
            onClick={onToggleDeckB}
            className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg ${
              deckBOn
                ? 'bg-gradient-to-b from-orange-500 to-orange-700 text-slate-950 border border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.5)] active:scale-95'
                : 'bg-slate-900/90 text-slate-500 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${deckBOn ? 'bg-slate-950 animate-ping' : 'bg-slate-700'}`} />
            <span>B {deckBOn ? 'ON' : 'OFF'}</span>
          </button>
          <span className="text-[9px] font-mono text-slate-400">
            {deckBPlaying ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Crossfader Section (Mandatory Core DJ Control) */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className={`flex items-center gap-1 ${crossfader < 50 ? 'text-cyan-400 font-extrabold' : 'text-slate-400'}`}>
            ◄ DECK A ({100 - crossfader}%)
          </span>
          <span className="text-slate-400 font-mono tracking-wider">
            {crossfader === 50 ? 'CENTER BLEND' : crossfader < 50 ? 'FAVOR A' : 'FAVOR B'}
          </span>
          <span className={`flex items-center gap-1 ${crossfader > 50 ? 'text-orange-400 font-extrabold' : 'text-slate-400'}`}>
            ({crossfader}%) DECK B ►
          </span>
        </div>

        {/* Large Tactile DJ Crossfader Slider */}
        <div className="relative py-1 flex items-center">
          {/* Track groove */}
          <div className="absolute left-0 right-0 h-4 bg-slate-900 rounded-full border border-slate-700 shadow-inner flex items-center justify-between px-3">
            <span className="text-[8px] font-black text-cyan-500">A</span>
            <div className="w-0.5 h-3 bg-slate-600" />
            <span className="text-[8px] font-black text-orange-500">B</span>
          </div>

          <input
            id="dj-crossfader-slider"
            type="range"
            min="0"
            max="100"
            value={crossfader}
            onChange={(e) => onUpdateCrossfader(Number(e.target.value))}
            className="w-full h-8 bg-transparent appearance-none cursor-pointer z-10 focus:outline-none accent-slate-100"
            style={{
              WebkitAppearance: 'none',
            }}
          />
        </div>

        {/* Quick Cut Snap Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => onUpdateCrossfader(0)}
            className={`py-1 rounded text-[9px] font-bold tracking-wider transition ${
              crossfader === 0
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            SNAP A
          </button>
          <button
            onClick={() => onUpdateCrossfader(50)}
            className={`py-1 rounded text-[9px] font-bold tracking-wider transition ${
              crossfader === 50
                ? 'bg-slate-200 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            CENTER
          </button>
          <button
            onClick={() => onUpdateCrossfader(100)}
            className={`py-1 rounded text-[9px] font-bold tracking-wider transition ${
              crossfader === 100
                ? 'bg-orange-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            SNAP B
          </button>
        </div>
      </div>

      {/* Tactile Master Strip from Reference Diagram: PLAY | CUE | LOOP | SYNC | MASTER */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1 px-1">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeDeck === 'A' ? 'bg-cyan-400' : 'bg-orange-400'
              }`}
            />
            TARGET: <strong className="text-white">DECK {activeDeck}</strong>
          </span>
          <span className="text-[8px] uppercase tracking-wider">Master Deck Controls</span>
        </div>
        <div className="flex sm:grid sm:grid-cols-6 gap-1 overflow-x-auto no-scrollbar py-0.5">
          {/* PLAY */}
          <button
            id="mixer-play-btn"
            onClick={onPlayActiveDeck}
            className={`py-1.5 px-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-1 transition active:scale-95 shrink-0 min-w-[50px] sm:min-w-0 ${
              (activeDeck === 'A' ? deckAPlaying : deckBPlaying)
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title={`Play / Pause Deck ${activeDeck}`}
          >
            {(activeDeck === 'A' ? deckAPlaying : deckBPlaying) ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>PLAY</span>
          </button>

          {/* CUE */}
          <button
            id="mixer-cue-btn"
            onClick={onCueActiveDeck}
            className="py-1.5 px-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-black text-[10px] flex items-center justify-center gap-1 transition active:scale-95 shrink-0 min-w-[48px] sm:min-w-0"
            title={`Cue Deck ${activeDeck}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>CUE</span>
          </button>

          {/* LOOP */}
          <button
            id="mixer-loop-btn"
            onClick={onLoopActiveDeck}
            className="py-1.5 px-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-black text-[10px] flex items-center justify-center gap-1 transition active:scale-95 shrink-0 min-w-[48px] sm:min-w-0"
            title={`Toggle Loop on Deck ${activeDeck}`}
          >
            <Repeat className="w-3 h-3" />
            <span>LOOP</span>
          </button>

          {/* ↩ REWIND MIX (Hardware DJ Rewind Transition Control) */}
          {(() => {
            const isRewinding = rewindTransitionState?.isActive;
            const isCompleted = rewindTransitionState?.phase === 'completed';
            const targetDeck = activeDeck === 'A' ? 'B' : 'A';
            const directionText = isRewinding
              ? `${rewindTransitionState.fromDeck} → ${rewindTransitionState.toDeck}`
              : isCompleted
              ? `${rewindTransitionState.toDeck} ACTIVE`
              : `${activeDeck} → ${targetDeck}`;

            return (
              <div className="relative flex items-center justify-center shrink-0 min-w-[68px] sm:min-w-0">
                <button
                  id="mixer-rewind-mix-btn"
                  type="button"
                  onClick={onRewindMix}
                  disabled={isRewinding}
                  className={`w-full py-1 px-1 rounded-lg border text-[10px] font-black flex flex-col items-center justify-center transition active:scale-95 relative overflow-hidden ${
                    isRewinding
                      ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-wait'
                      : isCompleted
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-gradient-to-b from-amber-500/20 to-slate-900 hover:from-amber-500/30 hover:to-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
                  }`}
                  title={
                    isRewinding
                      ? 'TRANSITION IN PROGRESS'
                      : `↩ REWIND MIX: Vinyl scratch transition from Deck ${activeDeck} to Deck ${targetDeck} (Shortcut 'R')`
                  }
                >
                  {/* Active Rewind Progress Bar Fill */}
                  {isRewinding && (
                    <div
                      className="absolute inset-0 bg-amber-500/30 pointer-events-none transition-all duration-100"
                      style={{ width: `${rewindTransitionState.progress}%` }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-1 leading-none">
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <RotateCcw
                        className={`w-3 h-3 text-amber-400 ${
                          isRewinding ? 'animate-spin duration-700' : ''
                        }`}
                      />
                    )}
                    <span className="tracking-tight text-[9px] font-black">
                      {isRewinding ? 'REWINDING...' : isCompleted ? '✓ MIXED' : 'REWIND MIX'}
                    </span>
                  </div>
                  <span className="relative z-10 text-[8px] font-mono opacity-90 mt-0.5 tracking-wider font-bold">
                    {directionText}
                  </span>
                </button>

                {/* Small '+' icon button to select/upload local audio from phone */}
                <button
                  id="rewind-mix-plus-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-90 text-slate-950 flex items-center justify-center shadow-md border border-amber-200 cursor-pointer z-20"
                  title="Select/upload audio file from phone (+)"
                >
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </button>
              </div>
            );
          })()}

          {/* SYNC */}
          <button
            id="mixer-sync-btn"
            onClick={onSyncActiveDeck}
            className="py-1.5 px-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/40 text-indigo-300 font-black text-[10px] flex items-center justify-center gap-1 transition active:scale-95 shrink-0 min-w-[48px] sm:min-w-0"
            title="Sync tempos across Deck A and Deck B"
          >
            <Zap className="w-3 h-3" />
            <span>SYNC</span>
          </button>

          {/* MASTER */}
          <button
            id="mixer-master-btn"
            onClick={onToggleMasterMute}
            className={`py-1.5 px-1 rounded-lg border text-[10px] font-black flex items-center justify-center gap-1 transition active:scale-95 shrink-0 min-w-[54px] sm:min-w-0 ${
              masterMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'
            }`}
            title="Toggle Master Audio Mute"
          >
            {masterMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>{masterMuted ? 'MUTED' : 'MASTER'}</span>
          </button>
        </div>

        {/* ↩ REWIND MIX Sound Overlay Section */}
        {(() => {
          const currentSoundFile = soundOverlay ? soundOverlay.soundFile : customAudio;
          const currentStatus = soundOverlay ? soundOverlay.status : audioStatus;

          return (
            <div id="rewind-mix-sound-overlay-panel" className="mt-2 pt-1.5 border-t border-slate-800/80">
              <input
                id="sound-overlay-file-input"
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (soundOverlay) {
                      soundOverlay.onFileSelected(file);
                    } else {
                      handleAudioUpload(e);
                    }
                  }
                  e.target.value = '';
                }}
              />

              {!currentSoundFile ? (
                <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 min-w-0">
                    <RotateCcw className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300 shrink-0">REWIND MIX</span>
                    <span className="text-slate-500 truncate text-[8px]">(Tap + to add phone audio)</span>
                  </div>

                  <button
                    id="sound-overlay-add-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                    title="Upload local audio from phone (+)"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>AUDIO</span>
                  </button>
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-slate-900/95 border border-amber-500/40 shadow-sm flex flex-col gap-1">
                  {/* Compact Header: Title & Status */}
                  <div className="flex items-center justify-between text-[10px] font-bold border-b border-slate-800 pb-0.5">
                    <span className="text-amber-300 flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
                      <span>REWIND AUDIO</span>
                    </span>
                    <div id="sound-overlay-status" className="flex items-center gap-1">
                      <span className="text-[8px] text-slate-400 font-normal">Status:</span>
                      {currentStatus === 'PLAYING' ? (
                        <span className="text-[8px] px-1 py-0.5 rounded font-mono font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-ping" />
                          ● Playing
                        </span>
                      ) : (
                        <span className="text-[8px] px-1 py-0.5 rounded font-mono font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400/80 inline-block" />
                          ● Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ultra Compact Row: Filename + Small PLAY + STOP + '+' + REMOVE */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-[9px] text-slate-400 font-sans shrink-0">File:</span>
                      <span
                        className="text-slate-200 font-semibold truncate text-[9px] font-mono"
                        title={currentSoundFile.name}
                      >
                        {currentSoundFile.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id="sound-overlay-play-btn"
                        type="button"
                        onClick={() => {
                          if (soundOverlay) soundOverlay.onPlaySound();
                          else handlePlayAudio();
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                          currentStatus === 'PLAYING'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        }`}
                        title="Play uploaded audio"
                      >
                        <Play className="w-2 h-2 fill-current" />
                        <span>PLAY</span>
                      </button>

                      <button
                        id="sound-overlay-stop-btn"
                        type="button"
                        onClick={() => {
                          if (soundOverlay) soundOverlay.onStopSound();
                          else handleStopAudio();
                        }}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition active:scale-95 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        title="Stop audio"
                      >
                        <Square className="w-2 h-2 fill-current" />
                        <span>STOP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 rounded text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 active:scale-90 cursor-pointer"
                        title="Select different audio (+)"
                      >
                        <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                      </button>

                      <button
                        id="sound-overlay-remove-btn"
                        type="button"
                        onClick={() => {
                          if (soundOverlay) soundOverlay.onRemoveSound();
                          else handleRemoveAudio();
                        }}
                        className="p-1 rounded text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 active:scale-90 cursor-pointer"
                        title="Remove audio"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
