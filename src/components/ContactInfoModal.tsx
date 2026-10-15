import React, { useState } from 'react';
import {
  X,
  Mail,
  User as UserIcon,
  Info,
  ShieldAlert,
  Ban,
  CheckCircle,
  Flag,
} from 'lucide-react';
import { Conversation, User } from '../types/chat.js';
import { useAuth } from '../context/AuthContext.js';
import { useChat } from '../context/ChatContext.js';

interface ContactInfoModalProps {
  conversation: Conversation;
  onClose: () => void;
  onReportUser: (userId: string) => void;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  conversation,
  onClose,
  onReportUser,
}) => {
  const { user, blockUser, unblockUser } = useAuth();
  const { getOtherParticipant } = useChat();
  const contact = getOtherParticipant(conversation);

  const [isProcessingBlock, setIsProcessingBlock] = useState(false);

  if (!contact) return null;

  const isBlocked = user?.blockedUserIds.includes(contact.id);

  const handleToggleBlock = async () => {
    setIsProcessingBlock(true);
    try {
      if (isBlocked) {
        await unblockUser(contact.id);
      } else {
        await blockUser(contact.id);
      }
    } catch (e) {
      console.error('Failed toggling block status:', e);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Contact Info
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar and basic info */}
        <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
          <div className="relative mb-3">
            <img
              src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`}
              alt={contact.displayName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover shadow-md bg-slate-200"
            />
            {contact.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#202c33] rounded-full" />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {contact.displayName}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            @{contact.username}
          </p>
        </div>

        {/* Details list */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* About */}
          <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                About
              </p>
              <p className="mt-0.5">{contact.about || 'No status set.'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                Email Address
              </p>
              <p className="mt-0.5 flex items-center gap-1.5">
                <span>{contact.email}</span>
                {contact.isEmailVerified && (
                  <span title="Email verified">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Block and Report */}
        <div className="p-4 bg-slate-50 dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleToggleBlock}
            disabled={isProcessingBlock}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              isBlocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onReportUser(contact.id);
            }}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
};
