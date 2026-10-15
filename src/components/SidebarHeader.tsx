import React from 'react';
import {
  MessageSquarePlus,
  Moon,
  Sun,
  Settings,
  Mail,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarHeaderProps {
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
  onOpenEmailInbox: () => void;
  onOpenVerifyModal: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenNewChat,
  onOpenSettings,
  onOpenEmailInbox,
  onOpenVerifyModal,
}) => {
  const { user, theme, toggleTheme } = useAuth();

  return (
    <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0 select-none">
      {/* Current User Info */}
      <div
        onClick={onOpenSettings}
        className="flex items-center gap-3 cursor-pointer py-1 pr-2 rounded-xl hover:opacity-90 transition-opacity min-w-0"
        title="Edit profile & settings"
      >
        <div className="relative shrink-0">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            alt={user?.displayName || 'User'}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shadow-xs"
          />
          {user && !user.isEmailVerified && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpenVerifyModal();
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer hover:scale-110 transition-transform"
              title="Email unverified! Click to verify"
            >
              !
            </span>
          )}
        </div>

        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
            {user?.displayName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px]">
            @{user?.username}
          </p>
        </div>
      </div>

      {/* Header Action Tools */}
      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
        {/* Simulated Email Box button */}
        <button
          type="button"
          onClick={onOpenEmailInbox}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-emerald-600 dark:text-emerald-400"
          title="Open simulated email inbox (Verification codes & password resets)"
        >
          <Mail className="w-5 h-5" />
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* New chat / contact button */}
        <button
          type="button"
          onClick={onOpenNewChat}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="New conversation"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
