export type DeckId = 'A' | 'B';

export type PlayerStatus =
  | 'IDLE'
  | 'UNSTARTED'
  | 'BUFFERING'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDED'
  | 'CUED'
  | 'ERROR';

export interface DeckState {
  deckId: DeckId;
  videoId: string;
  title: string;
  author: string;
  duration: number; // in seconds
  currentTime: number; // in seconds
  status: PlayerStatus;
  volume: number; // 0 - 100 (Channel Fader)
  gain: number; // 0 - 100 (Default: 50 unity)
  filter: number; // -100 to +100 (Default: 0)
  effectiveVolume: number; // 0 - 100 (after master + crossfader calculation)
  muted: boolean;
  playbackRate: number; // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  speedPitchPercent: number; // -50 to +50
  cuePoint: number | null; // cue time in seconds
  isCueActive: boolean;
  loopActive: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  loopBeats: 4 | 8 | 16 | null;
  bpm: number; // default 126
  isOn: boolean; // Deck Switch ON / OFF
  eqLow: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqHigh: number; // -12 to +12 dB
  error: string | null;
  isLoading: boolean;
  thumbnailUrl: string;
}

export interface MixerSettings {
  masterVolume: number; // 0 - 100
  crossfader: number; // 0 = Deck A 100%, 50 = Center, 100 = Deck B 100%
  exclusiveDeckMode: boolean; // If ON: only one deck plays at a time
  autoPauseOtherDeck: boolean; // Pause opposite deck when starting
  rememberLastVideos: boolean; // Save recent video list
  theme: 'dark-onyx' | 'neon-club' | 'cyber-cyan';
  landscapeHint: boolean;
  showEqNotice: boolean;
  layoutStyle?: 'sketch' | 'console';
  remixMode?: boolean; // Real Remix Mode: simultaneous dual-deck playback
  transitionDuration?: number; // Duration in seconds for auto remix transition (e.g. 2, 4, 8, 16)
  crossfadeCurve?: 'linear' | 'equal-power'; // Linear or equal-power crossfade curve
  transitionSoundEnabled?: boolean; // Play local rewind-transition.mp3 (Default: true)
  transitionSoundVolume?: number; // 0 - 100 (Default: 100)
  autoDjEnabled?: boolean; // Auto DJ mode (Default: false)
  autoDjTransitionSeconds?: number; // Seconds before track end to trigger transition (Default: 12)
  // Channel Hardware Controls Persistence
  deckAGain?: number; // 0 - 100 (Default: 50)
  deckBGain?: number; // 0 - 100 (Default: 50)
  deckAFader?: number; // 0 - 100 (Default: 100)
  deckBFader?: number; // 0 - 100 (Default: 100)
  deckAMuted?: boolean; // (Default: false)
  deckBMuted?: boolean; // (Default: false)
  deckAEqLow?: number; // -12 to +12 dB
  deckAEqMid?: number; // -12 to +12 dB
  deckAEqHigh?: number; // -12 to +12 dB
  deckAFilter?: number; // -100 to +100
  deckBEqLow?: number; // -12 to +12 dB
  deckBEqMid?: number; // -12 to +12 dB
  deckBEqHigh?: number; // -12 to +12 dB
  deckBFilter?: number; // -100 to +100
}

export type RewindTransitionPhase = 'idle' | 'rewinding' | 'crossfading' | 'completed';

export interface RewindTransitionState {
  isActive: boolean;
  phase: RewindTransitionPhase;
  fromDeck: DeckId;
  toDeck: DeckId;
  progress: number; // 0 to 100
}

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  author?: string;
  thumbnailUrl?: string;
  duration?: number;
  bpm?: number;
}

export interface RecentTrack {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  timestamp: number;
}

export interface DemoTrack {
  title: string;
  author: string;
  videoId: string;
  genre: string;
  bpm: number;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}
