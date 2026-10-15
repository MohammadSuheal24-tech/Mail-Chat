import { User, Conversation, Message, SimulatedEmail } from '../types/chat.js';

const TOKEN_KEY = 'echochat_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data as T;
  },

  // Auth
  async register(params: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    avatarUrl?: string;
  }): Promise<{ user: User; token: string; emailSent?: any }> {
    const res = await this.request<{ user: User; token: string; emailSent?: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  },

  async login(params: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  },

  async verifyEmail(code: string): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async resendVerification(): Promise<{ message: string; code: string; emailId: string }> {
    return this.request<{ message: string; code: string; emailId: string }>('/api/auth/resend-verification', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; demoHint?: any }> {
    return this.request<{ message: string; demoHint?: any }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: { email: string; code: string; newPassword: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/users');
  },

  async searchUsers(query: string): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async blockUser(targetUserId: string): Promise<{ blockedUserIds: string[] }> {
    return this.request<{ blockedUserIds: string[] }>('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async unblockUser(targetUserId: string): Promise<{ blockedUserIds: string[] }> {
    return this.request<{ blockedUserIds: string[] }>('/api/users/unblock', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  // Conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request<{ conversations: Conversation[] }>('/api/conversations');
  },

  async getConversation(id: string): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>(`/api/conversations/${id}`);
  },

  async createConversation(params: {
    isGroup: boolean;
    name?: string;
    avatarUrl?: string;
    description?: string;
    participantIds: string[];
  }): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addParticipant(conversationId: string, userId: string): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>(`/api/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async removeParticipant(conversationId: string, userId: string): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>(`/api/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE',
    });
  },

  // Messages
  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return this.request<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`);
  },

  async sendMessage(conversationId: string, messageData: Partial<Message>): Promise<{ message: Message }> {
    return this.request<{ message: Message }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  async editMessage(messageId: string, text: string): Promise<{ message: Message }> {
    return this.request<{ message: Message }>(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  },

  async deleteMessage(messageId: string, mode: 'everyone' | 'me'): Promise<{ message: Message }> {
    return this.request<{ message: Message }>(`/api/messages/${messageId}?mode=${mode}`, {
      method: 'DELETE',
    });
  },

  async togglePinMessage(messageId: string): Promise<{ conversation: Conversation; message: Message; isPinned: boolean }> {
    return this.request<{ conversation: Conversation; message: Message; isPinned: boolean }>(`/api/messages/${messageId}/pin`, {
      method: 'POST',
    });
  },

  async addReaction(messageId: string, emoji: string): Promise<{ reactions: any[] }> {
    return this.request<{ reactions: any[] }>(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  async markAsRead(conversationId: string): Promise<{ success: boolean; count: number }> {
    return this.request<{ success: boolean; count: number }>(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  },

  async forwardMessage(originalMessageId: string, targetConversationIds: string[]): Promise<{ success: boolean; messages: Message[] }> {
    return this.request<{ success: boolean; messages: Message[] }>('/api/messages/forward', {
      method: 'POST',
      body: JSON.stringify({ originalMessageId, targetConversationIds }),
    });
  },

  // Upload file / voice note
  async uploadFile(fileData: string, fileName: string, fileType: string): Promise<{ url: string; fileName: string; fileSize: number }> {
    return this.request<{ url: string; fileName: string; fileSize: number }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileData, fileName, fileType }),
    });
  },

  // Simulated emails (for viewing test emails received in browser)
  async getSimulatedEmails(): Promise<{ emails: SimulatedEmail[] }> {
    return this.request<{ emails: SimulatedEmail[] }>('/api/simulated-emails');
  },

  // Report
  async submitReport(data: { reportedUserId?: string; reportedMessageId?: string; reason: string; details?: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
