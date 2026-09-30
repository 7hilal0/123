import React from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { Sparkles, Search, Plus, MessageSquare, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    currentUser,
    activeTab,
    isInsideChat,
    conversations,
    navigateToFeed,
    navigateToSearch,
    navigateToCreatePost,
    navigateToMessages,
    navigateToProfile,
    setAuthModalOpen,
    t,
  } = useApp();

  if (isInsideChat) {
    return null;
  }

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 items-center h-16 px-2">
        {/* Home Feed */}
        <button
          onClick={() => navigateToFeed('hot')}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative group cursor-pointer"
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'feed' ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[56px] ${
              activeTab === 'feed' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            {t.navHome}
          </span>
        </button>

        {/* Explore / Search */}
        <button
          onClick={() => navigateToSearch()}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative group cursor-pointer"
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              activeTab === 'search'
                ? 'text-emerald-400'
                : 'text-neutral-400 group-hover:text-neutral-200'
            }`}
          >
            <Search className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[56px] ${
              activeTab === 'search'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400'
            }`}
          >
            {t.navExplore}
          </span>
        </button>

        {/* Create Button */}
        <button
          onClick={() => navigateToCreatePost()}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative cursor-pointer"
          aria-label={t.navCreate}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
        </button>

        {/* Messages */}
        <button
          onClick={() => navigateToMessages()}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative group cursor-pointer"
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'messages' ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-0.5 -start-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-neutral-950">
                {totalUnreadMessages}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[56px] ${
              activeTab === 'messages' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            {t.navMessages}
          </span>
        </button>

        {/* Profile / Auth */}
        <button
          onClick={() => {
            if (currentUser) {
              navigateToProfile(currentUser.id);
            } else {
              setAuthModalOpen(true, 'login');
            }
          }}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative group cursor-pointer"
        >
          {currentUser ? (
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.displayName}
              size="xs"
              status={currentUser.status}
              className={`ring-1 ${activeTab === 'profile' ? 'ring-emerald-400' : 'ring-transparent'}`}
            />
          ) : (
            <div
              className={`p-1 rounded-xl transition-colors ${
                activeTab === 'profile' ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-neutral-200'
              }`}
            >
              <User className="w-5 h-5" />
            </div>
          )}
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[56px] ${
              activeTab === 'profile' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            {currentUser ? t.navProfile : t.navLogin}
          </span>
        </button>
      </div>
    </nav>
  );
};
