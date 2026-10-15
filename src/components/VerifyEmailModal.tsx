import React, { useState } from 'react';
import { X, CheckCircle, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface VerifyEmailModalProps {
  onClose: () => void;
  onOpenEmailInbox: () => void;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({
  onClose,
  onOpenEmailInbox,
}) => {
  const { user, verifyEmail, resendVerification } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyEmail(code.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendMessage(null);
    try {
      const res = await resendVerification();
      setResendMessage(`New verification code generated: ${res.code}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Verify Email Address
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

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-in zoom-in" />
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Email Verified Successfully!
            </h4>
            <p className="text-xs text-slate-500">
              Your account is fully verified. You can now enjoy all EchoChat features with full security.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                We sent a 6-digit verification code to:
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {user?.email}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resendMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span>{resendMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    const match = resendMessage.match(/\d{6}/);
                    if (match) setCode(match[0]);
                  }}
                  className="font-semibold underline ml-2"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl tracking-[0.35em] font-mono py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={code.length < 6 || isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Quick Helper Tools */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEmailInbox();
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                View in Test Inbox
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
