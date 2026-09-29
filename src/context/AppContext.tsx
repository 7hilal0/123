import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { firebaseSync } from '../services/firebaseSync';

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
  navigateToSearch: (query?: string) => void;

  // Interactions
  upvotePost: (postId: string) => void;
  downvotePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  createPost: (postData: {
    communitySlug: string;
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
  login: (usernameOrEmail: string, password?: string) => boolean;
  register: (username: string, displayName: string, email: string, password?: string, avatarUrl?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Feedback & Reset
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language: Default to English ('en')
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nova_primary_language');
      if (stored === 'en' || stored === 'ar') return stored;
    }
    return 'en';
  });

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';
  const t: Translations = translations[language];

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nova_primary_language', newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    }
    showToast(newLang === 'en' ? 'Language switched to English' : 'تم تغيير اللغة إلى العربية', 'success');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

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

  const [posts, setPosts] = useState<Post[]>(() => storage.getPosts());
  const [communities, setCommunities] = useState<Community[]>(() => storage.getCommunities());
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => storage.getComments());
  const [conversations, setConversations] = useState<Conversation[]>(() => storage.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const convs = storage.getConversations();
    return convs.length > 0 ? convs[0].id : null;
  });
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>(() => storage.getDirectMessages());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authModalOpen, setAuthModalOpenState] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [editProfileModalOpen, setEditProfileModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // --- Real-time Cloud Synchronization (Firestore) ---
  useEffect(() => {
    setCloudSyncStatus('syncing');

    // 1. Fetch remote posts
    firebaseSync.fetchPosts().then((remotePosts) => {
      if (remotePosts && remotePosts.length > 0) {
        setPosts((local) => {
          const remoteIds = new Set(remotePosts.map((p) => p.id));
          const localOnly = local.filter((p) => !remoteIds.has(p.id));
          return [...remotePosts, ...localOnly];
        });
      }
      setCloudSyncStatus('connected');
    }).catch(() => {
      setCloudSyncStatus('connected');
    });

    // 2. Subscribe to remote posts live
    const unsubPosts = firebaseSync.subscribePosts((remotePosts) => {
      if (remotePosts && remotePosts.length > 0) {
        setPosts(remotePosts);
      }
    });

    // 3. Fetch communities
    firebaseSync.fetchCommunities().then((remoteComms) => {
      if (remoteComms && remoteComms.length > 0) {
        setCommunities((local) => {
          const remoteIds = new Set(remoteComms.map((c) => c.id));
          const localOnly = local.filter((c) => !remoteIds.has(c.id));
          return [...remoteComms, ...localOnly];
        });
      }
    }).catch(() => {});

    // 4. Fetch users
    firebaseSync.fetchUsers().then((remoteUsers) => {
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
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCommunity = (slug: string) => {
    setSelectedCommunitySlug(slug);
    setSelectedPostId(null);
    setSelectedUserId(null);
    setActiveTab('community-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPost = (postId: string) => {
    setSelectedPostId(postId);
    setActiveTab('post-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedPostId(null);
    setSelectedCommunitySlug(null);
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
      } else {
        startConversationWithUser(userIdOrConvId);
      }
    }
  };

  const navigateToCreatePost = (communitySlug?: string) => {
    if (communitySlug) {
      setSelectedCommunitySlug(communitySlug);
    }
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToNotifications = () => {
    setActiveTab('notifications');
  };

  const navigateToSearch = (query?: string) => {
    if (query !== undefined) {
      setSearchQuery(query);
    }
    setActiveTab('search');
  };

  // Interactions (Upvote/Downvote/Save)
  const upvotePost = (postId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;

        let updated: Post;
        if (p.userVote === 1) {
          updated = { ...p, upvotes: p.upvotes - 1, userVote: null };
        } else if (p.userVote === -1) {
          updated = { ...p, upvotes: p.upvotes + 1, downvotes: p.downvotes - 1, userVote: 1 };
        } else {
          updated = { ...p, upvotes: p.upvotes + 1, userVote: 1 };
        }
        firebaseSync.savePost(updated);
        return updated;
      })
    );
  };

  const downvotePost = (postId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;

        let updated: Post;
        if (p.userVote === -1) {
          updated = { ...p, downvotes: p.downvotes - 1, userVote: null };
        } else if (p.userVote === 1) {
          updated = { ...p, downvotes: p.downvotes + 1, upvotes: p.upvotes - 1, userVote: -1 };
        } else {
          updated = { ...p, downvotes: p.downvotes + 1, userVote: -1 };
        }
        firebaseSync.savePost(updated);
        return updated;
      })
    );
  };

  const toggleSavePost = (postId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const nextSaved = !p.isSaved;
          showToast(
            nextSaved
              ? (language === 'ar' ? 'تم حفظ المنشور في قائمتك' : 'Post saved to your list')
              : (language === 'ar' ? 'تمت إزالة المنشور من المحفوظات' : 'Post removed from saved'),
            'info'
          );
          return { ...p, isSaved: nextSaved };
        }
        return p;
      })
    );
  };

  const createPost = (postData: {
    communitySlug: string;
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

    const targetCommunity = communities.find((c) => c.slug === postData.communitySlug);
    const newPostId = `post_${Date.now()}`;

    const newPost: Post = {
      id: newPostId,
      author: currentUser,
      communitySlug: postData.communitySlug,
      communityName: targetCommunity ? targetCommunity.name : postData.communitySlug,
      communityIcon: targetCommunity
        ? targetCommunity.icon
        : 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=120&q=80',
      title: postData.title,
      content: postData.content,
      mediaType: postData.mediaType,
      mediaUrl: postData.mediaUrl,
      linkUrl: postData.linkUrl,
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
      commentCount: 0,
      createdAt: language === 'ar' ? 'الآن' : 'Just now',
      tags: postData.tags,
      isSaved: false,
    };

    setPosts((prev) => [newPost, ...prev]);
    setComments((prev) => ({ ...prev, [newPostId]: [] }));

    // Real-time Cloud Save
    firebaseSync.savePost(newPost);

    showToast(language === 'ar' ? 'تم نشر موضوعك وحفظه في السيرفر! 🚀' : 'Post published and saved to cloud! 🚀', 'success');
    navigateToPost(newPostId);
  };

  const deletePost = (postId: string) => {
    if (!currentUser) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setComments((prev) => {
      const copy = { ...prev };
      delete copy[postId];
      return copy;
    });

    // Cloud Delete
    firebaseSync.deletePost(postId);

    showToast(language === 'ar' ? 'تم حذف المنشور من السيرفر' : 'Post deleted from server', 'info');
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

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      author: currentUser,
      content,
      createdAt: language === 'ar' ? 'الآن' : 'Just now',
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
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
          const updated = { ...p, commentCount: p.commentCount + 1 };
          firebaseSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Cloud Save Comment
    firebaseSync.saveComment(postId, newComment);

    showToast(language === 'ar' ? 'تمت إضافة التعليق وحفظه سحابياً' : 'Comment saved to cloud', 'success');
  };

  const deleteComment = (postId: string, commentId: string) => {
    if (!currentUser) return;

    let removedCount = 0;

    const removeRecursive = (list: Comment[]): Comment[] => {
      const filtered: Comment[] = [];
      for (const c of list) {
        if (c.id === commentId) {
          removedCount += 1 + (c.replies ? c.replies.length : 0);
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

    setComments((prev) => {
      const current = prev[postId] || [];
      return { ...prev, [postId]: removeRecursive(current) };
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updated = { ...p, commentCount: Math.max(0, p.commentCount - removedCount) };
          firebaseSync.savePost(updated);
          return updated;
        }
        return p;
      })
    );

    // Cloud Delete Comment
    firebaseSync.deleteComment(postId, commentId);

    showToast(language === 'ar' ? 'تم حذف التعليق' : 'Comment deleted', 'info');
  };

  const upvoteComment = (postId: string, commentId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    setComments((prev) => {
      const existing = prev[postId] || [];
      const updateVote = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === commentId) {
            const nextVote: 1 | null = c.userVote === 1 ? null : 1;
            const upvoteDelta = c.userVote === 1 ? -1 : 1;
            const updated: Comment = {
              ...c,
              upvotes: c.upvotes + upvoteDelta,
              userVote: nextVote,
            };
            firebaseSync.saveComment(postId, updated);
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
          firebaseSync.saveCommunity(updated);
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
          firebaseSync.saveCommunity(updated);
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
    firebaseSync.saveCommunity(newComm);

    showToast(
      language === 'ar' ? `تم إنشاء المجتمع وحفظه سحابياً! 🎉` : `Community saved to cloud! 🎉`,
      'success'
    );
    navigateToCommunity(slug);
  };

  // Messaging
  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const startConversationWithUser = (targetUserId: string) => {
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

    const existingConv = conversations.find((c) => c.participant.id === targetUserId);
    if (existingConv) {
      setActiveConversationId(existingConv.id);
      setActiveTab('messages');
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      showToast(language === 'ar' ? 'المستخدم غير موجود' : 'User not found', 'warning');
      return;
    }

    const newConvId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      participant: targetUser,
      lastMessage: language === 'ar' ? 'محادثة جديدة' : 'New conversation',
      lastMessageTime: language === 'ar' ? 'الآن' : 'Just now',
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev]);
    setDirectMessages((prev) => ({ ...prev, [newConvId]: [] }));

    firebaseSync.saveConversation(newConv);

    setActiveConversationId(newConvId);
    setActiveTab('messages');
  };

  const sendDirectMessage = (text: string, mediaUrl?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      text,
      timestamp: language === 'ar' ? 'الآن' : 'Just now',
      mediaUrl,
      isRead: true,
    };

    setDirectMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const updated = { ...c, lastMessage: text, lastMessageTime: language === 'ar' ? 'الآن' : 'Just now' };
          firebaseSync.saveConversation(updated);
          return updated;
        }
        return c;
      })
    );

    // Save message to Cloud Firestore
    firebaseSync.saveDirectMessage(activeConversationId, newMsg);
  };

  // Follow user
  const toggleFollowUser = (userId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true, 'login');
      return;
    }

    if (userId === currentUser.id) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextFollowing = !u.isFollowing;
          const updated = {
            ...u,
            isFollowing: nextFollowing,
            followersCount: nextFollowing ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
          };
          firebaseSync.saveUser(updated);
          showToast(
            nextFollowing
              ? (language === 'ar' ? `تابعت الآن @${u.username}` : `Following @${u.username}`)
              : (language === 'ar' ? `ألغيت متابعة @${u.username}` : `Unfollowed @${u.username}`),
            'info'
          );
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

    // Save to Cloud Firestore
    firebaseSync.saveUser(updated);

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
    firebaseSync.saveUser(updated);
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

  // Real Authentication
  const login = (usernameOrEmail: string, password?: string): boolean => {
    const term = usernameOrEmail.trim().toLowerCase();
    const existing = users.find(
      (u) => u.username.toLowerCase() === term || (u.email && u.email.toLowerCase() === term)
    );

    if (!existing) {
      showToast(
        language === 'ar' ? 'اسم المستخدم أو البريد غير مسجل!' : 'Username or email not registered!',
        'warning'
      );
      return false;
    }

    if (password && existing.password && existing.password !== password) {
      showToast(
        language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password, please try again',
        'warning'
      );
      return false;
    }

    setCurrentUser(existing);
    setAuthModalOpenState(false);
    showToast(
      language === 'ar' ? `مرحباً بعودتك، ${existing.displayName}! 👋` : `Welcome back, ${existing.displayName}! 👋`,
      'success'
    );
    return true;
  };

  const register = (
    username: string,
    displayName: string,
    email: string,
    password = 'password123',
    avatarUrl?: string
  ): boolean => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername) {
      showToast(
        language === 'ar' ? 'يرجى إدخال اسم مستخدم صحيح' : 'Please enter a valid username (alphanumeric)',
        'warning'
      );
      return false;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      showToast(
        language === 'ar' ? 'اسم المستخدم مستخدم بالفعل' : 'Username is already taken, choose another',
        'warning'
      );
      return false;
    }

    if (email && users.some((u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase())) {
      showToast(
        language === 'ar' ? 'البريد الإلكتروني مسجل مسبقاً' : 'Email is already registered with another account',
        'warning'
      );
      return false;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: cleanUsername,
      displayName: displayName.trim() || cleanUsername,
      email: email.trim(),
      password,
      avatar:
        avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
      banner:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: language === 'ar' ? 'عضو جديد في مجتمع نوفا 🚀' : 'New member of NOVA community 🚀',
      status: 'online',
      customStatus: language === 'ar' ? 'مرحباً بالجميع في نوفا!' : 'Excited to be on NOVA!',
      badges: [language === 'ar' ? 'عضو موثق' : 'Member'],
      karma: 10,
      joinedDate: language === 'ar' ? 'انضم اليوم' : 'Joined today',
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);

    // Save user to cloud database
    firebaseSync.saveUser(newUser);

    setAuthModalOpenState(false);
    showToast(
      language === 'ar' ? `أهلاً بك في نوفا، ${newUser.displayName}! 🎉` : `Welcome to NOVA, ${newUser.displayName}! 🎉`,
      'success'
    );
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
  };

  const switchUser = (userId: string) => {
    const userToSwitch = users.find((u) => u.id === userId);
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
