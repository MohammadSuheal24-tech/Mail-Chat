import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquarePlus, UserCheck, CheckCircle } from 'lucide-react';
import { User } from '../types/chat.js';
import { api } from '../services/api.js';
import { useChat } from '../context/ChatContext.js';

interface NewChatModalProps {
  onClose: () => void;
  onOpenNewGroup: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onOpenNewGroup,
}) => {
  const { startDirectChat } = useChat();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then((res) => {
        setUsers(res.users);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSelectUser = async (targetUserId: string) => {
    try {
      await startDirectChat(targetUserId);
      onClose();
    } catch (e) {
      console.error('Failed starting direct chat:', e);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            New Chat
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
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
              placeholder="Search by name, @username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Quick action: Create Group */}
        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewGroup();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <span>Create a New Group Chat</span>
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching users found.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u.id)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#111b21] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      alt={u.displayName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover bg-slate-200"
                    />
                    {u.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#202c33] rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {u.displayName}
                      </p>
                      {u.isEmailVerified && (
                        <span title="Email verified">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.about || `@${u.username}`}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Chat
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
