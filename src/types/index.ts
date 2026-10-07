export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  profileColor?: string;
  displayNameColor?: string;
  bio: string;
  status: UserStatus;
  customStatus?: string;
  lastSeenAt?: number;
  badges: string[];
  karma: number;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  email?: string;
  password?: string;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

export interface CommunityModerator {
  username: string;
  displayName: string;
  avatar: string;
  role: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  banner: string;
  memberCount: number;
  onlineCount: number;
  isMember: boolean;
  category: string;
  rules: CommunityRule[];
  moderators: CommunityModerator[];
  createdAt: string;
}

export type PostMediaType = 'text' | 'image' | 'video' | 'link';

export interface Post {
  id: string;
  author: User;
  communitySlug: string;
  communityName: string;
  communityIcon: string;
  title: string;
  content: string;
  mediaType: PostMediaType;
  mediaUrl?: string;
  mediaDeferred?: boolean;
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
  votes?: Record<string, 1 | -1>;
  voteState?: Record<string, 1 | -1 | 0>;
  commentCount: number;
  createdAt: string;
  timestamp?: number;
  lastCommentTimestamp?: number;
  tags: string[];
  isSaved: boolean;
  savedBy?: Record<string, boolean>;
  isPinned?: boolean;
  deleted?: boolean;
  deletedAt?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  timestamp?: number;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
  votes?: Record<string, 1 | -1>;
  parentId?: string;
  replies?: Comment[];
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'voice';
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  participantIds?: string[];
  participants?: Record<string, User>;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimestamp?: number;
  lastSenderId?: string;
  unreadCount: number;
  unreadBy?: Record<string, number>;
  pinned?: boolean;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export type NotificationType = 'upvote' | 'downvote' | 'comment' | 'reply' | 'follow' | 'mention' | 'community' | 'message';

export interface NotificationItem {
  id: string;
  recipientId?: string;
  type: NotificationType;
  actor: User;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetType: 'post' | 'comment' | 'profile' | 'community' | 'conversation';
  targetId: string;
}

export type ActiveTab =
  | 'feed'
  | 'communities'
  | 'community-detail'
  | 'post-detail'
  | 'create'
  | 'messages'
  | 'profile'
  | 'notifications'
  | 'search'
  | 'settings';
export type FeedSortOption = 'hot' | 'new' | 'top' | 'following';
