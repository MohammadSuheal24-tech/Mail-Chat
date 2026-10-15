import React, { useState, useEffect } from 'react';
import { X, Users, Check, Search, Sparkles } from 'lucide-react';
import { User } from '../types/chat.js';
import { api } from '../services/api.js';
import { useChat } from '../context/ChatContext.js';

interface NewGroupModalProps {
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ onClose }) => {
  const { createGroup } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((res) => {
        setUsers(res.users);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed loading users:', err);
        setIsLoading(false);
      });
  }, []);

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createGroup(name.trim(), description.trim(), selectedIds);
      onClose();
    } catch (err) {
      console.error('Failed creating group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Create New Group
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0">
          {/* Group Info Inputs */}
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design Sync, Family, Project Nexus"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Group Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Member Selection Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-[#111b21] rounded-xl text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search participants to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Contact Checkboxes */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111b21] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                        alt={u.displayName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover bg-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {u.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
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
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {selectedIds.length} member{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isSubmitting ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
