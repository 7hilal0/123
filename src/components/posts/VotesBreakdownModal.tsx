import React from 'react';
import { Post, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { X, ThumbsUp, ThumbsDown, BarChart2, Users } from 'lucide-react';

interface VotesBreakdownModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const VotesBreakdownModal: React.FC<VotesBreakdownModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { users, currentUser, language, navigateToProfile } = useApp();

  if (!isOpen) return null;

  const votesRecord = post.votes || {};
  const upvoterIds = Object.keys(votesRecord).filter((uid) => votesRecord[uid] === 1);
  const downvoterIds = Object.keys(votesRecord).filter((uid) => votesRecord[uid] === -1);

  const totalVotes = post.upvotes + post.downvotes;
  const upvotePercent = totalVotes > 0 ? Math.round((post.upvotes / totalVotes) * 100) : 0;
  const downvotePercent = totalVotes > 0 ? Math.round((post.downvotes / totalVotes) * 100) : 0;
  const netScore = post.upvotes - post.downvotes;

  const getUserById = (uid: string): User => {
    if (currentUser && currentUser.id === uid) return currentUser;
    const found = users.find((u) => u.id === uid);
    if (found) return found;
    return {
      id: uid,
      username: uid.substring(0, 10),
      displayName: language === 'ar' ? 'مستخدم' : 'User',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      banner: '',
      bio: '',
      status: 'offline',
      badges: [],
      karma: 0,
      joinedDate: '2026',
      followersCount: 0,
      followingCount: 0,
    };
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 text-start"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                {language === 'ar' ? 'إحصائيات التفاعل والتقييم' : 'Votes & Reactions Breakdown'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {language === 'ar'
                  ? 'تفاصيل عدد الإعجابات وعدم الإعجاب'
                  : 'Detailed breakdown of likes and dislikes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Counters Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Likes Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1">
                <ThumbsUp className="w-4 h-4 fill-emerald-400/20" />
                <span>{language === 'ar' ? 'إعجاب (Likes)' : 'Likes'}</span>
              </div>
              <span className="text-2xl font-display font-extrabold text-emerald-400 tabular-nums">
                {post.upvotes}
              </span>
              <span className="text-[10px] text-emerald-400/80 mt-0.5">
                {language === 'ar' ? `${upvotePercent}% من التقييمات` : `${upvotePercent}% of votes`}
              </span>
            </div>

            {/* Dislikes Card */}
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs mb-1">
                <ThumbsDown className="w-4 h-4 fill-rose-400/20" />
                <span>{language === 'ar' ? 'ديسلايك (Dislikes)' : 'Dislikes'}</span>
              </div>
              <span className="text-2xl font-display font-extrabold text-rose-400 tabular-nums">
                {post.downvotes}
              </span>
              <span className="text-[10px] text-rose-400/80 mt-0.5">
                {language === 'ar' ? `${downvotePercent}% من التقييمات` : `${downvotePercent}% of votes`}
              </span>
            </div>
          </div>

          {/* Visual Ratio Progress Bar */}
          {totalVotes > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                <span className="text-emerald-400 font-bold">{post.upvotes} 👍</span>
                <span className="text-neutral-400">
                  {language === 'ar' ? 'الصافي:' : 'Net:'}{' '}
                  <strong className={netScore > 0 ? 'text-emerald-400' : netScore < 0 ? 'text-rose-400' : 'text-neutral-200'}>
                    {netScore > 0 ? `+${netScore}` : netScore}
                  </strong>
                </span>
                <span className="text-rose-400 font-bold">{post.downvotes} 👎</span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${upvotePercent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                />
                <div
                  style={{ width: `${downvotePercent}%` }}
                  className="bg-rose-500 h-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Voters Lists */}
          {totalVotes === 0 ? (
            <div className="py-8 text-center text-neutral-500 space-y-1 bg-neutral-950/40 rounded-2xl border border-white/5 p-4">
              <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-neutral-400">
                {language === 'ar'
                  ? 'لم يقم أحد بوضع إعجاب أو ديسلايك حتى الآن'
                  : 'No one has liked or disliked this post yet'}
              </p>
              <p className="text-[11px] text-neutral-500">
                {language === 'ar'
                  ? 'الإحصائيات الحالية: 0 إعجاب و 0 ديسلايك'
                  : 'Current count: 0 likes and 0 dislikes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Upvoters */}
              {upvoterIds.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>
                      {language === 'ar'
                        ? `الذين وضعوا إعجاب (${upvoterIds.length}):`
                        : `Liked by (${upvoterIds.length}):`}
                    </span>
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {upvoterIds.map((uid) => {
                      const user = getUserById(uid);
                      return (
                        <div
                          key={uid}
                          onClick={() => {
                            onClose();
                            navigateToProfile(user.id);
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 hover:bg-white/5 border border-white/5 cursor-pointer transition-colors"
                        >
                          <Avatar src={user.avatar} alt={user.displayName} size="xs" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-200 block truncate">
                              {user.displayName}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono block -mt-0.5 truncate">
                              @{user.username}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            +1
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Downvoters */}
              {downvoterIds.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3" />
                    <span>
                      {language === 'ar'
                        ? `الذين وضعوا ديسلايك (${downvoterIds.length}):`
                        : `Disliked by (${downvoterIds.length}):`}
                    </span>
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {downvoterIds.map((uid) => {
                      const user = getUserById(uid);
                      return (
                        <div
                          key={uid}
                          onClick={() => {
                            onClose();
                            navigateToProfile(user.id);
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 hover:bg-white/5 border border-white/5 cursor-pointer transition-colors"
                        >
                          <Avatar src={user.avatar} alt={user.displayName} size="xs" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-200 block truncate">
                              {user.displayName}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono block -mt-0.5 truncate">
                              @{user.username}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            -1
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-neutral-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
