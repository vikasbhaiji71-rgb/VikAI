import React from 'react';
import { Info, RotateCcw } from 'lucide-react';

interface EqualizerControlProps {
  deckId: 'A' | 'B';
  low: number; // -12 to +12
  mid: number; // -12 to +12
  high: number; // -12 to +12
  onChange: (band: 'low' | 'mid' | 'high', value: number) => void;
  onOpenNotice: () => void;
}

export const EqualizerControl: React.FC<EqualizerControlProps> = ({
  deckId,
  low,
  mid,
  high,
  onChange,
  onOpenNotice,
}) => {
  const bands = [
    { key: 'high' as const, label: 'HI', value: high, freq: '2.5kHz+' },
    { key: 'mid' as const, label: 'MID', value: mid, freq: '1.0kHz' },
    { key: 'low' as const, label: 'LOW', value: low, freq: '100Hz' },
  ];

  const isDeckA = deckId === 'A';
  const accentColor = isDeckA ? 'accent-cyan-400' : 'accent-orange-400';
  const textAccent = isDeckA ? 'text-cyan-400' : 'text-orange-400';

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-md">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
            3-BAND EQ
          </span>
          <span className="text-[9px] px-1 py-0.2 bg-slate-800 rounded font-mono text-slate-400">
            -12 / +12 dB
          </span>
        </div>
        <button
          onClick={onOpenNotice}
          className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/20 transition"
          title="View YouTube iframe CORS isolation note"
        >
          <Info className="w-2.5 h-2.5" />
          <span>CORS Notice</span>
        </button>
      </div>

      {/* 3 sliders */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {bands.map(({ key, label, value, freq }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-between w-full text-[9px] text-slate-400">
              <span className="font-bold text-white">{label}</span>
              <span className={`font-mono ${value !== 0 ? textAccent : 'text-slate-400'}`}>
                {value > 0 ? `+${value}` : value} dB
              </span>
            </div>

            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={value}
                onChange={(e) => onChange(key, Number(e.target.value))}
                className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accentColor}`}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[8px] text-slate-400">
              <span>{freq}</span>
              {value !== 0 && (
                <button
                  onClick={() => onChange(key, 0)}
                  className="hover:text-white transition p-0.5"
                  title="Reset to 0dB"
                >
                  <RotateCcw className="w-2 h-2" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[8px] text-slate-400 px-0.5 pt-0.5">
        <span
          className="truncate text-[8px] text-slate-400 hover:text-slate-300 transition cursor-help"
          title="Web Audio API EQ (lowshelf, peaking, highshelf) active for local audio. YouTube streams are cross-origin CORS-isolated by browser policy."
        >
          Web Audio EQ (Local) • YouTube CORS
        </span>
        <button
          onClick={() => {
            onChange('low', 0);
            onChange('mid', 0);
            onChange('high', 0);
          }}
          className="text-slate-400 hover:text-slate-200 transition"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};
