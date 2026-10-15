import React, { useState } from 'react';
import { X, Forward, Check, Search } from 'lucide-react';
import { Message, Conversation } from '../types/chat.js';
import { useChat } from '../context/ChatContext.js';

interface ForwardModalProps {
  message: Message;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, onClose }) => {
  const { conversations, forwardMessage, getOtherParticipant } = useChat();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await forwardMessage(message.id, selectedIds);
      onClose();
    } catch (e) {
      console.error('Forward failed:', e);
      setIsSubmitting(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const title = c.isGroup ? c.name : getOtherParticipant(c)?.displayName;
    return title?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
            <Forward className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Forward message to...</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-[#111b21] rounded-xl text-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search chats or contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Message snippet preview */}
        <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-black/10 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic truncate">
          Forwarding: "{message.text || `[${message.mediaType}]`}"
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {filteredConversations.map((c) => {
            const isGroup = c.isGroup;
            const other = getOtherParticipant(c);
            const title = isGroup ? c.name : other?.displayName || 'Direct Chat';
            const avatar = isGroup
              ? c.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.name}`
              : other?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`;
            const isSelected = selectedIds.includes(c.id);

            return (
              <div
                key={c.id}
                onClick={() => toggleSelect(c.id)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111b21] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={avatar}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover bg-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {isGroup ? `${c.participantIds.length} members` : `@${other?.username}`}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {selectedIds.length} chat{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <button
            type="button"
            onClick={handleForward}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Forwarding...' : 'Forward'}
            <Forward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
