import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Pin,
  Smile,
  Reply,
  Copy,
  Forward,
  Edit2,
  Trash2,
  Flag,
  FileText,
  Download,
  MoreVertical,
} from 'lucide-react';
import { Message, MediaType } from '../types/chat.js';
import { AudioVoicePlayer } from './AudioVoicePlayer.js';
import { QUICK_REACTIONS } from './EmojiPicker.js';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  isGroup: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string, mode: 'everyone' | 'me') => void;
  onTogglePin: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onForward: (message: Message) => void;
  onReport: (messageId: string, reportedUserId?: string) => void;
  onOpenMedia: (url: string, type: MediaType, name?: string) => void;
  searchHighlight?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onReact,
  onForward,
  onReport,
  onOpenMedia,
  searchHighlight,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderHighlightedText = (text: string) => {
    if (!searchHighlight || !searchHighlight.trim()) return text;
    const parts = text.split(new RegExp(`(${searchHighlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchHighlight.toLowerCase() ? (
        <span key={i} className="bg-amber-300 dark:bg-amber-500/60 text-slate-900 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={`group relative flex w-full my-1 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        ref={menuRef}
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl shadow-sm text-sm transition-all ${
          isMe
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-xs'
            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-xs'
        } ${message.isDeletedForEveryone ? 'italic opacity-70' : ''}`}
      >
        {/* Pinned Indicator badge */}
        {message.isPinned && (
          <div className="flex items-center gap-1 px-3 pt-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
            <Pin className="w-3 h-3 rotate-45" />
            <span>Pinned</span>
          </div>
        )}

        {/* Sender display name for group chats */}
        {!isMe && isGroup && (
          <div className="px-3 pt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {message.senderName}
          </div>
        )}

        {/* Quoted reply message */}
        {message.replyTo && (
          <div
            className={`mx-2 mt-2 px-2.5 py-1.5 rounded-lg border-l-4 text-xs select-none ${
              isMe
                ? 'bg-black/5 dark:bg-black/20 border-emerald-600 dark:border-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 border-emerald-500'
            }`}
          >
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
              {message.replyTo.senderName}
            </div>
            <div className="truncate text-slate-600 dark:text-slate-300 max-w-[260px]">
              {message.replyTo.mediaType && message.replyTo.mediaType !== 'text' ? (
                <span className="capitalize font-medium">[{message.replyTo.mediaType}] </span>
              ) : null}
              {message.replyTo.text || 'Media'}
            </div>
          </div>
        )}

        {/* Media content */}
        {message.mediaType === 'image' && message.mediaUrl && (
          <div className="p-1">
            <img
              src={message.mediaUrl}
              alt={message.mediaName || 'Image message'}
              onClick={() => onOpenMedia(message.mediaUrl!, 'image', message.mediaName)}
              className="rounded-xl max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {message.mediaType === 'video' && message.mediaUrl && (
          <div className="p-1">
            <video
              src={message.mediaUrl}
              controls
              className="rounded-xl max-h-72 w-full object-cover cursor-pointer"
            />
          </div>
        )}

        {message.mediaType === 'audio' && (
          <div className="p-2">
            <AudioVoicePlayer src={message.mediaUrl} duration={message.duration} isMe={isMe} />
          </div>
        )}

        {message.mediaType === 'document' && message.mediaUrl && (
          <div className="p-2">
            <a
              href={message.mediaUrl}
              download={message.mediaName || 'document'}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-black/20 hover:bg-black/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{message.mediaName || 'Document'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatFileSize(message.mediaSize)}
                </p>
              </div>
              <Download className="w-4 h-4 text-slate-500 shrink-0" />
            </a>
          </div>
        )}

        {/* Text content */}
        {message.text && (
          <div className="px-3.5 py-1.5 whitespace-pre-wrap break-words leading-relaxed">
            {renderHighlightedText(message.text)}
          </div>
        )}

        {/* Bottom Metadata: Timestamp, edited, status ticks */}
        <div className="flex items-center justify-end gap-1 px-2 pb-1.5 text-[10px] tabular-nums font-mono text-slate-500 dark:text-slate-400 float-right ml-4">
          {message.isEdited && <span className="text-[9px] opacity-80">(edited)</span>}
          <span>{formatTime(message.createdAt)}</span>

          {/* Delivery ticks for current user */}
          {isMe && !message.isDeletedForEveryone && (
            <span className="ml-0.5 inline-flex items-center">
              {message.status === 'read' ? (
                <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /></span>
              ) : message.status === 'delivered' ? (
                <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" /></span>
              ) : (
                <span title="Sent"><Check className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" /></span>
              )}
            </span>
          )}
        </div>

        {/* Reaction counts bar */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2 pb-2 pt-1 clear-both">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(message.id, r.emoji)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-[#111b21] shadow-xs border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {r.userIds.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Floating action button (visible on hover or tap) */}
        {!message.isDeletedForEveryone && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-black/20"
              aria-label="Message options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Context Action Menu Popup */}
        {showMenu && (
          <div
            className={`absolute z-30 ${
              isMe ? 'right-0' : 'left-0'
            } top-8 w-48 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150`}
          >
            {/* Quick emoji reactions row */}
            <div className="flex items-center justify-around px-2 py-1.5 border-b border-slate-100 dark:border-slate-700">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowMenu(false);
                  }}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>

            {message.text && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy text'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onForward(message);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <Forward className="w-3.5 h-3.5" />
              <span>Forward</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTogglePin(message.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{message.isPinned ? 'Unpin message' : 'Pin message'}</span>
            </button>

            {isMe && message.mediaType === 'text' && (
              <button
                type="button"
                onClick={() => {
                  onEdit(message);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit message</span>
              </button>
            )}

            {isMe ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id, 'everyone');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for everyone</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id, 'me');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for me</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id, 'me');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for me</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReport(message.id, message.senderId);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-t border-slate-100 dark:border-slate-700"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report message</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
