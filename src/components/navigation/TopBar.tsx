import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Settings } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    navigateToSettings,
    navigateToNotifications,
    navigateToFeed,
    unreadCount,
    t,
  } = useApp();

  const isProfilePage = activeTab === 'profile';

  return (
    <header className="sticky top-0 z-30 h-16 md:h-[72px] w-full bg-neutral-950/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 md:px-8 relative flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,.12)]">
      {/* Center: DZCORE Brand Logo & Name */}
      <button
        onClick={() => navigateToFeed('hot')}
        className="flex items-center gap-2.5 rounded-2xl px-3 py-1.5 group focus:outline-none cursor-pointer select-none transition-colors hover:bg-white/[0.04]"
        title="DZCORE"
      >
        <div className="w-10 h-8 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
          <img src="/dzcore-logo.webp" alt="DZCORE logo" className="h-full w-full object-contain" />
        </div>
        <span className="font-display font-bold text-lg md:text-xl tracking-wide text-white">
          <span className="text-emerald-500 font-extrabold">D</span>ZCORE
        </span>
      </button>

      {/* Far Right: Profile -> Settings Gear (with Language Settings), Other tabs -> Notifications Bell */}
      <div className="absolute right-4 md:right-6 flex items-center">
        {isProfilePage ? (
          <button
            onClick={navigateToSettings}
            className="relative p-2.5 text-neutral-300 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
            title={t.settingsTitle}
            aria-label={t.settingsTitle}
          >
            <Settings className="w-5 h-5 text-neutral-200 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        ) : (
          <button
            onClick={navigateToNotifications}
            className="relative p-2.5 text-neutral-300 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer"
            title={t.navNotifications}
            aria-label={t.navNotifications}
          >
            <Bell className="w-5 h-5 text-neutral-200" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-neutral-950 animate-pulse" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
