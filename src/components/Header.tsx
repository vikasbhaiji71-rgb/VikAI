import React from 'react';
import {
  Disc3,
  Sliders,
  Maximize2,
  Minimize2,
  Info,
  Sparkles,
  Zap,
  Headphones,
  ListMusic,
  Bot,
  Laugh,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAudioNotice: () => void;
  onOpenMemeLibrary: () => void;
  isMemePlaying?: boolean;
  exclusiveMode: boolean;
  isRemixMode: boolean;
  onToggleRemix: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenQueue?: () => void;
  queueCount?: number;
  autoDjEnabled?: boolean;
  onToggleAutoDj?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAudioNotice,
  onOpenMemeLibrary,
  isMemePlaying = false,
  exclusiveMode,
  isRemixMode,
  onToggleRemix,
  isFullscreen,
  onToggleFullscreen,
  onOpenQueue,
  queueCount = 0,
  autoDjEnabled = false,
  onToggleAutoDj,
}) => {
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md shrink-0">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
          <Disc3 className="w-5 h-5 animate-spin duration-3000 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm md:text-base font-black tracking-wider text-white">
              VIKMIX <span className="text-cyan-400">DJ</span>
            </h1>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Dual-Deck Mobile Remix Mixer
          </p>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Quick Header Remix Button */}
        <button
          id="header-remix-toggle-btn"
          type="button"
          onClick={onToggleRemix}
          className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border transition active:scale-95 shadow-md ${
            isRemixMode
              ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.5)]'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
          }`}
          title="Toggle Dual-Deck Remix Mode"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>REMIX: {isRemixMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Quick Header Auto DJ Button */}
        {onToggleAutoDj && (
          <button
            id="header-autodj-toggle-btn"
            type="button"
            onClick={onToggleAutoDj}
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border transition active:scale-95 shadow-md ${
              autoDjEnabled
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Auto DJ Continuous Transitions"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AUTO DJ: {autoDjEnabled ? 'ON' : 'OFF'}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>EXCLUSIVE: {isRemixMode ? 'OFF (REMIX)' : exclusiveMode ? 'ACTIVE' : 'OFF'}</span>
        </div>

        <button
          onClick={onOpenAudioNotice}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Audio Engine</span>
        </button>
      </div>

      {/* Right action buttons */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* DJ Queue Button */}
        {onOpenQueue && (
          <button
            id="header-queue-btn"
            onClick={onOpenQueue}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 text-xs font-semibold tracking-wide transition active:scale-95"
            title="Open DJ Queue & Auto Mix Manager"
          >
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Queue</span>
            {queueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {queueCount}
              </span>
            )}
          </button>
        )}

        {/* MEME Sound Library Button (Replacing Demo) */}
        <button
          id="open-meme-library-btn"
          type="button"
          onClick={onOpenMemeLibrary}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold tracking-wide transition active:scale-95 cursor-pointer ${
            isMemePlaying
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 hover:text-white'
          }`}
          title="Open Meme Sound Library & Reaction Drops"
        >
          <Laugh className="w-3.5 h-3.5 text-amber-400" />
          <span>MEME</span>
          {isMemePlaying && (
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          )}
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Optimal DJ Mode)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          id="open-settings-btn"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition"
          title="Mixer Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
