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
  MOCK_COMMUNITIES,
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

const PROFILE_MEDIA_DB = 'dzcore_profile_media_v1';
const PROFILE_MEDIA_STORE = 'profiles';

type ProfileMediaBackup = {
  avatar?: string;
  banner?: string;
};

function openProfileMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROFILE_MEDIA_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PROFILE_MEDIA_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveProfileMediaBackup(userId: string, media: ProfileMediaBackup): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  const db = await openProfileMediaDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(PROFILE_MEDIA_STORE, 'readwrite')
      .objectStore(PROFILE_MEDIA_STORE).put(media, userId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

async function getProfileMediaBackup(userId: string): Promise<ProfileMediaBackup | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
  const db = await openProfileMediaDb();
  const media = await new Promise<ProfileMediaBackup | undefined>((resolve, reject) => {
    const request = db.transaction(PROFILE_MEDIA_STORE, 'readonly').objectStore(PROFILE_MEDIA_STORE).get(userId);
    request.onsuccess = () => resolve(request.result as ProfileMediaBackup | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return media || null;
}

// One-time cleanup after the global comment reset. This removes stale comments
// cached on phones and browsers; posts, users, and other data stay untouched.
const COMMENT_RESET_VERSION = `${STORAGE_PREFIX}comments_reset_v1`;
const VOTE_RESET_VERSION = `${STORAGE_PREFIX}votes_reset_v1`;
const ACCOUNT_RESET_VERSION = `${STORAGE_PREFIX}accounts_reset_v2`;
const POST_RESET_VERSION = `${STORAGE_PREFIX}posts_reset_v4`;
const APPWRITE_ACCOUNT_RESET_VERSION = `${STORAGE_PREFIX}appwrite_accounts_reset_v1`;
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(COMMENT_RESET_VERSION) !== 'done') {
      localStorage.removeItem(STORAGE_KEYS.COMMENTS);
      localStorage.setItem(COMMENT_RESET_VERSION, 'done');
    }
    if (localStorage.getItem(VOTE_RESET_VERSION) !== 'done') {
      const rawPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (rawPosts) {
        const posts = JSON.parse(rawPosts) as Post[];
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts.map((post) => ({
          ...post,
          upvotes: 0,
          downvotes: 0,
          userVote: null,
          votes: {},
        }))));
      }
      localStorage.setItem(VOTE_RESET_VERSION, 'done');
    }
    if (localStorage.getItem(ACCOUNT_RESET_VERSION) !== 'done') {
      // The global account purge has already been completed. Do not clear a
      // valid local session during normal refreshes or after a new deployment.
      localStorage.setItem(ACCOUNT_RESET_VERSION, 'done');
    }
    if (localStorage.getItem(APPWRITE_ACCOUNT_RESET_VERSION) !== 'done') {
      // Appwrite is now the source of truth and its user list was reset.
      // Remove old demo/legacy accounts cached on individual phones.
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      localStorage.setItem(APPWRITE_ACCOUNT_RESET_VERSION, 'done');
    }
    if (localStorage.getItem(POST_RESET_VERSION) !== 'done') {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.COMMENTS);
      localStorage.setItem(POST_RESET_VERSION, 'done');
    }
  } catch (e) {
    console.warn('Local vote/comment cache reset skipped', e);
  }
}

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
  saveProfileMediaBackup,
  getProfileMediaBackup,
  getUsers: (): User[] => {
    const list = safeGet<User[]>(STORAGE_KEYS.USERS, []);
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
    // Firestore is the only source of truth for posts. Never seed old demo posts.
    const list = safeGet<Post[]>(STORAGE_KEYS.POSTS, []);
    const users = storage.getUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return list
      .filter((p) => p.id !== 'post_official_welcome')
      .map((p) => {
        const u = userMap.get(p.author.id);
        if (u) {
          return {
            ...p,
            author: {
              ...p.author,
              avatar: u.avatar,
              displayName: u.displayName,
              username: u.username,
            },
          };
        }
        return p;
      });
  },

  savePosts: (posts: Post[]): void => {
    safeSet(STORAGE_KEYS.POSTS, posts.filter((p) => p.id !== 'post_official_welcome'));
  },

  // Comments are cloud-only. Never restore them from a phone's localStorage.
  getComments: (): Record<string, Comment[]> => ({}),

  saveComments: (_comments: Record<string, Comment[]>): void => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.COMMENTS);
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
