import React from 'react';
import { Info, ShieldAlert, X, Radio } from 'lucide-react';

interface AudioNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioNoticeModal: React.FC<AudioNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">Audio Engine & EQ Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close audio notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs leading-relaxed text-slate-300">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">YouTube Iframe Browser Security (CORS)</p>
              <p className="mt-0.5 text-amber-200/90 text-[11px]">
                Under W3C web standards and Google's YouTube IFrame Player API terms, cross-origin embedded iframes cannot be routed directly into raw Web Audio API DSP filter nodes (BiquadFilterNode) due to Cross-Origin Resource Sharing (CORS) sandbox isolation.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              What VikMix DJ Actually Does:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
              <li>
                <strong className="text-emerald-400">Volume & Crossfader:</strong> 100% active, directly controls hardware playback gain via YouTube's official volume API with equal-power crossfade curve.
              </li>
              <li>
                <strong className="text-emerald-400">Tempo & Pitch:</strong> 100% active, uses YouTube's official playback rate API (0.5x to 2x) in real time.
              </li>
              <li>
                <strong className="text-emerald-400">Cue & Beat Looping:</strong> 100% active, software-synchronized loop boundaries with auto-rewind and cue-seeking.
              </li>
              <li>
                <strong className="text-cyan-400">3-Band EQ (Low / Mid / High):</strong> 100% active DSP filtering on local audio via Web Audio API (low-shelf at 100Hz, peaking at 1kHz, high-shelf at 2.5kHz). For YouTube iframe audio, true DSP frequency filtering cannot be applied due to browser CORS isolation; VikMix DJ honestly complies with web standards and does not simulate fake filtering on YouTube.
              </li>
            </ul>
          </div>

          <p className="text-slate-400 text-[11px]">
            In strict compliance with professional engineering standards and browser security, VikMix DJ processes local playable audio through genuine Web Audio API filter nodes and does not fake non-existent FFT filtering on protected cross-domain YouTube audio streams.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-98"
        >
          Understood & Continue DJing
        </button>
      </div>
    </div>
  );
};
