import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../posts/PostCard';
import { Avatar } from '../common/Avatar';
import {
  Search,
  Users,
  Compass,
  FileText,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    posts,
    communities,
    users,
    navigateToCommunity,
    navigateToProfile,
    navigateToFeed,
    joinCommunity,
    leaveCommunity,
    t,
    dir,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'communities' | 'people'>('all');
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const query = searchQuery.toLowerCase().trim();

  const matchedPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query)) ||
      p.communitySlug.toLowerCase().includes(query) ||
      p.communityName.toLowerCase().includes(query)
  );

  const matchedCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
  );

  const matchedUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.bio.toLowerCase().includes(query)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 text-start">
      {/* Header and Search input */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToFeed()}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
              Search {t.appName}
            </h1>
            <p className="text-xs text-neutral-400">
              Find topics, community spaces, or people.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-neutral-400 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-12 ps-12 pe-10 rounded-2xl bg-neutral-900 border border-white/10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-lg shadow-black/20 text-start"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Results
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Posts ({matchedPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('communities')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{t.navCommunities} ({matchedCommunities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'people'
              ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members ({matchedUsers.length})</span>
        </button>
      </div>

      {/* Results Feed */}
      <div className="space-y-6">
        {/* Posts */}
        {(activeTab === 'all' || activeTab === 'posts') && matchedPosts.length > 0 && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Discussions ({matchedPosts.length})
              </h2>
            )}
            <div className="space-y-3">
              {matchedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Communities */}
        {(activeTab === 'all' || activeTab === 'communities') && matchedCommunities.length > 0 && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t.navCommunities} ({matchedCommunities.length})
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchedCommunities.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3 text-start"
                >
                  <div
                    onClick={() => navigateToCommunity(c.slug)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <img
                      src={c.icon}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white hover:text-emerald-400 truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {c.memberCount} {t.members}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      c.isMember ? leaveCommunity(c.slug) : joinCommunity(c.slug)
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      c.isMember
                        ? 'bg-white/5 text-neutral-300 hover:text-rose-400'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {c.isMember ? t.joined : t.join}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People */}
        {(activeTab === 'all' || activeTab === 'people') && matchedUsers.length > 0 && (
          <div className="space-y-3">
            {activeTab === 'all' && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Members ({matchedUsers.length})
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchedUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigateToProfile(u.id)}
                  className="p-3 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-neutral-900 text-start"
                >
                  <Avatar src={u.avatar} alt={u.displayName} size="md" status={u.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      {u.displayName}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono truncate">
                      @{u.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedPosts.length === 0 &&
          matchedCommunities.length === 0 &&
          matchedUsers.length === 0 && (
            <div className="p-12 text-center text-xs text-neutral-500">
              No results found for "{searchQuery}". Try different keywords.
            </div>
          )}
      </div>
    </div>
  );
};
