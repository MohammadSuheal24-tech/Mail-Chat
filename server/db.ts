import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Conversation, Message, SimulatedEmail, ReportItem } from '../src/types/chat.js';

interface DatabaseSchema {
  users: (User & { passwordHash: string; verificationCode?: string; resetCode?: string; resetExpires?: number })[];
  conversations: Conversation[];
  messages: Message[];
  emails: SimulatedEmail[];
  reports: ReportItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let db: DatabaseSchema = {
  users: [],
  conversations: [],
  messages: [],
  emails: [],
  reports: [],
};

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      return;
    } catch (err) {
      console.error('Error reading database file, reseeding:', err);
    }
  }

  // Pre-seed demo users
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', defaultSalt);

  const demoUsers = [
    {
      id: 'usr_sarah',
      email: 'sarah.jenkins@echochat.io',
      username: 'sarah_j',
      displayName: 'Sarah Jenkins',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
      about: 'Designing modern apps & enjoying good coffee ☕✨',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true,
      lastSeen: new Date().toISOString(),
      isOnline: true,
      privacySettings: {
        lastSeenVisibility: 'everyone' as const,
        readReceipts: true,
      },
      blockedUserIds: [],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'usr_marcus',
      email: 'marcus.vance@echochat.io',
      username: 'marcus_v',
      displayName: 'Marcus Vance',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
      about: 'Full-stack builder. Let\'s make real-time software!',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      isOnline: false,
      privacySettings: {
        lastSeenVisibility: 'everyone' as const,
        readReceipts: true,
      },
      blockedUserIds: [],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'usr_priya',
      email: 'priya.patel@echochat.io',
      username: 'priya_p',
      displayName: 'Priya Patel',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc',
      about: 'Product Lead. Fast messages, thoughtful work.',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true,
      lastSeen: new Date().toISOString(),
      isOnline: true,
      privacySettings: {
        lastSeenVisibility: 'everyone' as const,
        readReceipts: true,
      },
      blockedUserIds: [],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'usr_alex',
      email: 'alex.rivera@echochat.io',
      username: 'alex_r',
      displayName: 'Alex Rivera',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9',
      about: 'Available for quick questions and coffee chats',
      passwordHash: defaultPasswordHash,
      isEmailVerified: true,
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      isOnline: false,
      privacySettings: {
        lastSeenVisibility: 'everyone' as const,
        readReceipts: true,
      },
      blockedUserIds: [],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  // Seed demo group conversation
  const groupConvo: Conversation = {
    id: 'conv_group_echo',
    isGroup: true,
    name: 'Echo Community & Tech',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=EchoCommunity',
    description: 'Welcome to EchoChat! Real-time group messaging without phone numbers.',
    creatorId: 'usr_sarah',
    adminIds: ['usr_sarah'],
    participantIds: ['usr_sarah', 'usr_marcus', 'usr_priya', 'usr_alex'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    pinnedMessageIds: ['msg_welcome_pinned'],
  };

  const seedMessages: Message[] = [
    {
      id: 'msg_welcome_pinned',
      conversationId: 'conv_group_echo',
      senderId: 'usr_sarah',
      senderName: 'Sarah Jenkins',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
      text: '🎉 Welcome to EchoChat! Enjoy real-time chatting with email-only authentication, voice notes, media sharing, and read receipts.',
      mediaType: 'text',
      isPinned: true,
      deletedForUserIds: [],
      status: 'read',
      readByUserIds: ['usr_sarah', 'usr_marcus', 'usr_priya', 'usr_alex'],
      reactions: [
        { emoji: '👋', userIds: ['usr_marcus', 'usr_priya'] },
        { emoji: '🚀', userIds: ['usr_sarah', 'usr_alex'] },
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'msg_priya_voice',
      conversationId: 'conv_group_echo',
      senderId: 'usr_priya',
      senderName: 'Priya Patel',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc',
      text: 'Voice note demo: check out the audio player and waveform below!',
      mediaType: 'audio',
      mediaName: 'voice_note_welcome.webm',
      duration: 6,
      deletedForUserIds: [],
      status: 'read',
      readByUserIds: ['usr_sarah', 'usr_marcus'],
      reactions: [{ emoji: '❤️', userIds: ['usr_sarah'] }],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg_marcus_hello',
      conversationId: 'conv_group_echo',
      senderId: 'usr_marcus',
      senderName: 'Marcus Vance',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
      text: 'Double blue ticks, reply threads, and pinning all work seamlessly across browser tabs!',
      mediaType: 'text',
      replyTo: {
        id: 'msg_welcome_pinned',
        senderName: 'Sarah Jenkins',
        text: '🎉 Welcome to EchoChat! Enjoy real-time chatting with email-only authentication...',
      },
      deletedForUserIds: [],
      status: 'read',
      readByUserIds: ['usr_sarah'],
      reactions: [{ emoji: '🔥', userIds: ['usr_alex'] }],
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  groupConvo.lastMessage = seedMessages[seedMessages.length - 1];

  db = {
    users: demoUsers,
    conversations: [groupConvo],
    messages: seedMessages,
    emails: [],
    reports: [],
  };

  saveDb();
}

// Initialize on import
initDb();

// DB Access Methods
export const dbService = {
  // Users
  getUserById(id: string) {
    const u = db.users.find((user) => user.id === id);
    if (!u) return null;
    const { passwordHash: _hash, verificationCode: _v, resetCode: _r, resetExpires: _re, ...publicUser } = u;
    return publicUser as User;
  },

  getUserAuthById(id: string) {
    return db.users.find((user) => user.id === id) || null;
  },

  getUserByEmail(email: string) {
    return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserByUsername(username: string) {
    return db.users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null;
  },

  createUser(userData: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
    avatarUrl?: string;
    about?: string;
    verificationCode?: string;
  }) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      passwordHash: userData.passwordHash,
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}&backgroundColor=b6e3f4`,
      about: userData.about || 'Hey there! I am using EchoChat.',
      isEmailVerified: false,
      verificationCode: userData.verificationCode,
      lastSeen: new Date().toISOString(),
      isOnline: true,
      privacySettings: {
        lastSeenVisibility: 'everyone' as const,
        readReceipts: true,
      },
      blockedUserIds: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb();
    const { passwordHash: _hash, verificationCode: _v, ...publicUser } = newUser;
    return publicUser as User;
  },

  updateUser(id: string, updates: Partial<User & { passwordHash?: string; verificationCode?: string; resetCode?: string; resetExpires?: number }>) {
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates };
    saveDb();
    const { passwordHash: _hash, verificationCode: _v, resetCode: _r, resetExpires: _re, ...publicUser } = db.users[idx];
    return publicUser as User;
  },

  getAllUsers(excludeUserId?: string) {
    return db.users
      .filter((u) => !excludeUserId || u.id !== excludeUserId)
      .map(({ passwordHash: _h, verificationCode: _v, resetCode: _r, resetExpires: _re, ...pub }) => pub as User);
  },

  searchUsers(query: string, currentUserId: string) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return db.users
      .filter((u) => u.id !== currentUserId && (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
      .map(({ passwordHash: _h, verificationCode: _v, resetCode: _r, resetExpires: _re, ...pub }) => pub as User);
  },

  blockUser(userId: string, targetUserId: string) {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
      saveDb();
    }
    return user.blockedUserIds;
  },

  unblockUser(userId: string, targetUserId: string) {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    user.blockedUserIds = user.blockedUserIds.filter((id) => id !== targetUserId);
    saveDb();
    return user.blockedUserIds;
  },

  // Conversations
  getConversationById(id: string) {
    const c = db.conversations.find((conv) => conv.id === id);
    if (!c) return null;
    const participants = c.participantIds
      .map((pid) => this.getUserById(pid))
      .filter((p): p is User => p !== null);
    return { ...c, participants };
  },

  getUserConversations(userId: string) {
    const convos = db.conversations.filter((c) => c.participantIds.includes(userId));
    return convos.map((c) => {
      const participants = c.participantIds
        .map((pid) => this.getUserById(pid))
        .filter((p): p is User => p !== null);

      // Get last active message that is not deleted for this user
      const msgs = db.messages
        .filter((m) => m.conversationId === c.id && !m.deletedForUserIds.includes(userId))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;

      // Count unread
      const unreadCount = msgs.filter((m) => m.senderId !== userId && !m.readByUserIds.includes(userId)).length;

      return {
        ...c,
        participants,
        lastMessage,
        unreadCount,
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getDirectConversation(user1Id: string, user2Id: string) {
    return db.conversations.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(user1Id) &&
        c.participantIds.includes(user2Id)
    ) || null;
  },

  createConversation(data: {
    isGroup: boolean;
    name?: string;
    avatarUrl?: string;
    description?: string;
    creatorId: string;
    participantIds: string[];
  }) {
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isGroup: data.isGroup,
      name: data.name,
      avatarUrl: data.avatarUrl || (data.isGroup ? `https://api.dicebear.com/7.x/identicon/svg?seed=${data.name}` : undefined),
      description: data.description,
      creatorId: data.creatorId,
      adminIds: data.isGroup ? [data.creatorId] : [],
      participantIds: Array.from(new Set(data.participantIds)),
      pinnedMessageIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.conversations.push(newConv);
    saveDb();
    return this.getConversationById(newConv.id)!;
  },

  updateConversation(id: string, updates: Partial<Conversation>) {
    const idx = db.conversations.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.conversations[idx] = { ...db.conversations[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDb();
    return this.getConversationById(id);
  },

  addParticipantToGroup(convId: string, newUserId: string) {
    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv || !conv.isGroup) return null;
    if (!conv.participantIds.includes(newUserId)) {
      conv.participantIds.push(newUserId);
      conv.updatedAt = new Date().toISOString();
      saveDb();
    }
    return this.getConversationById(convId);
  },

  removeParticipantFromGroup(convId: string, targetUserId: string) {
    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv || !conv.isGroup) return null;
    conv.participantIds = conv.participantIds.filter((id) => id !== targetUserId);
    conv.adminIds = conv.adminIds.filter((id) => id !== targetUserId);
    conv.updatedAt = new Date().toISOString();
    saveDb();
    return this.getConversationById(convId);
  },

  // Messages
  getMessagesByConversationId(conversationId: string, userId: string) {
    return db.messages
      .filter((m) => m.conversationId === conversationId && !m.deletedForUserIds.includes(userId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getMessageById(messageId: string) {
    return db.messages.find((m) => m.id === messageId) || null;
  },

  createMessage(data: Omit<Message, 'id' | 'createdAt' | 'status' | 'readByUserIds' | 'reactions' | 'deletedForUserIds'>) {
    const newMsg: Message = {
      ...data,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deletedForUserIds: [],
      status: 'sent',
      readByUserIds: [data.senderId],
      reactions: [],
      createdAt: new Date().toISOString(),
    };
    db.messages.push(newMsg);

    // Update conversation updatedAt and lastMessage
    const conv = db.conversations.find((c) => c.id === data.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
      conv.lastMessage = newMsg;
    }

    saveDb();
    return newMsg;
  },

  updateMessage(messageId: string, text: string) {
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    msg.text = text;
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();
    saveDb();
    return msg;
  },

  deleteMessageForEveryone(messageId: string) {
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    msg.isDeletedForEveryone = true;
    msg.text = 'This message was deleted';
    msg.mediaUrl = undefined;
    msg.mediaType = 'text';
    msg.updatedAt = new Date().toISOString();
    saveDb();
    return msg;
  },

  deleteMessageForMe(messageId: string, userId: string) {
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (!msg.deletedForUserIds.includes(userId)) {
      msg.deletedForUserIds.push(userId);
      saveDb();
    }
    return msg;
  },

  togglePinMessage(conversationId: string, messageId: string) {
    const conv = db.conversations.find((c) => c.id === conversationId);
    const msg = db.messages.find((m) => m.id === messageId);
    if (!conv || !msg) return null;

    conv.pinnedMessageIds = conv.pinnedMessageIds || [];
    const isCurrentlyPinned = conv.pinnedMessageIds.includes(messageId);

    if (isCurrentlyPinned) {
      conv.pinnedMessageIds = conv.pinnedMessageIds.filter((id) => id !== messageId);
      msg.isPinned = false;
    } else {
      conv.pinnedMessageIds.push(messageId);
      msg.isPinned = true;
    }

    saveDb();
    return { conversation: conv, message: msg, isPinned: !isCurrentlyPinned };
  },

  addReaction(messageId: string, userId: string, emoji: string) {
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return null;

    msg.reactions = msg.reactions || [];

    // Check if user already reacted with this emoji (toggle)
    const existingEmojiIndex = msg.reactions.findIndex((r) => r.emoji === emoji);

    // Remove user from any other emoji reaction on this message first
    msg.reactions.forEach((r) => {
      r.userIds = r.userIds.filter((id) => id !== userId);
    });

    if (existingEmojiIndex !== -1 && msg.reactions[existingEmojiIndex].userIds.includes(userId)) {
      // Already toggled off
    } else {
      if (existingEmojiIndex !== -1) {
        msg.reactions[existingEmojiIndex].userIds.push(userId);
      } else {
        msg.reactions.push({ emoji, userIds: [userId] });
      }
    }

    // Clean up empty reaction buckets
    msg.reactions = msg.reactions.filter((r) => r.userIds.length > 0);
    saveDb();
    return msg;
  },

  markMessagesAsRead(conversationId: string, readerId: string) {
    const unreadMsgs = db.messages.filter(
      (m) =>
        m.conversationId === conversationId &&
        m.senderId !== readerId &&
        !m.readByUserIds.includes(readerId)
    );

    if (unreadMsgs.length === 0) return [];

    const updatedIds: string[] = [];
    unreadMsgs.forEach((m) => {
      m.readByUserIds.push(readerId);
      m.status = 'read';
      updatedIds.push(m.id);
    });

    saveDb();
    return updatedIds;
  },

  markMessagesAsDelivered(messageIds: string[]) {
    const updated: Message[] = [];
    messageIds.forEach((id) => {
      const msg = db.messages.find((m) => m.id === id);
      if (msg && msg.status === 'sent') {
        msg.status = 'delivered';
        updated.push(msg);
      }
    });
    if (updated.length > 0) saveDb();
    return updated;
  },

  // Simulated Emails
  addSimulatedEmail(emailData: Omit<SimulatedEmail, 'id' | 'createdAt'>) {
    const email: SimulatedEmail = {
      ...emailData,
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    db.emails.unshift(email);
    // Keep max 50 emails
    if (db.emails.length > 50) db.emails.pop();
    saveDb();
    return email;
  },

  getSimulatedEmailsForUser(userEmail: string) {
    return db.emails.filter((m) => m.to.toLowerCase() === userEmail.toLowerCase());
  },

  getAllSimulatedEmails() {
    return db.emails;
  },

  // Reports
  createReport(reportData: Omit<ReportItem, 'id' | 'createdAt'>) {
    const report: ReportItem = {
      ...reportData,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    db.reports.push(report);
    saveDb();
    return report;
  },
};
