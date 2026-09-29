import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../posts/PostCard';
import { Avatar } from '../common/Avatar';
import { Post, Comment, FeedSortOption } from '../../types';
import {
  Flame,
  Clock,
  TrendingUp,
  Users,
  ShieldCheck,
  Hash,
  Sparkles,
  UserPlus,
  LogIn
} from 'lucide-react';

export const FeedView: React.FC = () => {
  const {
    posts,
    comments,
    users,
    currentUser,
    feedSort,
    setFeedSort,
    navigateToCreatePost,
    navigateToSearch,
    navigateToProfile,
    toggleFollowUser,
    setAuthModalOpen,
    t,
  } = useApp();

  // Helper to extract timestamp from post
  const getPostTime = (p: Post): number => {
    if (p.timestamp) return p.timestamp;
    const match = p.id.match(/\d{10,}/);
    if (match) return parseInt(match[0], 10);
    return 0;
  };

  // Helper to flatten comments and nested replies
  const flattenComments = (list: Comment[]): Comment[] => {
    let result: Comment[] = [];
    for (const c of list) {
      result.push(c);
      if (c.replies && c.replies.length > 0) {
        result = result.concat(flattenComments(c.replies));
      }
    }
    return result;
  };

  // Helper to extract comment timestamp
  const getCommentTime = (c: Comment, fallbackPostTime: number): number => {
    if (c.timestamp) return c.timestamp;
    const cm = c.id.match(/\d{10,}/);
    if (cm) return parseInt(cm[0], 10);
    return fallbackPostTime;
  };

  // 1. Calculate 'hot' (الرائج) score based on: high interaction + recent comments
  const calculateHotScore = (post: Post, now: number): number => {
    const postTime = getPostTime(post) || (now - 86400000);
    const likes = Math.max(0, post.upvotes);
    const netLikes = Math.max(0, post.upvotes - post.downvotes);
    const commentCount = Math.max(0, post.commentCount);

    // Base interaction weight
    const baseInteractionScore = (likes * 3) + (netLikes * 2) + (commentCount * 6);

    // Boost for recently written comments
    const postComments = comments[post.id] || [];
    const allComments = flattenComments(postComments);

    let recentCommentsBonus = 0;
    for (const c of allComments) {
      const cTime = getCommentTime(c, postTime);
      const ageMinutes = Math.max(1, (now - cTime) / (1000 * 60));

      // Newly added comments (< 30m, < 2h, < 6h, < 24h) give significant boosts
      if (ageMinutes < 30) {
        recentCommentsBonus += 80;
      } else if (ageMinutes < 120) {
        recentCommentsBonus += 45;
      } else if (ageMinutes < 360) {
        recentCommentsBonus += 25;
      } else if (ageMinutes < 1440) {
        recentCommentsBonus += 10;
      } else {
        recentCommentsBonus += 2;
      }
    }

    // Additional boost if post was commented on recently
    if (post.lastCommentTimestamp) {
      const lastCommentAgeMinutes = Math.max(1, (now - post.lastCommentTimestamp) / (1000 * 60));
      if (lastCommentAgeMinutes < 60) {
        recentCommentsBonus += 50;
      }
    }

    // Gradual time decay so posts without continuous new activity naturally cool off
    const postAgeHours = Math.max(0.1, (now - postTime) / (1000 * 60 * 60));
    const timeDecay = Math.pow(postAgeHours + 2, 0.85);

    return (baseInteractionScore + recentCommentsBonus) / timeDecay;
  };

  // Followed user set
  const followedUserIds = useMemo(() => {
    return new Set(users.filter((u) => u.isFollowing).map((u) => u.id));
  }, [users]);

  const isFollowingAuthor = (authorId: string, authorIsFollowing?: boolean): boolean => {
    return followedUserIds.has(authorId) || Boolean(authorIsFollowing);
  };

  // Compute sorted & filtered posts based on chosen feedSort
  const displayPosts = useMemo(() => {
    const now = Date.now();

    // 4. فلورز (من أتابعهم): تظهر فقط منشورات الأشخاص الذين تتابعهم
    if (feedSort === 'following') {
      const followingPosts = posts.filter((p) =>
        isFollowingAuthor(p.author.id, p.author.isFollowing)
      );
      // Sort newest first
      return followingPosts.sort((a, b) => getPostTime(b) - getPostTime(a));
    }

    // 2. الجديد: منشورات حديثة التي نشرت حسب الوقت (الأحدث أولاً)
    if (feedSort === 'new') {
      return [...posts].sort((a, b) => getPostTime(b) - getPostTime(a));
    }

    // 3. الأفضل: أعلى لايكات (إعجابات)
    if (feedSort === 'top') {
      return [...posts].sort((a, b) => {
        if (b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }
        return getPostTime(b) - getPostTime(a);
      });
    }

    // 1. الرائج (الافتراضي): منشورات فيها تفاعل كبير وتعليقات كتبت من وقت قليل
    return [...posts].sort((a, b) => {
      const scoreA = calculateHotScore(a, now);
      const scoreB = calculateHotScore(b, now);
      return scoreB - scoreA;
    });
  }, [posts, comments, feedSort, followedUserIds]);

  const sortTabs: {
    id: FeedSortOption;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'hot',
      label: t.feedHot,
      description: 'تفاعل عالي وتعليقات حديثة',
      icon: <Flame className="w-4 h-4" />,
    },
    {
      id: 'new',
      label: t.feedNew,
      description: 'الأحدث نشراً حسب الوقت',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'top',
      label: t.feedTop,
      description: 'الأعلى إعجاباً (لايكات)',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'following',
      label: t.feedFollowing,
      description: 'منشورات من تتابعهم فقط',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  // Popular Trending Tags across posts
  const popularTags = [
    'برمجة',
    'الجزائر',
    'تقنية',
    'تطوير',
    'عمل_حر',
    'ذكاء_اصطناعي',
    'تصميم',
    'نقاش',
  ];

  // Suggested users to follow if following feed is empty
  const suggestedUsers = users
    .filter((u) => u.id !== currentUser?.id && !isFollowingAuthor(u.id, u.isFollowing))
    .slice(0, 3);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 md:py-8 text-start">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Feed Column */}
        <div className="xl:col-span-8 space-y-5 min-w-0 w-full">
          {/* Feed Filter Bar (Segmented Controls) */}
          <div className="bg-neutral-900/75 border border-white/[0.08] rounded-2xl p-1.5 backdrop-blur-xl shadow-lg shadow-black/10">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
              {sortTabs.map((tab) => {
                const isActive = feedSort === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFeedSort(tab.id)}
                    title={tab.description}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/12 text-white shadow-sm ring-1 ring-emerald-400/20'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-emerald-400' : ''}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-3.5">
            {displayPosts.length > 0 ? (
              displayPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : feedSort === 'following' ? (
              /* Dedicated Empty State for Following Tab */
              <div className="p-8 md:p-10 text-center bg-neutral-900/40 rounded-2xl border border-white/5 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-display font-bold text-sm md:text-base text-white">
                    {t.followingEmptyTitle}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {currentUser
                      ? t.followingEmptyDesc
                      : 'سجّل الدخول لتتمكن من متابعة الأعضاء وعرض أحدث منشوراتهم في هذه الخلاصة.'}
                  </p>
                </div>

                {!currentUser ? (
                  <button
                    onClick={() => setAuthModalOpen(true, 'login')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول / إنشاء حساب</span>
                  </button>
                ) : suggestedUsers.length > 0 ? (
                  <div className="pt-2 max-w-sm mx-auto space-y-2">
                    <p className="text-[11px] font-semibold text-neutral-400 text-start uppercase tracking-wider">
                      أعضاء مقترحون للمتابعة:
                    </p>
                    <div className="space-y-2">
                      {suggestedUsers.map((su) => (
                        <div
                          key={su.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-white/5"
                        >
                          <div
                            onClick={() => navigateToProfile(su.id)}
                            className="flex items-center gap-2.5 cursor-pointer text-start min-w-0"
                          >
                            <Avatar src={su.avatar} alt={su.displayName} size="sm" status={su.status} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate hover:text-emerald-400">
                                {su.displayName}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-mono truncate">
                                @{su.username}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleFollowUser(su.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0 cursor-pointer shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>متابعة</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => navigateToSearch()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t.explorePeople}</span>
                  </button>
                )}
              </div>
            ) : (
              /* General Empty State */
              <div className="p-12 text-center bg-gradient-to-br from-neutral-900/70 to-neutral-950/60 rounded-2xl border border-white/[0.08] text-neutral-400 space-y-3 shadow-lg shadow-black/10">
                <p className="text-sm">{t.noPostsFound}</p>
                <button
                  onClick={() => navigateToCreatePost()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {t.startDiscussion}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Desktop) */}
        <div className="hidden xl:block xl:col-span-4 space-y-5 sticky top-20 text-start min-w-0">
          {/* Welcome Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/75 to-neutral-950 border border-white/[0.08] shadow-xl shadow-black/20">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-white">
                {t.welcome}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              ساحة المنشورات الموحدة لمنصة DZCORE. شارك أفكارك، وناقش وتواصل بحرية مع الجميع.
            </p>
            <button
              onClick={() => navigateToCreatePost()}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              {t.startDiscussion}
            </button>
          </div>

          {/* Trending Topics / Tags */}
          <div className="p-5 rounded-2xl bg-neutral-900/75 border border-white/[0.08] space-y-3.5 shadow-lg shadow-black/10">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                الوسوم الشائعة
              </h4>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigateToSearch(tag)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span className="text-emerald-400">#</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Community Guidelines Widget */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 space-y-3 text-xs text-neutral-400">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ميثاق وقواعد النشر</span>
            </div>
            <ul className="space-y-2 text-[11px] leading-relaxed list-disc list-inside text-neutral-400">
              <li>الاحترام المتبادل ونقاش الأفكار برقي.</li>
              <li>مشاركة محتوى أصيل ومفيد لجميع الأعضاء.</li>
              <li>الابتعاد عن الترويج العشوائي والسبام.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
