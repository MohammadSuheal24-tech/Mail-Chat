import React, { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤩', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '👏', '🙌', '👐', '🤲', '💪', '🦾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟', '💯'],
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🎮', '🎲', '🧩', '📱', '💻', '⌚', '📷', '💡', '🔦', '📖', '📚', '💰', '💵', '💳', '💎', '🔑', '🔒', '🔔', '📢', '🎧', '🎤', '🎬', '🎨', '🚀', '🚗', '✈️', '🚲', '☕', '🍕', '🍔', '🍟', '🍣', '🎂'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div className="w-72 sm:w-80 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Category selector */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex gap-1">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setActiveTab(idx);
                setSearch('');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === idx && !search
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-[#111b21] rounded-lg text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Emoji Grid */}
      <div className="p-2 grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-52 overflow-y-auto">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-[#2a3942] rounded-lg transition-transform active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
