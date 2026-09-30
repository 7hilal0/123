import { Post, Comment } from '../types';

/**
 * Resolves a post's vote counts and the active user's personal vote state.
 * This guarantees:
 * 1. Multiple users' likes/upvotes are accurately aggregated across all accounts.
 * 2. User A liking a post does not falsely show as liked on User B's device.
 * 3. Freshly created posts start with 0 likes and no automatic like by default.
 */
export function resolvePostForUser(post: Post, currentUserId?: string | null): Post {
  const votes = post.votes || {};
  const voteEntries = Object.entries(votes);

  let upvotes = post.upvotes || 0;
  let downvotes = post.downvotes || 0;

  // If the votes record is populated, dynamically calculate exact totals from each user's recorded vote
  if (voteEntries.length > 0) {
    upvotes = voteEntries.filter(([, v]) => v === 1).length;
    downvotes = voteEntries.filter(([, v]) => v === -1).length;
  }

  // Personal vote state for the viewing user
  const userVote: 1 | -1 | null = currentUserId ? (votes[currentUserId] ?? null) : null;
  const savedBy = post.savedBy || {};

  return {
    ...post,
    upvotes,
    downvotes,
    userVote,
    votes,
    savedBy,
    isSaved: currentUserId ? Boolean(savedBy[currentUserId]) : false,
  };
}

export function resolveCommentForUser(comment: Comment, currentUserId?: string | null): Comment {
  const votes = comment.votes || {};
  const voteEntries = Object.entries(votes);

  let upvotes = comment.upvotes || 0;
  let downvotes = comment.downvotes || 0;

  if (voteEntries.length > 0) {
    upvotes = voteEntries.filter(([, v]) => v === 1).length;
    downvotes = voteEntries.filter(([, v]) => v === -1).length;
  }

  const userVote: 1 | -1 | null = currentUserId ? (votes[currentUserId] ?? null) : null;

  return {
    ...comment,
    upvotes,
    downvotes,
    userVote,
    votes,
    replies: comment.replies?.map((r) => resolveCommentForUser(r, currentUserId)),
  };
}
