import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { dbService } from './server/db.js';
import { authController, requireAuth, AuthRequest } from './server/auth.js';
import { wsManager } from './server/ws.js';

const app = express();
const server = http.createServer(app);

// Increase body parser limits to support audio voice notes and base64 media uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Setup WebSocket server
const wss = new WebSocketServer({ server });
wsManager.init(wss);

// ---------------- API ROUTES ----------------

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', requireAuth, authController.getMe);
app.post('/api/auth/verify-email', requireAuth, authController.verifyEmail);
app.post('/api/auth/resend-verification', requireAuth, authController.resendVerification);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.put('/api/auth/profile', requireAuth, authController.updateProfile);

// Simulated Emails (for testing email verification & password reset without SMTP)
app.get('/api/simulated-emails', requireAuth, (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const emails = dbService.getSimulatedEmailsForUser(user.email);
  return res.json({ emails });
});

// Users Routes
app.get('/api/users', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const users = dbService.getAllUsers(currentUserId);
  return res.json({ users });
});

app.get('/api/users/search', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const query = (req.query.q as string) || '';
  const users = dbService.searchUsers(query, currentUserId);
  return res.json({ users });
});

app.post('/api/users/block', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });
  const blockedList = dbService.blockUser(currentUserId, targetUserId);
  return res.json({ blockedUserIds: blockedList });
});

app.post('/api/users/unblock', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });
  const blockedList = dbService.unblockUser(currentUserId, targetUserId);
  return res.json({ blockedUserIds: blockedList });
});

// Conversations Routes
app.get('/api/conversations', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const conversations = dbService.getUserConversations(currentUserId);
  return res.json({ conversations });
});

app.post('/api/conversations', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const { isGroup, name, avatarUrl, description, participantIds } = req.body;

  if (!isGroup) {
    // Direct chat
    const targetUserId = participantIds?.[0];
    if (!targetUserId) return res.status(400).json({ error: 'Participant required' });

    // Check if direct conversation already exists
    const existing = dbService.getDirectConversation(currentUserId, targetUserId);
    if (existing) {
      return res.json({ conversation: dbService.getConversationById(existing.id) });
    }

    const conversation = dbService.createConversation({
      isGroup: false,
      creatorId: currentUserId,
      participantIds: [currentUserId, targetUserId],
    });

    // Notify target user
    wsManager.sendToUser(targetUserId, {
      type: 'conversation:created',
      conversation,
    });

    return res.status(201).json({ conversation });
  } else {
    // Group chat
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });
    const allParticipants = Array.from(new Set([currentUserId, ...(participantIds || [])]));

    const conversation = dbService.createConversation({
      isGroup: true,
      name: name.trim(),
      avatarUrl,
      description,
      creatorId: currentUserId,
      participantIds: allParticipants,
    });

    // Notify all participants
    wsManager.sendToUsers(allParticipants, {
      type: 'conversation:created',
      conversation,
    });

    return res.status(201).json({ conversation });
  }
});

app.get('/api/conversations/:id', requireAuth, (req: AuthRequest, res) => {
  const convId = req.params.id;
  const conv = dbService.getConversationById(convId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!conv.participantIds.includes(req.user!.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  return res.json({ conversation: conv });
});

app.put('/api/conversations/:id', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.isGroup) return res.status(404).json({ error: 'Group not found' });

  // Only admin or creator can edit group details
  if (!conv.adminIds.includes(currentUserId) && conv.creatorId !== currentUserId) {
    return res.status(403).json({ error: 'Only admins can edit group settings' });
  }

  const { name, description, avatarUrl } = req.body;
  const updated = dbService.updateConversation(convId, { name, description, avatarUrl });

  wsManager.sendToUsers(conv.participantIds, {
    type: 'conversation:updated',
    conversation: updated,
  });

  return res.json({ conversation: updated });
});

// Add participant to group
app.post('/api/conversations/:id/participants', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const { userId } = req.body;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.isGroup) return res.status(404).json({ error: 'Group not found' });

  if (!conv.adminIds.includes(currentUserId) && conv.creatorId !== currentUserId) {
    return res.status(403).json({ error: 'Only group admins can add members' });
  }

  const updated = dbService.addParticipantToGroup(convId, userId);
  if (!updated) return res.status(400).json({ error: 'Failed to add participant' });

  wsManager.sendToUsers(updated.participantIds, {
    type: 'conversation:updated',
    conversation: updated,
  });

  return res.json({ conversation: updated });
});

