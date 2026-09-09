import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { Deck } from './components/Deck.tsx';
import { CenterMixer } from './components/CenterMixer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AudioNoticeModal } from './components/AudioNoticeModal.tsx';
import { OrientationBanner } from './components/OrientationBanner.tsx';
import { QueueModal } from './components/QueueModal.tsx';
import { MemeLibraryModal } from './components/MemeLibraryModal.tsx';
import { useYouTubeDeck } from './hooks/useYouTubeDeck.ts';
import { useSoundOverlay } from './hooks/useSoundOverlay.ts';
import { useMemeLibrary } from './hooks/useMemeLibrary.ts';
import { MixerSettings, RecentTrack, RewindTransitionState, QueueItem } from './types.ts';
import {
  calculateCrossfadeGains,
  calculateEffectiveVolume,
  CURATED_DEMO_TRACKS,
} from './utils/youtube.ts';

const SETTINGS_STORAGE_KEY = 'vikmix_dj_settings_v1';
const RECENT_A_KEY = 'vikmix_dj_recent_a_v1';
const RECENT_B_KEY = 'vikmix_dj_recent_b_v1';
const QUEUE_STORAGE_KEY = 'vikmix_dj_playlist_tracks_v3';

const DEFAULT_SETTINGS: MixerSettings = {
  masterVolume: 90,
  crossfader: 50,
  exclusiveDeckMode: false,
  autoPauseOtherDeck: true,
  rememberLastVideos: true,
  theme: 'dark-onyx',
  landscapeHint: true,
  showEqNotice: false,
  layoutStyle: 'console',
  transitionDuration: 6,
  crossfadeCurve: 'linear',
  transitionSoundEnabled: true,
  transitionSoundVolume: 100,
  autoDjEnabled: false,
  autoDjTransitionSeconds: 12,
  deckAGain: 50,
  deckBGain: 50,
  deckAFader: 100,
  deckBFader: 100,
  deckAMuted: false,
  deckBMuted: false,
  deckAEqLow: 0,
  deckAEqMid: 0,
  deckAEqHigh: 0,
  deckAFilter: 0,
  deckBEqLow: 0,
  deckBEqMid: 0,
  deckBEqHigh: 0,
  deckBFilter: 0,
};

