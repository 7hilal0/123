import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cloudSync } from '../../services/cloudSync';
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
  ArrowRight,
  X,
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
    navigateToProfile,
    showToast,
    editProfileModalOpen,
    setEditProfileModalOpen,
    t,
    dir,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'saved'>('posts');
  const [loadedMedia, setLoadedMedia] = useState<{ userId: string; avatar?: string; banner?: string } | null>(null);
  const [followListOpen, setFollowListOpen] = useState<'followers' | 'following' | null>(null);
  const [followMembers, setFollowMembers] = useState<import('../../types').User[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  const targetUserId = selectedUserId || currentUser?.id;
  const user = users.find((u) => u.id === targetUserId) || currentUser;

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    cloudSync.fetchUserMedia(user.id).then((media) => {
      if (active && (Object.prototype.hasOwnProperty.call(media, 'avatar') || Object.prototype.hasOwnProperty.call(media, 'banner'))) {
        setLoadedMedia({ userId: user.id, avatar: media.avatar, banner: media.banner });
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  const displayUser = user && loadedMedia?.userId === user.id ? { ...user, ...loadedMedia } : user;

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!displayUser) {
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

  const isSelf = currentUser && currentUser.id === displayUser.id;
  const profileColor = displayUser.profileColor || '#10b981';
  const displayNameColor = displayUser.displayNameColor || '#ffffff';
  // Use the stored YYYY-MM-DD portion directly so timezone conversion cannot change the day.
  const formattedJoinedDate = String(displayUser.joinedDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/)?.slice(1).join('/') || String(displayUser.joinedDate || '');
  const userPosts = posts.filter((p) => p.author.id === displayUser.id);
  const savedPosts = posts.filter((p) => p.isSaved);

  useEffect(() => {
    if (!followListOpen || !displayUser?.id) return;
    let active = true;
    setFollowLoading(true);
    cloudSync.fetchFollowMembers(displayUser.id, followListOpen)
      .then((members) => { if (active) setFollowMembers(members); })
      .catch(() => { if (active) setFollowMembers([]); })
      .finally(() => { if (active) setFollowLoading(false); });
    return () => { active = false; };
  }, [followListOpen, displayUser?.id]);

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`${t.linkCopied} (@${displayUser.username})`, 'info');
  };

  return (
    <div
      className="mx-auto min-h-screen max-w-5xl pb-16 text-start"
      style={{ backgroundColor: `${profileColor}12` }}
    >
      {/* Profile Header Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-neutral-900 overflow-hidden">
        {displayUser.banner ? (
          <>
            <img
              src={displayUser.banner}
              alt={displayUser.displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-[#3f424a]"
            aria-label="No profile banner"
          />
        )}

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
            <div className="relative rounded-full bg-transparent p-1 shadow-2xl">
              <Avatar
                src={displayUser.avatar}
                alt={displayUser.displayName}
                size="2xl"
                status={displayUser.status}
              />
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight" style={{ color: displayNameColor }}>
                  {displayUser.displayName}
                </h1>
                {displayUser.badges && displayUser.badges.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    {displayUser.badges[0]}
                  </span>
                )}
              </div>
            <span className="text-xs sm:text-sm text-neutral-400 font-mono">
                @{displayUser.username}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSelf ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border transition-colors cursor-pointer"
                  style={{ backgroundColor: `${profileColor}55`, borderColor: `${profileColor}99` }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editProfile}</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => toggleFollowUser(displayUser.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    displayUser.isFollowing
                      ? 'bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-200 border border-white/10'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  }`}
                >
                  {displayUser.isFollowing && <Check className="w-3.5 h-3.5" />}
                  <span>{displayUser.isFollowing ? t.following : t.follow}</span>
                </button>

                <button
                  onClick={() => navigateToMessages(displayUser.id)}
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
        {displayUser.customStatus && (
          <div className="mt-4 p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-xs text-neutral-300 flex items-center gap-2 max-w-xl">
            <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-wider">
              Status:
            </span>
            <span className="italic">{displayUser.customStatus}</span>
          </div>
        )}

        {/* Bio */}
        <p className="text-xs sm:text-sm text-neutral-300 mt-3 max-w-2xl leading-relaxed">
          {displayUser.bio}
        </p>

        {/* Metrics Row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white font-mono">{displayUser.karma}</span>
            <span>{t.karma}</span>
          </div>

          <button
            type="button"
            onClick={() => setFollowListOpen('followers')}
            className="flex items-center gap-1.5 text-start hover:text-white transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-white font-mono">{displayUser.followersCount}</span>
            <span>{t.followers}</span>
          </button>

          <button
            type="button"
            onClick={() => setFollowListOpen('following')}
            className="flex items-center gap-1.5 text-start hover:text-white transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-neutral-500" />
            <span className="font-semibold text-white font-mono">{displayUser.followingCount}</span>
            <span>{t.following}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span>{t.joinedDate}</span>
            <span className="font-semibold text-neutral-200">{formattedJoinedDate}</span>
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

      {followListOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setFollowListOpen(null)}
        >
          <div
            className="w-full max-w-md max-h-[75vh] overflow-hidden rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">
                {followListOpen === 'followers' ? t.followers : t.following}
              </h2>
              <button
                type="button"
                onClick={() => setFollowListOpen(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-3 space-y-2">
              {followLoading ? (
                <div className="py-10 text-center text-sm text-neutral-500">Loading...</div>
              ) : followMembers.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  {followListOpen === 'followers' ? t.followers : t.following}: 0
                </div>
              ) : (
                followMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setFollowListOpen(null);
                      navigateToProfile(member.id);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-start transition-colors"
                  >
                    <Avatar src={member.avatar} alt={member.displayName} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{member.displayName}</span>
                      <span className="block text-xs text-neutral-500 truncate">@{member.username}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editProfileModalOpen && (
        <EditProfileModal onClose={() => setEditProfileModalOpen(false)} />
      )}

    </div>
  );
};
