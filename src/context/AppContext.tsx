import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  Community,
  Post,
  Comment,
  Conversation,
  DirectMessage,
  NotificationItem,
  ActiveTab,
  FeedSortOption,
  UserStatus
} from '../types';
import { storage } from '../utils/storage';
import { translations, Language, Translations } from '../locales/translations';
import { cloudSync } from '../services/cloudSync';
import { cloudflareApi } from '../services/cloudflareApi';
import { DEFAULT_USER_AVATAR } from '../utils/avatarConstants';
import { resolvePostForUser, resolveCommentForUser } from '../utils/voting';
import { resolveConversationForUser } from '../utils/conversationUtils';
import { formatRelativeTime } from '../utils/relativeTime';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  activeTab: ActiveTab;
  feedSort: FeedSortOption;
  selectedCommunitySlug: string | null;
  selectedPostId: string | null;
  selectedUserId: string | null;
  posts: Post[];
  communities: Community[];
  comments: Record<string, Comment[]>;
  conversations: Conversation[];
  activeConversationId: string | null;
  directMessages: Record<string, DirectMessage[]>;
  notifications: NotificationItem[];
  searchQuery: string;
  toasts: ToastMessage[];
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  editProfileModalOpen: boolean;
  settingsModalOpen: boolean;
  cloudSyncStatus: 'connected' | 'syncing' | 'offline';

  // Language & i18n
  language: Language;
  dir: 'ltr' | 'rtl';
  t: Translations;
  setLanguage: (lang: Language) => void;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setFeedSort: (sort: FeedSortOption) => void;
  setSearchQuery: (query: string) => void;
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  setEditProfileModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;

  // Navigation
  navigateToFeed: (sort?: FeedSortOption) => void;
  navigateToCommunity: (slug: string) => void;
  navigateToPost: (postId: string) => void;
  navigateToProfile: (userId: string) => void;
  navigateToMessages: (userIdOrConvId?: string) => void;
  navigateToCreatePost: (communitySlug?: string) => void;
  navigateToNotifications: () => void;
  navigateToSettings: () => void;
  navigateToSearch: (query?: string) => void;

  // Interactions
  upvotePost: (postId: string) => void;
  downvotePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  createPost: (postData: {
    communitySlug?: string;
    title: string;
    content: string;
    mediaType: 'text' | 'image' | 'video' | 'link';
    mediaUrl?: string;
    linkUrl?: string;
    tags: string[];
  }) => void;
  deletePost: (postId: string) => void;
  submitReport: (targetType: 'post' | 'user' | 'comment', targetId: string, reason: string) => Promise<boolean>;

  // Comments
  addComment: (postId: string, content: string, parentId?: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  upvoteComment: (postId: string, commentId: string) => void;

  // Communities
  joinCommunity: (slug: string) => void;
  leaveCommunity: (slug: string) => void;
  createCommunity: (name: string, description: string, category: string, iconUrl?: string, bannerUrl?: string) => void;

  // Messaging
  isInsideChat: boolean;
  setIsInsideChat: (val: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  selectConversation: (conversationId: string) => void;
  startConversationWithUser: (targetUserId: string) => void;
  sendDirectMessage: (text: string, mediaUrl?: string) => void;

  // Profile & Social
  toggleFollowUser: (userId: string) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => Promise<void>;
  updateUserStatus: (status: UserStatus, customStatus?: string) => void;

  // Notifications
  markAllNotificationsRead: () => void;
  markNotificationRead: (notificationId: string) => void;
  unreadCount: number;

  // Auth
  login: (usernameOrEmail: string, password?: string) => Promise<boolean>;
  googleLogin: (credential: string, profile?: { username?: string; displayName?: string }) => Promise<boolean>;
  register: (username: string, displayName: string, email: string, password?: string, avatarUrl?: string) => Promise<boolean>;
  updateAccountEmail: (email: string, currentPassword: string) => Promise<boolean>;
  updateAccountPassword: (newPassword: string, currentPassword: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Feedback & Reset
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language: Default to English ('en')
  const LANGUAGE_STORAGE_KEY = 'dzcore_language';
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'ar' || stored === 'fr') return stored;
    }
    return 'en';
  });

  // Keep layout orientation fixed to LTR so the entire interface does not flip/mirror when switching to Arabic
  const dir: 'ltr' | 'rtl' = 'ltr';
  const t: Translations = translations[language];

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = 'ltr';
    }
    showToast(newLang === 'en' ? 'Language switched to English' : newLang === 'fr' ? 'Langue changée en français' : 'تم تغيير اللغة إلى العربية', 'success');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  // Initial data loaded from storage (with cloud sync)
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const currentId = storage.getCurrentUserId();
    const storedUsers = storage.getUsers();
    return currentId ? (storedUsers.find((u) => u.id === currentId) || null) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedSort, setFeedSort] = useState<FeedSortOption>('hot');
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const historyInitializedRef = useRef(false);
  const restoringHistoryRef = useRef(false);

  const [posts, setPosts] = useState<Post[]>(() => {
    const raw = storage.getPosts();
    const currentId = storage.getCurrentUserId();
    return raw.map((p) => resolvePostForUser(p, currentId));
  });
  const [communities, setCommunities] = useState<Community[]>(() => storage.getCommunities());
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => storage.getComments());
  const [conversations, setConversations] = useState<Conversation[]>(() => storage.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isInsideChat, setIsInsideChat] = useState<boolean>(false);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>(() => storage.getDirectMessages());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  // Keeps optimistic deletions out of a stale Cloudflare snapshot while the delete request settles.
  const deletedPostIdsRef = useRef<Set<string>>(new Set());
  const deletedCommentIdsRef = useRef<Set<string>>(new Set());
  const pendingVoteSavesRef = useRef<Record<string, Post>>({});
  const emptyPostPollsRef = useRef(0);
  const hasLoadedPostsRef = useRef(false);

  // Dynamically re-resolve personal vote highlights whenever the active user changes
  useEffect(() => {
    setPosts((prev) => prev.map((p) => resolvePostForUser(p, currentUser?.id)));
    setComments((prev) => {
      const updated: Record<string, Comment[]> = {};
      for (const [postId, list] of Object.entries(prev)) {
        updated[postId] = list.map((c) => resolveCommentForUser(c, currentUser?.id));
      }
      return updated;
    });
  }, [currentUser?.id]);

  // Restore the Cloudflare HttpOnly cookie session after refresh.
  useEffect(() => {
    let active = true;
    cloudflareApi.me().then(({ user: sessionUser }) => {
      if (!active) return;
      if (!sessionUser) { setCurrentUser(null); return; }
      const cachedProfile = storage.getUsers().find((user) => user.id === sessionUser.id);
      // Cloudflare is authoritative for profile media. Local data is only a
      // fallback, so an old image from another browser must not briefly replace
      // the newer server version after a refresh.
      void Promise.all([
        storage.getProfileMediaBackup(sessionUser.id).catch(() => null),
        cloudSync.fetchUserMedia(sessionUser.id).catch(() => ({} as Partial<User>)),
      ]).then(([cachedMedia, remoteMedia]) => {
        if (!active) return;

        const hasRemoteAvatar = Object.prototype.hasOwnProperty.call(remoteMedia, 'avatar');
        const hasRemoteBanner = Object.prototype.hasOwnProperty.call(remoteMedia, 'banner');
        const avatar = hasRemoteAvatar ? (remoteMedia.avatar || DEFAULT_USER_AVATAR) : (sessionUser.avatar || cachedMedia?.avatar || cachedProfile?.avatar || DEFAULT_USER_AVATAR);
        const banner = hasRemoteBanner ? (remoteMedia.banner || '') : (sessionUser.banner || cachedMedia?.banner || cachedProfile?.banner || '');

        const profile = {
          ...sessionUser,
          ...(cachedProfile || {}),
          // Never let cachedProfile overwrite newer server media.
          avatar,
          banner,
          profileColor: sessionUser.profileColor ?? cachedProfile?.profileColor,
          displayNameColor: sessionUser.displayNameColor ?? cachedProfile?.displayNameColor,
          bio: sessionUser.bio || cachedProfile?.bio || '',
          status: sessionUser.status || cachedProfile?.status || 'online' as UserStatus,
          customStatus: sessionUser.customStatus || cachedProfile?.customStatus || '',
          badges: sessionUser.badges || cachedProfile?.badges || ['Member'],
          karma: sessionUser.karma ?? cachedProfile?.karma ?? 0,
          joinedDate: sessionUser.joinedDate || cachedProfile?.joinedDate || 'Joined today',
          followersCount: sessionUser.followersCount ?? cachedProfile?.followersCount ?? 0,
          followingCount: sessionUser.followingCount ?? cachedProfile?.followingCount ?? 0,
          isFollowing: sessionUser.isFollowing ?? cachedProfile?.isFollowing ?? false,
        };
        setUsers((previous) => previous.some((user) => user.id === profile.id) ? previous.map((user) => user.id === profile.id ? profile : user) : [profile, ...previous]);
        setCurrentUser(profile);

        if (hasRemoteAvatar || hasRemoteBanner) {
          void storage.saveProfileMediaBackup(sessionUser.id, {
            avatar: hasRemoteAvatar ? remoteMedia.avatar : avatar,
            banner: hasRemoteBanner ? remoteMedia.banner : banner,
          });
        }
      });
    }).catch(() => {
      if (active) setCurrentUser(null);
    });
    return () => { active = false; };
  }, []);

  // --- Real-time Cloud Conversations Subscription ---
  useEffect(() => {
    if (!currentUser?.id) {
      setConversations([]);
      setActiveConversationId(null);
      return;
    }

    const unsubConvs = cloudSync.subscribeConversations(currentUser.id, (remoteConvs) => {
      if (!Array.isArray(remoteConvs)) return;
      const resolved = remoteConvs
        .filter(Boolean)
        .map((c) => resolveConversationForUser(c, currentUser, users));
      resolved.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      setConversations(resolved);

      setActiveConversationId((currentActive) => {
        if (!currentActive && resolved.length > 0) {
          return resolved[0].id;
        }
        return currentActive;
      });
    });

    return () => {
      unsubConvs();
    };
  }, [currentUser?.id, users]);

  // --- Real-time Cloud Direct Messages Subscription for Active Conversation ---
  useEffect(() => {
    if (!activeConversationId) return;

    const unsubMsgs = cloudSync.subscribeMessages(activeConversationId, (remoteMsgs) => {
      if (!Array.isArray(remoteMsgs)) return;
      setDirectMessages((prev) => ({
        ...prev,
        [activeConversationId]: remoteMsgs,
      }));
    });

    return () => {
      unsubMsgs();
    };
  }, [activeConversationId]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authModalOpen, setAuthModalOpenState] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [editProfileModalOpen, setEditProfileModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Keep the browser Back button inside the SPA instead of leaving the app or
  // resetting the user to the feed.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const snapshot = {
      dzcore: true,
      activeTab,
      feedSort,
      selectedCommunitySlug,
      selectedPostId,
      selectedUserId,
      isInsideChat,
      activeConversationId,
    };

    if (!historyInitializedRef.current) {
      window.history.replaceState(snapshot, '', window.location.href);
      historyInitializedRef.current = true;
      return;
    }

    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      return;
    }

    window.history.pushState(snapshot, '', window.location.href);
  }, [activeTab, feedSort, selectedCommunitySlug, selectedPostId, selectedUserId, isInsideChat, activeConversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const restoreFromHistory = (event: PopStateEvent) => {
      const state = event.state;
      if (!state?.dzcore) return;
      restoringHistoryRef.current = true;
      setActiveTab(state.activeTab || 'feed');
      setFeedSort(state.feedSort || 'hot');
      setSelectedCommunitySlug(state.selectedCommunitySlug ?? null);
      setSelectedPostId(state.selectedPostId ?? null);
      setSelectedUserId(state.selectedUserId ?? null);
      setIsInsideChat(Boolean(state.isInsideChat));
      setActiveConversationId(state.activeConversationId ?? null);
    };
    window.addEventListener('popstate', restoreFromHistory);
    return () => window.removeEventListener('popstate', restoreFromHistory);
  }, []);

  // --- Real-time Cloud Synchronization (Cloudflare) ---
  useEffect(() => {
    setCloudSyncStatus('syncing');

    // Subscribe to remote posts live. This is the single initial post read;
    // a separate fetch here would double Cloudflare reads and exhaust quotas.
    const unsubPosts = cloudSync.subscribePosts((remotePosts) => {
      setCloudSyncStatus('connected');
      if (Array.isArray(remotePosts)) {
        const cleanRemote = remotePosts
          .filter(
            (p) => Boolean(p && p.id && p.id !== 'post_official_welcome' && !p.deleted && !deletedPostIdsRef.current.has(p.id))
          )
          .map((p) => {
            // Never let a polling response overwrite a local vote while that
            // vote is still being persisted. The remote snapshot can briefly
            // be older than the optimistic state.
            const pending = pendingVoteSavesRef.current[p.id];
            if (!pending) return resolvePostForUser(p, currentUser?.id);

            const mergedVotes = { ...(p.votes || {}) };
            const mergedVoteState = { ...(p.voteState || {}) };
            const pendingVotes = pending.votes || {};
            const pendingVoteState = pending.voteState || {};

            for (const [userId, state] of Object.entries(pendingVoteState)) {
              if (state === 0) {
                delete mergedVotes[userId];
                mergedVoteState[userId] = 0;
              } else if (state === 1 || state === -1) {
                mergedVotes[userId] = pendingVotes[userId] ?? state;
                mergedVoteState[userId] = state;
              }
            }

            return resolvePostForUser({
              ...p,
              votes: mergedVotes,
              voteState: mergedVoteState,
              upvotes: Object.values(mergedVotes).filter((vote) => vote === 1).length,
              downvotes: Object.values(mergedVotes).filter((vote) => vote === -1).length,
            }, currentUser?.id);
          });

        if (cleanRemote.length === 0) {
          emptyPostPollsRef.current += 1;
          if (emptyPostPollsRef.current < 2 && hasLoadedPostsRef.current) return;
        } else {
          emptyPostPollsRef.current = 0;
        }
        setPosts(cleanRemote);
        hasLoadedPostsRef.current = true;
      }
    });

    // Communities and the complete user/media catalog are noncritical for the
    // first paint. Let the feed render first, then hydrate them in the background.
    const backgroundSync = window.setTimeout(() => {
      cloudSync.fetchCommunities().then((remoteComms) => {
        if (remoteComms && remoteComms.length > 0) {
          setCommunities((local) => {
            const remoteIds = new Set(remoteComms.map((c) => c.id));
            const localOnly = local.filter((c) => !remoteIds.has(c.id));
            return [...remoteComms, ...localOnly];
          });
        }
      }).catch(() => {});

    }, 0);

    return () => {
      window.clearTimeout(backgroundSync);
      unsubPosts();
    };
  }, []);

  // Refresh the user/media catalog after the authenticated session is known.
  // The old implementation captured currentUser=null inside a [] effect.
  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    cloudSync.fetchCommunities(currentUser.id).then((remoteComms) => {
      if (!active || !remoteComms?.length) return;
      setCommunities((local) => {
        const remoteIds = new Set(remoteComms.map((c) => c.id));
        return [...remoteComms, ...local.filter((c) => !remoteIds.has(c.id))];
      });
    }).catch((error) => console.warn('[Cloudflare] communities sync failed:', error));

    cloudSync.fetchUsers(currentUser.id).then((remoteUsers) => {
      if (!active || !remoteUsers?.length) return;
      setUsers((local) => {
        const remoteIds = new Set(remoteUsers.map((u) => u.id));
        const localOnly = local.filter((u) => !remoteIds.has(u.id));
        return [
          ...remoteUsers.map((remote) => {
            const cached = local.find((user) => user.id === remote.id);
            return {
              ...cached,
              ...remote,
              avatar: remote.avatar || cached?.avatar || DEFAULT_USER_AVATAR,
              banner: remote.banner || cached?.banner || '',
            };
          }),
          ...localOnly,
        ];
      });
    }).catch((error) => console.warn('[Cloudflare] users sync failed:', error));
    return () => { active = false; };
  }, [currentUser?.id]);

  // Sync to localStorage
  useEffect(() => { storage.saveUsers(users); }, [users]);
  useEffect(() => { storage.saveCurrentUserId(currentUser ? currentUser.id : null); }, [currentUser]);
  useEffect(() => { storage.savePosts(posts); }, [posts]);
  useEffect(() => {
    const pending = pendingVoteSavesRef.current;
    pendingVoteSavesRef.current = {};
    Object.values(pending).forEach((post) => { void cloudSync.savePost(post); });
  }, [posts]);
  useEffect(() => { storage.saveCommunities(communities); }, [communities]);
  useEffect(() => { storage.saveComments(comments); }, [comments]);
  useEffect(() => { storage.saveConversations(conversations); }, [conversations]);
  useEffect(() => { storage.saveDirectMessages(directMessages); }, [directMessages]);
  useEffect(() => { storage.saveNotifications(notifications); }, [notifications]);

  // Auto toast dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3200);
    return () => clearTimeout(timer);
  }, [toasts]);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const setAuthModalOpen = (open: boolean, mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpenState(open);
  };

  // Navigators
  const navigateToFeed = (sort: FeedSortOption = 'hot') => {
    setFeedSort(sort);
    setSelectedCommunitySlug(null);
    setSelectedPostId(null);
    setSelectedUserId(null);
    setIsInsideChat(false);
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCommunity = (slug: string) => {
    setSelectedCommunitySlug(slug);
    setSelectedPostId(null);
    setSelectedUserId(null);
    setIsInsideChat(false);
    setActiveTab('community-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPost = (postId: string) => {
    setSelectedPostId(postId);
    setIsInsideChat(false);
    setActiveTab('post-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync remote comments for this post
    cloudSync.fetchComments(postId).then((remoteComments) => {
      const cleanRemote = remoteComments
        .filter((comment) => !deletedCommentIdsRef.current.has(comment.id))
        .map((comment) => resolveCommentForUser(comment, currentUser?.id));
      // Cloudflare is authoritative after a refresh. Do not merge stale localStorage
      // comments back into the post, otherwise another device can see deleted data.
      setComments((prev) => ({ ...prev, [postId]: cleanRemote }));

      // Keep post.commentCount in exact alignment with actual existing comments
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId && p.commentCount !== cleanRemote.length) {
            const updated = { ...p, commentCount: cleanRemote.length };
            cloudSync.savePost(updated);
            return updated;
          }
          return p;
        })
      );
    }).catch(() => {
      // Keep the current local view only when the cloud request genuinely fails.
    });
  };

  // Allow the admin panel to open a specific post directly with ?post=ID.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const postId = new URLSearchParams(window.location.search).get('post');
    if (!postId) return;
    navigateToPost(postId);
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedPostId(null);
    setSelectedCommunitySlug(null);
    setIsInsideChat(false);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMessages = (userIdOrConvId?: string) => {
    setActiveTab('messages');
    setSelectedPostId(null);
    setSelectedCommunitySlug(null);

    if (userIdOrConvId) {
      const existingConv = conversations.find(
        (c) => c.id === userIdOrConvId || c.participant.id === userIdOrConvId
      );
      if (existingConv) {
        setActiveConversationId(existingConv.id);
        setIsInsideChat(true);
      } else {
        startConversationWithUser(userIdOrConvId);
      }
    } else {
      setIsInsideChat(false);
    }
  };

  const navigateToCreatePost = (communitySlug?: string) => {
    if (communitySlug) {
      setSelectedCommunitySlug(communitySlug);
    }
    setIsInsideChat(false);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToNotifications = () => {
    setIsInsideChat(false);
    setActiveTab('notifications');
  };

  const navigateToSettings = () => {
    setIsInsideChat(false);
    setActiveTab('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSearch = (query?: string) => {
    setIsInsideChat(false);
    if (query !== undefined) {
      setSearchQuery(query);
    }
    setActiveTab('search');
  };

  useEffect(() => {
    if (!currentUser?.id) { setNotifications([]); return; }
    const unsubscribe = cloudSync.subscribeNotifications(currentUser.id, (remote) => {
      setNotifications((previous) => {
        const merged = new Map(previous.map((item) => [item.id, item]));
        remote.forEach((item) => {
          const previous = merged.get(item.id);
          // Read state is sticky: once the user has read a notification, a stale
          // remote poll must not turn it back into unread.
          merged.set(item.id, {
            ...previous,
            ...item,
            isRead: Boolean(previous?.isRead || item.isRead),
          });
        });
        return Array.from(merged.values())
          .sort((a, b) => b.id.localeCompare(a.id))
          .slice(0, 100);
      });
    });
    return unsubscribe;
  }, [currentUser?.id]);

  // Interactions (Upvote/Downvote/Save)
  const addActivityNotification = (recipientId: string | undefined, type: NotificationItem['type'], actor: User, title: string, message: string, targetType: NotificationItem['targetType'], targetId: string) => {
    if (!currentUser || !recipientId || recipientId === actor.id || !actor) return;
    const item: NotificationItem = { id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, recipientId, type, actor, title, message, timestamp: language === 'ar' ? 'الآن' : language === 'fr' ? 'À l’instant' : 'Just now', isRead: false, targetType, targetId };
    cloudSync.saveNotification(item).catch((error) => console.error('[Cloudflare] Notification save failed', error));
    if (recipientId === currentUser.id) setNotifications((prev) => [item, ...prev].slice(0, 100));
  };

  const applyPostVote = (postId: string, desiredVote: 1 | -1) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const existing = posts.find((post) => post.id === postId);
    if (!existing) return;

    const userId = currentUser.id;
    const votes: Record<string, 1 | -1> = { ...(existing.votes || {}) };
    const voteState: Record<string, 1 | -1 | 0> = { ...(existing.voteState || {}) };
    const currentVote = voteState[userId] === 0 ? null : (votes[userId] ?? null);
    // Clicking the same active arrow cancels the vote (returns to neutral 0).
    // Clicking the opposite arrow switches directly to the new vote.
    if (currentVote === desiredVote) {
      delete votes[userId];
      voteState[userId] = 0;
    } else {
      votes[userId] = desiredVote;
      voteState[userId] = desiredVote;
    }

    const updated: Post = {
      ...existing,
      votes,
      voteState,
      upvotes: Object.values(votes).filter((vote) => vote === 1).length,
      downvotes: Object.values(votes).filter((vote) => vote === -1).length,
      userVote: votes[userId] ?? null,
    };

    // Mark the vote as pending before updating React state. This prevents
    // the 10-second remote poll from replacing the optimistic vote with an
    // older server snapshot while the save is in flight.
    pendingVoteSavesRef.current[postId] = updated;
    setPosts((previous) => previous.map((post) => (post.id === postId ? updated : post)));
    // Save immediately, including an empty votes map after removing a vote.
    void cloudSync.savePost(updated).finally(() => {
      const pending = pendingVoteSavesRef.current[postId];
      if (pending === updated) {
        delete pendingVoteSavesRef.current[postId];
      }
    });

    if (updated.userVote === desiredVote && existing.author.id !== currentUser.id) {
      addActivityNotification(
        existing.author.id,
        desiredVote === 1 ? 'upvote' : 'downvote',
        currentUser,
        desiredVote === 1
          ? (language === 'ar' ? 'إعجاب جديد بمنشورك' : language === 'fr' ? 'Nouveau j’aime' : 'New like on your post')
          : (language === 'ar' ? 'عدم إعجاب بمنشورك' : language === 'fr' ? 'Nouveau je n’aime pas' : 'New dislike on your post'),
        desiredVote === 1
          ? (language === 'ar' ? `أعجب @${currentUser.username} بمنشورك` : language === 'fr' ? `@${currentUser.username} a aimé votre publication` : `@${currentUser.username} liked your post`)
          : (language === 'ar' ? `لم يعجب @${currentUser.username} بمنشورك` : language === 'fr' ? `@${currentUser.username} n’a pas aimé votre publication` : `@${currentUser.username} disliked your post`),
        'post',
        postId
      );
    }
  };

  const upvotePost = (postId: string) => applyPostVote(postId, 1);
  const downvotePost = (postId: string) => applyPostVote(postId, -1);

  const toggleSavePost = (postId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const savedBy = { ...(p.savedBy || {}) };
          const nextSaved = !Boolean(savedBy[currentUser.id]);
          if (nextSaved) savedBy[currentUser.id] = true;
          else delete savedBy[currentUser.id];
          showToast(
            nextSaved
              ? (language === 'ar' ? 'تم حفظ المنشور في قائمتك' : 'Post saved to your list')
              : (language === 'ar' ? 'تمت إزالة المنشور من المحفوظات' : 'Post removed from saved'),
            'info'
          );
          const updated = { ...p, savedBy, isSaved: nextSaved };
          pendingVoteSavesRef.current[p.id] = updated;
          return updated;
        }
        return p;
      })
    );
  };

  const createPost = (postData: {
    communitySlug?: string;
    title: string;
    content: string;
    mediaType: 'text' | 'image' | 'video' | 'link';
    mediaUrl?: string;
    linkUrl?: string;
    tags: string[];
  }) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const effectiveSlug = postData.communitySlug || 'dz/general';
    const targetCommunity = communities.find((c) => c.slug === effectiveSlug);
    const now = Date.now();
    const newPostId = `post_${crypto.randomUUID()}`;

    const cleanAuthor: User = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      banner: currentUser.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: currentUser.bio || '',
      status: currentUser.status || 'online',
      badges: currentUser.badges || [],
      karma: currentUser.karma || 0,
      joinedDate: currentUser.joinedDate || '2026',
      followersCount: currentUser.followersCount || 0,
      followingCount: currentUser.followingCount || 0,
    };

    const newPost: Post = {
      id: newPostId,
      author: cleanAuthor,
      communitySlug: effectiveSlug,
      communityName: targetCommunity ? targetCommunity.name : 'DZCORE',
      communityIcon: targetCommunity
        ? targetCommunity.icon
        : 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=120&q=80',
      title: postData.title,
      content: postData.content,
      mediaType: postData.mediaType,
      mediaUrl: postData.mediaUrl || '',
      linkUrl: postData.linkUrl || '',
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      votes: {},
      commentCount: 0,
      createdAt: formatRelativeTime(now, language, language === 'ar' ? 'الآن' : language === 'fr' ? 'À l’instant' : 'Just now'),
      timestamp: now,
      tags: postData.tags,
      isSaved: false,
      savedBy: {},
    };

    setPosts((prev) => [newPost, ...prev]);
    setComments((prev) => ({ ...prev, [newPostId]: [] }));

    // Real-time Cloud Save. Roll back the optimistic post if the server rejects it.
    void cloudSync.savePost(newPost).catch(() => {
      setPosts((prev) => prev.filter((post) => post.id !== newPostId));
      setComments((prev) => {
        const copy = { ...prev };
        delete copy[newPostId];
        return copy;
      });
      showToast(language === 'ar' ? 'تعذر حفظ المنشور على السيرفر' : 'The post could not be saved to the server', 'warning');
    });

    showToast(language === 'ar' ? 'تم نشر موضوعك وحفظه في السيرفر! 🚀' : 'Post published and saved to cloud! 🚀', 'success');
    navigateToPost(newPostId);
  };
  const deletePost = (postId: string) => {
    if (!currentUser) return;
    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete || postToDelete.author.id !== currentUser.id) return;

    deletedPostIdsRef.current.add(postId);
    setCloudSyncStatus('syncing');
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setComments((prev) => {
      const copy = { ...prev };
      delete copy[postId];
      return copy;
    });

    // Cloud Delete. If it fails, restore the post instead of silently losing the user's data.
    cloudSync.deletePost(postId).then((deleted) => {
      if (deleted) {
        setCloudSyncStatus('connected');
        showToast(language === 'ar' ? 'تم حذف المنشور نهائياً' : 'Post permanently deleted', 'success');
        return;
      }
      setCloudSyncStatus('connected');
      deletedPostIdsRef.current.delete(postId);
      setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [postToDelete, ...prev]));
      showToast(language === 'ar' ? 'تعذر حذف المنشور من السيرفر' : 'The post could not be deleted from the server', 'warning');
    });
    if (selectedPostId === postId) {
      navigateToFeed();
    }
  };

  const submitReport = async (targetType: 'post' | 'user' | 'comment', targetId: string, reason: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return false;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) return false;
    try {
      await cloudflareApi.submitReport(targetType, targetId, trimmedReason);
      showToast(language === 'ar' ? 'تم إرسال البلاغ إلى الإدارة' : 'Report sent to moderators', 'success');
      return true;
    } catch {
      showToast(language === 'ar' ? 'تعذر إرسال البلاغ' : 'Could not send the report', 'warning');
      return false;
    }
  };

  // Comments
  const addComment = (postId: string, content: string, parentId?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const commentNow = Date.now();
    const newComment: Comment = {
      id: `comment_${crypto.randomUUID()}`,
      postId,
      author: currentUser,
      content,
      createdAt: formatRelativeTime(commentNow, language, language === 'ar' ? 'الآن' : language === 'fr' ? 'À l’instant' : 'Just now'),
      timestamp: commentNow,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      votes: {},
      parentId,
      replies: [],
    };

    setComments((prev) => {
      const postComments = prev[postId] || [];
      if (!parentId) {
        return { ...prev, [postId]: [newComment, ...postComments] };
      }

      const appendReply = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: appendReply(c.replies) };
          }
          return c;
        });
      };

      return { ...prev, [postId]: appendReply(postComments) };
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updated = {
            ...p,
            commentCount: p.commentCount + 1,
            lastCommentTimestamp: commentNow,
          };
          cloudSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Cloud Save Comment
    cloudSync.saveComment(postId, newComment);
    const targetPost = posts.find((p) => p.id === postId);
    const targetComment = parentId ? (comments[postId] || []).flatMap((c) => [c, ...(c.replies || [])]).find((c) => c.id === parentId) : null;
    const recipientId = parentId ? targetComment?.author.id : targetPost?.author.id;
    addActivityNotification(recipientId, parentId ? 'reply' : 'comment', currentUser, parentId ? (language === 'ar' ? 'رد جديد على تعليقك' : language === 'fr' ? 'Nouvelle réponse' : 'New reply') : (language === 'ar' ? 'تعليق جديد على منشورك' : language === 'fr' ? 'Nouveau commentaire' : 'New comment'), parentId ? `@${currentUser.username} replied to your comment` : `@${currentUser.username} commented on your post`, 'post', postId);

    showToast(language === 'ar' ? 'تمت إضافة التعليق وحفظه سحابياً' : 'Comment saved to cloud', 'success');
  };

  const deleteComment = (postId: string, commentId: string) => {
    if (!currentUser) return;
    const previousComments = comments[postId] || [];
    const idsToDelete: string[] = [];
    let removedCount = 0;

    const collectIds = (comment: Comment) => {
      idsToDelete.push(comment.id);
      removedCount += 1;
      comment.replies?.forEach(collectIds);
    };

    const removeRecursive = (list: Comment[]): Comment[] => {
      const filtered: Comment[] = [];
      for (const c of list) {
        if (c.id === commentId) {
          collectIds(c);
          continue;
        }
        if (c.replies && c.replies.length > 0) {
          filtered.push({ ...c, replies: removeRecursive(c.replies) });
        } else {
          filtered.push(c);
        }
      }
      return filtered;
    };

    const nextComments = removeRecursive(previousComments);
    if (idsToDelete.length === 0) return;
    idsToDelete.forEach((id) => deletedCommentIdsRef.current.add(id));

    setComments((prev) => {
      return { ...prev, [postId]: nextComments };
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updated = { ...p, commentCount: Math.max(0, nextComments.length) };
          cloudSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Delete the selected comment and all nested replies as one cloud operation.
    cloudSync.deleteComments(postId, idsToDelete).then((deleted) => {
      if (deleted) {
        showToast(language === 'ar' ? 'تم حذف التعليق نهائياً' : 'Comment permanently deleted', 'success');
        return;
      }

      idsToDelete.forEach((id) => deletedCommentIdsRef.current.delete(id));
      setComments((prev) => ({ ...prev, [postId]: previousComments }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + removedCount } : p
        )
      );
      showToast(language === 'ar' ? 'تعذر حذف التعليق من السيرفر' : 'The comment could not be deleted from the server', 'warning');
    });
  };

  const upvoteComment = (postId: string, commentId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const userId = currentUser.id;
    const findComment = (list: Comment[]): Comment | null => {
      for (const comment of list) {
        if (comment.id === commentId) return comment;
        if (comment.replies?.length) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };

    const existingComment = findComment(comments[postId] || []);
    const previousVote = existingComment?.votes?.[userId] ?? (existingComment?.userVote === 1 ? 1 : null);

    setComments((prev) => {
      const existing = prev[postId] || [];
      const updateVote = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === commentId) {
            const currentVotes: Record<string, 1 | -1> = { ...(c.votes || {}) };
            const myVote = currentVotes[userId] ?? (c.userVote === 1 ? 1 : c.userVote === -1 ? -1 : null);

            if (myVote === 1) {
              delete currentVotes[userId];
            } else {
              currentVotes[userId] = 1;
            }

            const upvotes = Object.values(currentVotes).filter((v) => v === 1).length;
            const downvotes = Object.values(currentVotes).filter((v) => v === -1).length;
            const nextUserVote: 1 | -1 | null = currentVotes[userId] ?? null;

            const updated: Comment = {
              ...c,
              votes: currentVotes,
              upvotes,
              downvotes,
              userVote: nextUserVote,
            };
            void cloudSync.saveComment(postId, updated);
            return updated;
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateVote(c.replies) };
          }
          return c;
        });
      };
      return { ...prev, [postId]: updateVote(existing) };
    });

    // Notify the comment owner only when a new like is added, not when it is removed.
    if (existingComment && previousVote !== 1 && existingComment.author?.id !== currentUser.id) {
      addActivityNotification(
        existingComment.author.id,
        'upvote',
        currentUser,
        language === 'ar' ? 'إعجاب جديد بتعليقك' : language === 'fr' ? 'Nouveau j’aime sur votre commentaire' : 'New like on your comment',
        language === 'ar'
          ? `أعجب @${currentUser.username} بتعليقك`
          : language === 'fr'
            ? `@${currentUser.username} a aimé votre commentaire`
            : `@${currentUser.username} liked your comment`,
        'comment',
        commentId
      );
    }
  };
  // Communities
  const joinCommunity = (slug: string) => {
    if (!currentUser) { setAuthModalOpen(true, 'login'); return; }
    const community = communities.find((c) => c.slug === slug);
    if (!community) return;
    void cloudflareApi.setCommunityMembership(community.id, true).then((result) => {
      if (!result.changed) return;
      setCommunities((prev) => prev.map((c) => c.id === community.id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c));
      showToast(language === 'ar' ? `انضممت إلى مجتمع ${community.name}` : `Joined ${community.name}`, 'success');
    }).catch(() => showToast(language === 'ar' ? 'تعذر الانضمام إلى المجتمع' : 'Could not join the community', 'warning'));
  };

  const leaveCommunity = (slug: string) => {
    if (!currentUser) { setAuthModalOpen(true, 'login'); return; }
    const community = communities.find((c) => c.slug === slug);
    if (!community) return;
    void cloudflareApi.setCommunityMembership(community.id, false).then((result) => {
      if (!result.changed) return;
      setCommunities((prev) => prev.map((c) => c.id === community.id ? { ...c, isMember: false, memberCount: Math.max(0, c.memberCount - 1) } : c));
      showToast(language === 'ar' ? `غادرت مجتمع ${community.name}` : `Left ${community.name}`, 'info');
    }).catch(() => showToast(language === 'ar' ? 'تعذر مغادرة المجتمع' : 'Could not leave the community', 'warning'));
  };

  const createCommunity = (
    name: string,
    description: string,
    category: string,
    iconUrl?: string,
    bannerUrl?: string
  ) => {
    if (!currentUser) { setAuthModalOpen(true, 'login'); return; }
    const cleanSlugPart = name.toLowerCase().replace(/[^a-z0-9]/g, '') || `hub_${Date.now()}`;
    const slug = `c/${cleanSlugPart}`;
    if (communities.some((c) => c.slug === slug)) {
      showToast(language === 'ar' ? 'يوجد مجتمع بهذا المعرف بالفعل!' : 'A community with this slug already exists!', 'warning');
      return;
    }
    const newComm: Community = {
      id: `comm_${crypto.randomUUID()}`,
      name, slug, description,
      icon: iconUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
      banner: bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      memberCount: 0, onlineCount: 1, isMember: false,
      category: category || (language === 'ar' ? 'عام' : 'General'),
      createdAt: language === 'ar' ? 'تأسس اليوم' : 'Created today',
      rules: [{ id: 'r1', title: language === 'ar' ? 'الاحترام المتبادل' : 'Mutual Respect', description: language === 'ar' ? 'النقاش البناء والمحترم هو أساس المجتمع.' : 'Constructive and polite communication.' }],
      moderators: [{ username: currentUser.username, displayName: currentUser.displayName, avatar: currentUser.avatar, role: language === 'ar' ? 'مؤسس' : 'Founder' }],
    };
    void cloudSync.saveCommunity(newComm)
      .then(() => cloudflareApi.setCommunityMembership(newComm.id, true))
      .then(() => {
        setCommunities((prev) => [{ ...newComm, isMember: true, memberCount: 1 }, ...prev]);
        showToast(language === 'ar' ? 'تم إنشاء المجتمع وحفظه سحابياً! 🎉' : 'Community saved to cloud! 🎉', 'success');
        navigateToCommunity(slug);
      })
      .catch(() => showToast(language === 'ar' ? 'تعذر حفظ المجتمع على السيرفر' : 'The community could not be saved to the server', 'warning'));
  };

  // Messaging
  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsInsideChat(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const startConversationWithUser = async (targetUserId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    if (targetUserId === currentUser.id) {
      showToast(
        language === 'ar' ? 'لا يمكنك مراسلة نفسك!' : 'You cannot message yourself!',
        'warning'
      );
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      showToast(language === 'ar' ? 'المستخدم غير موجود' : 'User not found', 'warning');
      return;
    }

    // Canonical conversation ID based on sorted user IDs
    const convId = `dm_${[currentUser.id, targetUserId].sort().join('__')}`;

    const existingConv = conversations.find(
      (c) => c.id === convId || c.participant?.id === targetUserId
    );
    if (existingConv) {
      setActiveConversationId(existingConv.id);
      setIsInsideChat(true);
      setActiveTab('messages');
      return;
    }

    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newConv: Conversation = {
      id: convId,
      participantIds: [currentUser.id, targetUserId],
      participants: {
        [currentUser.id]: currentUser,
        [targetUserId]: targetUser,
      },
      participant: targetUser,
      lastMessage: language === 'ar' ? 'محادثة جديدة' : 'New conversation',
      lastMessageTime: formattedTime,
      lastMessageTimestamp: now,
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== convId)]);
    setDirectMessages((prev) => ({ ...prev, [convId]: [] }));

    await cloudSync.saveConversation(newConv);

    setActiveConversationId(convId);
    setIsInsideChat(true);
    setActiveTab('messages');
  };

  const sendDirectMessage = async (text: string, mediaUrl?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg: DirectMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      text,
      timestamp: formattedTime,
      createdAt: now,
      mediaUrl,
      isRead: false,
    };

    // Optimistic local state update
    setDirectMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }));

    const otherUser = currentConv.participant;
    const participantIds = currentConv.participantIds || [currentUser.id, otherUser.id];
    const participants = currentConv.participants || {
      [currentUser.id]: currentUser,
      [otherUser.id]: otherUser,
    };

    const displayLastMessage = text.trim() || (mediaUrl ? (language === 'ar' ? '📷 صورة' : '📷 Photo') : '');

    const updatedConv: Conversation = {
      ...currentConv,
      participantIds,
      participants,
      lastMessage: displayLastMessage,
      lastMessageTime: formattedTime,
      lastMessageTimestamp: now,
      lastSenderId: currentUser.id,
      unreadCount: 0,
    };

    setConversations((prev) => [
      updatedConv,
      ...prev.filter((c) => c.id !== activeConversationId),
    ]);

    // Save message and updated conversation to Cloud Cloudflare in real time
    await cloudSync.saveDirectMessage(activeConversationId, newMsg);
    await cloudSync.saveConversation(updatedConv);
  };

  // Follow user
  const toggleFollowUser = (userId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    if (userId === currentUser.id) return;

    const target = users.find((u) => u.id === userId);
    const nextFollowing = target ? !target.isFollowing : false;
    if (target && nextFollowing) {
      addActivityNotification(
        userId,
        'follow',
        currentUser,
        language === 'ar' ? 'متابع جديد' : language === 'fr' ? 'Nouvel abonné' : 'New follower',
        language === 'ar' ? `بدأ @${currentUser.username} بمتابعتك` : language === 'fr' ? `@${currentUser.username} vous suit maintenant` : `@${currentUser.username} started following you`,
        'profile',
        currentUser.id
      );
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextFollowing = !u.isFollowing;
          const updated = {
            ...u,
            isFollowing: nextFollowing,
            followersCount: nextFollowing ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
          };
          void cloudSync.saveFollow(currentUser.id, userId, nextFollowing).catch((error) => console.error('[Cloudflare] Follow save failed:', error));
          void cloudSync.saveUser(updated).catch((error) => console.error('[Cloudflare] Follower count save failed:', error));
          return updated;
        }
        return u;
      })
    );
  };

  const updateCurrentUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    // Wait for Cloudflare to verify every media chunk instead of reporting a
    // success while a browser may still be closing or going offline.
    try {
      await cloudSync.saveUser(updated);
    } catch (error) {
      console.error('[Cloudflare] Profile save failed:', error);
      showToast(
        language === 'ar'
          ? 'تم حفظ التعديل على هذا الجهاز، لكن تعذر رفع الصورة للسحابة. جرّب GIF أصغر.'
          : 'Saved on this device, but cloud upload failed. Try a smaller GIF.',
        'warning'
      );
      throw error;
    }

    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    void storage.saveProfileMediaBackup(updated.id, { avatar: updated.avatar, banner: updated.banner })
      .catch((error) => console.warn('[Storage] Profile media backup failed:', error));

    // Keep posts independent from profile updates. Rewriting every authored
    // post here can race with feed sync and make posts disappear.
    setComments((prev) => {
      const next: Record<string, Comment[]> = {};
      for (const [postId, list] of Object.entries(prev)) next[postId] = list.map((c) => c.author.id === currentUser.id ? { ...c, author: updated } : c);
      return next;
    });

    showToast(
      language === 'ar' ? 'تم تحديث ملفك وحفظه في السيرفر' : 'Profile updated and saved to cloud',
      'success'
    );
  };

  const updateUserStatus = (status: UserStatus, customStatus?: string) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      status,
      ...(customStatus !== undefined ? { customStatus } : {}),
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    cloudSync.saveUser(updated);
    showToast(
      language === 'ar' ? 'تم تحديث حالة التواجد' : 'Status presence updated',
      'info'
    );
  };

  // Notifications
  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      // Persist the read state remotely so it survives refreshes and other devices.
      updated.forEach((notification) => {
        void cloudSync.saveNotification(notification).catch((error) =>
          console.error('[Cloudflare] Failed to persist notification read state:', error)
        );
      });
      return updated;
    });
    showToast(
      language === 'ar' ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read',
      'info'
    );
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
      const notification = updated.find((n) => n.id === notificationId);
      if (notification) {
        void cloudSync.saveNotification(notification).catch((error) =>
          console.error('[Cloudflare] Failed to persist notification read state:', error)
        );
      }
      return updated;
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Cloudflare D1 Authentication
  const login = async (usernameOrEmail: string, password?: string): Promise<boolean> => {
    const term = usernameOrEmail.trim().toLowerCase();
    let profile = users.find(
      (u) => u.username.toLowerCase() === term || (u.email && u.email.toLowerCase() === term)
    );
    if (!profile && !term.includes('@')) {
      const remoteUsers = await cloudSync.fetchUsers().catch(() => [] as User[]);
      profile = remoteUsers.find((u) => u.username.toLowerCase() === term);
      if (remoteUsers.length > 0) {
        setUsers((local) => {
          const remoteIds = new Set(remoteUsers.map((u) => u.id));
          return [...remoteUsers, ...local.filter((u) => !remoteIds.has(u.id))];
        });
      }
    }
    // A profile row may be unavailable while Cloudflare is loading or after a
    // migration. If the user entered an email, authenticate directly instead
    // of requiring the profile document to exist first.
    const email = profile?.email?.trim() || (term.includes('@') ? term : '');

    if (!email || !password) {
      showToast(
        language === 'ar'
          ? 'أدخل البريد الإلكتروني وكلمة المرور. تسجيل الدخول باسم المستخدم يتطلب وجود ملفك في قاعدة البيانات.'
          : 'Enter your email and password. Username login requires your profile to be available.',
        'warning'
      );
      return false;
    }

    try {
      const { user: sessionUser } = await cloudflareApi.login(term, password);
      const resolved = profile
        ? { ...profile, id: sessionUser.id, email: sessionUser.email }
        : ({
            id: sessionUser.id,
            username: sessionUser.username,
            displayName: sessionUser.displayName || sessionUser.username,
            email: sessionUser.email,
            avatar: DEFAULT_USER_AVATAR,
            banner: '',
            bio: '',
            status: 'online',
            customStatus: '',
            badges: ['Member'],
            karma: 0,
            joinedDate: 'Joined today',
            followersCount: 0,
            followingCount: 0,
            isFollowing: false,
          } as User);
      setCurrentUser(resolved);
      setUsers((previous) => previous.some((u) => u.id === resolved.id) ? previous.map((u) => u.id === resolved.id ? resolved : u) : [resolved, ...previous]);
      setAuthModalOpenState(false);
      showToast(
        language === 'ar' ? `مرحباً بعودتك، ${resolved.displayName}!` : `Welcome back, ${resolved.displayName}!`,
        'success'
      );
      return true;
    } catch (error: any) {
      console.error('[Cloudflare] Login failed:', error);
      showToast(
        language === 'ar'
          ? 'تعذر تسجيل الدخول. تحقق من البريد/اسم المستخدم وكلمة المرور.'
          : 'Could not sign in. Check your email/username and password.',
        'warning'
      );
      return false;
    }
  };

  const googleLogin = async (credential: string, profile?: { username?: string; displayName?: string }): Promise<boolean> => {
    try {
      const { user: sessionUser } = await cloudflareApi.googleLogin(credential, profile);
      const cached = users.find((u) => u.id === sessionUser.id);
      const resolved: User = {
        ...(cached || {}),
        ...sessionUser,
        id: sessionUser.id,
        username: sessionUser.username,
        displayName: sessionUser.displayName || sessionUser.username,
        email: sessionUser.email,
        avatar: sessionUser.avatar || cached?.avatar || DEFAULT_USER_AVATAR,
        banner: sessionUser.banner || cached?.banner || '',
        bio: sessionUser.bio || cached?.bio || '',
        status: sessionUser.status || cached?.status || 'online',
        customStatus: sessionUser.customStatus || cached?.customStatus || '',
        badges: sessionUser.badges || cached?.badges || ['Member'],
        karma: sessionUser.karma ?? cached?.karma ?? 0,
        joinedDate: sessionUser.joinedDate || cached?.joinedDate || 'Joined today',
        followersCount: sessionUser.followersCount ?? cached?.followersCount ?? 0,
        followingCount: sessionUser.followingCount ?? cached?.followingCount ?? 0,
        isFollowing: sessionUser.isFollowing ?? cached?.isFollowing ?? false,
      };
      setUsers((previous) => previous.some((u) => u.id === resolved.id) ? previous.map((u) => u.id === resolved.id ? resolved : u) : [resolved, ...previous]);
      setCurrentUser(resolved);
      setAuthModalOpenState(false);
      showToast(language === 'ar' ? `مرحباً، ${resolved.displayName}!` : `Welcome, ${resolved.displayName}!`, 'success');
      return true;
    } catch (error: any) {
      console.error('[Google] Login failed:', error);
      showToast(language === 'ar' ? 'تعذر تسجيل الدخول باستخدام Google.' : 'Could not sign in with Google.', 'warning');
      return false;
    }
  };

  const register = async (
    username: string,
    displayName: string,
    email: string,
    password = '',
    avatarUrl?: string
  ): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      showToast(language === 'ar' ? 'اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل' : 'Username must contain at least 3 characters', 'warning');
      return false;
    }
    if (password.length < 8) {
      showToast(language === 'ar' ? 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل' : 'Password must contain at least 8 characters', 'warning');
      return false;
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      showToast(language === 'ar' ? 'اسم المستخدم مستخدم بالفعل' : 'Username is already taken', 'warning');
      return false;
    }
    if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      showToast(language === 'ar' ? 'البريد الإلكتروني مسجل مسبقاً' : 'Email is already registered', 'warning');
      return false;
    }

    try {
      const { user: newUser } = await cloudflareApi.register({
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        email: cleanEmail,
        password,
        avatar: avatarUrl || DEFAULT_USER_AVATAR,
      });
      const normalizedUser: User = {
        ...newUser,
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        email: cleanEmail,
      };
      setUsers((prev) => [normalizedUser, ...prev]);
      setCurrentUser(normalizedUser);
      setAuthModalOpenState(false);
      showToast(language === 'ar' ? `أهلاً بك في DZCORE، ${normalizedUser.displayName}!` : `Welcome to DZCORE, ${normalizedUser.displayName}!`, 'success');
      return true;
    } catch (error: any) {
      console.error('[Cloudflare] Registration failed:', error);
      const message = error?.code === 'already_registered' ? 'Email is already registered' : 'Could not create the account';
      showToast(language === 'ar' ? 'تعذر إنشاء الحساب، تحقق من البيانات' : message, 'warning');
      return false;
    }
  };

  const updateAccountEmail = async (email: string, currentPassword: string) => {
    if (!currentUser) return false;
    try {
      const normalizedEmail = email.trim();
      await cloudflareApi.updateAccount({ email: normalizedEmail, currentPassword });
      const updatedUser = { ...currentUser, email: normalizedEmail };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((user) => user.id === updatedUser.id ? updatedUser : user));
      storage.saveUsers(users.map((user) => user.id === updatedUser.id ? updatedUser : user));
      await cloudSync.saveUser(updatedUser);
      showToast(language === 'ar' ? 'تم تحديث البريد الإلكتروني بنجاح' : 'Email updated successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('[Cloudflare] Email update failed:', error);
      showToast(language === 'ar' ? 'تعذر تغيير البريد الإلكتروني. تحقق من كلمة المرور والبريد.' : 'Could not update email. Check your password and email.', 'warning');
      return false;
    }
  };
  const updateAccountPassword = async (newPassword: string, currentPassword: string) => {
    if (!currentUser) return false;
    try {
      await cloudflareApi.updateAccount({ newPassword, currentPassword });
      showToast(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('[Cloudflare] Password update failed:', error);
      showToast(language === 'ar' ? 'تعذر تغيير كلمة المرور. تحقق من كلمة المرور الحالية.' : 'Could not update password. Check your current password.', 'warning');
      return false;
    }
  };
  const logout = async () => {
    try { await cloudflareApi.logout(); } catch { /* already signed out */ }
    setCurrentUser(null);
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
  };

  const switchUser = (userId: string) => {
    const userToSwitch = users.find((user) => user.id === userId);
    if (userToSwitch) {
      setCurrentUser(userToSwitch);
      showToast(`Switched to @${userToSwitch.username}`, 'info');
    }
  };

  const resetAllData = () => {
    storage.resetAll();
    setUsers(storage.getUsers());
    setCurrentUser(null);
    setPosts(storage.getPosts());
    setCommunities(storage.getCommunities());
    setComments(storage.getComments());
    setConversations(storage.getConversations());
    setDirectMessages(storage.getDirectMessages());
    setNotifications(storage.getNotifications());
    showToast(
      language === 'ar' ? 'تمت إعادة ضبط البيانات إلى الحالة الأصلية' : 'Data reset to clean defaults',
      'info'
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        activeTab,
        feedSort,
        selectedCommunitySlug,
        selectedPostId,
        selectedUserId,
        posts,
        communities,
        comments,
        conversations,
        activeConversationId,
        directMessages,
        notifications,
        searchQuery,
        toasts,
        authModalOpen,
        authModalMode,
        editProfileModalOpen,
        settingsModalOpen,
        cloudSyncStatus,

        language,
        dir,
        t,
        setLanguage,

        setActiveTab,
        setFeedSort,
        setSearchQuery,
        setAuthModalOpen,
        setEditProfileModalOpen,
        setSettingsModalOpen,

        navigateToFeed,
        navigateToCommunity,
        navigateToPost,
        navigateToProfile,
        navigateToMessages,
        navigateToCreatePost,
        navigateToNotifications,
        navigateToSettings,
        navigateToSearch,

        upvotePost,
        downvotePost,
        toggleSavePost,
        createPost,
        deletePost,
        submitReport,

        addComment,
        deleteComment,
        upvoteComment,

        joinCommunity,
        leaveCommunity,
        createCommunity,

        isInsideChat,
        setIsInsideChat,
        setActiveConversationId,
        selectConversation,
        startConversationWithUser,
        sendDirectMessage,

        toggleFollowUser,
        updateCurrentUserProfile,
        updateUserStatus,

        markAllNotificationsRead,
        markNotificationRead,
        unreadCount,

        login,
        googleLogin,
        register,
      updateAccountEmail,
      updateAccountPassword,
      logout,
        switchUser,

        showToast,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