// Remove participant / leave group
app.delete('/api/conversations/:id/participants/:userId', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const targetUserId = req.params.userId;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.isGroup) return res.status(404).json({ error: 'Group not found' });

  // Allowed if admin OR leaving on own accord
  const isLeavingSelf = currentUserId === targetUserId;
  const isAdmin = conv.adminIds.includes(currentUserId) || conv.creatorId === currentUserId;

  if (!isLeavingSelf && !isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const updated = dbService.removeParticipantFromGroup(convId, targetUserId);

  wsManager.sendToUsers([...conv.participantIds, targetUserId], {
    type: 'conversation:updated',
    conversation: updated,
    removedUserId: targetUserId,
  });

  return res.json({ conversation: updated });
});

// Messages Routes
app.get('/api/conversations/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.participantIds.includes(currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const messages = dbService.getMessagesByConversationId(convId, currentUserId);
  return res.json({ messages });
});

app.post('/api/conversations/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.participantIds.includes(currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if sender is blocked by direct chat recipient
  if (!conv.isGroup) {
    const otherUserId = conv.participantIds.find((id) => id !== currentUserId);
    if (otherUserId) {
      const otherUser = dbService.getUserById(otherUserId);
      if (otherUser && otherUser.blockedUserIds.includes(currentUserId)) {
        return res.status(403).json({ error: 'You cannot send messages to this contact' });
      }
    }
  }

  const currentUser = dbService.getUserById(currentUserId);
  const { text, mediaType, mediaUrl, mediaName, mediaSize, duration, replyTo } = req.body;

  if (!text && !mediaUrl) {
    return res.status(400).json({ error: 'Message content or media is required' });
  }

  // Check recipient presence to mark delivered
  const otherParticipants = conv.participantIds.filter((id) => id !== currentUserId);
  const anyOnline = otherParticipants.some((uid) => wsManager.isUserOnline(uid));

  const newMsg = dbService.createMessage({
    conversationId: convId,
    senderId: currentUserId,
    senderName: currentUser?.displayName || 'User',
    senderAvatar: currentUser?.avatarUrl,
    text: text || '',
    mediaType: mediaType || 'text',
    mediaUrl,
    mediaName,
    mediaSize,
    duration,
    replyTo,
  });

  // If online, update status to delivered
  if (anyOnline) {
    dbService.markMessagesAsDelivered([newMsg.id]);
    newMsg.status = 'delivered';
  }

  // Broadcast message to all conversation members in real-time
  wsManager.sendToUsers(conv.participantIds, {
    type: 'message:new',
    message: newMsg,
    conversationId: convId,
  });

  return res.status(201).json({ message: newMsg });
});

// Edit message
app.put('/api/messages/:id', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const messageId = req.params.id;
  const { text } = req.body;

  const msg = dbService.getMessageById(messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.senderId !== currentUserId) {
    return res.status(403).json({ error: 'You can only edit your own messages' });
  }

  const updatedMsg = dbService.updateMessage(messageId, text);
  const conv = dbService.getConversationById(msg.conversationId);
  if (conv && updatedMsg) {
    wsManager.sendToUsers(conv.participantIds, {
      type: 'message:updated',
      message: updatedMsg,
      conversationId: msg.conversationId,
    });
  }

  return res.json({ message: updatedMsg });
});

// Delete message
app.delete('/api/messages/:id', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const messageId = req.params.id;
  const mode = req.query.mode as string; // 'everyone' | 'me'

  const msg = dbService.getMessageById(messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const conv = dbService.getConversationById(msg.conversationId);

  if (mode === 'everyone') {
    if (msg.senderId !== currentUserId) {
      return res.status(403).json({ error: 'Only the sender can delete for everyone' });
    }
    const updated = dbService.deleteMessageForEveryone(messageId);
    if (conv && updated) {
      wsManager.sendToUsers(conv.participantIds, {
        type: 'message:deleted_everyone',
        message: updated,
        conversationId: msg.conversationId,
      });
    }
    return res.json({ message: updated });
  } else {
    // Delete for me
    const updated = dbService.deleteMessageForMe(messageId, currentUserId);
    return res.json({ message: updated });
  }
});

