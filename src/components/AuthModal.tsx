import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Lock,
  User as UserIcon,
  AtSign,
  AlertCircle,
  CheckCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

interface AuthModalProps {
  onEmailVerificationNeeded?: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onEmailVerificationNeeded }) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfoMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        email: email.trim(),
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        password,
      });

      if (res.emailSent && onEmailVerificationNeeded) {
        onEmailVerificationNeeded(email.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setInfoMessage(res.message);
      if (res.demoHint?.code) {
        setResetCode(res.demoHint.code);
      }
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Password reset request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      setInfoMessage(res.message);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setInfoMessage('You can now log in with your new password.');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo user quick login
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    resetMessages();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#efeae2] dark:bg-[#0b141a] flex items-center justify-center p-4">
      {/* Background vector accents */}
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Brand Banner */}
        <div className="bg-emerald-600 dark:bg-emerald-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-sm">
            <MessageSquare className="w-7 h-7 fill-white/20" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">EchoChat</h1>
          <p className="text-xs text-emerald-100 mt-1">
            Real-time messaging with email-only authentication &bull; No phone numbers
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode('forgot');
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Account Quick-Fill */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 mb-2">Or test with a pre-configured demo account:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[
                    { label: 'Sarah Jenkins', email: 'sarah.jenkins@echochat.io' },
                    { label: 'Marcus Vance', email: 'marcus.vance@echochat.io' },
                    { label: 'Priya Patel', email: 'priya.patel@echochat.io' },
                  ].map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleQuickLogin(demo.email)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] transition-colors"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-slate-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('register');
                  }}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unique Username * (e.g. alex2026)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <AtSign className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password (min 6 characters) *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
                <ShieldCheck className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
              <div className="text-center space-y-1">
                <KeyRound className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Reset Password</h3>
                <p className="text-slate-500 text-[11px]">
                  Enter your email address and we'll send a 6-digit password reset code.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
              >
                {isLoading ? 'Sending reset code...' : 'Send Reset Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="text-slate-500 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Mode 4: RESET PASSWORD (CONFIRM) */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Enter Reset Code</h3>
                <p className="text-slate-500 text-[11px]">
                  Enter the 6-digit code sent to your email and your new password.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl tracking-[0.3em] font-mono py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || resetCode.length < 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
              >
                {isLoading ? 'Updating password...' : 'Update Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="text-slate-500 hover:underline"
                >
                  Cancel & Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
