export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  about?: string;
  isEmailVerified: boolean;
  lastSeen?: string;
  isOnline?: boolean;
  privacySettings: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  blockedUserIds: string[];
  createdAt: string;
}

export type MediaType = 'text' | 'image' | 'video' | 'audio' | 'document';

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mediaType: MediaType;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  duration?: number; // For audio in seconds
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    mediaType?: MediaType;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  isDeletedForEveryone?: boolean;
  deletedForUserIds: string[];
  status: 'sent' | 'delivered' | 'read';
  readByUserIds: string[];
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  description?: string;
  creatorId?: string;
  adminIds: string[];
  participantIds: string[];
  participants?: User[];
  lastMessage?: Message;
  unreadCount?: number;
  pinnedMessageIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  type: 'verification' | 'reset_password';
  subject: string;
  code: string;
  token: string;
  message: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  reason: string;
  details?: string;
  createdAt: string;
}
