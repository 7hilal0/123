import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  Sparkles,
  Search,
  Bell,
  MessageSquare,
  Plus,
  X,
  Globe,
  Settings
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    currentUser,
    searchQuery,
    setSearchQuery,
    navigateToSearch,
    navigateToCreatePost,
    navigateToNotifications,
    navigateToMessages,
    navigateToProfile,
    navigateToFeed,
    setAuthModalOpen,
    setSettingsModalOpen,
    language,
    setLanguage,
    t,
    unreadCount,
    conversations,
  } = useApp();

  const [inputVal, setInputVal] = useState(searchQuery);
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      navigateToSearch(inputVal.trim());
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigateToFeed('hot')}
          className="flex lg:hidden items-center gap-2 group text-start focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-white">
            <span className="text-emerald-500 font-extrabold">D</span>ZCORE
          </span>
        </button>
      </div>

      {/* Zone 2: Centered Search Input */}
      <div className="flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-10 ps-10 pe-9 rounded-xl bg-neutral-900/90 border border-white/10 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 transition-all text-start"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                setSearchQuery('');
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Zone 3: Actions & Language Toggle */}
      <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
        {/* Quick Language Toggle Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 transition-colors"
          title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono">{language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors hidden sm:flex"
          title={t.settingsTitle}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Quick Create Button (desktop) */}
        <button
          onClick={() => navigateToCreatePost()}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t.navCreate}</span>
        </button>

        {/* Notifications Button */}
        <button
          onClick={navigateToNotifications}
          className="relative p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          title={t.navNotifications}
          aria-label={t.navNotifications}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-neutral-950" />
          )}
        </button>

        {/* Messages Button (desktop quick jump) */}
        <button
          onClick={() => navigateToMessages()}
          className="hidden sm:flex relative p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          title={t.navMessages}
          aria-label={t.navMessages}
        >
          <MessageSquare className="w-4 h-4" />
          {totalUnreadMessages > 0 && (
            <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-neutral-950" />
          )}
        </button>

        {/* User Pill / Login Trigger */}
        {currentUser ? (
          <button
            onClick={() => navigateToProfile(currentUser.id)}
            className="flex items-center gap-2 ps-1 pe-2.5 py-1 rounded-xl hover:bg-white/5 border border-white/5 transition-colors"
          >
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.displayName}
              size="sm"
              status={currentUser.status}
            />
            <span className="hidden xl:inline text-xs font-medium text-neutral-200 truncate max-w-[100px]">
              {currentUser.displayName}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors whitespace-nowrap"
            >
              {t.navLogin}
            </button>
            <button
              onClick={() => setAuthModalOpen(true, 'register')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap shadow-sm"
            >
              {t.navRegister}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
