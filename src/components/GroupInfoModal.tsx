import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Edit2,
  Check,
  Shield,
  Search,
} from 'lucide-react';
import { Conversation, User } from '../types/chat.js';
import { useAuth } from '../context/AuthContext.js';
import { useChat } from '../context/ChatContext.js';
import { api } from '../services/api.js';

interface GroupInfoModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  conversation,
  onClose,
}) => {
  const { user } = useAuth();
  const { refreshConversations, setActiveConversationId } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin =
    conversation.adminIds?.includes(user?.id || '') ||
    conversation.creatorId === user?.id;

  useEffect(() => {
    if (showAddMember) {
      api.getUsers().then((res) => {
        // Filter out users already in the group
        const notInGroup = res.users.filter(
          (u) => !conversation.participantIds.includes(u.id)
        );
        setAllUsers(notInGroup);
      }).catch(() => {});
    }
  }, [showAddMember, conversation.participantIds]);

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      await api.updateConversation(conversation.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setIsEditing(false);
      refreshConversations();
    } catch (e) {
      console.error('Failed to update group info:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (targetUserId: string) => {
    try {
      await api.addParticipant(conversation.id, targetUserId);
      setShowAddMember(false);
      refreshConversations();
    } catch (e) {
      console.error('Failed to add participant:', e);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeParticipant(conversation.id, targetUserId);
      refreshConversations();
    } catch (e) {
      console.error('Failed to remove participant:', e);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      if (user?.id) {
        await api.removeParticipant(conversation.id, user.id);
        setActiveConversationId(null);
        refreshConversations();
        onClose();
      }
    } catch (e) {
      console.error('Failed to leave group:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Group Information
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Avatar and Group Name */}
          <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
            <img
              src={
                conversation.avatarUrl ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.name}`
              }
              alt={conversation.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover shadow-md bg-slate-200 mb-3"
            />

            {isEditing ? (
              <div className="w-full space-y-2 mt-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111b21] text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="Group name"
                />
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111b21] text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
                  placeholder="Group description"
                />
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    disabled={isSaving}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {conversation.name}
                  </h3>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      title="Edit group details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {conversation.description || 'No group description.'}
                </p>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {conversation.participantIds.length} members
                </span>
              </>
            )}
          </div>

          {/* Members List */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Members
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMember((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add member</span>
                </button>
              )}
            </div>

            {/* Add Member Drawer */}
            {showAddMember && (
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-[#202c33] rounded-xl text-xs mb-2 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers
                    .filter((u) => u.displayName.toLowerCase().includes(memberSearch.toLowerCase()) || u.username.toLowerCase().includes(memberSearch.toLowerCase()))
                    .map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between py-2 px-1 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.displayName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover bg-slate-200"
                          />
                          <span className="truncate text-slate-800 dark:text-slate-200">
                            {candidate.displayName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMember(candidate.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  {allUsers.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      All registered users are already members!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* List of current members */}
            <div className="space-y-2">
              {conversation.participants?.map((member) => {
                const isMemberAdmin =
                  conversation.adminIds?.includes(member.id) ||
                  conversation.creatorId === member.id;
                const isCurrent = member.id === user?.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111b21] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover bg-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {member.displayName}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-slate-400">(You)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{member.about || `@${member.username}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMemberAdmin && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Admin
                        </span>
                      )}

                      {isAdmin && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Leave group button */}
        <div className="p-4 bg-slate-50 dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLeaveGroup}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
