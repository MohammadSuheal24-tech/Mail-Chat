import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Video,
  Camera,
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker.js';
import { VoiceRecorder } from './VoiceRecorder.js';
import { useChat } from '../context/ChatContext.js';
import { api } from '../services/api.js';

export const MessageInput: React.FC = () => {
  const {
    sendMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
    setTyping,
  } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Sync text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setTyping(true);

    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`;
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !isUploading) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, trimmed);
      setEditingMessage(null);
      setText('');
      return;
    }

    try {
      await sendMessage({ text: trimmed, mediaType: 'text' });
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTyping(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result as string;
        let mediaType: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';

        try {
          const res = await api.uploadFile(fileData, file.name, file.type);
          await sendMessage({
            text: text.trim(),
            mediaType,
            mediaUrl: res.url,
            mediaName: file.name,
            mediaSize: file.size,
          });
          setText('');
        } catch (uploadErr) {
          // If server upload fails, fallback to direct data url
          await sendMessage({
            text: text.trim(),
            mediaType,
            mediaUrl: fileData,
            mediaName: file.name,
            mediaSize: file.size,
          });
          setText('');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setIsUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceSend = async (audioUrl: string, duration: number) => {
    setIsRecordingVoice(false);
    try {
      await sendMessage({
        text: '',
        mediaType: 'audio',
        mediaUrl: audioUrl,
        mediaName: `voice_${Date.now()}.webm`,
        duration,
      });
    } catch (err) {
      console.error('Failed to send voice message:', err);
    }
  };

  return (
    <div className="relative px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-700/60 shrink-0">
      {/* Replying banner */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-white dark:bg-[#111b21] border-l-4 border-emerald-500 flex items-center justify-between shadow-xs animate-in slide-in-from-bottom-2">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Replying to {replyingTo.senderName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {replyingTo.text || `[${replyingTo.mediaType}]`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing banner */}
      {editingMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-white dark:bg-[#111b21] border-l-4 border-amber-500 flex items-center justify-between shadow-xs">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-amber-600">Editing Message</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{editingMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji picker popup */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-40">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      {/* Attachments dropdown menu */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-16 left-12 z-40 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 w-48 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Photos & Videos</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv,.zip"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer text-slate-700 dark:text-slate-200">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span>Camera photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      )}

      {/* Recording Voice Note Mode */}
      {isRecordingVoice ? (
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecordingVoice(false)} />
      ) : (
        /* Regular Input Controls */
        <div className="flex items-end gap-2">
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attach button */}
          <button
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input area */}
          <div className="flex-1 min-h-[44px] bg-white dark:bg-[#2a3942] rounded-2xl px-4 py-2.5 flex items-center shadow-xs">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent outline-none resize-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 max-h-28"
            />
          </div>

          {/* Send or Voice Note Button */}
          {text.trim() || editingMessage ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              title="Send message"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
