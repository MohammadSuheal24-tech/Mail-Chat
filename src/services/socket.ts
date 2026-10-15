import { api } from './api.js';

type EventCallback = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isConnected = false;
  private shouldReconnect = true;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = api.getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Authenticate socket connection
        if (token) {
          this.send({ type: 'auth', token });
        }
        this.emitLocal('connected', { isConnected: true });

        // Ping every 25 seconds to keep connection active
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping' });
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            this.emitLocal(data.type, data);
          }
        } catch (e) {
          console.error('Socket message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        this.emitLocal('disconnected', { isConnected: false });
        if (this.shouldReconnect) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.delete(callback);
    }
  }

  private emitLocal(event: string, data: any) {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  sendTypingStart(conversationId: string, userId: string) {
    this.send({ type: 'typing:start', conversationId, userId });
  }

  sendTypingStop(conversationId: string, userId: string) {
    this.send({ type: 'typing:stop', conversationId, userId });
  }
}

export const socketService = new SocketClient();
