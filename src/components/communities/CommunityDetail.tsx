import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../posts/PostCard';
import { Avatar } from '../common/Avatar';
import {
  Users,
  Plus,
  Shield,
  ArrowRight,
  ArrowLeft,
  Flame,
  Sparkles,
  TrendingUp,
  Info
} from 'lucide-react';
import { FeedSortOption } from '../../types';

export const CommunityDetail: React.FC = () => {
  const {
    selectedCommunitySlug,
    communities,
    posts,
    joinCommunity,
    leaveCommunity,
    navigateToFeed,
    navigateToCreatePost,
    navigateToProfile,
    t,
    dir,
  } = useApp();

  const [sortOption, setSortOption] = useState<FeedSortOption>('hot');

  const community = communities.find((c) => c.slug === selectedCommunitySlug);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!community) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Community not found</h2>
        <button
          onClick={() => navigateToFeed()}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium cursor-pointer"
        >
          {t.backToFeed}
        </button>
      </div>
    );
  }

  // Filter posts for this community
  const communityPosts = posts.filter((p) => p.communitySlug === community.slug);

  // Sort
  const sortedPosts = [...communityPosts].sort((a, b) => {
    if (sortOption === 'new') return b.id.localeCompare(a.id);
    if (sortOption === 'top') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    return (b.upvotes * 1.5 + b.commentCount * 2) - (a.upvotes * 1.5 + a.commentCount * 2);
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 text-start">
      {/* Header Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-neutral-900 overflow-hidden">
        <img
          src={community.banner}
          alt={community.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        {/* Back Link */}
        <button
          onClick={() => navigateToFeed()}
          className="absolute top-4 start-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white hover:bg-black/80 transition-colors cursor-pointer"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{t.backToFeed}</span>
        </button>
      </div>

      {/* Community Identity Bar */}
      <div className="px-4 md:px-6 relative -mt-12 sm:-mt-16 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-neutral-950 bg-neutral-900 shrink-0 shadow-2xl">
              <img
                src={community.icon}
                alt={community.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
                {community.name}
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-mono mt-0.5">
                <span className="text-emerald-400 font-semibold">{community.slug}</span>
                <span aria-hidden="true">·</span>
                <span>{community.category}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                community.isMember
                  ? leaveCommunity(community.slug)
                  : joinCommunity(community.slug)
              }
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                community.isMember
                  ? 'bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-300 border border-white/10'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {community.isMember ? t.joined : `+ ${t.join}`}
            </button>

            <button
              onClick={() => navigateToCreatePost(community.slug)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.navCreate}</span>
            </button>
          </div>
        </div>

        {/* Member & Presence Metrics */}
        <div className="flex items-center gap-4 text-xs text-neutral-400 mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-semibold text-white font-mono">
              {community.memberCount.toLocaleString()}
            </span>
            <span>{t.members}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Posts Stream */}
        <div className="lg:col-span-8 space-y-4">
          {/* Feed Filter Segmented */}
          <div className="flex items-center justify-between bg-neutral-900/60 border border-white/5 rounded-2xl p-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortOption('hot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sortOption === 'hot'
                    ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.feedHot}</span>
              </button>

              <button
                onClick={() => setSortOption('new')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sortOption === 'new'
                    ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.feedNew}</span>
              </button>

              <button
                onClick={() => setSortOption('top')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  sortOption === 'top'
                    ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.feedTop}</span>
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-3.5">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {sortedPosts.length === 0 && (
              <div className="p-12 text-center bg-neutral-900/30 rounded-2xl border border-white/5 text-neutral-400 space-y-3">
                <p className="text-sm">{t.noPostsFound}</p>
                <button
                  onClick={() => navigateToCreatePost(community.slug)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {t.startDiscussion}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-5 sticky top-20">
          {/* About Community Card */}
          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>{t.about}</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {community.description}
            </p>
          </div>

          {/* Rules */}
          {community.rules && community.rules.length > 0 && (
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{t.rules}</span>
              </h3>
              <ol className="divide-y divide-white/5 text-xs">
                {community.rules.map((rule, idx) => (
                  <li key={rule.id} className="py-2.5 space-y-1">
                    <span className="font-semibold text-neutral-200 block">
                      {idx + 1}. {rule.title}
                    </span>
                    <span className="text-neutral-400 block text-[11px] leading-relaxed">
                      {rule.description}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
