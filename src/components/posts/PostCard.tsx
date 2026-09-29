import React, { useState } from 'react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  ExternalLink,
  Trash2,
  ImageOff
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  isDetailedView?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isDetailedView = false }) => {
  const {
    currentUser,
    upvotePost,
    downvotePost,
    toggleSavePost,
    deletePost,
    navigateToPost,
    navigateToCommunity,
    navigateToProfile,
    showToast,
    t,
  } = useApp();

  const [imageError, setImageError] = useState(false);

  const netScore = post.upvotes - post.downvotes;

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

  return (
    <article
      onClick={handleCardClick}
      className={`group bg-neutral-900/60 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-200 overflow-hidden text-start ${
        isDetailedView ? 'p-5 md:p-6' : 'p-4 md:p-5 cursor-pointer hover:bg-neutral-900/80 shadow-lg shadow-black/20'
      }`}
    >
      <div className="flex gap-3 md:gap-4 items-start">
        {/* Voting Column (Desktop) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:flex flex-col items-center bg-neutral-950/60 border border-white/5 rounded-xl p-1 shrink-0"
        >
          <button
            onClick={() => upvotePost(post.id)}
            className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
              post.userVote === 1
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-neutral-400 hover:text-emerald-400 hover:bg-white/5'
            }`}
            title={t.upvote}
            aria-label={t.upvote}
          >
            <ArrowBigUp className={`w-5 h-5 ${post.userVote === 1 ? 'fill-current' : ''}`} />
          </button>

          <span
            className={`text-xs font-mono font-bold my-0.5 tabular-nums ${
              post.userVote === 1
                ? 'text-emerald-400'
                : post.userVote === -1
                ? 'text-rose-400'
                : 'text-neutral-300'
            }`}
          >
            {netScore}
          </span>

          <button
            onClick={() => downvotePost(post.id)}
            className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer ${
              post.userVote === -1
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-neutral-400 hover:text-rose-400 hover:bg-white/5'
            }`}
            title={t.downvote}
            aria-label={t.downvote}
          >
            <ArrowBigDown className={`w-5 h-5 ${post.userVote === -1 ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          {/* Metadata Header */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-400 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToCommunity(post.communitySlug);
              }}
              className="flex items-center gap-1.5 font-semibold text-neutral-200 hover:text-emerald-400 transition-colors"
            >
              <img
                src={post.communityIcon}
                alt={post.communityName}
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>{post.communityName}</span>
              <span className="text-neutral-500 font-mono text-[11px]">({post.communitySlug})</span>
            </button>

            <span aria-hidden="true" className="text-neutral-600">·</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToProfile(post.author.id);
              }}
              className="hover:text-neutral-200 transition-colors font-mono"
            >
              @{post.author.username}
            </button>

            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{post.createdAt}</span>

            {post.isPinned && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-amber-400 font-medium">{t.pinned}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h2
            className={`font-semibold text-neutral-100 group-hover:text-white transition-colors leading-snug tracking-tight mb-2 ${
              isDetailedView ? 'text-xl md:text-2xl font-bold' : 'text-base md:text-lg'
            }`}
            style={{ textWrap: 'balance' }}
          >
            {post.title}
          </h2>

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
          {post.mediaUrl && post.mediaType === 'image' && (
            <div className="relative rounded-xl overflow-hidden bg-neutral-950 my-3 max-h-[500px] border border-white/5 flex items-center justify-center">
              {!imageError ? (
                <img
                  src={post.mediaUrl}
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
            className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-neutral-400"
          >
            {/* Mobile Vote Buttons */}
            <div className="flex sm:hidden items-center bg-neutral-950/80 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => upvotePost(post.id)}
                className={`p-1.5 rounded min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  post.userVote === 1 ? 'text-emerald-500' : 'text-neutral-400'
                }`}
              >
                <ArrowBigUp className={`w-4 h-4 ${post.userVote === 1 ? 'fill-current' : ''}`} />
              </button>
              <span className="text-xs font-mono font-bold px-1 tabular-nums">
                {netScore}
              </span>
              <button
                onClick={() => downvotePost(post.id)}
                className={`p-1.5 rounded min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  post.userVote === -1 ? 'text-rose-400' : 'text-neutral-400'
                }`}
              >
                <ArrowBigDown className={`w-4 h-4 ${post.userVote === -1 ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Comments Counter */}
            <button
              onClick={() => navigateToPost(post.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount} {t.commentsCount}</span>
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
