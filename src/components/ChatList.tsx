import React from 'react';
import {
  Search,
  Check,
  CheckCheck,
  Camera,
  Mic,
  Video,
  FileText,
  Users,
} from 'lucide-react';
import { Conversation } from '../types/chat.js';
import { useChat } from '../context/ChatContext.js';
import { useAuth } from '../context/AuthContext.js';

interface ChatListProps {
  onSelectConversation: (id: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectConversation }) => {
  const {
    conversations,
    activeConversationId,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    getOtherParticipant,
  } = useChat();

  const { user } = useAuth();

  const formatListTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    const title = c.isGroup ? c.name : other?.displayName;
    const username = other?.username || '';
    const lastMsgText = c.lastMessage?.text || '';

    // Search filter
    const matchesSearch =
      !searchQuery.trim() ||
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsgText.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    if (filterTab === 'unread') {
      return matchesSearch && (c.unreadCount || 0) > 0;
    }
    if (filterTab === 'groups') {
      return matchesSearch && c.isGroup;
    }

    return matchesSearch;
  });

  const renderLastMessageSnippet = (conv: Conversation) => {
    const msg = conv.lastMessage;
    if (!msg) return <span className="italic opacity-60">No messages yet</span>;

    const isMe = msg.senderId === user?.id;

    return (
      <div className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
        {isMe && !msg.isDeletedForEveryone && (
          <span className="shrink-0">
            {msg.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-slate-400" />
            )}
          </span>
        )}

        {msg.mediaType === 'image' && (
          <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-300">
            <Camera className="w-3.5 h-3.5" /> Photo
          </span>
        )}
        {msg.mediaType === 'audio' && (
          <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-300">
            <Mic className="w-3.5 h-3.5 text-emerald-500" /> Voice message
          </span>
        )}
        {msg.mediaType === 'video' && (
          <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-300">
            <Video className="w-3.5 h-3.5" /> Video
          </span>
        )}
        {msg.mediaType === 'document' && (
          <span className="flex items-center gap-1 shrink-0 text-slate-600 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5" /> Document
          </span>
        )}

        {msg.text && (
          <span className="truncate">
            {conv.isGroup && !isMe ? `${msg.senderName}: ` : ''}
            {msg.text}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#111b21]">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] rounded-xl text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs (All / Unread / Groups) */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 select-none">
        {(['all', 'unread', 'groups'] as const).map((tab) => {
          const isActive = filterTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {searchQuery
              ? 'No chats match your search query.'
              : filterTab === 'unread'
              ? 'No unread messages.'
              : filterTab === 'groups'
              ? 'No group chats yet. Create one!'
              : 'No conversations yet. Start a new chat!'}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isGroup = c.isGroup;
            const other = getOtherParticipant(c);
            const title = isGroup ? c.name : other?.displayName || 'Direct Chat';
            const avatar = isGroup
              ? c.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.name}`
              : other?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`;
            const isActive = c.id === activeConversationId;
            const unreadCount = c.unreadCount || 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#202c33]'
                }`}
              >
                {/* Avatar with presence */}
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-xs"
                  />
                  {!isGroup && other?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#111b21] rounded-full" />
                  )}
                </div>

                {/* Content info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {title}
                    </p>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                      {formatListTimestamp(c.lastMessage?.createdAt || c.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {renderLastMessageSnippet(c)}
                    </div>

                    {unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