export default function App() {
  // Load saved settings
  const [settings, setSettings] = useState<MixerSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          layoutStyle: parsed.layoutStyle || 'console',
          deckAGain: typeof parsed.deckAGain === 'number' ? parsed.deckAGain : 50,
          deckBGain: typeof parsed.deckBGain === 'number' ? parsed.deckBGain : 50,
          deckAFader: typeof parsed.deckAFader === 'number' ? parsed.deckAFader : 100,
          deckBFader: typeof parsed.deckBFader === 'number' ? parsed.deckBFader : 100,
          deckAMuted: Boolean(parsed.deckAMuted),
          deckBMuted: Boolean(parsed.deckBMuted),
          crossfader: typeof parsed.crossfader === 'number' ? parsed.crossfader : 50,
          masterVolume: typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 90,
          transitionSoundVolume: parsed.transitionSoundVolume ?? 100,
          transitionSoundEnabled: parsed.transitionSoundEnabled ?? true,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Load recent tracks
  const [recentA, setRecentA] = useState<RecentTrack[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_A_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: CURATED_DEMO_TRACKS[1].videoId,
        title: CURATED_DEMO_TRACKS[1].title,
        author: CURATED_DEMO_TRACKS[1].author,
        thumbnailUrl: `https://img.youtube.com/vi/${CURATED_DEMO_TRACKS[1].videoId}/hqdefault.jpg`,
        timestamp: Date.now(),
      },
    ];
  });

  const [recentB, setRecentB] = useState<RecentTrack[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_B_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: CURATED_DEMO_TRACKS[3].videoId,
        title: CURATED_DEMO_TRACKS[3].title,
        author: CURATED_DEMO_TRACKS[3].author,
        thumbnailUrl: `https://img.youtube.com/vi/${CURATED_DEMO_TRACKS[3].videoId}/hqdefault.jpg`,
        timestamp: Date.now(),
      },
    ];
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAudioNoticeOpen, setIsAudioNoticeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMasterMuted, setIsMasterMuted] = useState(false);

  // Real Remix Mode state: Simultaneous dual-deck playback with live crossfading
  const [isRemixMode, setIsRemixMode] = useState<boolean>(() => Boolean(settings.remixMode));
  const [remixToast, setRemixToast] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success';
  } | null>(null);

  // Auto Remix Transition state: Smoothly fades current deck out while next fades in
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    from: 'A' | 'B';
    to: 'A' | 'B';
    progress: number;
  }>({
    isActive: false,
    from: 'A',
    to: 'B',
    progress: 0,
  });
  const transitionAnimRef = useRef<number | null>(null);
  const startRemixTransitionRef = useRef<() => void>(() => {});

  // DJ Rewind Transition System (↩ REWIND MIX & AUTO DJ)
  const [rewindTransitionState, setRewindTransitionState] = useState<RewindTransitionState>({
    isActive: false,
    fromDeck: 'A',
    toDeck: 'B',
    progress: 0,
    phase: 'idle',
  });
  const rewindAnimRef = useRef<number | null>(null);
  const rewindTransitionActiveRef = useRef(false);
  rewindTransitionActiveRef.current = rewindTransitionState.isActive;
  const transitionActiveRef = useRef(false);
  transitionActiveRef.current = transitionState.isActive;
  const isRemixModeRef = useRef(isRemixMode);
  isRemixModeRef.current = isRemixMode;

  const performRewindTransitionRef = useRef<(forcedFrom?: 'A' | 'B', forcedTo?: 'A' | 'B') => void>(
    () => {}
  );
  // Reusable HTMLAudioElement for REWIND MIX transition sound
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [customRewindAudioUrl, setCustomRewindAudioUrl] = useState<string | null>(null);
  const customRewindAudioUrlRef = useRef<string | null>(null);
  customRewindAudioUrlRef.current = customRewindAudioUrl;

  // DJ Track Queue Management
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  // Meme Sound Library
  const [isMemeLibraryOpen, setIsMemeLibraryOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Clean up animations and preload reusable transition audio
  useEffect(() => {
    try {
      const soundSrc = customRewindAudioUrl || '/audio/rewind-transition.mp3';
      const audio = new Audio(soundSrc);
      audio.preload = 'auto';
      const vol = Math.max(0, Math.min(1, (settings.transitionSoundVolume ?? 100) / 100));
      audio.volume = vol;
      transitionAudioRef.current = audio;
    } catch (e) {
      console.warn('Could not pre-initialize transition audio:', e);
    }

    return () => {
      if (transitionAnimRef.current) {
        cancelAnimationFrame(transitionAnimRef.current);
      }
      if (rewindAnimRef.current) {
        cancelAnimationFrame(rewindAnimRef.current);
      }
      if (transitionAudioRef.current) {
        try {
          transitionAudioRef.current.pause();
          transitionAudioRef.current.src = '';
        } catch {}
        transitionAudioRef.current = null;
      }
    };
  }, [customRewindAudioUrl]);

  // Update transition audio volume independently whenever the setting changes
  useEffect(() => {
    if (transitionAudioRef.current) {
      const vol = Math.max(0, Math.min(1, (settings.transitionSoundVolume ?? 100) / 100));
      transitionAudioRef.current.volume = vol;
    }
  }, [settings.transitionSoundVolume]);

  // Active Deck focus tracking for keyboard shortcuts
  const [activeDeckFocus, setActiveDeckFocus] = useState<'A' | 'B'>('A');

  // Callback when Deck A loads track
  const handleTrackLoadedA = useCallback((track: { id: string; title: string }) => {
    if (!settings.rememberLastVideos) return;
    setRecentA((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [
        {
          id: track.id,
          title: track.title,
          author: '',
          thumbnailUrl: `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 10);
      localStorage.setItem(RECENT_A_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [settings.rememberLastVideos]);

  // Callback when Deck B loads track
  const handleTrackLoadedB = useCallback((track: { id: string; title: string }) => {
    if (!settings.rememberLastVideos) return;
    setRecentB((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [
        {
          id: track.id,
          title: track.title,
          author: '',
          thumbnailUrl: `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 10);
      localStorage.setItem(RECENT_B_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [settings.rememberLastVideos]);

  // Deck controls refs to break temporal dead zone and prevent stale closures
  const deckAControlsRef = useRef<any>(null);
  const deckBControlsRef = useRef<any>(null);

  const initialVideoA = useMemo(() => recentA[0]?.id || CURATED_DEMO_TRACKS[0].videoId, []);
  const initialVideoB = useMemo(() => recentB[0]?.id || CURATED_DEMO_TRACKS[1].videoId, []);

  // Deck A Instance Hook
  const deckAControls = useYouTubeDeck({
    deckId: 'A',
    elementId: 'youtube-player-deck-a',
    initialVideoId: initialVideoA,
    initialVolume: settings.deckAFader ?? 100,
    initialGain: settings.deckAGain ?? 50,
    initialMuted: settings.deckAMuted ?? false,
    initialFilter: settings.deckAFilter ?? 0,
    initialEqLow: settings.deckAEqLow ?? 0,
    initialEqMid: settings.deckAEqMid ?? 0,
    initialEqHigh: settings.deckAEqHigh ?? 0,
    onTrackLoaded: handleTrackLoadedA,
    onAutoPauseOpposite: () => {
      // NEVER automatically pause Deck B when Deck A starts if Remix Mode or any Transition is active
      if (
        rewindTransitionActiveRef.current ||
        transitionActiveRef.current ||
        isRemixModeRef.current ||
        isRemixMode
      ) {
        return;
      }
      if (settings.exclusiveDeckMode) {
        deckBControlsRef.current?.pause();
      }
    },
  });

  // Deck B Instance Hook
  const deckBControls = useYouTubeDeck({
    deckId: 'B',
    elementId: 'youtube-player-deck-b',
    initialVideoId: initialVideoB,
    initialVolume: settings.deckBFader ?? 100,
    initialGain: settings.deckBGain ?? 50,
    initialMuted: settings.deckBMuted ?? false,
    initialFilter: settings.deckBFilter ?? 0,
    initialEqLow: settings.deckBEqLow ?? 0,
    initialEqMid: settings.deckBEqMid ?? 0,
    initialEqHigh: settings.deckBEqHigh ?? 0,
    onTrackLoaded: handleTrackLoadedB,
    onAutoPauseOpposite: () => {
      // NEVER automatically pause Deck A when Deck B starts if Remix Mode or any Transition is active
      if (
        rewindTransitionActiveRef.current ||
        transitionActiveRef.current ||
        isRemixModeRef.current ||
        isRemixMode
      ) {
        return;
      }
      if (!isRemixMode && settings.exclusiveDeckMode) {
        deckAControlsRef.current?.pause();
      }
    },
  });

  deckAControlsRef.current = deckAControls;
  deckBControlsRef.current = deckBControls;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const isMasterMutedRef = useRef(isMasterMuted);
  isMasterMutedRef.current = isMasterMuted;

  // Active EQ for local audio: follows the active focused deck
  const currentDeckEq = activeDeckFocus === 'A' ? deckAControls.deck : deckBControls.deck;

  // Sound Overlay hook with automatic background music ducking (100% -> 25%) and restoration (25% -> 100%)
  // Also processes local audio through real Web Audio API EQ (LOW shelf, MID peak, HI shelf)
  const soundOverlay = useSoundOverlay({
    deckAControlsRef,
    deckBControlsRef,
    settingsRef,
    isMasterMutedRef,
    rewindTransitionActiveRef,
    eqLow: currentDeckEq.eqLow,
    eqMid: currentDeckEq.eqMid,
    eqHigh: currentDeckEq.eqHigh,
    onNotify: (message, type) => setRemixToast({ message, type: type || 'info' }),
  });

  // Meme Sound Library hook with automatic background music ducking (100% -> 50%) and restoration (50% -> 100%)
  const memeLibrary = useMemeLibrary({
    deckAControlsRef,
    deckBControlsRef,
    settingsRef,
    isMasterMutedRef,
    rewindTransitionActiveRef,
    soundOverlayDuckingRef: soundOverlay.duckingMultiplierRef,
    onNotify: (message, type) => setRemixToast({ message, type: type || 'info' }),
  });

  // Synchronize dynamic volumes based on crossfader & master
  // Crossfader adjusts effective volume balance ONLY. It NEVER calls pauseVideo(), stopVideo(), or cueVideoById().
  useEffect(() => {
    // If REWIND MIX is actively controlling the smooth crossfade volume curve, skip manual sync
    if (rewindTransitionActiveRef.current) {
      return;
    }

    const { gainA, gainB } = calculateCrossfadeGains(
      settings.crossfader,
      settings.crossfadeCurve || 'linear'
    );
    const effectiveMaster = isMasterMuted ? 0 : settings.masterVolume;
    const duckFactor = soundOverlay.duckingMultiplierRef.current * memeLibrary.memeDuckingMultiplierRef.current;

    const baseVolA = calculateEffectiveVolume(
      deckAControls.deck.volume,
      gainA,
      effectiveMaster,
      deckAControls.deck.isOn,
      deckAControls.deck.muted,
      deckAControls.deck.gain ?? 50
    );

    const baseVolB = calculateEffectiveVolume(
      deckBControls.deck.volume,
      gainB,
      effectiveMaster,
      deckBControls.deck.isOn,
      deckBControls.deck.muted,
      deckBControls.deck.gain ?? 50
    );

    const effVolA = Math.max(0, Math.min(100, Math.round(baseVolA * duckFactor)));
    const effVolB = Math.max(0, Math.min(100, Math.round(baseVolB * duckFactor)));

    deckAControls.applyVolume(effVolA);
    deckBControls.applyVolume(effVolB);
  }, [
    settings.crossfader,
    settings.masterVolume,
    isMasterMuted,
    deckAControls.deck.volume,
    deckBControls.deck.volume,
    deckAControls.deck.gain,
    deckBControls.deck.gain,
    deckAControls.deck.muted,
    deckBControls.deck.muted,
    deckAControls.deck.isOn,
    deckBControls.deck.isOn,
    settings.crossfadeCurve,
  ]);

  // Exclusive Deck Mode Enforcement (Completely disabled while Remix Mode or any transition is ON)
  useEffect(() => {
    if (
      rewindTransitionActiveRef.current ||
      transitionActiveRef.current ||
      isRemixModeRef.current ||
      isRemixMode
    ) {
      return;
    }
    if (settings.exclusiveDeckMode) {
      if (deckAControls.deck.status === 'PLAYING' && deckBControls.deck.status === 'PLAYING') {
        // Pause the non-focused or opposite deck
        if (activeDeckFocus === 'A') {
          deckBControls.pause();
        } else {
          deckAControls.pause();
        }
      }
    }
  }, [isRemixMode, settings.exclusiveDeckMode, deckAControls.deck.status, deckBControls.deck.status, activeDeckFocus]);

  // Handle deck power toggle with exclusive mode check
  const handleToggleDeckA = () => {
    deckAControls.toggleDeckPower();
    if (!isRemixMode && !deckAControls.deck.isOn && settings.exclusiveDeckMode) {
      deckBControls.pause();
    }
  };

  const handleToggleDeckB = () => {
    deckBControls.toggleDeckPower();
    if (!isRemixMode && !deckBControls.deck.isOn && settings.exclusiveDeckMode) {
      deckAControls.pause();
    }
  };

  // Keyboard DJ Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing in input fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (activeDeckFocus === 'A') {
          if (deckAControls.deck.status === 'PLAYING') deckAControls.pause();
          else deckAControls.play();
        } else {
          if (deckBControls.deck.status === 'PLAYING') deckBControls.pause();
          else deckBControls.play();
        }
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveDeckFocus('A');
        if (deckAControls.deck.status === 'PLAYING') {
          deckAControls.pause();
        } else {
          deckAControls.play();
          if (!isRemixMode && settings.exclusiveDeckMode) deckBControls.pause();
        }
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveDeckFocus('B');
        if (deckBControls.deck.status === 'PLAYING') {
          deckBControls.pause();
        } else {
          deckBControls.play();
          if (!isRemixMode && settings.exclusiveDeckMode) deckAControls.pause();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSettings((prev) => ({
          ...prev,
          crossfader: Math.max(0, prev.crossfader - 5),
        }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSettings((prev) => ({
          ...prev,
          crossfader: Math.min(100, prev.crossfader + 5),
        }));
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        startRemixTransitionRef.current?.();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        performRewindTransitionRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeckFocus, deckAControls, deckBControls, isRemixMode, settings.exclusiveDeckMode]);

  // Update & persist settings
  const handleUpdateSettings = useCallback((newSettings: Partial<MixerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setIsRemixMode(false);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
  };

  // Quick 1-Click Demo Mix: Loads 2 synchronized dance tracks immediately
  const handleLoadDemoMix = () => {
    deckAControls.loadVideo(CURATED_DEMO_TRACKS[1].videoId); // Daft Punk Around the World
    deckBControls.loadVideo(CURATED_DEMO_TRACKS[3].videoId); // deadmau5 Ghosts 'n' Stuff
    setSettings((prev) => ({ ...prev, crossfader: 50 }));
    setRemixToast({
      message: 'Loaded synchronized demo tracks into Deck A and Deck B. Ready to Remix!',
      type: 'success',
    });
    setTimeout(() => setRemixToast(null), 4000);
  };

  // Real Remix Mode Toggle with Intelligent Synchronization
  const handleToggleRemix = useCallback(() => {
    if (isRemixMode) {
      // Turning Remix Mode OFF
      setIsRemixMode(false);
      handleUpdateSettings({ remixMode: false });
      setRemixToast({
        message: 'Remix Mode OFF. Both decks remain loaded and independently controllable.',
        type: 'info',
      });
      setTimeout(() => setRemixToast(null), 3500);
      return;
    }

    // Turning Remix Mode ON
    // Check if both decks have a video loaded
    const hasTrackA = Boolean(deckAControls.deck.videoId);
    const hasTrackB = Boolean(deckBControls.deck.videoId);

    if (!hasTrackA || !hasTrackB) {
      setRemixToast({
        message: 'Please load a YouTube video into both Deck A and Deck B to start Remix Mode.',
        type: 'warning',
      });
      return;
    }

    // 1. REMIX MODE becomes ON
    setIsRemixMode(true);
    handleUpdateSettings({ remixMode: true, exclusiveDeckMode: false });
    setRemixToast({
      message: '🎧 REMIX MODE ON! Both Deck A & Deck B playing simultaneously.',
      type: 'success',
    });
    setTimeout(() => setRemixToast(null), 4000);

    // Ensure power switches are ON
    if (!deckAControls.deck.isOn) {
      deckAControls.toggleDeckPower();
    }
    if (!deckBControls.deck.isOn) {
      deckBControls.toggleDeckPower();
    }

    // 2. Both Deck A and Deck B play simultaneously with reference-based sync
    const isAPlaying = deckAControls.deck.status === 'PLAYING';
    const isBPlaying = deckBControls.deck.status === 'PLAYING';
    const syncTolerance = 1.0; // 1 second tolerance

    if (isAPlaying && !isBPlaying) {
      // Deck A is the reference deck
      const refTime = deckAControls.deck.currentTime;
      const durB = deckBControls.deck.duration;
      if (durB > 0) {
        const targetB = refTime <= durB ? refTime : (refTime % durB);
        deckBControls.seek(targetB);
      }
      deckBControls.syncTo(deckAControls.deck.playbackRate, deckAControls.deck.bpm);
      deckBControls.play();
    } else if (isBPlaying && !isAPlaying) {
      // Deck B is the reference deck
      const refTime = deckBControls.deck.currentTime;
      const durA = deckAControls.deck.duration;
      if (durA > 0) {
        const targetA = refTime <= durA ? refTime : (refTime % durA);
        deckAControls.seek(targetA);
      }
      deckAControls.syncTo(deckBControls.deck.playbackRate, deckBControls.deck.bpm);
      deckAControls.play();
    } else if (!isAPlaying && !isBPlaying) {
      // Both paused: align positions if drift > syncTolerance and start both
      const refTime = deckAControls.deck.currentTime;
      const durB = deckBControls.deck.duration;
      if (durB > 0 && Math.abs(deckAControls.deck.currentTime - deckBControls.deck.currentTime) > syncTolerance) {
        const targetB = refTime <= durB ? refTime : (refTime % durB);
        deckBControls.seek(targetB);
      }
      deckAControls.play();
      deckBControls.play();
    } else {
      // Both already playing: align if drift > syncTolerance without interrupting
      const diff = Math.abs(deckAControls.deck.currentTime - deckBControls.deck.currentTime);
      if (diff > syncTolerance) {
        const refTime = deckAControls.deck.currentTime;
        const durB = deckBControls.deck.duration;
        if (durB > 0) {
          const targetB = refTime <= durB ? refTime : (refTime % durB);
          deckBControls.seek(targetB);
        }
      }
    }
  }, [isRemixMode, deckAControls, deckBControls]);

  // Cancel any active auto-transition
  const handleCancelRemixTransition = useCallback(() => {
    if (transitionAnimRef.current) {
      cancelAnimationFrame(transitionAnimRef.current);
      transitionAnimRef.current = null;
    }
    setTransitionState((prev) => ({ ...prev, isActive: false }));
    setRemixToast({
      message: 'Remix Transition paused at current position.',
      type: 'info',
    });
    setTimeout(() => setRemixToast(null), 2500);
  }, []);

  // Manual crossfader adjustment halts any active auto-transition smoothly
  const handleUpdateCrossfader = useCallback(
    (newPos: number) => {
      if (transitionAnimRef.current) {
        cancelAnimationFrame(transitionAnimRef.current);
        transitionAnimRef.current = null;
      }
      setTransitionState((prev) => (prev.isActive ? { ...prev, isActive: false } : prev));
      if (newPos < 45) {
        setActiveDeckFocus('A');
      } else if (newPos > 55) {
        setActiveDeckFocus('B');
      }
      handleUpdateSettings({ crossfader: newPos });
    },
    [handleUpdateSettings]
  );

  // REAL DJ-STYLE AUTO REMIX / TRANSITION SYSTEM
  // CURRENT PLAYING DECK smoothly fades OUT (100 -> 90 -> 75 -> 50 -> 25 -> 0)
  // NEXT DECK smoothly fades IN (0 -> 10 -> 25 -> 50 -> 75 -> 100)
  // Both videos continue playing!
  const handleStartRemixTransition = useCallback(() => {
    // If already in transition, reverse the direction smoothly back
    if (transitionState.isActive) {
      const newTo: 'A' | 'B' = transitionState.to === 'B' ? 'A' : 'B';
      const newFrom: 'A' | 'B' = transitionState.to;
      const targetPos = newTo === 'B' ? 100 : 0;
      const startPos = settings.crossfader;
      const durationSec = settings.transitionDuration || 4;
      const durationMs = Math.max(500, durationSec * 1000 * (Math.abs(targetPos - startPos) / 100));
      const startTime = performance.now();

      if (transitionAnimRef.current) {
        cancelAnimationFrame(transitionAnimRef.current);
      }

      transitionActiveRef.current = true;
      setTransitionState({
        isActive: true,
        from: newFrom,
        to: newTo,
        progress: 0,
      });

      const animateReverse = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / durationMs);
        const currentCrossfader = Math.round(startPos + (targetPos - startPos) * p);

        setSettings((prev) => ({ ...prev, crossfader: currentCrossfader }));
        setTransitionState((prev) => ({
          ...prev,
          progress: Math.round(p * 100),
        }));

        if (p < 1) {
          transitionAnimRef.current = requestAnimationFrame(animateReverse);
        } else {
          transitionAnimRef.current = null;
          transitionActiveRef.current = false;
          setSettings((prev) => ({ ...prev, crossfader: targetPos }));
          setTransitionState((prev) => ({ ...prev, isActive: false, progress: 100 }));
          setActiveDeckFocus(newTo);
        }
      };

      transitionAnimRef.current = requestAnimationFrame(animateReverse);
      return;
    }

    // Verify both decks have a video loaded
    const hasTrackA = Boolean(deckAControls.deck.videoId);
    const hasTrackB = Boolean(deckBControls.deck.videoId);

    if (!hasTrackA || !hasTrackB) {
      setRemixToast({
        message: 'Please load a YouTube video into both Deck A and Deck B to start Remix Transition.',
        type: 'warning',
      });
      return;
    }

    // Determine current playing deck and next deck
    const isAPlaying = deckAControls.deck.status === 'PLAYING';
    const isBPlaying = deckBControls.deck.status === 'PLAYING';

    let fromDeck: 'A' | 'B' = 'A';
    let toDeck: 'A' | 'B' = 'B';
    let targetCrossfader = 100;

    if (isAPlaying && !isBPlaying) {
      fromDeck = 'A';
      toDeck = 'B';
      targetCrossfader = 100;
    } else if (isBPlaying && !isAPlaying) {
      fromDeck = 'B';
      toDeck = 'A';
      targetCrossfader = 0;
    } else {
      // Both playing or both paused: follow current crossfader bias
      if (settings.crossfader < 50) {
        fromDeck = 'A';
        toDeck = 'B';
        targetCrossfader = 100;
      } else {
        fromDeck = 'B';
        toDeck = 'A';
        targetCrossfader = 0;
      }
    }

    // 1. Ensure Remix Mode is ON so both decks stay playing simultaneously!
    setIsRemixMode(true);
    handleUpdateSettings({ remixMode: true, exclusiveDeckMode: false });

    // 2. Ensure both decks are powered ON
    if (!deckAControls.deck.isOn) deckAControls.toggleDeckPower();
    if (!deckBControls.deck.isOn) deckBControls.toggleDeckPower();

    // 3. BOTH VIDEOS SHOULD CONTINUE PLAYING:
    // Current deck keeps playing while fading OUT
    // Next deck starts playing immediately so it fades IN with the beat
    const sourceControls = fromDeck === 'A' ? deckAControls : deckBControls;
    const targetControls = toDeck === 'B' ? deckBControls : deckAControls;

    sourceControls.play();
    targetControls.play();

    // 4. Smoothly animate crossfader from current position to target (0 or 100)
    const startCrossfader = settings.crossfader;
    const durationSec = settings.transitionDuration || 4;
    const durationMs = durationSec * 1000;
    const startTime = performance.now();

    if (transitionAnimRef.current) {
      cancelAnimationFrame(transitionAnimRef.current);
    }

    transitionActiveRef.current = true;
    setTransitionState({
      isActive: true,
      from: fromDeck,
      to: toDeck,
      progress: 0,
    });

    const animateTransition = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Linear transition calculates crossfader smoothly:
      // When going from 0 to 100:
      // A volume: 100 -> 90 -> 75 -> 50 -> 25 -> 0
      // B volume: 0 -> 10 -> 25 -> 50 -> 75 -> 100
      const currentCrossfader = Math.round(
        startCrossfader + (targetCrossfader - startCrossfader) * progress
      );

      setSettings((prev) => ({ ...prev, crossfader: currentCrossfader }));
      setTransitionState((prev) => ({
        ...prev,
        progress: Math.round(progress * 100),
      }));

      if (progress < 1) {
        transitionAnimRef.current = requestAnimationFrame(animateTransition);
      } else {
        transitionAnimRef.current = null;
        transitionActiveRef.current = false;
        setSettings((prev) => ({ ...prev, crossfader: targetCrossfader }));
        setTransitionState((prev) => ({
          ...prev,
          isActive: false,
          progress: 100,
        }));
        setActiveDeckFocus(toDeck);
        setRemixToast({
          message: `🎧 Transition completed to Deck ${toDeck}! Both videos continue playing.`,
          type: 'success',
        });
        setTimeout(() => setRemixToast(null), 3500);
      }
    };

    transitionAnimRef.current = requestAnimationFrame(animateTransition);
  }, [
    transitionState.isActive,
    transitionState.to,
    settings.crossfader,
    settings.transitionDuration,
    deckAControls,
    deckBControls,
    handleUpdateSettings,
  ]);

  startRemixTransitionRef.current = handleStartRemixTransition;

  // DJ REWIND TRANSITION ENGINE (↩ REWIND MIX & AUTO DJ)
  // Strictly eliminates any silence: outgoing song continues playing, incoming song starts simultaneously,
  // rewind audio starts immediately, and an equal-power crossfade transitions between the two.
  const performRewindTransition = useCallback(
    async (forcedFrom?: 'A' | 'B', forcedTo?: 'A' | 'B') => {
      // Prevent double trigger
      if (rewindTransitionActiveRef.current || transitionActiveRef.current) {
        setRemixToast({
          message: 'TRANSITION IN PROGRESS',
          type: 'warning',
        });
        return;
      }

      // STEP 1: Identify CURRENT active deck & incoming deck
      let fromDeck: 'A' | 'B' = forcedFrom || 'A';
      let toDeck: 'A' | 'B' = forcedTo || 'B';

      if (!forcedFrom || !forcedTo) {
        const isAPlaying = deckAControls.deck.status === 'PLAYING';
        const isBPlaying = deckBControls.deck.status === 'PLAYING';

        if (isAPlaying && !isBPlaying) {
          fromDeck = 'A';
          toDeck = 'B';
        } else if (isBPlaying && !isAPlaying) {
          fromDeck = 'B';
          toDeck = 'A';
        } else if (settings.crossfader < 50) {
          fromDeck = 'A';
          toDeck = 'B';
        } else {
          fromDeck = 'B';
          toDeck = 'A';
        }
      }

      const fromControls = fromDeck === 'A' ? deckAControls : deckBControls;
      const toControls = toDeck === 'B' ? deckBControls : deckAControls;

      // STEP 6 / PRECONDITION: CURRENT SONG MUST CONTINUE PLAYING
      // Do NOT pause or stop the current deck!
      if (!fromControls.deck.videoId) {
        setRemixToast({
          message: `Deck ${fromDeck} has no track loaded. Please load a YouTube video first.`,
          type: 'warning',
        });
        return;
      }

      // Ensure the current song is playing so there is audio
      if (fromControls.deck.status !== 'PLAYING') {
        fromControls.play();
      }

      // STEP 2: Identify the NEXT track from the existing Playlist/Queue
      let targetVideoId = toControls.deck.videoId;
      let shouldAdvanceQueue = false;
      let queuedTrackTitle = '';

      // If incoming deck already has a track and it's different from the outgoing track, use it!
      // Otherwise, pick the next track from the existing user Playlist/Queue:
      if (!targetVideoId || targetVideoId === fromControls.deck.videoId) {
        const nextInQueue = queue.find((t) => t.videoId !== fromControls.deck.videoId);
        if (nextInQueue) {
          targetVideoId = nextInQueue.videoId;
          queuedTrackTitle = nextInQueue.title;
          shouldAdvanceQueue = true;
          // STEP 3: Prepare the next YouTube video in the inactive deck
          toControls.loadVideo(targetVideoId);
        } else {
          // STRICT RULE: NEVER load random, suggested, or demo video!
          // DO NOT stop or pause current song!
          setRemixToast({
            message: `Next playlist video could not be loaded. Deck ${toDeck} has no track loaded.`,
            type: 'warning',
          });
          return;
        }
      }

      // STEP 4: Make sure the next player is CUED/READY
      // If incoming video has not loaded yet, keep current song playing normally!
      // Never create silence.
      const waitForReady = async (maxWaitMs: number = 3800): Promise<boolean> => {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
          if (toControls.deck.status === 'ERROR') {
            return false;
          }
          const player = toControls.playerRef.current;
          if (player && typeof player.playVideo === 'function') {
            try {
              const state = player.getPlayerState?.();
              // 5 = CUED, 2 = PAUSED, 1 = PLAYING, -1 = UNSTARTED
              if (
                state === 5 ||
                state === 2 ||
                state === -1 ||
                state === 1 ||
                toControls.deck.status === 'CUED'
              ) {
                return true;
              }
            } catch {
              // ignore
            }
          }
          await new Promise((r) => setTimeout(r, 60));
        }
        const p = toControls.playerRef.current;
        return Boolean(p && typeof p.playVideo === 'function');
      };

      const isReady = await waitForReady();
      if (!isReady) {
        // If loading fails: cancel transition and keep current song playing!
        setRemixToast({
          message: 'Next playlist video could not be loaded.',
          type: 'warning',
        });
        return;
      }

      // If we loaded from queue, update queue state
      if (shouldAdvanceQueue && targetVideoId) {
        setQueue((prev) => {
          const nextIdx = prev.findIndex((t) => t.videoId === targetVideoId);
          const updated = nextIdx !== -1 ? prev.slice(nextIdx + 1) : prev;
          try {
            localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        if (queuedTrackTitle) {
          setRemixToast({
            message: `Loaded "${queuedTrackTitle}" from Playlist into Deck ${toDeck}`,
            type: 'info',
          });
        }
      }

      // STEP 5: Set next deck volume to 0 BEFORE starting playback
      toControls.applyVolume(0);
      try {
        toControls.playerRef.current?.setVolume?.(0);
        toControls.playerRef.current?.mute?.();
      } catch {
        // ignore
      }

      // EXCLUSIVE DECK MODE BYPASS: Temporarily allow dual playback during transition
      rewindTransitionActiveRef.current = true;
      isRemixModeRef.current = true;
      setIsRemixMode(true);
      handleUpdateSettings({ remixMode: true, exclusiveDeckMode: false });

      if (!deckAControls.deck.isOn) deckAControls.toggleDeckPower();
      if (!deckBControls.deck.isOn) deckBControls.toggleDeckPower();

      // STEP 7: Immediately start the REWIND MIX audio (Overlay transition sound)
      if (settings.transitionSoundEnabled ?? true) {
        try {
          const soundSrc = customRewindAudioUrlRef.current || '/audio/rewind-transition.mp3';
          let audio = transitionAudioRef.current;
          if (!audio || (!audio.src.endsWith(soundSrc) && audio.src !== soundSrc)) {
            audio = new Audio(soundSrc);
            audio.preload = 'auto';
            transitionAudioRef.current = audio;
          }

          const vol = Math.max(0, Math.min(1, (settings.transitionSoundVolume ?? 100) / 100));
          audio.pause();
          audio.currentTime = 0;
          audio.volume = vol;

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Autoplay/browser policy blocked transition sound:', err);
            });
          }
        } catch (err) {
          console.warn('Transition audio execution error:', err);
        }
      }

      // STEP 8: Immediately start next YouTube video at volume 0 AND ensure current deck continues
      toControls.play();
      fromControls.play();

      // STEP 9: Perform smooth fade with Equal Power Crossfade curve:
      // outgoing = Math.cos(progress * Math.PI / 2)
      // incoming = Math.sin(progress * Math.PI / 2)
      // Duration default: 6 seconds
      const durationSec = settings.transitionDuration || 6;
      const durationMs = durationSec * 1000;
      const startTime = performance.now();

      const startCrossfader = settings.crossfader;
      const targetCrossfader = toDeck === 'B' ? 100 : 0;

      // Calculate base effective volumes respecting channel faders, gains, master, and mute
      const effectiveMaster = isMasterMuted ? 0 : settings.masterVolume;
      const baseOutVol = calculateEffectiveVolume(
        fromControls.deck.volume,
        1.0,
        effectiveMaster,
        fromControls.deck.isOn,
        fromControls.deck.muted,
        fromControls.deck.gain ?? 50
      );
      const baseInVol = calculateEffectiveVolume(
        toControls.deck.volume,
        1.0,
        effectiveMaster,
        toControls.deck.isOn,
        toControls.deck.muted,
        toControls.deck.gain ?? 50
      );

      // Start transition animation state
      setRewindTransitionState({
        isActive: true,
        fromDeck,
        toDeck,
        progress: 0,
        phase: 'rewinding',
      });

      if (rewindAnimRef.current) {
        cancelAnimationFrame(rewindAnimRef.current);
      }

      const animateRewindTransition = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Standard mathematical equal-power crossfade curve
        const outFactor = Math.cos(progress * (Math.PI / 2));
        const inFactor = Math.sin(progress * (Math.PI / 2));

        const duck = soundOverlay.duckingMultiplierRef.current * memeLibrary.memeDuckingMultiplierRef.current;
        const currentOutVol = Math.max(0, Math.min(100, Math.round(baseOutVol * outFactor * duck)));
        const currentInVol = Math.max(0, Math.min(100, Math.round(baseInVol * inFactor * duck)));

        // Modulate hardware playback volumes directly without overwriting user fader settings
        fromControls.applyVolume(currentOutVol);
        toControls.applyVolume(currentInVol);

        // Smooth crossfader slider interpolation
        const currentCrossfader = Math.round(
          startCrossfader + (targetCrossfader - startCrossfader) * progress
        );
        setSettings((prev) => ({ ...prev, crossfader: currentCrossfader }));

        setRewindTransitionState((prev) => ({
          ...prev,
          progress: Math.round(progress * 100),
          phase: progress >= 0.5 ? 'crossfading' : 'rewinding',
        }));

        if (progress < 1) {
          rewindAnimRef.current = requestAnimationFrame(animateRewindTransition);
        } else {
          rewindAnimRef.current = null;
          rewindTransitionActiveRef.current = false;

          // STEP 10: Only AFTER the current song reaches 0%, pause the outgoing deck
          fromControls.pause();
          fromControls.applyVolume(0);

          // Incoming deck is at full target volume (scaled by ducking if sound overlay or meme is playing)
          toControls.applyVolume(
            Math.round(baseInVol * soundOverlay.duckingMultiplierRef.current * memeLibrary.memeDuckingMultiplierRef.current)
          );

          // Lock crossfader to target
          setSettings((prev) => ({ ...prev, crossfader: targetCrossfader }));

          // Incoming deck becomes active focus
          setActiveDeckFocus(toDeck);

          // Update transition state to completed
          setRewindTransitionState({
            isActive: false,
            fromDeck,
            toDeck,
            progress: 100,
            phase: 'completed',
          });

          // PLAYLIST ADVANCEMENT: Cue next unplayed track from playlist into the idle deck
          setQueue((prevQueue) => {
            const incomingId = targetVideoId;
            const outgoingId = fromControls.deck.videoId;
            const nextIndex = prevQueue.findIndex(
              (item) => item.videoId !== incomingId && item.videoId !== outgoingId
            );

            if (nextIndex !== -1) {
              const nextTrack = prevQueue[nextIndex];
              // Cue next track from user playlist into the idle deck ready for subsequent mix
              fromControls.loadVideo(nextTrack.videoId);
              const updatedQueue = prevQueue.slice(nextIndex + 1);
              try {
                localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
              } catch {}
              setRemixToast({
                message: `↩ REWIND MIX COMPLETE! Deck ${toDeck} is ACTIVE. Next playlist track cued in Deck ${fromDeck}: "${nextTrack.title}".`,
                type: 'success',
              });
              return updatedQueue;
            } else {
              setRemixToast({
                message: `↩ REWIND MIX COMPLETE! Deck ${toDeck} is now ACTIVE.`,
                type: 'success',
              });
              return prevQueue;
            }
          });

          setTimeout(() => {
            setRewindTransitionState((prev) => ({
              ...prev,
              phase: 'idle',
              progress: 0,
            }));
          }, 2400);
        }
      };

      rewindAnimRef.current = requestAnimationFrame(animateRewindTransition);
    },
    [
      deckAControls,
      deckBControls,
      settings.crossfader,
      settings.transitionDuration,
      settings.transitionSoundEnabled,
      settings.transitionSoundVolume,
      settings.masterVolume,
      isMasterMuted,
      queue,
      handleUpdateSettings,
    ]
  );

  performRewindTransitionRef.current = performRewindTransition;

  // AUTO DJ continuous track monitor
  useEffect(() => {
    if (!settings.autoDjEnabled) return;
    if (rewindTransitionState.isActive || transitionState.isActive) return;

    const threshold = settings.autoDjTransitionSeconds ?? 12;

    // Deck A playing check
    if (deckAControls.deck.status === 'PLAYING') {
      const dur = deckAControls.deck.duration;
      const cur = deckAControls.deck.currentTime;
      const remaining = dur - cur;
      if (dur > 20 && remaining > 0 && remaining <= threshold) {
        performRewindTransitionRef.current?.('A', 'B');
        return;
      }
    }

    // Deck B playing check
    if (deckBControls.deck.status === 'PLAYING') {
      const dur = deckBControls.deck.duration;
      const cur = deckBControls.deck.currentTime;
      const remaining = dur - cur;
      if (dur > 20 && remaining > 0 && remaining <= threshold) {
        performRewindTransitionRef.current?.('B', 'A');
        return;
      }
    }
  }, [
    settings.autoDjEnabled,
    settings.autoDjTransitionSeconds,
    deckAControls.deck.status,
    deckAControls.deck.duration,
    deckAControls.deck.currentTime,
    deckBControls.deck.status,
    deckBControls.deck.duration,
    deckBControls.deck.currentTime,
    rewindTransitionState.isActive,
    transitionState.isActive,
  ]);

  // Queue helper methods
  const handleAddToQueue = (track: {
    videoId: string;
    title: string;
    author: string;
    duration?: number;
    bpm?: number;
  }) => {
    setQueue((prev) => {
      const newItem: QueueItem = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...track,
      };
      const updated = [...prev, newItem];
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setRemixToast({
      message: `Added "${track.title}" to DJ Queue`,
      type: 'info',
    });
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch {}
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAudioNotice={() => setIsAudioNoticeOpen(true)}
        onOpenMemeLibrary={() => setIsMemeLibraryOpen(true)}
        isMemePlaying={memeLibrary.status === 'PLAYING'}
        exclusiveMode={settings.exclusiveDeckMode}
        isRemixMode={isRemixMode}
        onToggleRemix={handleToggleRemix}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenQueue={() => setIsQueueOpen(true)}
        queueCount={queue.length}
        autoDjEnabled={Boolean(settings.autoDjEnabled)}
        onToggleAutoDj={() => handleUpdateSettings({ autoDjEnabled: !settings.autoDjEnabled })}
      />

      {/* Floating Remix Mode Notification Toast */}
      {remixToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 border transition-all duration-300 animate-in fade-in slide-in-from-top-4 bg-slate-900/95 border-fuchsia-500/60 text-white shadow-fuchsia-950/50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎧</span>
            <span className="text-xs md:text-sm font-semibold text-slate-100">{remixToast.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {remixToast.type === 'warning' && (
              <button
                onClick={() => {
                  setIsMemeLibraryOpen(true);
                  setRemixToast(null);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Open Meme Library
              </button>
            )}
            <button
              onClick={() => setRemixToast(null)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Orientation Advice Banner */}
      <OrientationBanner enabled={settings.landscapeHint} />

      {/* Main DJ Surface Container */}
      <main className="flex-1 p-2 md:p-3 max-w-[1920px] mx-auto w-full flex flex-col justify-center">
        {/* Main DJ Layout: Adaptive Sketch Mode or 3-Column Console (Permanent element mounting preserves YouTube iframes) */}
        <div
          className={
            settings.layoutStyle === 'console'
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5 md:gap-3 items-start'
              : 'grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 md:gap-3 items-start'
          }
        >
          {/* LEFT: DECK A */}
          <div
            className={
              settings.layoutStyle === 'console'
                ? 'lg:col-span-4 xl:col-span-4 order-1 flex flex-col justify-between'
                : 'order-1 col-span-1 flex flex-col justify-between'
            }
            onClick={() => setActiveDeckFocus('A')}
          >
            <Deck
              deck={deckAControls.deck}
              oppositeDeck={deckBControls.deck}
              playerElementId="youtube-player-deck-a"
              recentTracks={recentA}
              onLoadVideo={deckAControls.loadVideo}
              onPlay={() => {
                setActiveDeckFocus('A');
                deckAControls.play();
                if (!isRemixMode && settings.exclusiveDeckMode) deckBControls.pause();
              }}
              onPause={deckAControls.pause}
              onStop={deckAControls.stop}
              onRestart={deckAControls.restart}
              onCue={deckAControls.cue}
              onSync={() => deckAControls.syncTo(deckBControls.deck.playbackRate, deckBControls.deck.bpm)}
              onToggleLoop={deckAControls.toggleLoop}
              onSetLoopBeats={deckAControls.setLoopBeats}
              onSetPlaybackRate={deckAControls.setPlaybackRate}
              onSetSpeedOffset={deckAControls.setSpeedOffset}
              onSetVolume={deckAControls.setVolume}
              onToggleMute={deckAControls.toggleMute}
              onSeek={deckAControls.seek}
              onUpdateEq={(band, val) => {
                setActiveDeckFocus('A');
                deckAControls.updateEq(band, val);
              }}
              onOpenAudioNotice={() => setIsAudioNoticeOpen(true)}
            />
          </div>

          {/* CENTER: VIKMIX MASTER & CROSSFADER MIXER */}
          <div
            className={
              settings.layoutStyle === 'console'
                ? 'lg:col-span-4 xl:col-span-4 order-2 flex flex-col justify-between'
                : 'portrait:order-3 landscape:order-3 md:order-3 col-span-1 md:col-span-2 landscape:col-span-2 flex flex-col justify-between'
            }
          >
            <CenterMixer
              deckAOn={deckAControls.deck.isOn}
              deckBOn={deckBControls.deck.isOn}
              deckAPlaying={deckAControls.deck.status === 'PLAYING'}
              deckBPlaying={deckBControls.deck.status === 'PLAYING'}
              deckAVolume={deckAControls.deck.volume}
              deckBVolume={deckBControls.deck.volume}
              masterVolume={settings.masterVolume}
              crossfader={settings.crossfader}
              exclusiveMode={settings.exclusiveDeckMode}
              activeDeck={activeDeckFocus}
              isRemixMode={isRemixMode}
              onToggleRemix={handleToggleRemix}
              isTransitioning={transitionState.isActive}
              transitionProgress={transitionState.progress}
              transitionFrom={transitionState.from}
              transitionTo={transitionState.to}
              transitionDuration={settings.transitionDuration || 4}
              onStartRemixTransition={handleStartRemixTransition}
              onCancelRemixTransition={handleCancelRemixTransition}
              onSetTransitionDuration={(sec) => handleUpdateSettings({ transitionDuration: sec })}
              onRewindMix={performRewindTransition}
              rewindTransitionState={rewindTransitionState}
              onCustomAudioChange={setCustomRewindAudioUrl}
              soundOverlay={soundOverlay}
              masterMuted={isMasterMuted}
              onToggleDeckA={handleToggleDeckA}
              onToggleDeckB={handleToggleDeckB}
              onUpdateCrossfader={handleUpdateCrossfader}
              onUpdateMasterVolume={(val) => handleUpdateSettings({ masterVolume: val })}
              onToggleExclusiveMode={() =>
                handleUpdateSettings({ exclusiveDeckMode: !settings.exclusiveDeckMode })
              }
              onPlayActiveDeck={() => {
                if (activeDeckFocus === 'A') {
                  if (deckAControls.deck.status === 'PLAYING') deckAControls.pause();
                  else deckAControls.play();
                } else {
                  if (deckBControls.deck.status === 'PLAYING') deckBControls.pause();
                  else deckBControls.play();
                }
              }}
              onCueActiveDeck={() => {
                if (activeDeckFocus === 'A') deckAControls.cue();
                else deckBControls.cue();
              }}
              onLoopActiveDeck={() => {
                if (activeDeckFocus === 'A') deckAControls.toggleLoop();
                else deckBControls.toggleLoop();
              }}
              onSyncActiveDeck={() => {
                if (activeDeckFocus === 'A') {
                  deckAControls.syncTo(deckBControls.deck.playbackRate, deckBControls.deck.bpm);
                } else {
                  deckBControls.syncTo(deckAControls.deck.playbackRate, deckAControls.deck.bpm);
                }
              }}
              onToggleMasterMute={() => setIsMasterMuted((prev) => !prev)}
            />
          </div>

          {/* RIGHT: DECK B */}
          <div
            className={
              settings.layoutStyle === 'console'
                ? 'lg:col-span-4 xl:col-span-4 order-3 flex flex-col justify-between'
                : 'portrait:order-2 landscape:order-2 md:order-2 col-span-1 flex flex-col justify-between'
            }
            onClick={() => setActiveDeckFocus('B')}
          >
            <Deck
              deck={deckBControls.deck}
              oppositeDeck={deckAControls.deck}
              playerElementId="youtube-player-deck-b"
              recentTracks={recentB}
              onLoadVideo={deckBControls.loadVideo}
              onPlay={() => {
                setActiveDeckFocus('B');
                deckBControls.play();
                if (!isRemixMode && settings.exclusiveDeckMode) deckAControls.pause();
              }}
              onPause={deckBControls.pause}
              onStop={deckBControls.stop}
              onRestart={deckBControls.restart}
              onCue={deckBControls.cue}
              onSync={() => deckBControls.syncTo(deckAControls.deck.playbackRate, deckAControls.deck.bpm)}
              onToggleLoop={deckBControls.toggleLoop}
              onSetLoopBeats={deckBControls.setLoopBeats}
              onSetPlaybackRate={deckBControls.setPlaybackRate}
              onSetSpeedOffset={deckBControls.setSpeedOffset}
              onSetVolume={deckBControls.setVolume}
              onToggleMute={deckBControls.toggleMute}
              onSeek={deckBControls.seek}
              onUpdateEq={(band, val) => {
                setActiveDeckFocus('B');
                deckBControls.updateEq(band, val);
              }}
              onOpenAudioNotice={() => setIsAudioNoticeOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Subtle Hardware Footer */}
      <footer className="w-full bg-slate-950/80 border-t border-slate-900/80 px-3 py-1 flex items-center justify-between text-[9px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-2">
          <span>ACTIVE DECK: <strong className="text-white">DECK {activeDeckFocus}</strong></span>
          <span>•</span>
          <span>CROSSFADER: <strong className="text-cyan-400">{settings.crossfader}%</strong></span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>SPACE: Play/Pause</span>
          <span>A / B: Select Deck</span>
          <span>◄ / ►: Crossfade</span>
        </div>
        <div>
          <span>VIKMIX DJ ENGINE 2.0</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />

      {/* DJ Queue & Auto Mix Modal */}
      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        onAddToQueue={handleAddToQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onLoadToDeck={(videoId, targetDeck) => {
          if (targetDeck === 'A') deckAControls.loadVideo(videoId);
          else deckBControls.loadVideo(videoId);
          setRemixToast({
            message: `Loaded track into Deck ${targetDeck}!`,
            type: 'info',
          });
        }}
        deckA={deckAControls.deck}
        deckB={deckBControls.deck}
        autoDjEnabled={Boolean(settings.autoDjEnabled)}
        onToggleAutoDj={() => handleUpdateSettings({ autoDjEnabled: !settings.autoDjEnabled })}
      />

      {/* Audio Engine Notice Modal */}
      <AudioNoticeModal
        isOpen={isAudioNoticeOpen}
        onClose={() => setIsAudioNoticeOpen(false)}
      />

      {/* Meme Sound Library Modal */}
      <MemeLibraryModal
        isOpen={isMemeLibraryOpen}
        onClose={() => setIsMemeLibraryOpen(false)}
        memeLibrary={memeLibrary}
      />
    </div>
  );
}
