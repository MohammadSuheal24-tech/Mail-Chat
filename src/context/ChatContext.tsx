import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, MediaType, User } from '../types/chat.js';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';
import { sounds } from '../utils/audio.js';
import { useAuth } from './AuthContext.js';

interface TypingInfo {
  userId: string;
  userName: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Message[];
  isLoadingMessages: boolean;
  filterTab: 'all' | 'unread' | 'groups';
  setFilterTab: (tab: 'all' | 'unread' | 'groups') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typingMap: Record<string, TypingInfo[]>;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  sendMessage: (params: {
    text: string;
    mediaType?: MediaType;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    duration?: number;
  }) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string, mode: 'everyone' | 'me') => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  forwardMessage: (messageId: string, targetConversationIds: string[]) => Promise<void>;
  startDirectChat: (targetUserId: string) => Promise<Conversation>;
  createGroup: (name: string, description?: string, participantIds?: string[], avatarUrl?: string) => Promise<Conversation>;
  refreshConversations: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  getOtherParticipant: (conversation: Conversation) => User | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingMap, setTypingMap] = useState<Record<string, TypingInfo[]>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const activeConvRef = useRef<string | null>(null);
  activeConvRef.current = activeConversationId;

  const currentUserIdRef = useRef<string | undefined>(user?.id);
  currentUserIdRef.current = user?.id;

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const refreshConversations = useCallback(async () => {
    if (!currentUserIdRef.current) return;
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, []);

  // Load conversations when user authenticates
  useEffect(() => {
    if (user?.id) {
      refreshConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [user?.id, refreshConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !user?.id) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    api.getMessages(activeConversationId)
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages);
          setIsLoadingMessages(false);
          // Mark messages as read
          api.markAsRead(activeConversationId).then(() => {
            // Update unread count locally
            setConversations((prev) =>
              prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
            );
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, user?.id]);

  // WebSocket event listeners
  useEffect(() => {
    if (!user?.id) return;

    const unsubs = [
      socketService.on('message:new', (data: { message: Message; conversationId: string }) => {
        const { message, conversationId } = data;
        const currentActiveId = activeConvRef.current;
        const isFromMe = message.senderId === currentUserIdRef.current;

        // If for active chat, append message
        if (conversationId === currentActiveId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });

          // Mark as read immediately if not sent by me
          if (!isFromMe) {
            api.markAsRead(conversationId).catch(() => {});
            sounds.playReceived();
          }
        } else {
          // Play received chime for other chat
          if (!isFromMe) {
            sounds.playReceived();
          }
        }

        // Update conversation lastMessage & unreadCount
        setConversations((prev) => {
          return prev
            .map((c) => {
              if (c.id === conversationId) {
                const isCurrentActive = c.id === currentActiveId;
                const newUnread = isCurrentActive || isFromMe ? 0 : (c.unreadCount || 0) + 1;
                return {
                  ...c,
                  lastMessage: message,
                  unreadCount: newUnread,
                  updatedAt: message.createdAt,
                };
              }
              return c;
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
      }),

      socketService.on('message:updated', (data: { message: Message; conversationId: string }) => {
        const { message, conversationId } = data;
        if (conversationId === activeConvRef.current) {
          setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId && c.lastMessage?.id === message.id) {
              return { ...c, lastMessage: message };
            }
            return c;
          })
        );
      }),

      socketService.on('message:deleted_everyone', (data: { message: Message; conversationId: string }) => {
        const { message, conversationId } = data;
        if (conversationId === activeConvRef.current) {
          setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
        }
      }),

      socketService.on('messages:read', (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
        const { conversationId, messageIds, readerId } = data;
        if (conversationId === activeConvRef.current) {
          setMessages((prev) =>
            prev.map((m) => {
              if (messageIds.includes(m.id)) {
                return {
                  ...m,
                  status: 'read',
                  readByUserIds: Array.from(new Set([...m.readByUserIds, readerId])),
                };
              }
              return m;
            })
          );
        }
      }),

      socketService.on('message:pinned_toggled', (data: { messageId: string; isPinned: boolean; pinnedMessageIds: string[]; conversationId: string }) => {
        const { messageId, isPinned, pinnedMessageIds, conversationId } = data;
        if (conversationId === activeConvRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
          );
        }
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, pinnedMessageIds } : c))
        );
      }),

      socketService.on('message:reaction', (data: { messageId: string; reactions: any[]; conversationId: string }) => {
        const { messageId, reactions, conversationId } = data;
        if (conversationId === activeConvRef.current) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
          );
        }
      }),

      socketService.on('typing:start', (data: { conversationId: string; userId: string; userName: string }) => {
        const { conversationId, userId, userName } = data;
        setTypingMap((prev) => {
          const list = prev[conversationId] || [];
          if (list.some((item) => item.userId === userId)) return prev;
          return { ...prev, [conversationId]: [...list, { userId, userName }] };
        });
      }),

      socketService.on('typing:stop', (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        setTypingMap((prev) => {
          const list = prev[conversationId] || [];
          return { ...prev, [conversationId]: list.filter((item) => item.userId !== userId) };
        });
      }),

      socketService.on('presence:update', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
        const { userId, isOnline, lastSeen } = data;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.participantIds.includes(userId)) {
              const updatedParticipants = c.participants?.map((p) =>
                p.id === userId ? { ...p, isOnline, lastSeen } : p
              );
              return { ...c, participants: updatedParticipants };
            }
            return c;
          })
        );
      }),

      socketService.on('conversation:created', (_data: any) => {
        refreshConversations();
      }),

      socketService.on('conversation:updated', (data: { conversation: Conversation; removedUserId?: string }) => {
        const { conversation, removedUserId } = data;
        if (removedUserId === currentUserIdRef.current) {
          // Current user removed from group
          setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
          if (activeConvRef.current === conversation.id) {
            setActiveConversationId(null);
          }
        } else {
          setConversations((prev) =>
            prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
          );
        }
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user?.id, refreshConversations]);

  // Typing helper
  const typingTimerRef = useRef<any>(null);
  const setTyping = (isTyping: boolean) => {
    if (!activeConversationId || !user?.id) return;
    if (isTyping) {
      socketService.sendTypingStart(activeConversationId, user.id);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketService.sendTypingStop(activeConversationId, user.id);
      }, 3000);
    } else {
      clearTimeout(typingTimerRef.current);
      socketService.sendTypingStop(activeConversationId, user.id);
    }
  };

  const sendMessage = async (params: {
    text: string;
    mediaType?: MediaType;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    duration?: number;
  }) => {
    if (!activeConversationId || !user?.id) return;

    setTyping(false);

    const payload: any = {
      text: params.text,
      mediaType: params.mediaType || 'text',
      mediaUrl: params.mediaUrl,
      mediaName: params.mediaName,
      mediaSize: params.mediaSize,
      duration: params.duration,
    };

    if (replyingTo) {
      payload.replyTo = {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        text: replyingTo.text,
        mediaType: replyingTo.mediaType,
      };
      setReplyingTo(null);
    }

    try {
      const res = await api.sendMessage(activeConversationId, payload);
      sounds.playSent();

      // Add to messages if not already present
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      // Update conversation in list
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id === activeConversationId) {
              return {
                ...c,
                lastMessage: res.message,
                updatedAt: res.message.createdAt,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (err: any) {
      console.error('Send message error:', err);
      throw err;
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    try {
      const res = await api.editMessage(messageId, text);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
      setEditingMessage(null);
    } catch (err: any) {
      console.error('Edit message error:', err);
      throw err;
    }
  };

  const deleteMessage = async (messageId: string, mode: 'everyone' | 'me') => {
    try {
      const res = await api.deleteMessage(messageId, mode);
      if (mode === 'everyone') {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
      } else {
        // Remove locally
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err: any) {
      console.error('Delete message error:', err);
      throw err;
    }
  };

  const togglePinMessage = async (messageId: string) => {
    try {
      const res = await api.togglePinMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: res.isPinned } : m))
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === res.conversation.id ? { ...c, pinnedMessageIds: res.conversation.pinnedMessageIds } : c))
      );
    } catch (err: any) {
      console.error('Toggle pin error:', err);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await api.addReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err: any) {
      console.error('Add reaction error:', err);
    }
  };

  const forwardMessage = async (messageId: string, targetConversationIds: string[]) => {
    try {
      await api.forwardMessage(messageId, targetConversationIds);
      refreshConversations();
    } catch (err: any) {
      console.error('Forward message error:', err);
      throw err;
    }
  };

  const startDirectChat = async (targetUserId: string): Promise<Conversation> => {
    const res = await api.createConversation({
      isGroup: false,
      participantIds: [targetUserId],
    });
    await refreshConversations();
    setActiveConversationId(res.conversation.id);
    return res.conversation;
  };

  const createGroup = async (
    name: string,
    description?: string,
    participantIds: string[] = [],
    avatarUrl?: string
  ): Promise<Conversation> => {
    const res = await api.createConversation({
      isGroup: true,
      name,
      description,
      participantIds,
      avatarUrl,
    });
    await refreshConversations();
    setActiveConversationId(res.conversation.id);
    return res.conversation;
  };

  const getOtherParticipant = (conversation: Conversation): User | undefined => {
    if (conversation.isGroup || !user) return undefined;
    const otherId = conversation.participantIds.find((id) => id !== user.id);
    return conversation.participants?.find((p) => p.id === otherId);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeConversationId,
        setActiveConversationId,
        messages,
        isLoadingMessages,
        filterTab,
        setFilterTab,
        searchQuery,
        setSearchQuery,
        typingMap,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        sendMessage,
        editMessage,
        deleteMessage,
        togglePinMessage,
        addReaction,
        forwardMessage,
        startDirectChat,
        createGroup,
        refreshConversations,
        setTyping,
        getOtherParticipant,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
