import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Community, Post, Comment, Conversation, DirectMessage } from '../types';

/**
 * Deeply strips undefined properties from an object so Firestore setDoc does not reject it.
 * Firestore throws a runtime error if any field value is `undefined`.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const firebaseSync = {
  // --- USERS ---
  async saveUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      const cleanData = stripUndefined(user);
      await setDoc(userRef, cleanData, { merge: true });
      console.log(`[Firestore] Saved user ${user.id}`);
    } catch (err) {
      console.error('[Firestore] Error saving user to Firestore:', err);
    }
  },

  async fetchUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach((d) => list.push(d.data() as User));
      return list;
    } catch (err) {
      console.error('[Firestore] Error fetching users from Firestore:', err);
      return [];
    }
  },

  // --- COMMUNITIES ---
  async saveCommunity(community: Community): Promise<void> {
    try {
      const commRef = doc(db, 'communities', community.id);
      const cleanData = stripUndefined(community);
      await setDoc(commRef, cleanData, { merge: true });
      console.log(`[Firestore] Saved community ${community.id}`);
    } catch (err) {
      console.error('[Firestore] Error saving community to Firestore:', err);
    }
  },

  async fetchCommunities(): Promise<Community[]> {
    try {
      const snap = await getDocs(collection(db, 'communities'));
      const list: Community[] = [];
      snap.forEach((d) => list.push(d.data() as Community));
      return list;
    } catch (err) {
      console.error('[Firestore] Error fetching communities from Firestore:', err);
      return [];
    }
  },

  // --- POSTS ---
  async savePost(post: Post): Promise<void> {
    try {
      const postRef = doc(db, 'posts', post.id);
      const cleanData = stripUndefined(post);
      await setDoc(postRef, cleanData, { merge: true });
      console.log(`[Firestore] Successfully saved post to cloud: ${post.id}`);
    } catch (err) {
      console.error('[Firestore] Error saving post to Firestore:', err);
    }
  },

  async deletePost(postId: string): Promise<boolean> {
    try {
      await setDoc(doc(db, 'posts', postId), {
        deleted: true,
        deletedAt: Date.now(),
      }, { merge: true });
      console.log(`[Firestore] Marked post deleted in cloud: ${postId}`);
      return true;
    } catch (err) {
      console.error('[Firestore] Error deleting post from Firestore:', err);
      return false;
    }
  },

  async fetchPosts(): Promise<Post[]> {
    try {
      const q = query(collection(db, 'posts'), limit(150));
      const snap = await getDocs(q);
      const list: Post[] = [];
      snap.forEach((d) => list.push(d.data() as Post));
      console.log(`[Firestore] Fetched ${list.length} posts from Firestore.`);
      return list;
    } catch (err) {
      console.error('[Firestore] Error fetching posts from Firestore:', err);
      return [];
    }
  },

  subscribePosts(callback: (posts: Post[]) => void) {
    try {
      return onSnapshot(
        collection(db, 'posts'),
        (snapshot) => {
          const list: Post[] = [];
          snapshot.forEach((d) => list.push(d.data() as Post));
          console.log(`[Firestore] Real-time snapshot: ${list.length} posts from cloud.`);
          callback(list);
        },
        (error) => {
          console.error('[Firestore] Posts subscription error:', error);
        }
      );
    } catch (err) {
      console.error('[Firestore] Failed to subscribe to posts:', err);
      return () => {};
    }
  },

  // --- COMMENTS ---
  async saveComment(postId: string, comment: Comment): Promise<void> {
    try {
      // A delete tombstone prevents a late save request from resurrecting a comment
      // after another device has already deleted it.
      const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
      const existing = await getDoc(commentRef);
      if (existing.exists() && (existing.data() as { deleted?: boolean }).deleted) {
        console.warn(`[Firestore] Ignoring save for deleted comment ${comment.id}`);
        return;
      }
      const cleanData = stripUndefined(comment);
      await setDoc(commentRef, cleanData, { merge: true });
      console.log(`[Firestore] Saved comment ${comment.id} for post ${postId}`);
    } catch (err) {
      console.error('[Firestore] Error saving comment to Firestore:', err);
    }
  },

  async deleteComments(postId: string, commentIds: string[]): Promise<boolean> {
    if (commentIds.length === 0) return true;
    try {
      const batch = writeBatch(db);
      commentIds.forEach((commentId) => {
        // Keep a tombstone in the existing comments collection. This prevents a
        // delayed save from another device from recreating the deleted comment.
        batch.set(doc(db, 'posts', postId, 'comments', commentId), {
          commentId,
          deleted: true,
          deletedAt: Date.now(),
        });
      });
      await batch.commit();
      console.log(`[Firestore] Deleted ${commentIds.length} comment document(s) from ${postId}`);
      return true;
    } catch (err) {
      console.warn('[Firestore] Batch delete failed, attempting direct updates:', err);
      try {
        for (const cid of commentIds) {
          await setDoc(doc(db, 'posts', postId, 'comments', cid), {
            commentId: cid,
            deleted: true,
            deletedAt: Date.now(),
          }, { merge: true });
        }
        return true;
      } catch (fallbackErr) {
        console.error('[Firestore] Fallback delete also failed:', fallbackErr);
        return false;
      }
    }
  },

  async deleteComment(postId: string, commentId: string): Promise<boolean> {
    return this.deleteComments(postId, [commentId]);
  },

  async fetchComments(postId: string): Promise<Comment[]> {
    try {
      const snap = await getDocs(collection(db, 'posts', postId, 'comments'));
      const list: Comment[] = [];
      snap.forEach((d) => {
        const data = d.data() as { deleted?: boolean };
        if (!data.deleted) list.push(data as Comment);
      });
      return list;
    } catch (err) {
      console.error(`[Firestore] Error fetching comments for ${postId}:`, err);
      throw err;
    }
  },

  // --- CONVERSATIONS & DIRECT MESSAGES ---
  async saveConversation(conv: Conversation): Promise<void> {
    try {
      const convRef = doc(db, 'conversations', conv.id);
      const cleanData = stripUndefined(conv);
      await setDoc(convRef, cleanData, { merge: true });
      console.log(`[Firestore] Saved conversation: ${conv.id}`);
    } catch (err) {
      console.error('[Firestore] Error saving conversation to Firestore:', err);
    }
  },

  async fetchConversations(userId: string): Promise<Conversation[]> {
    try {
      const snap = await getDocs(collection(db, 'conversations'));
      const list: Conversation[] = [];
      snap.forEach((d) => {
        const data = d.data() as Conversation;
        if (
          data.participantIds?.includes(userId) ||
          data.id.includes(userId) ||
          data.participant?.id === userId
        ) {
          list.push(data);
        }
      });
      return list;
    } catch (err) {
      console.error('[Firestore] Error fetching conversations:', err);
      return [];
    }
  },

  subscribeConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    try {
      return onSnapshot(
        collection(db, 'conversations'),
        (snapshot) => {
          const list: Conversation[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Conversation;
            if (
              data.participantIds?.includes(userId) ||
              data.id.includes(userId) ||
              data.participant?.id === userId
            ) {
              list.push(data);
            }
          });
          callback(list);
        },
        (error) => {
          console.error('[Firestore] Conversations subscription error:', error);
        }
      );
    } catch (err) {
      console.error('[Firestore] Failed to subscribe to conversations:', err);
      return () => {};
    }
  },

  async saveDirectMessage(conversationId: string, message: DirectMessage): Promise<void> {
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
      const cleanData = stripUndefined(message);
      await setDoc(msgRef, cleanData, { merge: true });
      console.log(`[Firestore] Saved message ${message.id} to conversation ${conversationId}`);
    } catch (err) {
      console.error('[Firestore] Error saving message to Firestore:', err);
    }
  },

  async fetchMessages(conversationId: string): Promise<DirectMessage[]> {
    try {
      const snap = await getDocs(collection(db, 'conversations', conversationId, 'messages'));
      const list: DirectMessage[] = [];
      snap.forEach((d) => list.push(d.data() as DirectMessage));
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return list;
    } catch (err) {
      console.error(`[Firestore] Error fetching messages for ${conversationId}:`, err);
      return [];
    }
  },

  subscribeMessages(conversationId: string, callback: (messages: DirectMessage[]) => void) {
    try {
      return onSnapshot(
        collection(db, 'conversations', conversationId, 'messages'),
        (snapshot) => {
          const list: DirectMessage[] = [];
          snapshot.forEach((d) => list.push(d.data() as DirectMessage));
          list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          callback(list);
        },
        (error) => {
          console.error('[Firestore] Messages subscription error:', error);
        }
      );
    } catch (err) {
      console.error('[Firestore] Failed to subscribe to messages:', err);
      return () => {};
    }
  },
};
