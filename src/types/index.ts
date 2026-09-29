export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  status: UserStatus;
  customStatus?: string;
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
  slug: string; // e.g. "n/technica"
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
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
  commentCount: number;
  createdAt: string;
  tags: string[];
  isSaved: boolean;
  isPinned?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | null;
  parentId?: string;
  replies?: Comment[];
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  mediaUrl?: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned?: boolean;
}

export type NotificationType = 'upvote' | 'comment' | 'reply' | 'follow' | 'mention' | 'community';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: User;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetType: 'post' | 'comment' | 'profile' | 'community';
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
  | 'search';
export type FeedSortOption = 'hot' | 'new' | 'top' | 'following';
