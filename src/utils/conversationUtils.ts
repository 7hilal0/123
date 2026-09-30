import { Conversation, User } from '../types';

/**
 * Resolves a conversation for the viewing user.
 * In a real-time multi-user app, Conversation contains participantIds and participants map.
 * This helper ensures that whichever user opens the conversation sees the other participant's avatar,
 * name, and details properly.
 */
export function resolveConversationForUser(
  conv: Conversation,
  currentUser?: User | null,
  allUsers: User[] = []
): Conversation {
  if (!currentUser) return conv;

  let otherUser: User | undefined;

  // 1. If participants map exists, find the participant whose ID is not currentUser.id
  if (conv.participants) {
    const otherId = Object.keys(conv.participants).find((id) => id !== currentUser.id);
    if (otherId) {
      otherUser = conv.participants[otherId];
    }
  }

  // 2. If participantIds array exists, find the user from allUsers or participants
  if (!otherUser && conv.participantIds) {
    const otherId = conv.participantIds.find((id) => id !== currentUser.id);
    if (otherId) {
      otherUser = allUsers.find((u) => u.id === otherId) || conv.participants?.[otherId];
    }
  }

  // 3. Fallback to conv.participant if it's not currentUser
  if (!otherUser && conv.participant && conv.participant.id !== currentUser.id) {
    otherUser = conv.participant;
  }

  // 4. If the conv.id was generated with sorted IDs e.g. "dm_userA__userB"
  if (!otherUser && conv.id.startsWith('dm_')) {
    const parts = conv.id.replace('dm_', '').split('__');
    const otherId = parts.find((p) => p !== currentUser.id);
    if (otherId) {
      otherUser = allUsers.find((u) => u.id === otherId);
    }
  }

  const finalParticipant = otherUser || conv.participant;

  // Compute unread count for current user: if last sender wasn't me and hasn't been read
  const unread = conv.lastSenderId && conv.lastSenderId !== currentUser.id ? (conv.unreadCount || 1) : 0;

  return {
    ...conv,
    participant: finalParticipant,
    unreadCount: unread,
  };
}
