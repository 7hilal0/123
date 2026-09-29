import {
  User,
  Community,
  Post,
  Comment,
  Conversation,
  DirectMessage,
  NotificationItem,
} from '../types';
import {
  ADMIN_USER,
  MOCK_USERS,
  MOCK_COMMUNITIES,
  MOCK_POSTS,
  MOCK_COMMENTS,
  MOCK_CONVERSATIONS,
  MOCK_DIRECT_MESSAGES,
  MOCK_NOTIFICATIONS,
} from '../data/mockData';
import { DEFAULT_USER_AVATAR, OFFICIAL_DZCORE_AVATAR } from './avatarConstants';

// Version 5 clean namespace
const STORAGE_PREFIX = 'nova_dz_prod_v5_';

const STORAGE_KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  CURRENT_USER_ID: `${STORAGE_PREFIX}current_user_id`,
  POSTS: `${STORAGE_PREFIX}posts`,
  COMMENTS: `${STORAGE_PREFIX}comments`,
  COMMUNITIES: `${STORAGE_PREFIX}communities`,
  CONVERSATIONS: `${STORAGE_PREFIX}conversations`,
  DIRECT_MESSAGES: `${STORAGE_PREFIX}direct_messages`,
  NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
};

// Clean up obsolete mock keys from older runs so user sees the fresh real changes immediately
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('nova_dz_') || key.startsWith('nova_')) && !key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Storage purge skipped', e);
  }
}

// Safe JSON Parse helper
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

// Safe JSON Stringify helper
function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing localStorage key "${key}":`, err);
  }
}

export const storage = {
  getUsers: (): User[] => {
    const list = safeGet<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    return list.map((u) => {
      if (u.id === 'admin_dzcore') {
        return { ...u, avatar: OFFICIAL_DZCORE_AVATAR };
      }
      if (!u.avatar || u.avatar.includes('photo-1534528741775-53994a69daeb')) {
        return { ...u, avatar: DEFAULT_USER_AVATAR };
      }
      return u;
    });
  },

  saveUsers: (users: User[]): void => {
    safeSet(STORAGE_KEYS.USERS, users);
  },

  getCurrentUserId: (): string | null => {
    return safeGet<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  },

  saveCurrentUserId: (userId: string | null): void => {
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  getPosts: (): Post[] => {
    const list = safeGet<Post[]>(STORAGE_KEYS.POSTS, MOCK_POSTS);
    return list.filter((p) => p.id !== 'post_official_welcome');
  },

  savePosts: (posts: Post[]): void => {
    safeSet(STORAGE_KEYS.POSTS, posts.filter((p) => p.id !== 'post_official_welcome'));
  },

  getComments: (): Record<string, Comment[]> => {
    return safeGet<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, MOCK_COMMENTS);
  },

  saveComments: (comments: Record<string, Comment[]>): void => {
    safeSet(STORAGE_KEYS.COMMENTS, comments);
  },

  getCommunities: (): Community[] => {
    return safeGet<Community[]>(STORAGE_KEYS.COMMUNITIES, MOCK_COMMUNITIES);
  },

  saveCommunities: (communities: Community[]): void => {
    safeSet(STORAGE_KEYS.COMMUNITIES, communities);
  },

  getConversations: (): Conversation[] => {
    return safeGet<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, MOCK_CONVERSATIONS);
  },

  saveConversations: (conversations: Conversation[]): void => {
    safeSet(STORAGE_KEYS.CONVERSATIONS, conversations);
  },

  getDirectMessages: (): Record<string, DirectMessage[]> => {
    return safeGet<Record<string, DirectMessage[]>>(STORAGE_KEYS.DIRECT_MESSAGES, MOCK_DIRECT_MESSAGES);
  },

  saveDirectMessages: (messages: Record<string, DirectMessage[]>): void => {
    safeSet(STORAGE_KEYS.DIRECT_MESSAGES, messages);
  },

  getNotifications: (): NotificationItem[] => {
    const list = safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    return list.filter((n) => n.id !== 'notif_welcome' && n.targetId !== 'post_official_welcome');
  },

  saveNotifications: (notifications: NotificationItem[]): void => {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Reset all local storage to fresh initial state
  resetAll: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
