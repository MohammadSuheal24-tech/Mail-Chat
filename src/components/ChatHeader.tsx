import React from 'react';
import {
  ArrowLeft,
  Search,
  Pin,
  MoreVertical,
  Users,
  Shield,
  PhoneOff,
} from 'lucide-react';
import { Conversation, User } from '../types/chat.js';
import { useChat } from '../context/ChatContext.js';
import { useAuth } from '../context/AuthContext.js';

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  onOpenSearch: () => void;
  onOpenGroupInfo: () => void;
  onOpenContactInfo: () => void;
  pinnedCount: number;
  onTogglePinnedList: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  onOpenSearch,
  onOpenGroupInfo,
  onOpenContactInfo,
  pinnedCount,
  onTogglePinnedList,
}) => {
  const { typingMap, getOtherParticipant } = useChat();
  const { user } = useAuth();

  const isGroup = conversation.isGroup;
  const otherUser = getOtherParticipant(conversation);
  const typingList = typingMap[conversation.id] || [];

  // Title
  const title = isGroup ? conversation.name : otherUser?.displayName || 'Direct Chat';
  const avatar = isGroup
    ? conversation.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.name}`
    : otherUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username || 'user'}`;

  // Subtitle logic
  const renderSubtitle = () => {
    if (typingList.length > 0) {
      const names = typingList.map((t) => t.userName).join(', ');
      return <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">{names} typing...</span>;
    }

    if (isGroup) {
      const memberCount = conversation.participantIds.length;
      return <span>{memberCount} members</span>;
    }

    if (!otherUser) return null;

    // Check if other user blocked me or I blocked them
    const isBlocked = user?.blockedUserIds.includes(otherUser.id);
    if (isBlocked) {
      return <span className="text-slate-400">Blocked</span>;
    }

    // Check last-seen privacy setting of other user
    const visibility = otherUser.privacySettings?.lastSeenVisibility || 'everyone';
    if (visibility === 'nobody') {
      return null;
    }

    if (otherUser.isOnline) {
      return <span className="text-emerald-600 dark:text-emerald-400 font-medium">online</span>;
    }

    if (otherUser.lastSeen) {
      const date = new Date(otherUser.lastSeen);
      const isToday = new Date().toDateString() === date.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
        <span>
          {isToday ? `last seen today at ${timeStr}` : `last seen on ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="h-16 px-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0 select-none z-10">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Back to chat list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar and name clickable to open info */}
        <div
          onClick={isGroup ? onOpenGroupInfo : onOpenContactInfo}
          className="flex items-center gap-3 cursor-pointer py-1 pr-2 rounded-xl hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
            />
            {!isGroup && otherUser?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#202c33] rounded-full" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-xs">
              {title}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs leading-tight">
              {renderSubtitle()}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
        {/* Pinned Messages Toggle */}
        {pinnedCount > 0 && (
          <button
            type="button"
            onClick={onTogglePinnedList}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            title={`${pinnedCount} pinned messages`}
          >
            <Pin className="w-3.5 h-3.5 rotate-45" />
            <span>{pinnedCount}</span>
          </button>
        )}

        {/* Search messages in chat */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Group Info / Contact Info */}
        <button
          type="button"
          onClick={isGroup ? onOpenGroupInfo : onOpenContactInfo}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={isGroup ? 'Group information' : 'Contact details'}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
