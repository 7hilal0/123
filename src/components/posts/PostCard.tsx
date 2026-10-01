import React, { useEffect, useState } from 'react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { cloudSync } from '../../services/cloudSync';
import { Avatar } from '../common/Avatar';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  ExternalLink,
  Trash2,
  ImageOff,
  UserPlus,
  UserCheck,
  MoreVertical,
  Flag,
  X
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  isDetailedView?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isDetailedView = false }) => {
  const {
    currentUser,
    users,
    upvotePost,
    downvotePost,
    toggleSavePost,
    deletePost,
    submitReport,
    toggleFollowUser,
    navigateToPost,
    navigateToCommunity,
    navigateToProfile,
    showToast,
    setAuthModalOpen,
    comments,
    t,
  } = useApp();

  // Always resolve the latest author profile so avatar and name stay 100% in sync with the user's account
  const author =
    (currentUser && currentUser.id === post.author.id)
      ? currentUser
      : (users.find((u) => u.id === post.author.id) || post.author);

  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<'post' | 'user'>('post');
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState(post.mediaUrl || '');

  useEffect(() => {
    setResolvedMediaUrl(post.mediaUrl || '');
    if (!post.mediaDeferred) return;
    let active = true;
    const timer = window.setTimeout(() => {
      cloudSync.fetchPost(post.id).then((fullPost) => {
        if (active && fullPost?.mediaUrl) setResolvedMediaUrl(fullPost.mediaUrl);
      }).catch(() => {});
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [post.id, post.mediaUrl, post.mediaDeferred]);
  const netScore = post.upvotes - post.downvotes;
  const activeVote = currentUser ? (post.votes?.[currentUser.id] ?? null) : null;

  const postCommentsList = comments[post.id];
  const displayCommentCount =
    postCommentsList !== undefined ? postCommentsList.length : (post.commentCount || 0);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    showToast(t.linkCopied, 'info');
  };

  const handleCardClick = () => {
    if (!isDetailedView) {
      navigateToPost(post.id);
    }
  };

  const openReport = (target: 'post' | 'user') => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    setReportTarget(target);
    setReportReason('');
    setMenuOpen(false);
    setReportOpen(true);
  };

  const submitCurrentReport = async (event: React.FormEvent) => {
    event.preventDefault();
    const reason = reportReason.trim();
    if (!reason) return;
    setReportBusy(true);
    const sent = await submitReport(reportTarget, reportTarget === 'post' ? post.id : author.id, reason);
    setReportBusy(false);
    if (sent) {
      setReportOpen(false);
      setReportReason('');
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-neutral-950/80 border border-white/[0.07] hover:border-emerald-400/25 rounded-2xl transition-all duration-300 overflow-hidden text-start ${
        isDetailedView
          ? 'p-5 md:p-6 shadow-2xl shadow-black/25'
          : 'p-4 md:p-5 cursor-pointer hover:-translate-y-0.5 hover:bg-neutral-900/95 shadow-lg shadow-black/20 hover:shadow-emerald-950/20'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute end-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200"
          aria-label="خيارات المنشور"
          title="خيارات المنشور"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute end-0 top-10 w-52 rounded-xl border border-white/10 bg-neutral-900 p-1.5 shadow-2xl shadow-black/50">
            <button type="button" onClick={() => openReport('post')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs text-neutral-200 hover:bg-white/10">
              <Flag className="h-4 w-4 text-amber-400" /> الإبلاغ عن المنشور
            </button>
            <button type="button" onClick={() => openReport('user')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs text-neutral-200 hover:bg-white/10">
              <Flag className="h-4 w-4 text-rose-400" /> الإبلاغ عن صاحب الحساب
            </button>
          </div>
        )}
      </div>

      {reportOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={() => setReportOpen(false)}>
          <form onSubmit={submitCurrentReport} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{reportTarget === 'post' ? 'الإبلاغ عن المنشور' : 'الإبلاغ عن صاحب الحساب'}</h3>
                <p className="mt-1 text-xs text-neutral-400">اكتب سبب البلاغ حتى تتمكن الإدارة من مراجعته.</p>
              </div>
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white" aria-label="إغلاق"><X className="h-4 w-4" /></button>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
              minLength={3}
              maxLength={1000}
              rows={5}
              placeholder="اكتب سبب البلاغ هنا..."
              className="w-full resize-none rounded-xl border border-white/10 bg-neutral-950 p-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-emerald-400/50"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-white/10">إلغاء</button>
              <button type="submit" disabled={reportBusy || reportReason.trim().length < 3} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50">{reportBusy ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-3 md:gap-4 items-start">
        {/* Voting Column (Desktop) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:flex flex-col items-center bg-neutral-950/60 border border-white/5 rounded-xl p-1 shrink-0"
        >
          <button
            onClick={() => upvotePost(post.id)}
            className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
              activeVote === 1
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-neutral-400 hover:text-emerald-400 hover:bg-white/5'
            }`}
            title={t.upvote}
            aria-label={t.upvote}
          >
            <ArrowBigUp className={`w-5 h-5 ${activeVote === 1 ? 'fill-current' : ''}`} />
          </button>
          <span
            className={`text-xs font-mono font-bold my-0.5 tabular-nums ${
              activeVote === 1
                ? 'text-emerald-400'
                : activeVote === -1
                ? 'text-rose-400'
                : 'text-neutral-300'
            }`}
          >
            {netScore}
          </span>

          <button
            onClick={() => downvotePost(post.id)}
            className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
              activeVote === -1
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-neutral-400 hover:text-rose-400 hover:bg-white/5'
            }`}
            title={t.downvote}
            aria-label={t.downvote}
          >
            <ArrowBigDown className={`w-5 h-5 ${activeVote === -1 ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          {/* Metadata Header: Author Avatar, Display Name, Username & Community */}
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-neutral-400 mb-3">
            {/* Author Info */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToProfile(author.id);
              }}
              className="flex items-center gap-2 group/author focus:outline-none"
            >
              <Avatar
                src={author.avatar}
                alt={author.displayName}
                size="xs"
                status={author.status}
              />
              <div className="flex items-center gap-1.5 text-start">
                <span className="font-semibold text-neutral-100 group-hover/author:text-emerald-400 transition-colors">
                  {author.displayName}
                </span>
                <span className="font-mono text-neutral-400 text-[11px]">
                  @{author.username}
                </span>
              </div>
            </button>

            {currentUser && author.id !== currentUser.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowUser(author.id);
                }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  author.isFollowing
                    ? 'border-white/10 bg-white/5 text-neutral-300 hover:border-rose-400/30 hover:text-rose-300'
                    : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
                title={author.isFollowing ? t.following : t.follow}
              >
                {author.isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                <span>{author.isFollowing ? t.following : t.follow}</span>
              </button>
            )}

            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-[11px] text-neutral-400">{post.createdAt}</span>

            {post.isPinned && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-amber-400 font-medium text-[11px]">{t.pinned}</span>
              </>
            )}
          </div>

          {/* Title */}
          {post.title?.trim() && (
            <h2
              className={`font-display text-white mb-2 ${
                isDetailedView ? 'text-xl md:text-2xl font-bold' : 'text-base md:text-lg'
              }`}
              style={{ textWrap: 'balance' }}
            >
              {post.title}
            </h2>
          )}

          {/* Content Text */}
          {post.content && (
            <p
              className={`text-neutral-300 text-sm leading-relaxed mb-3 ${
                isDetailedView ? 'whitespace-pre-line' : 'line-clamp-3'
              }`}
            >
              {post.content}
            </p>
          )}

          {/* Media Render */}
          {resolvedMediaUrl && post.mediaType === 'image' && (
            <div className="relative rounded-xl overflow-hidden bg-neutral-950 my-3 max-h-[500px] border border-white/5 flex items-center justify-center">
              {!imageError ? (
                <img
                  src={resolvedMediaUrl}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover max-h-[480px]"
                />
              ) : (
                <div className="w-full h-48 bg-neutral-900 flex flex-col items-center justify-center text-neutral-500 gap-2">
                  <ImageOff className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Image unavailable</span>
                </div>
              )}
            </div>
          )}

          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-3 py-2 my-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-white/10 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="truncate max-w-xs">{post.linkUrl}</span>
            </a>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono text-emerald-400/80 hover:text-emerald-300 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Card Footer Actions */}
          <div
            onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between pt-3 mt-4 border-t border-white/[0.07] text-xs text-neutral-400"
          >
            {/* Mobile Vote Buttons */}
            <div className="flex sm:hidden items-center bg-neutral-950/80 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => upvotePost(post.id)}
                className={`p-1.5 rounded min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  activeVote === 1 ? 'text-emerald-500' : 'text-neutral-400'
                }`}
              >
                <ArrowBigUp className={`w-4 h-4 ${activeVote === 1 ? 'fill-current' : ''}`} />
              </button>
              <span className="text-xs font-mono font-bold px-1 tabular-nums">{netScore}</span>
              <button
                onClick={() => downvotePost(post.id)}
                className={`p-1.5 rounded min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  activeVote === -1 ? 'text-rose-400' : 'text-neutral-400'
                }`}
              >
                <ArrowBigDown className={`w-4 h-4 ${activeVote === -1 ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Comments Counter */}
            <button
              onClick={() => navigateToPost(post.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{displayCommentCount} {t.commentsCount}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-neutral-200 transition-colors cursor-pointer"
              title={t.share}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.share}</span>
            </button>

            {/* Save */}
            <button
              onClick={() => toggleSavePost(post.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                post.isSaved ? 'text-amber-400 font-semibold' : 'hover:text-neutral-200'
              }`}
              title={t.savePost}
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{post.isSaved ? t.saved : t.savePost}</span>
            </button>

            {/* Author Delete Action */}
            {currentUser && currentUser.id === post.author.id && (
              <button
                onClick={() => deletePost(post.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-neutral-500 cursor-pointer"
                title={t.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
