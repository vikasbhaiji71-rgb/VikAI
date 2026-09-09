import React, { useRef, useState } from 'react';
import { Laugh, Plus, Play, Square, Trash2, X, Volume2, Sparkles, Upload, Music } from 'lucide-react';
import { MemeLibraryState } from '../hooks/useMemeLibrary.ts';

interface MemeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memeLibrary: MemeLibraryState;
}

export function MemeLibraryModal({ isOpen, onClose, memeLibrary }: MemeLibraryModalProps) {
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const slotFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);

  if (!isOpen) return null;

  const { memes, playingMemeId, playingMemeName, status, onAddMemeFile, onPlayMeme, onStopMeme, onRemoveMeme } =
    memeLibrary;

  const handleGlobalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddMemeFile(file);
    }
    e.target.value = '';
  };

  const handleSlotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetSlotId) {
      onAddMemeFile(file, targetSlotId);
    }
    setTargetSlotId(null);
    e.target.value = '';
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || isNaN(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const customMemes = memes.filter((m) => m.category === 'custom');
  const royaltyFreeMemes = memes.filter((m) => m.category === 'royalty_free');
  const viralSlots = memes.filter((m) => m.category === 'viral_slot');

  return (
    <div
      id="meme-library-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="meme-library-modal"
        className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Global Native Audio File Input */}
        <input
          ref={globalFileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleGlobalFileChange}
        />

        {/* Hidden Slot Native Audio File Input */}
        <input
          ref={slotFileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleSlotFileChange}
        />

        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Laugh className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase flex items-center gap-2">
                <span>MEME SOUND LIBRARY</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {status === 'PLAYING' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>● MEME PLAYING: {playingMemeName || 'AUDIO'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>● READY</span>
                  </span>
                )}
                <span className="text-slate-600 text-[10px]">•</span>
                <span className="text-[10px] text-slate-400 font-mono">Ducks DJ Music to 50%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Top + ADD MEME Button */}
            <button
              id="add-meme-global-btn"
              type="button"
              onClick={() => globalFileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              title="Add an audio file from your device (+)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ADD MEME</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Subheader */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Playlist music automatically reduces to 50% while meme audio plays.</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">Local & Private</span>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 text-xs">
          {/* SECTION 1: MY MEMES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>My Memes ({customMemes.length})</span>
              </span>
              <button
                type="button"
                onClick={() => globalFileInputRef.current?.click()}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Audio</span>
              </button>
            </div>

            {customMemes.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 border-dashed text-center text-slate-400">
                <p className="text-[11px]">No custom meme sounds added yet.</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tap <strong className="text-amber-400">[+ ADD MEME]</strong> to select MP3, WAV, M4A, or OGG audio from your phone.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {customMemes.map((item) => {
                  const isPlaying = playingMemeId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-xl border flex items-center justify-between transition ${
                        isPlaying
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate">{item.name}</p>
                          {item.duration !== undefined && (
                            <span className="text-[9px] font-mono text-slate-400">
                              {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPlaying ? (
                          <button
                            type="button"
                            onClick={onStopMeme}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold transition active:scale-95"
                          >
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>STOP</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onPlayMeme(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition active:scale-95"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>PLAY</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveMeme(item.id)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                          title="Remove from My Memes"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: BUILT-IN ROYALTY-FREE REACTION SFX */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Preloaded Royalty-Free Drops (Ready to Play)</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                100% Free / Public Domain
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {royaltyFreeMemes.map((item) => {
                const isPlaying = playingMemeId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-xl border flex items-center justify-between transition ${
                      isPlaying
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white text-xs truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-[9px] text-slate-400 truncate">{item.description}</p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isPlaying ? (
                        <button
                          type="button"
                          onClick={onStopMeme}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold transition active:scale-95"
                        >
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>STOP</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPlayMeme(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition active:scale-95"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>PLAY</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: INDIAN VIRAL MEME SLOTS (COPYRIGHT-COMPLIANT SLOTS) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Laugh className="w-3.5 h-3.5 text-amber-400" />
                <span>India Viral Reaction Slots</span>
              </span>
              <span className="text-[9px] font-mono text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                User Audio Slots
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              In strict compliance with copyright rules, attach your own legally obtained audio clips for these iconic viral moments:
            </p>

            <div className="space-y-1.5">
              {viralSlots.map((item) => {
                const isPlaying = playingMemeId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-xl border flex items-center justify-between transition ${
                      isPlaying
                        ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white text-xs truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {item.isReady ? (
                          <span className="text-emerald-400 font-mono">
                            ✓ Audio attached {item.duration ? `(${formatDuration(item.duration)})` : ''}
                          </span>
                        ) : (
                          item.description
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.isReady ? (
                        <>
                          {isPlaying ? (
                            <button
                              type="button"
                              onClick={onStopMeme}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold transition active:scale-95"
                            >
                              <Square className="w-2.5 h-2.5 fill-current" />
                              <span>STOP</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onPlayMeme(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition active:scale-95"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>PLAY</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveMeme(item.id)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                            title="Remove attached audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSlotId(item.id);
                            slotFileInputRef.current?.click();
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>Attach Audio</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>VikMix DJ • Meme Engine</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
