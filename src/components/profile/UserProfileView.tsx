import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { PostCard } from '../posts/PostCard';
import { EditProfileModal } from './EditProfileModal';
import {
  Calendar,
  Users,
  MessageSquare,
  Share2,
  Edit3,
  Flame,
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const {
    selectedUserId,
    currentUser,
    users,
    posts,
    comments,
    toggleFollowUser,
    navigateToMessages,
    navigateToFeed,
    showToast,
    editProfileModalOpen,
    setEditProfileModalOpen,
    t,
    dir,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'saved'>('posts');

  const targetUserId = selectedUserId || currentUser?.id;
  const user = users.find((u) => u.id === targetUserId) || currentUser;

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Member not found</h2>
        <button
          onClick={() => navigateToFeed()}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium"
        >
          {t.backToFeed}
        </button>
      </div>
    );
  }

  const isSelf = currentUser && currentUser.id === user.id;
  const profileColor = user.profileColor || '#10b981';
  const displayNameColor = user.displayNameColor || '#ffffff';
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const savedPosts = posts.filter((p) => p.isSaved);

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`${t.linkCopied} (@${user.username})`, 'info');
  };

  return (
    <div
      className="mx-auto min-h-screen max-w-5xl pb-16 text-start"
      style={{ backgroundColor: `${profileColor}12` }}
    >
      {/* Profile Header Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-neutral-900 overflow-hidden">
        <img
          src={user.banner}
          alt={user.displayName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        <button
          onClick={() => navigateToFeed()}
          className="absolute top-4 start-4 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer"
        >
          <BackIcon className="w-5 h-5" />
        </button>
      </div>

      <div
        className="px-4 sm:px-6 relative rounded-b-2xl border-x border-b overflow-visible"
        style={{
          // The color panel begins exactly where the cover ends. The avatar
          // may overlap visually, but the color never covers the banner.
          backgroundImage: `linear-gradient(to bottom, ${profileColor}28 0%, ${profileColor}18 28%, ${profileColor}10 62%, ${profileColor}08 100%)`,
          borderColor: `${profileColor}66`,
          boxShadow: `0 0 0 1px ${profileColor}18, 0 18px 50px ${profileColor}14`,
        }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-5 sm:pt-6">
          {/* Avatar & Identifiers */}
          <div className="flex items-end gap-4">
            <div className="relative rounded-full p-1 bg-transparent shadow-2xl">
              <Avatar
                src={user.avatar}
                alt={user.displayName}
                size="2xl"
                status={user.status}
              />
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight" style={{ color: displayNameColor }}>
                  {user.displayName}
                </h1>
                {user.badges && user.badges.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    {user.badges[0]}
                  </span>
                )}
              </div>
            <span className="text-xs sm:text-sm text-neutral-400 font-mono">
                @{user.username}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSelf ? (
              <button
                onClick={() => setEditProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border transition-colors cursor-pointer"
                style={{ backgroundColor: `${profileColor}55`, borderColor: `${profileColor}99` }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.editProfile}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => toggleFollowUser(user.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    user.isFollowing
                      ? 'bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-200 border border-white/10'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  }`}
                >
                  {user.isFollowing && <Check className="w-3.5 h-3.5" />}
                  <span>{user.isFollowing ? t.following : t.follow}</span>
                </button>

                <button
                  onClick={() => navigateToMessages(user.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t.navMessages}</span>
                </button>
              </>
            )}

            <button
              onClick={handleShareProfile}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
              title={t.share}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Quote */}
        {user.customStatus && (
          <div className="mt-4 p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-xs text-neutral-300 flex items-center gap-2 max-w-xl">
            <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
              Status:
            </span>
            <span className="italic">{user.customStatus}</span>
          </div>
        )}

        {/* Bio */}
        <p className="text-xs sm:text-sm text-neutral-300 mt-3 max-w-2xl leading-relaxed">
          {user.bio}
        </p>

        {/* Metrics Row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white font-mono">{user.karma}</span>
            <span>{t.karma}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-white font-mono">{user.followersCount}</span>
            <span>{t.followers}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span>{t.joinedDate}: {user.joinedDate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer ${
              activeTab === 'posts' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>{t.profilePosts} ({userPosts.length})</span>
            {activeTab === 'posts' && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 rounded-full" style={{ backgroundColor: profileColor }} />
            )}
          </button>

          {isSelf && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer ${
                activeTab === 'saved' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{t.profileSaved} ({savedPosts.length})</span>
              {activeTab === 'saved' && (
                <span className="absolute bottom-0 start-0 end-0 h-0.5 rounded-full" style={{ backgroundColor: profileColor }} />
              )}
            </button>
          )}
        </div>

        </div>

      {/* Tab Content stays on the normal page surface, not inside the colored profile panel */}
      <div className="px-4 sm:px-6 mt-4 space-y-3.5" style={{ backgroundColor: `${profileColor}08` }}>
          {activeTab === 'posts' && (
            <>
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {userPosts.length === 0 && (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No posts published yet.
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {savedPosts.length === 0 && (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No saved posts yet.
                </div>
              )}
            </>
          )}
      </div>

      {editProfileModalOpen && (
        <EditProfileModal onClose={() => setEditProfileModalOpen(false)} />
      )}
    </div>
  );
};
