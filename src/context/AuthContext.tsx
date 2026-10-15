import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/chat.js';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';
import { sounds } from '../utils/audio.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  chatWallpaper: string;
  setChatWallpaper: (wallpaperId: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  login: (params: { email: string; password: string }) => Promise<void>;
  register: (params: { email: string; username: string; displayName: string; password: string; avatarUrl?: string }) => Promise<{ emailSent?: any }>;
  logout: () => void;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<{ code: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('echochat_theme') as 'light' | 'dark') || 'dark';
  });
  const [chatWallpaper, setChatWallpaperState] = useState<string>(() => {
    return localStorage.getItem('echochat_wallpaper') || 'default-doodle';
  });
  const [soundEnabled, setSoundState] = useState(true);

  const setChatWallpaper = (wallpaperId: string) => {
    setChatWallpaperState(wallpaperId);
    localStorage.setItem('echochat_wallpaper', wallpaperId);
  };

  // Apply dark mode class to html document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('echochat_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundState(enabled);
    sounds.setSoundEnabled(enabled);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = api.getToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          socketService.connect();
        } catch (e) {
          console.warn('Session expired or invalid token');
          api.clearToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (params: { email: string; password: string }) => {
    const res = await api.login(params);
    setUser(res.user);
    setToken(res.token);
    socketService.connect();
  };

  const register = async (params: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    avatarUrl?: string;
  }) => {
    const res = await api.register(params);
    setUser(res.user);
    setToken(res.token);
    socketService.connect();
    return { emailSent: res.emailSent };
  };

  const logout = () => {
    socketService.disconnect();
    api.clearToken();
    setToken(null);
    setUser(null);
  };

  const verifyEmail = async (code: string) => {
    const res = await api.verifyEmail(code);
    setUser(res.user);
  };

  const resendVerification = async () => {
    const res = await api.resendVerification();
    return { code: res.code };
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const blockUser = async (userId: string) => {
    const res = await api.blockUser(userId);
    if (user) {
      setUser({ ...user, blockedUserIds: res.blockedUserIds });
    }
  };

  const unblockUser = async (userId: string) => {
    const res = await api.unblockUser(userId);
    if (user) {
      setUser({ ...user, blockedUserIds: res.blockedUserIds });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        theme,
        toggleTheme,
        chatWallpaper,
        setChatWallpaper,
        soundEnabled,
        setSoundEnabled,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        updateProfile,
        blockUser,
        unblockUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
