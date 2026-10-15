import React, { useState } from 'react';
import { X, Flag, CheckCircle } from 'lucide-react';
import { api } from '../services/api.js';

interface ReportModalProps {
  messageId?: string;
  reportedUserId?: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or unsolicited advertising',
  'Harassment, bullying, or hate speech',
  'Impersonation or fake account',
  'Violence, harm, or dangerous content',
  'Scam, fraud, or phishing link',
  'Other violation of community guidelines',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  messageId,
  reportedUserId,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitReport({
        reportedMessageId: messageId,
        reportedUserId,
        reason: selectedReason,
        details: details.trim(),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
            <Flag className="w-4 h-4" />
            <span>{messageId ? 'Report Message' : 'Report Contact'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-in zoom-in" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Report Submitted
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thank you for keeping our community safe. Our trust and safety team will review this report promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Why are you reporting this?
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                      selectedReason === reason
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 font-medium'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-emerald-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide additional context to help us investigate..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111b21] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
