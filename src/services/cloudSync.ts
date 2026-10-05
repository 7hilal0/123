import { User, Community, Post, Comment, Conversation, DirectMessage, NotificationItem } from '../types';
import { cloudflareApi } from './cloudflareApi';
import { DEFAULT_USER_AVATAR } from '../utils/avatarConstants';

const MEDIA_CHUNK_SIZE = 48_000;
type EntityType = 'user' | 'community' | 'communityMember' | 'post' | 'comment' | 'conversation' | 'message' | 'notification' | 'profileMedia' | 'follow';
type ProfileMediaChunk = { id: string; userId: string; field: 'avatar' | 'banner'; index: number; total: number; value: string; mediaVersion?: string };
type FollowRecord = { id: string; followerId: string; followingId: string; following: boolean };
const userMediaCache = new Map<string, { value: Partial<User>; expiresAt: number }>();
const userMediaRequests = new Map<string, Promise<Partial<User>>>();
const MEDIA_CACHE_TTL = 5_000;

const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
function splitMedia(value: string): string[] { if (!value) return ['']; const chunks: string[] = []; for (let i = 0; i < value.length; i += MEDIA_CHUNK_SIZE) chunks.push(value.slice(i, i + MEDIA_CHUNK_SIZE)); return chunks; }
function parse<T>(payload: string): T | null { try { return JSON.parse(payload) as T; } catch { return null; } }
async function saveMediaBatch(rows: ProfileMediaChunk[]): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await cloudflareApi.saveEntityBatch(rows.map((row) => ({ entityType: 'profileMedia', entityId: row.id, ownerId: row.userId, payload: JSON.stringify(row) })));
      return;
    } catch (error) {
      lastError = error;
      await pause(300 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Profile media batch upload failed');
}
async function listRows<T>(type?: EntityType, ownerId?: string, extra: Record<string, string> = {}) {
  const res = await cloudflareApi.listEntities(type, ownerId, extra);
  return Array.isArray(res?.items) ? res.items : [];
}
async function fetchType<T>(type: EntityType, predicate?: (value: T) => boolean, ownerId?: string, extra: Record<string, string> = {}): Promise<T[]> {
  const rows = await listRows(type, ownerId, extra);
  const values = (rows || [])
    .map((row) => (row && row.payload ? parse<T>(row.payload) : null))
    .filter((value): value is T => Boolean(value));
  return predicate ? values.filter(predicate) : values;
}
async function saveEntity<T extends { id: string }>(entityType: EntityType, entity: T, ownerId?: string): Promise<void> { await cloudflareApi.saveEntity(entityType, entity.id, JSON.stringify(entity), ownerId || entity.id); }
function subscribePoll<T>(fetcher: () => Promise<T[]>, callback: (items: T[]) => void, label: string): () => void {
  let stopped = false;
  const poll = async () => {
    try {
      const items = await fetcher();
      if (!stopped && Array.isArray(items)) {
        callback(items);
      }
    } catch (error) {
      console.error(`[Cloudflare] ${label} sync error:`, error);
    }
  };
  void poll();
  const timer = window.setInterval(poll, 10000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}

export const cloudSync = {
  async saveUser(user: User): Promise<void> {
    const avatar = user.avatar || '';
    const banner = user.banner || '';

    // If avatar/banner is a lightweight thumbnail or SVG (< 180KB), include it directly in the profile entity.
    // This guarantees other users and visitors receive the thumbnail instantly without relying on chunked media rows!
    const profile: User = {
      ...user,
      avatar: avatar.length <= 180_000 ? avatar : '',
      banner: banner.length <= 180_000 ? banner : '',
    };

    userMediaCache.set(user.id, { value: { avatar, banner }, expiresAt: Date.now() + MEDIA_CACHE_TTL });

    // Save profile entity directly with thumbnail so all users see it immediately
    await saveEntity('user', profile, user.id);

    // If media is larger than 30KB or needs full chunking, upload to media store in background
    if (avatar.length > 30_000 || banner.length > 30_000) {
      try {
        const uploadedVersions: Partial<Record<'avatar' | 'banner', string>> = {};
        for (const item of [{ field: 'avatar' as const, value: avatar }, { field: 'banner' as const, value: banner }]) {
          if (!item.value) continue;
          const chunks = splitMedia(item.value);
          const mediaVersion = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          uploadedVersions[item.field] = mediaVersion;
          const rows = chunks.map((value, index) => ({
            id: `${user.id}:${item.field}:${mediaVersion}:${index}`,
            userId: user.id,
            field: item.field,
            index,
            total: chunks.length,
            value,
            mediaVersion,
          } as ProfileMediaChunk));
          for (let index = 0; index < rows.length; index += 20) {
            await saveMediaBatch(rows.slice(index, index + 20));
            await pause(100);
          }

          // Only remove old versions after every chunk of the new version is stored.
          await cloudflareApi.cleanupProfileMedia(item.field, mediaVersion);
        }
      } catch (err) {
        console.warn('[Cloudflare] Media chunks backup warning:', err);
      }
    }
  },
  async fetchUsers(currentUserId?: string): Promise<User[]> {
    const users = await fetchType<User>('user');
    const followRows = await listRows('follow');
    const mediaRows = await listRows('profileMedia');
    const follows = (followRows || [])
      .map((row) => (row && row.payload ? parse<FollowRecord>(row.payload) : null))
      .filter((value): value is FollowRecord => Boolean(value));
    const media = (mediaRows || [])
      .map((row) => (row && row.payload ? parse<ProfileMediaChunk>(row.payload) : null))
      .filter((value): value is ProfileMediaChunk => Boolean(value));
    const hydrateMedia = (userId: string): Partial<User> => {
      const result: Partial<User> = {};
      for (const field of ['avatar', 'banner'] as const) {
        const groups = new Map<string, ProfileMediaChunk[]>();
        media.filter((item) => item.userId === userId && item.field === field).forEach((item) => {
          const key = item.mediaVersion || 'legacy';
          groups.set(key, [...(groups.get(key) || []), item]);
        });
        const complete = [...groups.entries()]
          .sort(([x], [y]) => y.localeCompare(x))
          .map(([, group]) => group.sort((x, y) => x.index - y.index))
          .find((group) => {
            const total = group[0]?.total || 0;
            const indexes = new Set(group.map((item) => item.index));
            return total > 0 && group.length === total && [...Array(total).keys()].every((index) => indexes.has(index));
          });
        if (complete) result[field] = complete.map((item) => item.value).join('');
      }
      if (result.avatar || result.banner) userMediaCache.set(userId, { value: result, expiresAt: Date.now() + MEDIA_CACHE_TTL });
      return result;
    };
    const followerCounts = new Map<string, number>();
    const followingCounts = new Map<string, number>();
    const followingByCurrentUser = new Set<string>();
    for (const follow of follows) {
      if (!follow.following) continue;
      followerCounts.set(follow.followingId, (followerCounts.get(follow.followingId) || 0) + 1);
      followingCounts.set(follow.followerId, (followingCounts.get(follow.followerId) || 0) + 1);
      if (follow.followerId === currentUserId) followingByCurrentUser.add(follow.followingId);
    }
    return (users || []).map((user) => {
      const cachedEntry = userMediaCache.get(user.id);
      const cached = cachedEntry && cachedEntry.expiresAt > Date.now() ? cachedEntry.value : undefined;
      if (cachedEntry && !cached) userMediaCache.delete(user.id);
      const remoteMedia = hydrateMedia(user.id);
      const hydrated = {
        ...user,
        avatar: remoteMedia.avatar || user.avatar || cached?.avatar || DEFAULT_USER_AVATAR,
        banner: remoteMedia.banner || user.banner || cached?.banner || '',
        ...(followerCounts.has(user.id) ? { followersCount: followerCounts.get(user.id) || 0 } : {}),
        ...(followingCounts.has(user.id) ? { followingCount: followingCounts.get(user.id) || 0 } : {}),
        ...(currentUserId ? { isFollowing: followingByCurrentUser.has(user.id) } : {}),
      };
      return hydrated;
    });
  },
  async saveFollow(followerId: string, followingId: string, following: boolean): Promise<void> {
    const record: FollowRecord = { id: `${followerId}:${followingId}`, followerId, followingId, following };
    await saveEntity('follow', record, followerId);
  },
  async fetchFollowMembers(userId: string, direction: 'followers' | 'following'): Promise<User[]> {
    const [users, followRows] = await Promise.all([
      fetchType<User>('user'),
      listRows('follow'),
    ]);
    const follows = (followRows || [])
      .map((row) => (row?.payload ? parse<FollowRecord>(row.payload) : null))
      .filter((value): value is FollowRecord => Boolean(value) && value.following);
    const ids = new Set(
      follows
        .filter((follow) => direction === 'followers' ? follow.followingId === userId : follow.followerId === userId)
        .map((follow) => direction === 'followers' ? follow.followerId : follow.followingId)
    );
    return (users || []).filter((user) => ids.has(user.id));
  },
  async fetchUserMedia(userId: string): Promise<Partial<User>> {
    const cached = userMediaCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) userMediaCache.delete(userId);
    if (userMediaRequests.has(userId)) return userMediaRequests.get(userId) || {};
    const request = (async () => {
    const rows = await listRows('profileMedia', userId);
    const media = rows.map((row) => parse<ProfileMediaChunk>(row.payload)).filter((value): value is ProfileMediaChunk => Boolean(value));
    const result: Partial<User> = {};
    for (const field of ['avatar', 'banner'] as const) {
      const groups = new Map<string, ProfileMediaChunk[]>();
      media.filter((item) => item.field === field).forEach((item) => {
        const key = item.mediaVersion || 'legacy';
        groups.set(key, [...(groups.get(key) || []), item]);
      });
      const complete = [...groups.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, group]) => group.sort((a, b) => a.index - b.index))
        .find((group) => {
          const total = group[0]?.total || 0;
          const indexes = new Set(group.map((item) => item.index));
          return total > 0 && group.length === total && [...Array(total).keys()].every((index) => indexes.has(index));
        });
      if (complete) result[field] = complete.map((item) => item.value).join('');
    }
    // Do not cache an incomplete/empty result. Media chunks can still be uploading,
    // and caching {} here would prevent future requests from seeing the completed image.
    if (result.avatar || result.banner) {
      userMediaCache.set(userId, { value: result, expiresAt: Date.now() + MEDIA_CACHE_TTL });
    } else {
      userMediaCache.delete(userId);
    }
    userMediaRequests.delete(userId);
    return result;
    })().catch((error) => {
      userMediaRequests.delete(userId);
      throw error;
    });
    userMediaRequests.set(userId, request);
    return request;
  },
  saveCommunity: (community: Community) => saveEntity('community', community),
  async fetchCommunities(currentUserId?: string) {
    const communities = await fetchType<Community>('community');
    if (!currentUserId) return communities.map((community) => ({ ...community, isMember: false }));
    const memberships = await fetchType<{ communityId: string }>('communityMember', undefined, currentUserId);
    const joined = new Set(memberships.map((membership) => membership.communityId));
    return communities.map((community) => ({ ...community, isMember: joined.has(community.id) }));
  },
  savePost: (post: Post) => saveEntity('post', post, post.author?.id),
  async deletePost(postId: string): Promise<boolean> { try { await saveEntity('post', { id: postId, deleted: true, deletedAt: Date.now() } as unknown as Post); return true; } catch { return false; } },
  async fetchPosts(): Promise<Post[]> {
    try {
      // Prefer the lightweight post response, but fall back to the normal
      // entity response if the summary endpoint is unavailable or returns no
      // usable posts. This prevents a feed from appearing empty when posts
      // still exist in D1.
      let res = await cloudflareApi.listEntities('post', undefined, { summary: '1' });
      let rows = Array.isArray(res?.items) ? res.items : [];

      const parsePosts = (items: Array<{ payload?: string }>): Post[] =>
        items
          .map((row) => (row && row.payload ? parse<Post>(row.payload) : null))
          .filter((value): value is Post => value !== null && !value.deleted);

      let posts = parsePosts(rows);

      if (posts.length === 0) {
        res = await cloudflareApi.listEntities('post');
        rows = Array.isArray(res?.items) ? res.items : [];
        posts = parsePosts(rows);
      }

      return posts;
    } catch (error) {
      console.error('[Cloudflare] fetchPosts failed:', error);
      throw error;
    }
  },
  async fetchPost(postId: string): Promise<Post | null> {
    try {
      const res = await cloudflareApi.listEntities('post', undefined, { entityId: postId });
      const rows = Array.isArray(res?.items) ? res.items : [];
      return rows[0] && rows[0].payload ? parse<Post>(rows[0].payload) : null;
    } catch {
      return null;
    }
  },
  // A failed poll must not be converted into []: that would erase the cached
  // feed and make all posts appear to disappear during a brief network error.
  subscribePosts(callback: (posts: Post[]) => void) { return subscribePoll(() => this.fetchPosts(), callback, 'posts'); },
  saveComment: (postId: string, comment: Comment) => saveEntity('comment', { ...comment, postId } as Comment & { postId: string }, comment.author?.id),
  async deleteComments(postId: string, commentIds: string[]): Promise<boolean> {
    try {
      for (const commentId of commentIds) await saveEntity('comment', { id: commentId, postId, deleted: true, deletedAt: Date.now() } as unknown as Comment, undefined);
      return true;
    } catch { return false; }
  },
  deleteComment(postId: string, commentId: string) { return this.deleteComments(postId, [commentId]); },
  async fetchComments(postId: string) { const comments = await fetchType<Comment & { postId?: string }>('comment', (comment) => comment.postId === postId); return comments.filter((comment) => !(comment as Comment & { deleted?: boolean }).deleted); },
  saveConversation: (conversation: Conversation) => {
    // Never store full participant objects here: they may contain large GIF
    // data URLs and can make the conversation row too large for D1.
    const compactConversation = {
      id: conversation.id,
      participantIds: conversation.participantIds || Object.keys(conversation.participants || {}),
      lastMessage: conversation.lastMessage,
      lastMessageTime: conversation.lastMessageTime,
      lastMessageTimestamp: conversation.lastMessageTimestamp,
      lastSenderId: conversation.lastSenderId,
      unreadCount: conversation.unreadCount || 0,
    } as Conversation;
    return saveEntity('conversation', compactConversation, undefined);
  },
  fetchConversations: (userId: string) => fetchType<Conversation>('conversation', (conversation) => Boolean(conversation.participantIds?.includes(userId) || conversation.id.includes(userId) || conversation.participant?.id === userId)),
  subscribeConversations(userId: string, callback: (items: Conversation[]) => void) { return subscribePoll(() => this.fetchConversations(userId), callback, 'conversations'); },
  saveDirectMessage: (conversationId: string, message: DirectMessage) => saveEntity('message', { ...message, conversationId } as DirectMessage & { conversationId: string }, message.senderId),
  async fetchMessages(conversationId: string) {
    const messages = await fetchType<DirectMessage & { conversationId?: string }>('message', undefined, undefined, { conversationId });
    return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  },
  subscribeMessages(conversationId: string, callback: (items: DirectMessage[]) => void) { return subscribePoll(() => this.fetchMessages(conversationId), callback, 'messages'); },
  saveNotification: (notification: NotificationItem) => saveEntity('notification', notification, notification.recipientId),
  subscribeNotifications(userId: string, callback: (items: NotificationItem[]) => void) { return subscribePoll(() => fetchType<NotificationItem>('notification', undefined, userId), callback, 'notifications'); },
};
