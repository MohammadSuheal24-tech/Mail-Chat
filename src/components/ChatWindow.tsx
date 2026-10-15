import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Pin,
  Lock,
} from 'lucide-react';
import { Conversation, Message, MediaType } from '../types/chat.js';
import { useChat } from '../context/ChatContext.js';
import { useAuth } from '../context/AuthContext.js';
import { WALLPAPER_PRESETS } from '../utils/wallpapers.js';
import { ChatHeader } from './ChatHeader.js';
import { MessageItem } from './MessageItem.js';
import { MessageInput } from './MessageInput.js';
import { MediaLightbox } from './MediaLightbox.js';
import { ForwardModal } from './ForwardModal.js';
import { ReportModal } from './ReportModal.js';
import { GroupInfoModal } from './GroupInfoModal.js';
import { ContactInfoModal } from './ContactInfoModal.js';

interface ChatWindowProps {
  onBackToSidebar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBackToSidebar }) => {
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    setReplyingTo,
    setEditingMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
  } = useChat();

  const { user, chatWallpaper } = useAuth();
  const activeWallpaper = WALLPAPER_PRESETS.find((w) => w.id === chatWallpaper) || WALLPAPER_PRESETS[0];

  // In-chat Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Modals state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: MediaType; name?: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [reportingInfo, setReportingInfo] = useState<{ messageId?: string; userId?: string } | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#111b21] p-8 text-center select-none border-b-4 border-emerald-500">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-inner">
          <MessageSquare className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          EchoChat for Web
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-6">
          Send and receive real-time messages with email authentication. Never requires a phone number. Group chats, voice notes, media sharing, and instant read receipts.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Email-authenticated & private communication</span>
        </div>
      </div>
    );
  }

  // Filter messages matching in-chat search
  const searchMatches = searchQuery.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const targetMsg = searchMatches[nextIdx];
    if (targetMsg) {
      messageRefs.current[targetMsg.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const targetMsg = searchMatches[prevIdx];
    if (targetMsg) {
      messageRefs.current[targetMsg.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToMessage = (msgId: string) => {
    messageRefs.current[msgId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Group messages by date
  const formatMessageDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  // Pinned messages in this conversation
  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0b141a] relative">
      {/* Header */}
      <ChatHeader
        conversation={activeConversation}
        onBack={onBackToSidebar}
        onOpenSearch={() => setShowSearch((s) => !s)}
        onOpenGroupInfo={() => setShowGroupInfo(true)}
        onOpenContactInfo={() => setShowContactInfo(true)}
        pinnedCount={pinnedMessages.length}
        onTogglePinnedList={() => setShowPinnedDrawer((d) => !d)}
      />

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#202c33] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
              autoFocus
            />
          </div>

          {searchMatches.length > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">
                {currentMatchIndex + 1} of {searchMatches.length}
              </span>
              <button
                type="button"
                onClick={handlePrevMatch}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Previous match"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Next match"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned Messages Top Banner */}
      {pinnedMessages.length > 0 && (
        <div
          onClick={() => scrollToMessage(pinnedMessages[0].id)}
          className="px-4 py-2 bg-emerald-50 dark:bg-[#1f2c34] border-b border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-[#25353e] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 rotate-45 shrink-0" />
            <div className="text-xs truncate">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-2">
                Pinned Message:
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {pinnedMessages[0].text || `[${pinnedMessages[0].mediaType}]`}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-2">
            Jump to message →
          </span>
        </div>
      )}

      {/* Main Messages Feed Area with custom selected wallpaper */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 flex flex-col space-y-1 transition-colors duration-200 ${activeWallpaper.bgClass}`}>
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
            <p className="text-xs max-w-xs bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xs">
              🔒 Messages are protected. Start the conversation by sending a text, photo, voice note, or document.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const prevMsg = messages[index - 1];
            const showDateHeader =
              !prevMsg || formatMessageDate(prevMsg.createdAt) !== formatMessageDate(msg.createdAt);

            return (
              <React.Fragment key={msg.id}>
                {/* Date separator pill */}
                {showDateHeader && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-lg text-[11px] font-medium tracking-wide bg-white/90 dark:bg-[#182229]/90 text-slate-600 dark:text-slate-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60 select-none">
                      {formatMessageDate(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div ref={(el) => { messageRefs.current[msg.id] = el; }}>
                  <MessageItem
                    message={msg}
                    isMe={isMe}
                    isGroup={activeConversation.isGroup}
                    onReply={(m) => setReplyingTo(m)}
                    onEdit={(m) => setEditingMessage(m)}
                    onDelete={(id, mode) => deleteMessage(id, mode)}
                    onTogglePin={(id) => togglePinMessage(id)}
                    onReact={(id, emoji) => addReaction(id, emoji)}
                    onForward={(m) => setForwardingMessage(m)}
                    onReport={(messageId, reportedUserId) => setReportingInfo({ messageId, userId: reportedUserId })}
                    onOpenMedia={(url, type, name) => setLightboxMedia({ url, type, name })}
                    searchHighlight={searchQuery}
                  />
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <MessageInput />

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <MediaLightbox
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          mediaName={lightboxMedia.name}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {/* Report Modal */}
      {reportingInfo && (
        <ReportModal
          messageId={reportingInfo.messageId}
          reportedUserId={reportingInfo.userId}
          onClose={() => setReportingInfo(null)}
        />
      )}

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal
          conversation={activeConversation}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      {/* Contact Info Modal */}
      {showContactInfo && (
        <ContactInfoModal
          conversation={activeConversation}
          onClose={() => setShowContactInfo(false)}
          onReportUser={(userId) => setReportingInfo({ userId })}
        />
      )}
    </div>
  );
};
