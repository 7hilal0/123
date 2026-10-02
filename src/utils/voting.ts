import { Post, Comment } from '../types';

/**
 * Resolves a post's vote counts and the active user's personal vote state.
 * This guarantees:
 * 1. Multiple users' likes/upvotes are accurately aggregated across all accounts.
 * 2. User A liking a post does not falsely show as liked on User B's device.
 * 3. Freshly created posts start with 0 likes and no automatic like by default.
 */
export function resolvePostForUser(post: Post, currentUserId?: string | null): Post {
  if (!post) return post;
  const voteState = post.voteState || {};
  const rawVotes = post.votes || {};

  // Clean votes map: filter out entries where voteState is explicitly marked 0
  const votes: Record<string, 1 | -1> = {};
  for (const [userId, val] of Object.entries(rawVotes)) {
    if (voteState[userId] === 0) continue;
    if (val === 1 || val === -1) {
      votes[userId] = val;
    }
  }

  const voteEntries = Object.entries(votes);

  // If post.votes is defined (even as empty {}), the exact upvotes is strictly the number of real 1s
  // This guarantees when likes are reset to 0 or when someone removes a vote, it stays 0 and never resurrects stale numbers
  let upvotes = 0;
  let downvotes = 0;

  if (post.votes !== undefined && post.votes !== null) {
    upvotes = voteEntries.filter(([, v]) => v === 1).length;
    downvotes = voteEntries.filter(([, v]) => v === -1).length;
  } else {
    // Only for legacy posts where votes object was never initialized
    upvotes = voteEntries.length > 0 ? voteEntries.filter(([, v]) => v === 1).length : (post.upvotes || 0);
    downvotes = voteEntries.length > 0 ? voteEntries.filter(([, v]) => v === -1).length : (post.downvotes || 0);
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
    voteState,
    savedBy,
    isSaved: currentUserId ? Boolean(savedBy[currentUserId]) : false,
  };
}

export function resolveCommentForUser(comment: Comment, currentUserId?: string | null): Comment {
  if (!comment) return comment;
  const rawVotes = comment.votes || {};
  const voteEntries = Object.entries(rawVotes);

  let upvotes = 0;
  let downvotes = 0;
  if (comment.votes !== undefined && comment.votes !== null) {
    upvotes = voteEntries.filter(([, v]) => v === 1).length;
    downvotes = voteEntries.filter(([, v]) => v === -1).length;
  } else {
    upvotes = voteEntries.length > 0 ? voteEntries.filter(([, v]) => v === 1).length : (comment.upvotes || 0);
    downvotes = voteEntries.length > 0 ? voteEntries.filter(([, v]) => v === -1).length : (comment.downvotes || 0);
  }

  const userVote: 1 | -1 | null = currentUserId ? (rawVotes[currentUserId] ?? null) : null;

  return {
    ...comment,
    upvotes,
    downvotes,
    userVote,
    votes: rawVotes,
    replies: comment.replies?.map((r) => resolveCommentForUser(r, currentUserId)),
  };
}
