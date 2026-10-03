import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { Avatar } from '../common/Avatar';
import { Comment } from '../../types';
import { formatRelativeTime } from '../../utils/relativeTime';
import {
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  ArrowBigUp,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, depth = 0 }) => {
  const { upvoteComment, addComment, deleteComment, navigateToProfile, currentUser, users, setAuthModalOpen, t, language } = useApp();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const author =
    (currentUser && currentUser.id === comment.author.id)
      ? currentUser
      : (users.find((u) => u.id === comment.author.id) || comment.author);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!replyContent.trim()) return;

    addComment(postId, replyContent.trim(), comment.id);
    setReplyContent('');
    setReplyOpen(false);
  };

  return (
    <div className={`relative ${depth > 0 ? 'ms-3 sm:ms-6 ps-3 border-s border-white/5' : ''} my-3 text-start`}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => navigateToProfile(author.id)}
          className="focus:outline-none shrink-0"
        >
          <Avatar
            src={author.avatar}
            alt={author.displayName}
            size="xs"
            status={author.status}
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              onClick={() => navigateToProfile(author.id)}
              className="font-medium text-neutral-200 hover:text-emerald-400 transition-colors"
            >
              {author.displayName}
            </button>
            <span className="font-mono text-neutral-500">@{author.username}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeTime(comment.timestamp, language, comment.createdAt)}</span>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ms-auto text-neutral-500 hover:text-neutral-300 p-0.5"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <>
              {/* Content */}
              <div className="text-sm text-neutral-300 my-1 leading-relaxed">
                {comment.content}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                <button
                  onClick={() => upvoteComment(postId, comment.id)}
                  className={`flex items-center gap-1 hover:text-emerald-400 transition-colors ${
                    comment.userVote === 1 ? 'text-emerald-400 font-bold' : ''
                  }`}
                >
                  <ArrowBigUp className={`w-3.5 h-3.5 ${comment.userVote === 1 ? 'fill-current' : ''}`} />
                  <span className="tabular-nums font-mono">{comment.upvotes}</span>
                </button>

                <button
                  onClick={() => {
                    if (!currentUser) {
                      setAuthModalOpen(true, 'login');
                    } else {
                      setReplyOpen(!replyOpen);
                    }
                  }}
                  className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  <span>{t.reply}</span>
                </button>

                {currentUser && currentUser.id === comment.author.id && (
                  <button
                    onClick={() => deleteComment(postId, comment.id)}
                    className="flex items-center gap-1 hover:text-rose-400 text-neutral-600 transition-colors ms-auto"
                    title={t.deleteComment}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t.deleteComment}</span>
                  </button>
                )}
              </div>

              {/* Inline Reply Box */}
              {replyOpen && (
                <form onSubmit={handleReplySubmit} className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`${t.writeReply} @${comment.author.username}...`}
                    className="flex-1 bg-neutral-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-start"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>{t.sendReply}</span>
                  </button>
                </form>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const PostDetail: React.FC = () => {
  const {
    posts,
    selectedPostId,
    comments,
    addComment,
    navigateToFeed,
    currentUser,
    setAuthModalOpen,
    t,
    language,
    dir,
  } = useApp();

  const [commentText, setCommentText] = useState('');

  const post = posts.find((p) => p.id === selectedPostId);
  const postComments = (selectedPostId && comments[selectedPostId]) || [];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!commentText.trim() || !selectedPostId) return;

    addComment(selectedPostId, commentText.trim());
    setCommentText('');
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">{t.postNotFound}</h2>
        <button
          onClick={() => navigateToFeed()}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium"
        >
          {t.backToFeed}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-start">
      {/* Top Back Nav */}
      <button
        onClick={() => navigateToFeed()}
        className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
      >
        <BackIcon className="w-4 h-4" />
        <span>{t.backToFeed}</span>
      </button>

      {/* Main Post Card */}
      <PostCard post={post} isDetailedView={true} />

      {/* Comment Creation Box */}
      <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 md:p-5">
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-neutral-300">
            {t.submitComment}
          </label>
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              currentUser
                ? t.addCommentPlaceholder
                : `${t.navLogin} to comment...`
            }
            disabled={!currentUser}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-start disabled:opacity-50"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-500">
              {currentUser ? `@${currentUser.username}` : ''}
            </span>

            <button
              type="submit"
              disabled={!commentText.trim() || !currentUser}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.submitComment}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-neutral-300 px-1">
          {postComments.length} {t.commentsCount}
        </h3>

        <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 md:p-5 divide-y divide-white/5">
          {postComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={post.id}
            />
          ))}

          {postComments.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              {language === 'ar' ? 'لا توجد تعليقات حتى الآن. شارك برأيك أولاً!' : 'No comments yet. Share your thoughts!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
