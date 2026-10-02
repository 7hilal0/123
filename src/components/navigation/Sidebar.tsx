import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  Sparkles,
  MessageSquare,
  Bell,
  User,
  Plus,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  Globe,
  Settings
} from 'lucide-react';
import { UserStatus } from '../../types';
import { ThumbnailPickerModal } from '../common/ThumbnailPickerModal';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    selectedCommunitySlug,
    unreadCount,
    conversations,
    navigateToFeed,
    navigateToCreatePost,
    navigateToMessages,
    navigateToNotifications,
    navigateToProfile,
    navigateToSearch,
    setAuthModalOpen,
    navigateToSettings,
    logout,
    updateUserStatus,
    t,
    dir,
    language,
  } = useApp();

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const statuses: { label: string; value: UserStatus; color: string }[] = [
    { label: t.statusOnline, value: 'online', color: 'bg-emerald-500' },
    { label: t.statusIdle, value: 'idle', color: 'bg-amber-500' },
    { label: t.statusDnd, value: 'dnd', color: 'bg-rose-500' },
    { label: t.statusOffline, value: 'offline', color: 'bg-neutral-500' },
  ];

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <aside className={`hidden md:flex flex-col w-64 h-screen sticky top-0 bg-neutral-950/80 backdrop-blur-xl border-white/5 select-none shrink-0 z-30 ${dir === 'rtl' ? 'md:order-2 border-s md:border-e-0' : 'border-e'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
        <button
          onClick={() => navigateToFeed('hot')}
          className="flex items-center gap-2.5 group text-start focus:outline-none"
        >
          <div className="w-10 h-8 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <img src="/dzcore-logo.png" alt="DZCORE logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-wide text-white">
                <span className="text-emerald-500 font-extrabold">D</span>ZCORE
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block -mt-1 font-mono tracking-wider">
              {t.appTagline}
            </span>
          </div>
        </button>

        <button
          onClick={() => navigateToSearch()}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Nav */}
        <div className="space-y-1">
          <button
            onClick={() => navigateToFeed('hot')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'feed' && !selectedCommunitySlug
                ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold'
                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" />
              <span>{t.navHome}</span>
            </div>
          </button>

          <button
            onClick={() => navigateToSearch()}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold'
                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4" />
              <span>{t.navExplore}</span>
            </div>
          </button>

          <button
            onClick={() => navigateToMessages()}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold'
                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>{t.navMessages}</span>
            </div>
            {totalUnreadMessages > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-full">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateToNotifications()}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold'
                : 'text-neutral-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>{t.navNotifications}</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser && (
            <button
              onClick={() => navigateToProfile(currentUser.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'profile' && !selectedCommunitySlug
                  ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30 font-semibold'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>{t.navProfile}</span>
              </div>
            </button>
          )}

          <button
            onClick={navigateToSettings}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>{t.settingsTitle}</span>
            </div>
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

        {/* Create Post Button */}
        <div>
          <button
            onClick={() => navigateToCreatePost()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.navCreate}</span>
          </button>
        </div>
      </div>

      {/* User Bottom Plate (Profile / Status bar) */}
      <div className="p-3 border-t border-white/5 bg-neutral-900/40 relative" ref={statusMenuRef}>
        {currentUser ? (
          <div>
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 transition-colors">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-start focus:outline-none"
              >
                <Avatar
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  size="sm"
                  status={currentUser.status}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate font-mono">
                    @{currentUser.username}
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                title={t.navLogout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Status Popover */}
            {statusMenuOpen && (
              <div className="absolute bottom-16 start-3 end-3 p-2 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {t.presenceStatus}
                </div>
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      updateUserStatus(s.value);
                      setStatusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      currentUser.status === s.value
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span>{s.label}</span>
                    </div>
                    {currentUser.status === s.value && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}

                <div className="pt-1.5 mt-1.5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMenuOpen(false);
                      setShowThumbnailModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تغيير الصورة المصغرة' : 'Change Thumbnail'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, 'login')}
            className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>{t.navLogin}</span>
          </button>
        )}
      </div>

      {/* Thumbnail Picker Modal */}
      <ThumbnailPickerModal
        isOpen={showThumbnailModal}
        onClose={() => setShowThumbnailModal(false)}
      />
    </aside>
  );
};
