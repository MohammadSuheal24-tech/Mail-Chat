import React, { useState, useEffect } from 'react';
import { X, Mail, Check, Copy, KeyRound, CheckCircle } from 'lucide-react';
import { SimulatedEmail } from '../types/chat.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface EmailInboxModalProps {
  onClose: () => void;
  onApplyVerificationCode?: (code: string) => void;
}

export const EmailInboxModal: React.FC<EmailInboxModalProps> = ({
  onClose,
  onApplyVerificationCode,
}) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api.getSimulatedEmails()
      .then((res) => {
        setEmails(res.emails);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load simulated emails:', err);
        setIsLoading(false);
      });
  }, []);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Simulated Email Inbox ({user?.email})
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

        {/* Notice */}
        <div className="px-6 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900/30">
          📨 This test email inbox captures account verification codes and password reset links without requiring an external mail server.
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No emails received yet.</p>
              <p className="mt-1 text-[11px] opacity-75">
                Register a new account or request a password reset to receive verification emails here.
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#111b21] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    EchoChat Security &bull; no-reply@echochat.io
                  </span>
                  <span>{new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {email.subject}
                </h4>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {email.message}
                </p>

                {email.code && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Your Security Code</p>
                      <p className="font-mono text-base font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                        {email.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(email.id, email.code)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === email.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === email.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {email.type === 'verification' && onApplyVerificationCode && !user?.isEmailVerified && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyVerificationCode(email.code);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verify Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
