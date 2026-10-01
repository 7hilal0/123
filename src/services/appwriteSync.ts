import { APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID, Query, tablesDB } from '../lib/appwrite';
import { User, Community, Post, Comment, Conversation, DirectMessage, NotificationItem } from '../types';

const MAX_PAGE = 100;

type EntityType =
  | 'user'
  | 'community'
  | 'post'
  | 'comment'
  | 'conversation'
  | 'message'
  | 'notification';

type StoredRow = {
  entityType: string;
  ownerId?: string;
  payload: string;
};

function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => stripUndefined(item)) as unknown as T;
  if (typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) result[key] = stripUndefined(item);
    }
    return result as T;
  }
  return value;
}

// Appwrite row IDs are limited to 36 safe characters. This deterministic hash
// keeps updates idempotent without exposing the original nested-document key.
function rowId(type: EntityType, id: string): string {
  let hash = 2166136261;
  for (const char of `${type}:${id}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${type.slice(0, 3)}_${(hash >>> 0).toString(16).padStart(8, '0')}_${Math.abs(id.length).toString(16)}`;
}

async function listRows(): Promise<Array<{ $id: string; data: StoredRow }>> {
  const rows: Array<{ $id: string; data: StoredRow }> = [];
  for (let offset = 0; offset < 10000; offset += MAX_PAGE) {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLE_ID,
      queries: [Query.limit(MAX_PAGE), Query.offset(offset)],
      total: false,
      ttl: 0,
    });
    const page = (result.rows || []) as Array<{ $id: string; entityType?: string; ownerId?: string; payload?: string }>;
    rows.push(...page.map((row) => ({
      $id: row.$id,
      data: { entityType: row.entityType || '', ownerId: row.ownerId, payload: row.payload || '{}' },
    })));
    if (page.length < MAX_PAGE) break;
  }
  return rows;
}

function parse<T>(row: { data: StoredRow }): T | null {
  try {
    return JSON.parse(row.data.payload) as T;
  } catch {
    return null;
  }
}

async function saveEntity<T extends { id: string }>(entityType: EntityType, entity: T, ownerId?: string): Promise<void> {
  const clean = stripUndefined(entity);
  await tablesDB.upsertRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_TABLE_ID,
    rowId: rowId(entityType, entity.id),
    data: {
      entityType,
      ownerId: ownerId || entity.id,
      payload: JSON.stringify(clean),
    },
  });
}

async function fetchType<T>(entityType: EntityType, predicate?: (value: T) => boolean): Promise<T[]> {
  const rows = await listRows();
  const values = rows
    .filter((row) => row.data.entityType === entityType)
    .map((row) => parse<T>(row))
    .filter((value): value is T => Boolean(value));
  return predicate ? values.filter(predicate) : values;
}

function subscribePoll<T>(fetcher: () => Promise<T[]>, callback: (items: T[]) => void, label: string): () => void {
  let stopped = false;
  const poll = async () => {
    try {
      const items = await fetcher();
      if (!stopped) callback(items);
    } catch (error) {
      console.error(`[Appwrite] ${label} sync error:`, error);
    }
  };
  void poll();
  const timer = window.setInterval(poll, 10000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}

export const appwriteSync = {
  async saveUser(user: User): Promise<void> {
    await saveEntity('user', user);
  },
  fetchUsers(): Promise<User[]> {
    return fetchType<User>('user');
  },

  async saveCommunity(community: Community): Promise<void> {
    await saveEntity('community', community);
  },
  fetchCommunities(): Promise<Community[]> {
    return fetchType<Community>('community');
  },

  async savePost(post: Post): Promise<void> {
    await saveEntity('post', post, post.author?.id);
  },
  async deletePost(postId: string): Promise<boolean> {
    const post = { id: postId, deleted: true, deletedAt: Date.now() } as unknown as Post;
    try {
      await saveEntity('post', post);
      return true;
    } catch (error) {
      console.error('[Appwrite] Error marking post deleted:', error);
      return false;
    }
  },
  async fetchPosts(): Promise<Post[] | null> {
    try {
      return await fetchType<Post>('post');
    } catch (error) {
      console.error('[Appwrite] Error fetching posts:', error);
      return null;
    }
  },
  subscribePosts(callback: (posts: Post[]) => void): () => void {
    return subscribePoll(() => this.fetchPosts().then((items) => items || []), callback, 'posts');
  },

  async saveComment(postId: string, comment: Comment): Promise<void> {
    await saveEntity('comment', { ...comment, postId } as Comment & { postId: string }, postId);
  },
  async deleteComments(postId: string, commentIds: string[]): Promise<boolean> {
    try {
      for (const commentId of commentIds) {
        await saveEntity('comment', { id: commentId, postId, deleted: true, deletedAt: Date.now() } as unknown as Comment, postId);
      }
      return true;
    } catch (error) {
      console.error('[Appwrite] Error deleting comments:', error);
      return false;
    }
  },
  deleteComment(postId: string, commentId: string): Promise<boolean> {
    return this.deleteComments(postId, [commentId]);
  },
  async fetchComments(postId: string): Promise<Comment[]> {
    const comments = await fetchType<Comment & { postId?: string }>('comment', (comment) => comment.postId === postId);
    return comments.filter((comment) => !(comment as Comment & { deleted?: boolean }).deleted);
  },

  async saveConversation(conversation: Conversation): Promise<void> {
    await saveEntity('conversation', conversation);
  },
  fetchConversations(userId: string): Promise<Conversation[]> {
    return fetchType<Conversation>('conversation', (conversation) =>
      Boolean(conversation.participantIds?.includes(userId) || conversation.id.includes(userId) || conversation.participant?.id === userId)
    );
  },
  subscribeConversations(userId: string, callback: (items: Conversation[]) => void): () => void {
    return subscribePoll(() => this.fetchConversations(userId), callback, 'conversations');
  },

  async saveDirectMessage(conversationId: string, message: DirectMessage): Promise<void> {
    await saveEntity('message', { ...message, conversationId } as DirectMessage & { conversationId: string }, conversationId);
  },
  async fetchMessages(conversationId: string): Promise<DirectMessage[]> {
    const messages = await fetchType<DirectMessage & { conversationId?: string }>('message', (message) => message.conversationId === conversationId);
    return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  },
  subscribeMessages(conversationId: string, callback: (items: DirectMessage[]) => void): () => void {
    return subscribePoll(() => this.fetchMessages(conversationId), callback, 'messages');
  },

  async saveNotification(notification: NotificationItem): Promise<void> {
    await saveEntity('notification', notification, notification.recipientId);
  },
  subscribeNotifications(userId: string, callback: (items: NotificationItem[]) => void): () => void {
    return subscribePoll(
      () => fetchType<NotificationItem>('notification', (notification) => notification.recipientId === userId),
      callback,
      'notifications'
    );
  },
};