// Pin / Unpin message
app.post('/api/messages/:id/pin', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const messageId = req.params.id;
  const msg = dbService.getMessageById(messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const conv = dbService.getConversationById(msg.conversationId);
  if (!conv || !conv.participantIds.includes(currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = dbService.togglePinMessage(msg.conversationId, messageId);
  if (result) {
    wsManager.sendToUsers(conv.participantIds, {
      type: 'message:pinned_toggled',
      messageId,
      isPinned: result.isPinned,
      pinnedMessageIds: result.conversation.pinnedMessageIds,
      conversationId: msg.conversationId,
    });
  }

  return res.json(result);
});

// Emoji reaction
app.post('/api/messages/:id/reactions', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const messageId = req.params.id;
  const { emoji } = req.body;

  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  const msg = dbService.getMessageById(messageId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const updatedMsg = dbService.addReaction(messageId, currentUserId, emoji);
  const conv = dbService.getConversationById(msg.conversationId);
  if (conv && updatedMsg) {
    wsManager.sendToUsers(conv.participantIds, {
      type: 'message:reaction',
      messageId,
      reactions: updatedMsg.reactions,
      conversationId: msg.conversationId,
    });
  }

  return res.json({ reactions: updatedMsg?.reactions });
});

// Mark messages as read
app.post('/api/conversations/:id/read', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const convId = req.params.id;
  const conv = dbService.getConversationById(convId);
  if (!conv || !conv.participantIds.includes(currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const readMessageIds = dbService.markMessagesAsRead(convId, currentUserId);

  if (readMessageIds.length > 0) {
    // Notify participants in real-time
    wsManager.sendToUsers(conv.participantIds, {
      type: 'messages:read',
      conversationId: convId,
      messageIds: readMessageIds,
      readerId: currentUserId,
    });
  }

  return res.json({ success: true, count: readMessageIds.length });
});

// Forward message
app.post('/api/messages/forward', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const { originalMessageId, targetConversationIds } = req.body;

  if (!originalMessageId || !Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    return res.status(400).json({ error: 'Invalid forward parameters' });
  }

  const originalMsg = dbService.getMessageById(originalMessageId);
  if (!originalMsg) return res.status(404).json({ error: 'Original message not found' });

  const currentUser = dbService.getUserById(currentUserId);
  const createdMessages: any[] = [];

  targetConversationIds.forEach((convId) => {
    const conv = dbService.getConversationById(convId);
    if (conv && conv.participantIds.includes(currentUserId)) {
      const forwardedMsg = dbService.createMessage({
        conversationId: convId,
        senderId: currentUserId,
        senderName: currentUser?.displayName || 'User',
        senderAvatar: currentUser?.avatarUrl,
        text: originalMsg.text,
        mediaType: originalMsg.mediaType,
        mediaUrl: originalMsg.mediaUrl,
        mediaName: originalMsg.mediaName,
        mediaSize: originalMsg.mediaSize,
        duration: originalMsg.duration,
      });

      createdMessages.push(forwardedMsg);

      wsManager.sendToUsers(conv.participantIds, {
        type: 'message:new',
        message: forwardedMsg,
        conversationId: convId,
      });
    }
  });

  return res.json({ success: true, messages: createdMessages });
});

// Upload media file / voice note
app.post('/api/upload', requireAuth, (req: AuthRequest, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data is required' });
    }

    // Support Base64 data URL saving
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const ext = path.extname(fileName || '') || (fileType?.includes('audio') ? '.webm' : fileType?.includes('image') ? '.png' : '.bin');
    const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `/uploads/${safeName}`;
    return res.json({
      url: fileUrl,
      fileName: fileName || safeName,
      fileSize: Buffer.byteLength(base64Data, 'base64'),
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Report user or message
app.post('/api/reports', requireAuth, (req: AuthRequest, res) => {
  const currentUserId = req.user!.id;
  const { reportedUserId, reportedMessageId, reason, details } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Reason for report is required' });
  }

  const report = dbService.createReport({
    reporterId: currentUserId,
    reportedUserId,
    reportedMessageId,
    reason,
    details,
  });

  return res.status(201).json({
    message: 'Report received. Our moderation team has been notified.',
    report,
  });
});

// Vite Middleware integration for development
async function startServer() {
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoChat server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
