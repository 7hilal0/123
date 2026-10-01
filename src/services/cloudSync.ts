import { User, Community, Post, Comment, Conversation, DirectMessage, NotificationItem } from '../types';
import { cloudflareApi } from './cloudflareApi';

const MEDIA_CHUNK_SIZE = 48_000;
type EntityType = 'user' | 'community' | 'post' | 'comment' | 'conversation' | 'message' | 'notification' | 'profileMedia' | 'follow';
type ProfileMediaChunk = { id: string; userId: string; field: 'avatar' | 'banner'; index: number; total: number; value: string };
type FollowRecord = { id: string; followerId: string; followingId: string; following: boolean };

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
async function listRows<T>(type?: EntityType, ownerId?: string) { return (await cloudflareApi.listEntities(type, ownerId)).items; }
async function fetchType<T>(type: EntityType, predicate?: (value: T) => boolean): Promise<T[]> { const rows = await listRows(type); const values = rows.map((row) => parse<T>(row.payload)).filter((value): value is T => Boolean(value)); return predicate ? values.filter(predicate) : values; }
async function saveEntity<T extends { id: string }>(entityType: EntityType, entity: T, ownerId?: string): Promise<void> { await cloudflareApi.saveEntity(entityType, entity.id, JSON.stringify(entity), ownerId || entity.id); }
function subscribePoll<T>(fetcher: () => Promise<T[]>, callback: (items: T[]) => void, label: string): () => void { let stopped = false; const poll = async () => { try { const items = await fetcher(); if (!stopped) callback(items); } catch (error) { console.error(`[Cloudflare] ${label} sync error:`, error); } }; void poll(); const timer = window.setInterval(poll, 10000); return () => { stopped = true; window.clearInterval(timer); }; }

export const cloudSync = {
  async saveUser(user: User): Promise<void> {
    const { avatar, banner, ...profile } = user;
    await saveEntity('user', profile as User);
    for (const item of [{ field: 'avatar' as const, value: avatar || '' }, { field: 'banner' as const, value: banner || '' }]) {
      const chunks = splitMedia(item.value);
      const rows = chunks.map((value, index) => ({ id: `${user.id}:${item.field}:${index}`, userId: user.id, field: item.field, index, total: chunks.length, value } as ProfileMediaChunk));
      for (let index = 0; index < rows.length; index += 20) { await saveMediaBatch(rows.slice(index, index + 20)); await pause(120); }
    }
  },
  async fetchUsers(currentUserId?: string): Promise<User[]> {
    const users = await fetchType<User>('user');
    // User profiles intentionally omit large avatar/banner data. Reassemble the
    // separately stored chunks here so other people's images survive a refresh,
    // not only the currently signed-in user's images.
    const followRows = await listRows('follow');
    const follows = followRows.map((row) => parse<FollowRecord>(row.payload)).filter((value): value is FollowRecord => Boolean(value));
    const followerCounts = new Map<string, number>();
    const followingByCurrentUser = new Set<string>();
    for (const follow of follows) {
      if (!follow.following) continue;
      followerCounts.set(follow.followingId, (followerCounts.get(follow.followingId) || 0) + 1);
      if (follow.followerId === currentUserId) followingByCurrentUser.add(follow.followingId);
    }
    return users.map((user) => {
      const hydrated = {
        ...user,
        ...(followerCounts.has(user.id) ? { followersCount: followerCounts.get(user.id) || 0 } : {}),
        ...(currentUserId ? { isFollowing: followingByCurrentUser.has(user.id) } : {}),
      };
      return hydrated;
    });
  },
  async saveFollow(followerId: string, followingId: string, following: boolean): Promise<void> {
    const record: FollowRecord = { id: `${followerId}:${followingId}`, followerId, followingId, following };
    await saveEntity('follow', record, followerId);
  },
  async fetchUserMedia(userId: string): Promise<Partial<User>> {
    const rows = await listRows('profileMedia', userId);
    const media = rows.map((row) => parse<ProfileMediaChunk>(row.payload)).filter((value): value is ProfileMediaChunk => Boolean(value));
    const result: Partial<User> = {};
    for (const field of ['avatar', 'banner'] as const) {
      const chunks = media.filter((item) => item.field === field).sort((a, b) => a.index - b.index);
      if (chunks.length && chunks.length >= chunks[0].total) result[field] = chunks.slice(0, chunks[0].total).map((item) => item.value).join('');
    }
    return result;
  },
  saveCommunity: (community: Community) => saveEntity('community', community),
  fetchCommunities: () => fetchType<Community>('community'),
  savePost: (post: Post) => saveEntity('post', post, post.author?.id),
  async deletePost(postId: string): Promise<boolean> { try { await saveEntity('post', { id: postId, deleted: true, deletedAt: Date.now() } as unknown as Post); return true; } catch { return false; } },
  async fetchPosts(): Promise<Post[]> {
    const rows = (await cloudflareApi.listEntities('post', undefined, { summary: '1' })).items;
    return rows.map((row) => parse<Post>(row.payload)).filter((value): value is Post => Boolean(value));
  },
  async fetchPost(postId: string): Promise<Post | null> {
    const rows = (await cloudflareApi.listEntities('post', undefined, { entityId: postId })).items;
    return rows[0] ? parse<Post>(rows[0].payload) : null;
  },
  // A failed poll must not be converted into []: that would erase the cached
  // feed and make all posts appear to disappear during a brief network error.
  subscribePosts(callback: (posts: Post[]) => void) { return subscribePoll(() => this.fetchPosts(), callback, 'posts'); },
  saveComment: (postId: string, comment: Comment) => saveEntity('comment', { ...comment, postId } as Comment & { postId: string }, postId),
  async deleteComments(postId: string, commentIds: string[]): Promise<boolean> { try { for (const commentId of commentIds) await saveEntity('comment', { id: commentId, postId, deleted: true, deletedAt: Date.now() } as unknown as Comment, postId); return true; } catch { return false; } },
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
    return saveEntity('conversation', compactConversation, conversation.participantIds?.[0]);
  },
  fetchConversations: (userId: string) => fetchType<Conversation>('conversation', (conversation) => Boolean(conversation.participantIds?.includes(userId) || conversation.id.includes(userId) || conversation.participant?.id === userId)),
  subscribeConversations(userId: string, callback: (items: Conversation[]) => void) { return subscribePoll(() => this.fetchConversations(userId), callback, 'conversations'); },
  saveDirectMessage: (conversationId: string, message: DirectMessage) => saveEntity('message', { ...message, conversationId } as DirectMessage & { conversationId: string }, conversationId),
  async fetchMessages(conversationId: string) { const messages = await fetchType<DirectMessage & { conversationId?: string }>('message', (message) => message.conversationId === conversationId); return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); },
  subscribeMessages(conversationId: string, callback: (items: DirectMessage[]) => void) { return subscribePoll(() => this.fetchMessages(conversationId), callback, 'messages'); },
  saveNotification: (notification: NotificationItem) => saveEntity('notification', notification, notification.recipientId),
  subscribeNotifications(userId: string, callback: (items: NotificationItem[]) => void) { return subscribePoll(() => fetchType<NotificationItem>('notification', (notification) => notification.recipientId === userId), callback, 'notifications'); },
};
