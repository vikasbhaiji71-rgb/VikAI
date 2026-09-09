import React, { useState } from 'react';
import {
  X,
  Sliders,
  Monitor,
  Keyboard,
  RefreshCw,
  Check,
  LayoutGrid,
  RotateCcw,
  Volume2,
  Bot,
  Play,
} from 'lucide-react';
import { MixerSettings } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MixerSettings;
  onUpdateSettings: (newSettings: Partial<MixerSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  if (!isOpen) return null;

  const handleTestSound = () => {
    try {
      setIsPlayingTestSound(true);
      const audio = new Audio('/audio/rewind-transition.mp3');
      audio.volume = Math.max(0, Math.min(1, (settings.transitionSoundVolume ?? 100) / 100));
      audio.onended = () => setIsPlayingTestSound(false);
      audio.onerror = () => setIsPlayingTestSound(false);
      audio.play().catch(() => setIsPlayingTestSound(false));
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sliders className="w-5 h-5" />
            <h2 className="text-base font-bold text-white tracking-wide">Mixer & Deck Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Exclusive Deck Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div>
              <p className="font-semibold text-white">Exclusive Deck Mode</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Only one deck can play at a time. Starting Deck A automatically pauses Deck B.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ exclusiveDeckMode: !settings.exclusiveDeckMode })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.exclusiveDeckMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.exclusiveDeckMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Pause Other Deck */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div>
              <p className="font-semibold text-white">Auto Pause Opposite Deck</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically pause the opposite deck when switching or cutting crossfader completely.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoPauseOtherDeck: !settings.autoPauseOtherDeck })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.autoPauseOtherDeck ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.autoPauseOtherDeck ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Remember Last Videos */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div>
              <p className="font-semibold text-white">Remember Recent Tracks</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Save loaded YouTube tracks in LocalStorage for one-tap recall.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ rememberLastVideos: !settings.rememberLastVideos })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.rememberLastVideos ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.rememberLastVideos ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Master Volume */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">Default Master Volume</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Default Crossfader Position */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">Default Crossfader Position</span>
              <span className="font-mono text-slate-300">
                {settings.crossfader === 50 ? 'Center (50/50)' : settings.crossfader < 50 ? `Deck A (${100 - settings.crossfader}%)` : `Deck B (${settings.crossfader}%)`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.crossfader}
              onChange={(e) => onUpdateSettings({ crossfader: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Deck A</span>
              <span>Center</span>
              <span>Deck B</span>
            </div>
          </div>

          {/* Auto Remix Transition Duration */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">Remix Transition Duration</span>
              <span className="font-mono text-fuchsia-400 font-bold">
                {settings.transitionDuration || 4}s
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Time taken for one deck to smoothly fade out while the next fades in.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[2, 4, 8, 16].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ transitionDuration: sec })}
                  className={`py-1.5 px-2 rounded-lg font-mono font-bold text-xs border transition ${
                    (settings.transitionDuration || 4) === sec
                      ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {sec}s{sec === 4 ? ' (Beat)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* DJ Rewind Transition Sound Settings */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold text-white text-sm">TRANSITION SOUND</span>
                  <p className="text-slate-400 text-[10px]">
                    Play authentic DJ rewind scratch effect (/audio/rewind-transition.mp3)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    transitionSoundEnabled: !(settings.transitionSoundEnabled ?? true),
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.transitionSoundEnabled ?? true ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.transitionSoundEnabled ?? true}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.transitionSoundEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Transition Sound Volume */}
            <div className="pt-1 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  TRANSITION SOUND VOLUME
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {settings.transitionSoundVolume ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.transitionSoundVolume ?? 100}
                onChange={(e) =>
                  onUpdateSettings({ transitionSoundVolume: Number(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 italic">
                *Affects ONLY the transition sound effect. Does NOT alter YouTube deck playback volume.
              </p>
            </div>

            {/* Audition Button */}
            <button
              type="button"
              onClick={handleTestSound}
              disabled={isPlayingTestSound}
              className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-60"
            >
              <Play className={`w-3 h-3 fill-current ${isPlayingTestSound ? 'animate-pulse' : ''}`} />
              <span>{isPlayingTestSound ? 'Playing Sound Effect...' : 'Audition Transition Sound'}</span>
            </button>
          </div>

          {/* AUTO DJ Settings */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-semibold text-white text-sm">AUTO DJ MODE</span>
                  <p className="text-slate-400 text-[10px]">
                    Automatically trigger Rewind Mix before current track ends
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    autoDjEnabled: !(settings.autoDjEnabled ?? false),
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoDjEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.autoDjEnabled ?? false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.autoDjEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.autoDjEnabled && (
              <div className="pt-1 space-y-1 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Transition Point (Before Track End)</span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {settings.autoDjTransitionSeconds ?? 12}s
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[8, 12, 16, 24].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateSettings({ autoDjTransitionSeconds: sec })}
                      className={`py-1 px-1.5 rounded-lg font-mono font-bold text-xs border transition ${
                        (settings.autoDjTransitionSeconds ?? 12) === sec
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Option */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <span className="font-semibold text-white">Visual Deck Style</span>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'dark-onyx', label: 'Dark Onyx', color: 'bg-slate-950 border-slate-700' },
                { id: 'neon-club', label: 'Neon Club', color: 'bg-[#0f0e17] border-pink-500/40' },
                { id: 'cyber-cyan', label: 'Cyber Cyan', color: 'bg-[#07131e] border-cyan-500/40' },
              ].map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => onUpdateSettings({ theme: themeOption.id as any })}
                  className={`p-2 rounded-lg border text-center font-medium transition ${themeOption.color} ${
                    settings.theme === themeOption.id ? 'ring-2 ring-cyan-400 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {settings.theme === themeOption.id && <Check className="w-3 h-3 text-cyan-400" />}
                    <span>{themeOption.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Architecture */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              Mixer Layout
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ layoutStyle: 'sketch' })}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  (settings.layoutStyle || 'sketch') === 'sketch'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white ring-1 ring-cyan-400'
                    : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-300">
                  {(settings.layoutStyle || 'sketch') === 'sketch' && <Check className="w-3 h-3" />}
                  <span>Mobile Sketch (Default)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Dual decks on top, wide horizontal crossfader mixer below.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ layoutStyle: 'console' })}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  settings.layoutStyle === 'console'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white ring-1 ring-cyan-400'
                    : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-bold text-cyan-300">
                  {settings.layoutStyle === 'console' && <Check className="w-3 h-3" />}
                  <span>3-Column Console</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Side-by-side: Deck A | Center Mixer | Deck B on wide screens.
                </p>
              </button>
            </div>
          </div>

          {/* Landscape Hint */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                Landscape Orientation Banner
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Show helpful hint when phone is held in portrait.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ landscapeHint: !settings.landscapeHint })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.landscapeHint ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.landscapeHint ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              Keyboard DJ Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">SPACE</span>
                <span>Play/Pause Active</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">A</span>
                <span>Activate Deck A</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">B</span>
                <span>Activate Deck B</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">LEFT / RIGHT</span>
                <span>Fader to A / B</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-fuchsia-900/80 text-fuchsia-200 border border-fuchsia-700/50 px-1.5 py-0.5 rounded">T</span>
                <span className="text-fuchsia-300 font-semibold">Remix Transition</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="font-mono bg-amber-900/80 text-amber-200 border border-amber-700/50 px-1.5 py-0.5 rounded">R</span>
                <span className="text-amber-300 font-semibold">↩ REWIND MIX</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onResetSettings}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-98"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
