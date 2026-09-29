import React from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../posts/PostCard';
import { FeedSortOption } from '../../types';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Users,
  Compass,
  Plus
} from 'lucide-react';

export const FeedView: React.FC = () => {
  const {
    posts,
    feedSort,
    setFeedSort,
    communities,
    navigateToCommunity,
    navigateToCreatePost,
    t,
  } = useApp();

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (feedSort === 'new') {
      return b.id.localeCompare(a.id);
    }
    if (feedSort === 'top') {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    }
    if (feedSort === 'following') {
      const aFollow = a.author.isFollowing ? 1 : 0;
      const bFollow = b.author.isFollowing ? 1 : 0;
      if (aFollow !== bFollow) return bFollow - aFollow;
    }
    // 'hot' default
    return (b.upvotes * 1.5 + b.commentCount * 2) - (a.upvotes * 1.5 + a.commentCount * 2);
  });

  const sortTabs: { id: FeedSortOption; label: string; icon: React.ReactNode }[] = [
    { id: 'hot', label: t.feedHot, icon: <Flame className="w-4 h-4" /> },
    { id: 'new', label: t.feedNew, icon: <Sparkles className="w-4 h-4" /> },
    { id: 'top', label: t.feedTop, icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'following', label: t.feedFollowing, icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 text-start">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Feed Filter Bar (Segmented Controls) */}
          <div className="flex items-center justify-between bg-neutral-900/60 border border-white/5 rounded-2xl p-1.5 backdrop-blur-md">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {sortTabs.map((tab) => {
                const isActive = feedSort === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFeedSort(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-emerald-400' : ''}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => navigateToCreatePost()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.navCreate}</span>
            </button>
          </div>

          {/* Posts List */}
          <div className="space-y-3.5">
            {sortedPosts.length > 0 ? (
              sortedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="p-12 text-center bg-neutral-900/30 rounded-2xl border border-white/5 text-neutral-400 space-y-3">
                <p className="text-sm">{t.noPostsFound}</p>
                <button
                  onClick={() => navigateToCreatePost()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  {t.startDiscussion}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-20 text-start">
          {/* Welcome Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900/80 to-neutral-950 border border-white/10 shadow-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-white">
                {t.welcome}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              {t.welcomeSub}
            </p>
            <button
              onClick={() => navigateToCreatePost()}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              {t.startDiscussion}
            </button>
          </div>

          {/* Top Communities Widget */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                  {t.navCommunities}
                </h4>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {communities.slice(0, 4).map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigateToCommunity(c.slug)}
                    className="flex items-center gap-2.5 text-start min-w-0 group"
                  >
                    <img
                      src={c.icon}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white group-hover:text-emerald-400 truncate transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {c.memberCount} {t.members}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigateToCommunity(c.slug)}
                    className="text-[11px] text-emerald-400 hover:underline shrink-0"
                  >
                    {t.about}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
