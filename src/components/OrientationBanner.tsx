import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

interface OrientationBannerProps {
  enabled: boolean;
}

export const OrientationBanner: React.FC<OrientationBannerProps> = ({ enabled }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!enabled || !isPortrait || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-cyan-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-cyan-200">
      <div className="flex items-center gap-2">
        <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span>
          <strong>Pro DJ Mode:</strong> Rotate phone to <strong>Landscape</strong> for full side-by-side mixer experience.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:text-white transition"
        title="Dismiss hint"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
