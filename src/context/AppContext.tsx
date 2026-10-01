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
import { appwriteSync } from '../services/appwriteSync';
import { cloudflareApi } from '../services/cloudflareApi';
import { DEFAULT_USER_AVATAR } from '../utils/avatarConstants';
import { resolvePostForUser, resolveCommentForUser } from '../utils/voting';
import { resolveConversationForUser } from '../utils/conversationUtils';

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
  updateCurrentUserProfile: (updates: Partial<User>) => void;
  updateUserStatus: (status: UserStatus, customStatus?: string) => void;

  // Notifications
  markAllNotificationsRead: () => void;
  markNotificationRead: (notificationId: string) => void;
  unreadCount: number;

  // Auth
  login: (usernameOrEmail: string, password?: string) => Promise<boolean>;
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
  // Keeps optimistic deletions out of a stale Firestore snapshot while the delete request settles.
  const deletedPostIdsRef = useRef<Set<string>>(new Set());
  const deletedCommentIdsRef = useRef<Set<string>>(new Set());
  const pendingVoteSavesRef = useRef<Record<string, Post>>({});

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
    cloudflareApi.me().then(async ({ user: sessionUser }) => {
      if (!active) return;
      if (!sessionUser) { setCurrentUser(null); return; }
      const remoteUsers = await appwriteSync.fetchUsers().catch(() => [] as User[]);
      const cachedProfile = storage.getUsers().find((user) => user.id === sessionUser.id);
      const cachedMedia = await storage.getProfileMediaBackup(sessionUser.id).catch(() => null);
      const remoteProfile = remoteUsers.find((user) => user.id === sessionUser.id);
      const remoteMedia = await appwriteSync.fetchUserMedia(sessionUser.id).catch(() => ({} as Partial<User>));
      const localAvatar = cachedMedia?.avatar || remoteMedia.avatar || cachedProfile?.avatar;
      const localBanner = cachedMedia?.banner || remoteMedia.banner || cachedProfile?.banner;
      const profile = remoteProfile ? {
        ...remoteProfile,
        // Prefer the local IndexedDB copy for animated media when the cloud row
        // is incomplete or still contains only a partial chunk upload.
        avatar: localAvatar?.startsWith('data:image/gif') || !remoteProfile.avatar || remoteProfile.avatar === DEFAULT_USER_AVATAR
          ? localAvatar || remoteProfile.avatar || DEFAULT_USER_AVATAR
          : remoteProfile.avatar,
        banner: localBanner?.startsWith('data:image/gif') || !remoteProfile.banner
          ? localBanner || remoteProfile.banner || ''
          : remoteProfile.banner,
        profileColor: remoteProfile.profileColor || cachedProfile?.profileColor,
      } : {
        id: sessionUser.id,
        username: sessionUser.username,
        displayName: sessionUser.displayName || sessionUser.username,
        email: sessionUser.email,
        avatar: localAvatar || DEFAULT_USER_AVATAR,
        banner: localBanner || '',
        bio: cachedProfile?.bio || '',
        status: cachedProfile?.status || 'online' as UserStatus,
        customStatus: cachedProfile?.customStatus || '',
        profileColor: cachedProfile?.profileColor,
        badges: cachedProfile?.badges || ['Member'],
        karma: cachedProfile?.karma || 0,
        joinedDate: cachedProfile?.joinedDate || 'Joined today',
        followersCount: cachedProfile?.followersCount || 0,
        followingCount: cachedProfile?.followingCount || 0,
        isFollowing: cachedProfile?.isFollowing || false,
      };
      setUsers((previous) => previous.some((user) => user.id === profile.id) ? previous.map((user) => user.id === profile.id ? profile : user) : [profile, ...previous]);
      setCurrentUser(profile);
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

    const unsubConvs = appwriteSync.subscribeConversations(currentUser.id, (remoteConvs) => {
      const resolved = remoteConvs.map((c) => resolveConversationForUser(c, currentUser, users));
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

    const unsubMsgs = appwriteSync.subscribeMessages(activeConversationId, (remoteMsgs) => {
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

  // --- Real-time Cloud Synchronization (Firestore) ---
  useEffect(() => {
    setCloudSyncStatus('syncing');

    // Proactively purge welcome post from Firestore
    appwriteSync.deletePost('post_official_welcome').catch(() => {});

    // Subscribe to remote posts live. This is the single initial post read;
    // a separate fetch here would double Firestore reads and exhaust quotas.
    const unsubPosts = appwriteSync.subscribePosts((remotePosts) => {
      setCloudSyncStatus('connected');
      if (remotePosts) {
        const cleanRemote = remotePosts
          .filter(
            (p) => p.id !== 'post_official_welcome' && !p.deleted && !deletedPostIdsRef.current.has(p.id)
          )
          .map((p) => resolvePostForUser(p, currentUser?.id));

        // Firestore is authoritative. Do not merge old local posts into the feed.
        setPosts(cleanRemote);
      }
    });

    // 3. Fetch communities
    appwriteSync.fetchCommunities().then((remoteComms) => {
      if (remoteComms && remoteComms.length > 0) {
        setCommunities((local) => {
          const remoteIds = new Set(remoteComms.map((c) => c.id));
          const localOnly = local.filter((c) => !remoteIds.has(c.id));
          return [...remoteComms, ...localOnly];
        });
      }
    }).catch(() => {});

    // 4. Fetch users
    appwriteSync.fetchUsers().then((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers((local) => {
          const remoteIds = new Set(remoteUsers.map((u) => u.id));
          const localOnly = local.filter((u) => !remoteIds.has(u.id));
          return [...remoteUsers, ...localOnly];
        });
      }
    }).catch(() => {});

    return () => {
      unsubPosts();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => { storage.saveUsers(users); }, [users]);
  useEffect(() => { storage.saveCurrentUserId(currentUser ? currentUser.id : null); }, [currentUser]);
  useEffect(() => { storage.savePosts(posts); }, [posts]);
  useEffect(() => {
    const pending = pendingVoteSavesRef.current;
    pendingVoteSavesRef.current = {};
    Object.values(pending).forEach((post) => { void appwriteSync.savePost(post); });
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
    appwriteSync.fetchComments(postId).then((remoteComments) => {
      const cleanRemote = remoteComments
        .filter((comment) => !deletedCommentIdsRef.current.has(comment.id))
        .map((comment) => resolveCommentForUser(comment, currentUser?.id));
      // Firestore is authoritative after a refresh. Do not merge stale localStorage
      // comments back into the post, otherwise another device can see deleted data.
      setComments((prev) => ({ ...prev, [postId]: cleanRemote }));

      // Keep post.commentCount in exact alignment with actual existing comments
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId && p.commentCount !== cleanRemote.length) {
            const updated = { ...p, commentCount: cleanRemote.length };
            appwriteSync.savePost(updated);
            return updated;
          }
          return p;
        })
      );
    }).catch(() => {
      // Keep the current local view only when the cloud request genuinely fails.
    });
  };

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
    const unsubscribe = appwriteSync.subscribeNotifications(currentUser.id, (remote) => {
      setNotifications((previous) => {
        const merged = new Map(previous.map((item) => [item.id, item]));
        remote.forEach((item) => merged.set(item.id, { ...merged.get(item.id), ...item }));
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
    appwriteSync.saveNotification(item).catch((error) => console.error('[Firestore] Notification save failed', error));
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
    // Clicking the active arrow removes the vote. Clicking the opposite arrow
    // removes the old vote first, so one action changes the score by one.
    if (currentVote === desiredVote || (currentVote !== null && currentVote !== desiredVote)) {
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

    setPosts((previous) => previous.map((post) => (post.id === postId ? updated : post)));
    // Save immediately, including an empty votes map after removing a vote.
    void appwriteSync.savePost(updated);

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
    const newPostId = `post_${now}`;

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
      createdAt: language === 'ar' ? 'الآن' : 'Just now',
      timestamp: now,
      tags: postData.tags,
      isSaved: false,
      savedBy: {},
    };

    setPosts((prev) => [newPost, ...prev]);
    setComments((prev) => ({ ...prev, [newPostId]: [] }));

    // Real-time Cloud Save
    appwriteSync.savePost(newPost);

    showToast(language === 'ar' ? 'تم نشر موضوعك وحفظه في السيرفر! 🚀' : 'Post published and saved to cloud! 🚀', 'success');
    navigateToPost(newPostId);
  };

  const deletePost = (postId: string) => {
    if (!currentUser) return;
    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete || postToDelete.author.id !== currentUser.id) return;

    deletedPostIdsRef.current.add(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setComments((prev) => {
      const copy = { ...prev };
      delete copy[postId];
      return copy;
    });

    // Cloud Delete. If it fails, restore the post instead of silently losing the user's data.
    appwriteSync.deletePost(postId).then((deleted) => {
      if (deleted) {
        showToast(language === 'ar' ? 'تم حذف المنشور نهائياً' : 'Post permanently deleted', 'success');
        return;
      }
      deletedPostIdsRef.current.delete(postId);
      setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [postToDelete, ...prev]));
      showToast(language === 'ar' ? 'تعذر حذف المنشور من السيرفر' : 'The post could not be deleted from the server', 'warning');
    });
    if (selectedPostId === postId) {
      navigateToFeed();
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
      id: `comment_${commentNow}`,
      postId,
      author: currentUser,
      content,
      createdAt: language === 'ar' ? 'الآن' : 'Just now',
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
          appwriteSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Cloud Save Comment
    appwriteSync.saveComment(postId, newComment);
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
          appwriteSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Delete the selected comment and all nested replies as one cloud operation.
    appwriteSync.deleteComments(postId, idsToDelete).then((deleted) => {
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
            appwriteSync.saveComment(postId, updated);
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
  };

  // Communities
  const joinCommunity = (slug: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setCommunities((prev) =>
      prev.map((c) => {
        if (c.slug === slug) {
          const updated = { ...c, isMember: true, memberCount: c.memberCount + 1 };
          appwriteSync.saveCommunity(updated);
          showToast(language === 'ar' ? `انضممت إلى مجتمع ${c.name}` : `Joined ${c.name}`, 'success');
          return updated;
        }
        return c;
      })
    );
  };

  const leaveCommunity = (slug: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setCommunities((prev) =>
      prev.map((c) => {
        if (c.slug === slug) {
          const updated = { ...c, isMember: false, memberCount: Math.max(0, c.memberCount - 1) };
          appwriteSync.saveCommunity(updated);
          showToast(language === 'ar' ? `غادرت مجتمع ${c.name}` : `Left ${c.name}`, 'info');
          return updated;
        }
        return c;
      })
    );
  };

  const createCommunity = (
    name: string,
    description: string,
    category: string,
    iconUrl?: string,
    bannerUrl?: string
  ) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    const cleanSlugPart = name.toLowerCase().replace(/[^a-z0-9]/g, '') || `hub_${Date.now()}`;
    const slug = `c/${cleanSlugPart}`;

    if (communities.some((c) => c.slug === slug)) {
      showToast(
        language === 'ar' ? 'يوجد مجتمع بهذا المعرف بالفعل!' : 'A community with this slug already exists!',
        'warning'
      );
      return;
    }

    const newComm: Community = {
      id: `comm_${Date.now()}`,
      name,
      slug,
      description,
      icon:
        iconUrl ||
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
      banner:
        bannerUrl ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      memberCount: 1,
      onlineCount: 1,
      isMember: true,
      category: category || (language === 'ar' ? 'عام' : 'General'),
      createdAt: language === 'ar' ? 'تأسس اليوم' : 'Created today',
      rules: [
        { id: 'r1', title: language === 'ar' ? 'الاحترام المتبادل' : 'Mutual Respect', description: language === 'ar' ? 'النقاش البناء والمحترم هو أساس المجتمع.' : 'Constructive and polite communication.' },
      ],
      moderators: [
        {
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar,
          role: language === 'ar' ? 'مؤسس' : 'Founder',
        },
      ],
    };

    setCommunities((prev) => [newComm, ...prev]);

    // Cloud Save Community
    appwriteSync.saveCommunity(newComm);

    showToast(
      language === 'ar' ? `تم إنشاء المجتمع وحفظه سحابياً! 🎉` : `Community saved to cloud! 🎉`,
      'success'
    );
    navigateToCommunity(slug);
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

    await appwriteSync.saveConversation(newConv);

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

    // Save message and updated conversation to Cloud Firestore in real time
    await appwriteSync.saveDirectMessage(activeConversationId, newMsg);
    await appwriteSync.saveConversation(updatedConv);
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
          appwriteSync.saveUser(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    void storage.saveProfileMediaBackup(updated.id, {
      avatar: updated.avatar,
      banner: updated.banner,
    }).catch((error) => console.warn('[Storage] Profile media backup failed:', error));

    // Update all posts authored by currentUser so posts and profile avatars stay 100% in sync
    setPosts((prev) =>
      prev.map((p) => {
        if (p.author.id === currentUser.id) {
          const updatedPost = { ...p, author: updated };
          appwriteSync.savePost(updatedPost);
          return updatedPost;
        }
        return p;
      })
    );

    // Update all comments authored by currentUser
    setComments((prev) => {
      const newComments: Record<string, Comment[]> = {};
      for (const [postId, list] of Object.entries(prev)) {
        newComments[postId] = list.map((c) =>
          c.author.id === currentUser.id ? { ...c, author: updated } : c
        );
      }
      return newComments;
    });

    // Save to Appwrite and surface failures instead of silently losing media updates.
    void appwriteSync.saveUser(updated).catch((error) => {
      console.error('[Appwrite] Profile save failed:', error);
      showToast(
        language === 'ar'
          ? 'تم حفظ التعديل على هذا الجهاز، لكن تعذر رفع الصورة للسحابة. جرّب GIF أصغر.'
          : 'Saved on this device, but cloud upload failed. Try a smaller GIF.',
        'warning'
      );
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
    appwriteSync.saveUser(updated);
    showToast(
      language === 'ar' ? 'تم تحديث حالة التواجد' : 'Status presence updated',
      'info'
    );
  };

  // Notifications
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast(
      language === 'ar' ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read',
      'info'
    );
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Cloudflare D1 Authentication
  const login = async (usernameOrEmail: string, password?: string): Promise<boolean> => {
    const term = usernameOrEmail.trim().toLowerCase();
    let profile = users.find(
      (u) => u.username.toLowerCase() === term || (u.email && u.email.toLowerCase() === term)
    );
    if (!profile && !term.includes('@')) {
      const remoteUsers = await appwriteSync.fetchUsers().catch(() => [] as User[]);
      profile = remoteUsers.find((u) => u.username.toLowerCase() === term);
      if (remoteUsers.length > 0) {
        setUsers((local) => {
          const remoteIds = new Set(remoteUsers.map((u) => u.id));
          return [...remoteUsers, ...local.filter((u) => !remoteIds.has(u.id))];
        });
      }
    }
    // A profile row may be unavailable while Appwrite is loading or after a
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
      await appwriteSync.saveUser(updatedUser);
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
