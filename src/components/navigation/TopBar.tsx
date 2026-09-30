import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Settings } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    navigateToSettings,
    navigateToFeed,
    t,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 relative flex items-center justify-center">
      {/* Center: DZCORE Brand Logo & Name */}
      <button
        onClick={() => navigateToFeed('hot')}
        className="flex items-center gap-2.5 group focus:outline-none cursor-pointer select-none"
        title="DZCORE"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg md:text-xl tracking-wide text-white">
          <span className="text-emerald-500 font-extrabold">D</span>ZCORE
        </span>
      </button>

      {/* Far Right: Settings */}
      <div className="absolute right-4 md:right-6 flex items-center">
        <button
          onClick={navigateToSettings}
          className="relative p-2.5 text-neutral-300 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
          title={t.settingsTitle}
          aria-label={t.settingsTitle}
        >
          <Settings className="w-5 h-5 text-neutral-200 group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </header>
  );
};
