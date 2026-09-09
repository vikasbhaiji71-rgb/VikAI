import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Trash2,
  Play,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Disc3,
  Bot,
} from 'lucide-react';
import { QueueItem, DeckState } from '../types.ts';
import { CURATED_DEMO_TRACKS, extractYouTubeVideoId } from '../utils/youtube.ts';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueueItem[];
  onAddToQueue: (item: QueueItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  onLoadToDeck: (videoId: string, deckId: 'A' | 'B') => void;
  deckA: DeckState;
  deckB: DeckState;
  autoDjEnabled: boolean;
  onToggleAutoDj: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onLoadToDeck,
  deckA,
  deckB,
  autoDjEnabled,
  onToggleAutoDj,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const videoId = extractYouTubeVideoId(inputUrl);
    if (!videoId) {
      setError('Please provide a valid YouTube URL or 11-char Video ID');
      return;
    }

    const newItem: QueueItem = {
      id: `${videoId}-${Date.now()}`,
      videoId,
      title: customTitle.trim() || `YouTube Track (${videoId})`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };

    onAddToQueue(newItem);
    setInputUrl('');
    setCustomTitle('');
  };

  const handleAddPreset = (preset: (typeof CURATED_DEMO_TRACKS)[0]) => {
    const newItem: QueueItem = {
      id: `${preset.videoId}-${Date.now()}`,
      videoId: preset.videoId,
      title: preset.title,
      author: preset.author,
      thumbnailUrl: `https://img.youtube.com/vi/${preset.videoId}/hqdefault.jpg`,
    };
    onAddToQueue(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                DJ PLAYLIST & QUEUE
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/40">
                  {queue.length} TRACKS
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Strict Source for REWIND MIX & Auto DJ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto DJ Toggle in Queue */}
            <button
              id="queue-autodj-toggle"
              type="button"
              onClick={onToggleAutoDj}
              className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border transition active:scale-95 ${
                autoDjEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Auto DJ Continuous Transitions"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AUTO DJ: {autoDjEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active Decks Status */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/40 border-b border-slate-800/80 text-xs shrink-0">
          <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-cyan-400 font-bold">DECK A (ACTIVE/IDLE)</span>
              <span className="text-slate-400 font-semibold">{deckA.status}</span>
            </div>
            <p className="text-[11px] font-bold text-white truncate">
              {deckA.title || deckA.videoId || 'No Track Loaded'}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-slate-900 border border-orange-500/30">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-orange-400 font-bold">DECK B (ACTIVE/IDLE)</span>
              <span className="text-slate-400 font-semibold">{deckB.status}</span>
            </div>
            <p className="text-[11px] font-bold text-white truncate">
              {deckB.title || deckB.videoId || 'No Track Loaded'}
            </p>
          </div>
        </div>

        {/* Add track form */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 shrink-0">
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste YouTube Link or Video ID to Queue..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {error && <p className="text-[10px] text-rose-400 font-semibold">{error}</p>}
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Sample tracks (optional):
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
            {CURATED_DEMO_TRACKS.map((track) => (
              <button
                key={track.videoId}
                onClick={() => handleAddPreset(track)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[10px] whitespace-nowrap transition shrink-0"
                title={`Add ${track.title} to Playlist`}
              >
                + {track.title.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Queue track list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {queue.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Disc3 className="w-8 h-8 mx-auto text-slate-600 animate-spin duration-5000" />
              <p className="text-xs font-semibold">Playlist / Queue is currently empty</p>
              <p className="text-[10px] max-w-xs mx-auto text-slate-400">
                Paste YouTube URLs or IDs above to build your playlist. <strong>REWIND MIX</strong> will{' '}
                <strong>ONLY</strong> play videos from your playlist. When empty, REWIND MIX transitions
                between your currently loaded decks with zero outside videos.
              </p>
            </div>
          ) : (
            queue.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-10 h-7 object-cover rounded bg-slate-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {item.author ? `${item.author} • ` : ''}ID: {item.videoId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onLoadToDeck(item.videoId, 'A')}
                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/40 text-cyan-300 text-[10px] font-bold transition"
                    title="Load immediately into Deck A"
                  >
                    A
                  </button>
                  <button
                    onClick={() => onLoadToDeck(item.videoId, 'B')}
                    className="px-2 py-1 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-600/40 text-orange-300 text-[10px] font-bold transition"
                    title="Load immediately into Deck B"
                  >
                    B
                  </button>
                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Remove track"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px]">
            Press <strong>↩ REWIND MIX</strong> or press <strong>'R'</strong> to mix into next queued
            track
          </span>
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-slate-500 hover:text-rose-400 text-[11px] font-semibold transition"
            >
              Clear Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
