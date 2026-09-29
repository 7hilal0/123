import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Community, Post, Comment, Conversation, DirectMessage } from '../types';

export const firebaseSync = {
  // --- USERS ---
  async saveUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user, { merge: true });
    } catch (err) {
      console.warn('Error saving user to Firestore:', err);
    }
  },

  async fetchUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach((d) => list.push(d.data() as User));
      return list;
    } catch (err) {
      console.warn('Error fetching users from Firestore:', err);
      return [];
    }
  },

  // --- COMMUNITIES ---
  async saveCommunity(community: Community): Promise<void> {
    try {
      const commRef = doc(db, 'communities', community.id);
      await setDoc(commRef, community, { merge: true });
    } catch (err) {
      console.warn('Error saving community to Firestore:', err);
    }
  },

  async fetchCommunities(): Promise<Community[]> {
    try {
      const snap = await getDocs(collection(db, 'communities'));
      const list: Community[] = [];
      snap.forEach((d) => list.push(d.data() as Community));
      return list;
    } catch (err) {
      console.warn('Error fetching communities from Firestore:', err);
      return [];
    }
  },

  // --- POSTS ---
  async savePost(post: Post): Promise<void> {
    try {
      const postRef = doc(db, 'posts', post.id);
      await setDoc(postRef, post, { merge: true });
    } catch (err) {
      console.warn('Error saving post to Firestore:', err);
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      console.warn('Error deleting post from Firestore:', err);
    }
  },

  async fetchPosts(): Promise<Post[]> {
    try {
      const q = query(collection(db, 'posts'), limit(100));
      const snap = await getDocs(q);
      const list: Post[] = [];
      snap.forEach((d) => list.push(d.data() as Post));
      return list;
    } catch (err) {
      console.warn('Error fetching posts from Firestore:', err);
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
          if (list.length > 0) {
            callback(list);
          }
        },
        (error) => {
          console.warn('Posts subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to subscribe to posts:', err);
      return () => {};
    }
  },

  // --- COMMENTS ---
  async saveComment(postId: string, comment: Comment): Promise<void> {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
      await setDoc(commentRef, comment, { merge: true });
    } catch (err) {
      console.warn('Error saving comment to Firestore:', err);
    }
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    } catch (err) {
      console.warn('Error deleting comment from Firestore:', err);
    }
  },

  async fetchComments(postId: string): Promise<Comment[]> {
    try {
      const snap = await getDocs(collection(db, 'posts', postId, 'comments'));
      const list: Comment[] = [];
      snap.forEach((d) => list.push(d.data() as Comment));
      return list;
    } catch (err) {
      console.warn(`Error fetching comments for ${postId}:`, err);
      return [];
    }
  },

  // --- CONVERSATIONS & DIRECT MESSAGES ---
  async saveConversation(conv: Conversation): Promise<void> {
    try {
      const convRef = doc(db, 'conversations', conv.id);
      await setDoc(convRef, conv, { merge: true });
    } catch (err) {
      console.warn('Error saving conversation to Firestore:', err);
    }
  },

  async saveDirectMessage(conversationId: string, message: DirectMessage): Promise<void> {
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
      await setDoc(msgRef, message, { merge: true });
    } catch (err) {
      console.warn('Error saving message to Firestore:', err);
    }
  },

  subscribeMessages(conversationId: string, callback: (messages: DirectMessage[]) => void) {
    try {
      return onSnapshot(
        collection(db, 'conversations', conversationId, 'messages'),
        (snapshot) => {
          const list: DirectMessage[] = [];
          snapshot.forEach((d) => list.push(d.data() as DirectMessage));
          callback(list);
        },
        (error) => {
          console.warn('Messages subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to subscribe to messages:', err);
      return () => {};
    }
  },
};
