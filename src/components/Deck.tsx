import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
  Link,
  History,
  AlertCircle,
  Loader2,
  Gauge,
  Music,
} from 'lucide-react';
import { DeckState, RecentTrack, DemoTrack } from '../types.ts';
import { WaveformDisplay } from './WaveformDisplay.tsx';
import { EqualizerControl } from './EqualizerControl.tsx';
import { CURATED_DEMO_TRACKS, extractYouTubeVideoId } from '../utils/youtube.ts';

interface DeckProps {
  deck: DeckState;
  oppositeDeck: DeckState;
  playerElementId: string;
  recentTracks: RecentTrack[];
  onLoadVideo: (videoId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRestart: () => void;
  onCue: () => void;
  onSync: () => void;
  onToggleLoop: () => void;
  onSetLoopBeats: (beats: 4 | 8 | 16) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetSpeedOffset: (percent: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  onUpdateEq: (band: 'low' | 'mid' | 'high', val: number) => void;
  onOpenAudioNotice: () => void;
}

export const Deck: React.FC<DeckProps> = ({
  deck,
  oppositeDeck,
  playerElementId,
  recentTracks,
  onLoadVideo,
  onPlay,
  onPause,
  onStop,
  onRestart,
  onCue,
  onSync,
  onToggleLoop,
  onSetLoopBeats,
  onSetPlaybackRate,
  onSetSpeedOffset,
  onSetVolume,
  onToggleMute,
  onSeek,
  onUpdateEq,
  onOpenAudioNotice,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const isDeckA = deck.deckId === 'A';
  const accentBorder = isDeckA ? 'border-cyan-500/30' : 'border-orange-500/30';
  const glowShadow = isDeckA ? 'shadow-cyan-950/20' : 'shadow-orange-950/20';
  const deckColor = isDeckA ? 'cyan' : 'orange';
  const themeText = isDeckA ? 'text-cyan-400' : 'text-orange-400';
  const themeBg = isDeckA ? 'bg-cyan-500' : 'bg-orange-500';

  const handleLoadSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    const extracted = extractYouTubeVideoId(urlInput);
    if (!extracted) {
      setInputError('Invalid YouTube URL or Video ID');
      return;
    }

    onLoadVideo(extracted);
    setUrlInput('');
  };

  const handlePresetSelect = (track: DemoTrack) => {
    onLoadVideo(track.videoId);
    setShowPresets(false);
  };

  const isPlaying = deck.status === 'PLAYING';
  const isBuffering = deck.status === 'BUFFERING';

  return (
    <div
      id={`deck-${deck.deckId.toLowerCase()}-panel`}
      className={`bg-slate-950/90 border ${accentBorder} rounded-2xl p-3 md:p-4 shadow-xl ${glowShadow} flex flex-col gap-3 relative transition-all duration-200 backdrop-blur-sm ${
        !deck.isOn ? 'opacity-70 saturate-50' : 'opacity-100'
      }`}
    >
      {/* Top Deck Header: Deck ID Badge, Video Title & LED Status */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-slate-950 shadow-md ${
              isDeckA ? 'bg-cyan-400 shadow-cyan-500/30' : 'bg-orange-500 shadow-orange-500/30'
            }`}
          >
            {deck.deckId}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-100 truncate" title={deck.title || 'No Track Loaded'}>
              {deck.title || (deck.videoId ? `Track: ${deck.videoId}` : `DECK ${deck.deckId} - READY`)}
            </h3>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              {deck.videoId ? `ID: ${deck.videoId}` : 'Paste URL or select preset to load'}
            </p>
          </div>
        </div>

        {/* LED State Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              !deck.isOn
                ? 'bg-slate-700'
                : isPlaying
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                : isBuffering
                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-ping'
                : deck.status === 'PAUSED'
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-slate-600'
            }`}
          />
          <span
            className={`font-mono text-[10px] font-bold tracking-wider uppercase ${
              !deck.isOn
                ? 'text-slate-500'
                : isPlaying
                ? 'text-emerald-400'
                : isBuffering
                ? 'text-cyan-400'
                : deck.status === 'PAUSED'
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {!deck.isOn ? 'OFF' : deck.status}
          </span>
        </div>
      </div>

      {/* Video / Player Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-inner group">
        {/* Actual YouTube IFrame mounts into this DOM element */}
        <div
          id={playerElementId}
          className="w-full h-full"
        />

        {/* Placeholder / Thumbnail display before playback starts */}
        {(!deck.videoId || deck.isLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 p-4 text-center z-10 pointer-events-none">
            {deck.isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className={`w-8 h-8 animate-spin ${themeText}`} />
                <span className="text-xs font-semibold text-slate-300">Loading YouTube Track...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className={`p-3 rounded-full bg-slate-800/80 border border-slate-700 ${themeText}`}>
                  <Music className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  DECK {deck.deckId} IS EMPTY
                </span>
                <span className="text-[10px] text-slate-400">
                  Load a YouTube video below to begin mixing
                </span>
              </div>
            )}
          </div>
        )}

        {/* Overlay error message if embedding fails */}
        {deck.error && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center z-20">
            <AlertCircle className="w-7 h-7 text-rose-500 mb-1.5" />
            <p className="text-xs font-bold text-rose-400">{deck.error}</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
              Some tracks on YouTube restrict third-party embedding. You can load another track or try a verified preset.
            </p>
            <button
              type="button"
              onClick={() => {
                const demoTrack = isDeckA ? CURATED_DEMO_TRACKS[0] : CURATED_DEMO_TRACKS[1];
                onLoadVideo(demoTrack.videoId);
              }}
              className="mt-2.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-600 transition active:scale-95 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Load Verified Preset</span>
            </button>
          </div>
        )}
      </div>

      {/* URL Loader Input Area */}
      <div className="flex flex-col gap-1.5">
        <form onSubmit={handleLoadSubmit} className="flex gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Paste YouTube URL or Video ID"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
            <Link className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5 pointer-events-none" />
          </div>

          <button
            type="submit"
            id={`load-deck-${deck.deckId.toLowerCase()}-btn`}
            disabled={deck.isLoading}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] tracking-wider text-slate-950 transition active:scale-95 shrink-0 ${
              isDeckA ? 'bg-cyan-400 hover:bg-cyan-300' : 'bg-orange-500 hover:bg-orange-400'
            }`}
          >
            {deck.isLoading ? 'LOADING...' : `LOAD DECK ${deck.deckId}`}
          </button>
        </form>

        {/* Validation / error notification */}
        {inputError && (
          <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 px-1">
            <AlertCircle className="w-3 h-3" />
            <span>{inputError}</span>
          </div>
        )}

        {/* Quick action bar: Preset tracks & Recent tracks */}
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>Curated Presets</span>
          </button>

          {recentTracks.length > 0 && (
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              <History className="w-3 h-3" />
              <span>Recent ({recentTracks.length})</span>
            </button>
          )}
        </div>

        {/* Preset Drawer */}
        {showPresets && (
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-1.5 animate-in fade-in duration-100">
            {CURATED_DEMO_TRACKS.map((track) => (
              <button
                key={track.videoId}
                onClick={() => handlePresetSelect(track)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-left border border-slate-700 transition"
              >
                <p className="text-[11px] font-bold text-white truncate">{track.title}</p>
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
                  <span>{track.genre}</span>
                  <span className={themeText}>{track.bpm} BPM</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Tracks Drawer */}
        {showRecent && recentTracks.length > 0 && (
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1 animate-in fade-in duration-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Recently Loaded in Deck {deck.deckId}
            </p>
            {recentTracks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onLoadVideo(item.id);
                  setShowRecent(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 text-left text-xs transition"
              >
                <span className="text-slate-200 truncate pr-2 text-[11px]">{item.title || item.id}</span>
                <span className="font-mono text-[9px] text-slate-400 shrink-0">{item.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Waveform / Progress Area */}
      <WaveformDisplay
        deckColor={deckColor}
        currentTime={deck.currentTime}
        duration={deck.duration}
        isPlaying={isPlaying}
        cuePoint={deck.cuePoint}
        loopActive={deck.loopActive}
        loopStart={deck.loopStart}
        loopEnd={deck.loopEnd}
        onSeek={onSeek}
      />

      {/* Main DJ Transport Buttons (Large tactile controls) */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* Play / Pause Toggle */}
        <button
          id={`deck-${deck.deckId.toLowerCase()}-play-btn`}
          onClick={isPlaying ? onPause : onPlay}
          className={`col-span-2 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg ${
            isPlaying
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        <button
          id={`deck-${deck.deckId.toLowerCase()}-stop-btn`}
          onClick={onStop}
          className="py-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition active:scale-95"
          title="Stop & Return to Cue / Start"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="text-[9px]">STOP</span>
        </button>

        {/* Restart Button */}
        <button
          id={`deck-${deck.deckId.toLowerCase()}-restart-btn`}
          onClick={onRestart}
          className="py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition active:scale-95"
          title="Restart track from 0:00"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[9px]">RESTART</span>
        </button>

        {/* Cue Button */}
        <button
          id={`deck-${deck.deckId.toLowerCase()}-cue-btn`}
          onClick={onCue}
          className={`py-3 rounded-xl border font-black text-xs flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
            deck.cuePoint !== null
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="DJ Cue: Tap to jump to cue or set cue point when paused"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[9px]">CUE</span>
        </button>
      </div>

      {/* Secondary DJ Controls: Loop & Sync */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* Sync Button */}
        <button
          id={`deck-${deck.deckId.toLowerCase()}-sync-btn`}
          onClick={onSync}
          className="col-span-1 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-700/50 text-indigo-300 font-black text-[10px] tracking-wider transition active:scale-95 flex flex-col items-center justify-center"
          title={`Sync speed & tempo to Deck ${oppositeDeck.deckId}`}
        >
          <span>SYNC</span>
          <span className="text-[8px] opacity-75 font-mono">{deck.playbackRate}x</span>
        </button>

        {/* Master Loop Toggle */}
        <button
          onClick={onToggleLoop}
          className={`col-span-1 py-1.5 rounded-lg border font-bold text-[10px] transition active:scale-95 flex flex-col items-center justify-center ${
            deck.loopActive
              ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Repeat className="w-3 h-3 mb-0.5" />
          <span>LOOP</span>
        </button>

        {/* 4 Beat Loop */}
        <button
          onClick={() => onSetLoopBeats(4)}
          className={`py-1.5 rounded-lg border text-[10px] font-bold transition active:scale-95 ${
            deck.loopActive && deck.loopBeats === 4
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          4 BEAT
        </button>

        {/* 8 Beat Loop */}
        <button
          onClick={() => onSetLoopBeats(8)}
          className={`py-1.5 rounded-lg border text-[10px] font-bold transition active:scale-95 ${
            deck.loopActive && deck.loopBeats === 8
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          8 BEAT
        </button>

        {/* 16 Beat Loop */}
        <button
          onClick={() => onSetLoopBeats(16)}
          className={`py-1.5 rounded-lg border text-[10px] font-bold transition active:scale-95 ${
            deck.loopActive && deck.loopBeats === 16
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          16 BEAT
        </button>
      </div>

      {/* Tempo / Pitch Speed Slider & Presets */}
      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            TEMPO / SPEED
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${deck.speedPitchPercent !== 0 ? themeText : 'text-slate-400'}`}>
              {deck.speedPitchPercent > 0 ? `+${deck.speedPitchPercent}%` : `${deck.speedPitchPercent}%`}
            </span>
            <span className="font-mono bg-slate-800 px-1 rounded text-white text-[9px]">
              {deck.playbackRate}x
            </span>
          </div>
        </div>

        {/* Speed slider: -50% to +50% */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-400">-50%</span>
          <input
            type="range"
            min="-50"
            max="50"
            value={deck.speedPitchPercent}
            onChange={(e) => onSetSpeedOffset(Number(e.target.value))}
            className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
              isDeckA ? 'accent-cyan-400' : 'accent-orange-400'
            }`}
          />
          <span className="text-[9px] font-mono text-slate-400">+50%</span>
        </div>

        {/* Rate Buttons: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x */}
        <div className="grid grid-cols-6 gap-1 pt-0.5">
          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => onSetPlaybackRate(rate)}
              className={`py-1 rounded text-[9px] font-mono font-bold transition ${
                deck.playbackRate === rate
                  ? `${themeBg} text-slate-950 font-black shadow-sm`
                  : 'bg-slate-800/90 text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Volume & Equalizer Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Deck Volume Slider & Mute */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              DECK {deck.deckId} VOL
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 text-[9px]">
                Eff: {deck.effectiveVolume}%
              </span>
              <span className="font-mono font-bold text-white">
                {deck.muted ? 'MUTED' : `${deck.volume}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={deck.volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
                isDeckA ? 'accent-cyan-400' : 'accent-orange-400'
              }`}
            />
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border transition ${
                deck.muted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Deck Mute"
            >
              {deck.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3-Band Visual Equalizer */}
        <EqualizerControl
          deckId={deck.deckId}
          low={deck.eqLow}
          mid={deck.eqMid}
          high={deck.eqHigh}
          onChange={onUpdateEq}
          onOpenNotice={onOpenAudioNotice}
        />
      </div>
    </div>
  );
};
