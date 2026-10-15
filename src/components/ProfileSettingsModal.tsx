import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Camera,
  CheckCircle,
  AlertCircle,
  Eye,
  CheckCheck,
  Ban,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  LogOut,
  Save,
  Palette,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { User } from '../types/chat.js';
import { WALLPAPER_PRESETS } from '../utils/wallpapers.js';

interface ProfileSettingsModalProps {
  onClose: () => void;
  onOpenVerifyModal: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  onClose,
  onOpenVerifyModal,
}) => {
  const {
    user,
    updateProfile,
    theme,
    toggleTheme,
    chatWallpaper,
    setChatWallpaper,
    soundEnabled,
    setSoundEnabled,
    logout,
    unblockUser,
  } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [lastSeenVisibility, setLastSeenVisibility] = useState<'everyone' | 'contacts' | 'nobody'>(
    user?.privacySettings?.lastSeenVisibility || 'everyone'
  );
  const [readReceipts, setReadReceipts] = useState<boolean>(
    user?.privacySettings?.readReceipts ?? true
  );

  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load blocked user details
  useEffect(() => {
    if (user?.blockedUserIds && user.blockedUserIds.length > 0) {
      api.getUsers().then((res) => {
        const blocked = res.users.filter((u) => user.blockedUserIds.includes(u.id));
        setBlockedUsers(blocked);
      }).catch(() => {});
    } else {
      setBlockedUsers([]);
    }
  }, [user?.blockedUserIds]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        about: about.trim(),
        avatarUrl,
        privacySettings: {
          lastSeenVisibility,
          readReceipts,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const uploadRes = await api.uploadFile(dataUrl, `avatar_${Date.now()}`, file.type);
        setAvatarUrl(uploadRes.url);
      } catch (err) {
        setAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}&backgroundColor=b6e3f4`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Profile & Settings
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover shadow-md bg-slate-200"
              />
              <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <button
                type="button"
                onClick={handleGenerateRandomAvatar}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Randomize avatar
              </button>
            </div>
          </div>

          {/* Account Identifiers */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Username
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-mono">
                @{user?.username}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Email Address (Identity)
                </label>
                {user?.isEmailVerified ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVerifyModal();
                    }}
                    className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    <AlertCircle className="w-3 h-3" /> Verify Now
                  </button>
                )}
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-black/20 text-slate-700 dark:text-slate-300">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                About / Bio
              </label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Hey there! I am using EchoChat."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              Privacy Settings
            </h4>

            {/* Last Seen Visibility */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Last Seen & Online</p>
                  <p className="text-[10px] text-slate-500">Choose who can see when you were last online</p>
                </div>
                <select
                  value={lastSeenVisibility}
                  onChange={(e) => setLastSeenVisibility(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-200 outline-none text-xs"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>

            {/* Read Receipts Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Read Receipts</p>
                <p className="text-[10px] text-slate-500">
                  If turned off, you won't send or see read receipts (blue ticks)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReadReceipts((r) => !r)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  readReceipts ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    readReceipts ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Blocked Users Section */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                Blocked Accounts ({blockedUsers.length})
              </p>
              {blockedUsers.length === 0 ? (
                <p className="text-[11px] text-slate-400">No blocked accounts</p>
              ) : (
                <div className="space-y-1.5">
                  {blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={bu.avatarUrl}
                          alt={bu.displayName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full bg-slate-200"
                        />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {bu.displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => unblockUser(bu.id)}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Wallpaper Customization */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Chat Wallpaper
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setChatWallpaper('default-doodle')}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Reset to Classic
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalize your message feed with subtle geometric patterns or solid tones.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = chatWallpaper === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setChatWallpaper(preset.id)}
                    className={`group flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-[#202c33]'
                    }`}
                  >
                    {/* Swatch Preview Frame */}
                    <div
                      className={`w-full h-12 rounded-lg border border-black/5 dark:border-white/5 relative overflow-hidden flex items-center justify-center transition-transform group-hover:scale-[1.02] ${preset.bgClass}`}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] truncate max-w-full font-medium ${
                        isSelected
                          ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences: Theme and Sound */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              App Preferences
            </h4>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span className="capitalize">{theme}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Sound Effects</span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
