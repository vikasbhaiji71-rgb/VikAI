import React, { useRef, useMemo } from 'react';
import { formatTime } from '../utils/youtube.ts';

interface WaveformDisplayProps {
  deckColor: 'cyan' | 'orange';
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  cuePoint: number | null;
  loopActive: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (seconds: number) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  deckColor,
  currentTime,
  duration,
  isPlaying,
  cuePoint,
  loopActive,
  loopStart,
  loopEnd,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate pseudo-random deterministic waveform peak bars
  const bars = useMemo(() => {
    const count = 70;
    const result: number[] = [];
    let prev = 0.5;
    for (let i = 0; i < count; i++) {
      // Simulate typical EDM / dance / vocal track dynamics with buildup & drops
      const phase = Math.sin((i / count) * Math.PI * 4);
      const noise = ((Math.sin(i * 997.1) + Math.cos(i * 353.7)) / 2 + 1) / 2;
      const height = Math.max(0.15, Math.min(1.0, 0.35 + 0.45 * Math.abs(phase) * noise));
      result.push(height);
      prev = height;
    }
    return result;
  }, []);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const cuePercent = cuePoint !== null && duration > 0 ? Math.min(100, (cuePoint / duration) * 100) : null;
  const loopStartPercent = loopStart !== null && duration > 0 ? Math.min(100, (loopStart / duration) * 100) : null;
  const loopEndPercent = loopEnd !== null && duration > 0 ? Math.min(100, (loopEnd / duration) * 100) : null;

  const isDraggingRef = useRef(false);

  const calculateTargetSeconds = (clientX: number) => {
    if (!containerRef.current || duration <= 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = clickX / rect.width;
    return ratio * duration;
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onSeek(calculateTargetSeconds(clientX));
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onSeek(calculateTargetSeconds(clientX));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const isCyan = deckColor === 'cyan';
  const primaryColor = isCyan ? 'bg-cyan-400' : 'bg-orange-500';
  const glowColor = isCyan ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 120, 0, 0.4)';
  const playedBarColor = isCyan ? 'bg-cyan-400' : 'bg-orange-400';
  const unplayedBarColor = 'bg-slate-700/70';

  return (
    <div className="w-full select-none">
      {/* Time display bar */}
      <div className="flex justify-between items-center px-1 mb-1 font-mono text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? (isCyan ? 'bg-cyan-400 animate-pulse' : 'bg-orange-400 animate-pulse') : 'bg-slate-500'}`} />
          <span className="text-white font-semibold">{formatTime(currentTime)}</span>
        </span>
        <span className="text-[10px] text-slate-400">
          REMAIN: -{formatTime(Math.max(0, duration - currentTime))}
        </span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Interactive Waveform container with tactile drag scrubbing */}
      <div
        ref={containerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="relative h-12 w-full rounded-lg bg-slate-950/90 border border-slate-800 hover:border-slate-700 cursor-pointer overflow-hidden shadow-inner flex items-center px-1 group transition"
      >
        {/* Loop Region Highlight */}
        {loopActive && loopStartPercent !== null && loopEndPercent !== null && (
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x-2 border-emerald-400/80 z-10 pointer-events-none"
            style={{
              left: `${Math.min(loopStartPercent, loopEndPercent)}%`,
              width: `${Math.abs(loopEndPercent - loopStartPercent)}%`,
            }}
          >
            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-1 rounded">
              LOOP
            </span>
          </div>
        )}

        {/* Cue Marker Flag */}
        {cuePercent !== null && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
            style={{ left: `${cuePercent}%` }}
          >
            <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <div className="absolute top-0 transform -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[8px] px-1 rounded-b shadow font-mono">
              CUE
            </div>
          </div>
        )}

        {/* Bars Waveform Canvas */}
        <div className="w-full h-full flex items-center justify-between gap-[1px] relative z-0">
          {bars.map((barHeight, idx) => {
            const barPercent = (idx / bars.length) * 100;
            const isPlayed = barPercent <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-center h-full"
              >
                <div
                  className={`w-full rounded-full transition-all duration-75 ${
                    isPlayed ? playedBarColor : unplayedBarColor
                  }`}
                  style={{
                    height: `${barHeight * 80}%`,
                    boxShadow: isPlayed && isPlaying ? `0 0 6px ${glowColor}` : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Live Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
          style={{ left: `${progressPercent}%` }}
        >
          <div className={`w-0.5 h-full ${primaryColor} shadow-[0_0_10px_${glowColor}]`} />
          <div className={`absolute top-0 w-2.5 h-2.5 rounded-full ${primaryColor} -translate-x-[4px] -translate-y-1 shadow-md`} />
          <div className={`absolute bottom-0 w-2.5 h-2.5 rounded-full ${primaryColor} -translate-x-[4px] translate-y-1 shadow-md`} />
        </div>

        {/* Subtle grid background lines */}
        <div className="absolute inset-0 grid grid-cols-8 pointer-events-none opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-slate-500 h-full" />
          ))}
        </div>
      </div>
    </div>
  );
};
