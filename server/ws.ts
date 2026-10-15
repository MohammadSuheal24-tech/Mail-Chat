import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { dbService } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'echochat_super_secret_jwt_key_2026';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<WebSocket>> = new Map();
  private socketToUser: Map<WebSocket, string> = new Map();

  init(wss: WebSocketServer) {
    this.wss = wss;

    wss.on('connection', (ws: WebSocket) => {
      let currentUserId: string | undefined;

      ws.on('message', (raw: string) => {
        try {
          const data = JSON.parse(raw.toString());
          this.handleMessage(ws, data, (userId) => {
            currentUserId = userId;
          });
        } catch (err) {
          console.error('Invalid WS message payload:', err);
        }
      });

      ws.on('close', () => {
        if (currentUserId) {
          this.removeUserSocket(currentUserId, ws);
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
      });
    });

    console.log('WebSocketManager initialized successfully');
  }

  private handleMessage(ws: WebSocket, data: any, setUserId: (id: string) => void) {
    switch (data.type) {
      case 'auth': {
        const { token, userId } = data;
        let resolvedUserId = userId;

        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            resolvedUserId = decoded.id;
          } catch (e) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid authentication token' }));
            return;
          }
        }

        if (resolvedUserId) {
          setUserId(resolvedUserId);
          this.addUserSocket(resolvedUserId, ws);

          // Update user status
          dbService.updateUser(resolvedUserId, { isOnline: true, lastSeen: new Date().toISOString() });

          // Broadcast presence
          this.broadcast({
            type: 'presence:update',
            userId: resolvedUserId,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          });

          // Confirm auth
          ws.send(JSON.stringify({ type: 'auth:success', userId: resolvedUserId }));
        }
        break;
      }

      case 'typing:start': {
        const { conversationId, userId } = data;
        if (!conversationId || !userId) return;
        const conv = dbService.getConversationById(conversationId);
        if (conv) {
          const otherParticipants = conv.participantIds.filter((id) => id !== userId);
          const user = dbService.getUserById(userId);
          this.sendToUsers(otherParticipants, {
            type: 'typing:start',
            conversationId,
            userId,
            userName: user?.displayName || 'Someone',
          });
        }
        break;
      }

      case 'typing:stop': {
        const { conversationId, userId } = data;
        if (!conversationId || !userId) return;
        const conv = dbService.getConversationById(conversationId);
        if (conv) {
          const otherParticipants = conv.participantIds.filter((id) => id !== userId);
          this.sendToUsers(otherParticipants, {
            type: 'typing:stop',
            conversationId,
            userId,
          });
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }

      default:
        break;
    }
  }

  private addUserSocket(userId: string, ws: WebSocket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(ws);
    this.socketToUser.set(ws, userId);
  }

  private removeUserSocket(userId: string, ws: WebSocket) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // User went fully offline
        const lastSeen = new Date().toISOString();
        dbService.updateUser(userId, { isOnline: false, lastSeen });
        this.broadcast({
          type: 'presence:update',
          userId,
          isOnline: false,
          lastSeen,
        });
      }
    }
    this.socketToUser.delete(ws);
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  sendToUser(userId: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    const msg = JSON.stringify(payload);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  }

  sendToUsers(userIds: string[], payload: any) {
    userIds.forEach((id) => this.sendToUser(id, payload));
  }

  broadcast(payload: any, excludeUserId?: string) {
    const msg = JSON.stringify(payload);
    this.userSockets.forEach((sockets, uid) => {
      if (excludeUserId && uid === excludeUserId) return;
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      });
    });
  }
}

export const wsManager = new WebSocketManager();
