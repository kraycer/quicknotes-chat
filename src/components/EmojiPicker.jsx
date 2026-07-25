import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '🥱', '😴']
  },
  {
    name: 'Reacciones & Gestos',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🧠', '👀', '👁️', '👅', '👄', '🔥', '💥', '✨', '⚡', '🌟', '💖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💫']
  },
  {
    name: 'Privacidad & Objetos',
    emojis: ['🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🛡️', '🕵️', '🕵️‍♀️', '🤫', '👻', '💀', '☠️', '📱', '💻', '✉️', '📝', '📌', '⏱️', '⌛', '⏰', '🚀', '🎯', '💣', '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🎵', '🎶', '🔔', '🔕', '💡']
  },
  {
    name: 'Naturaleza & Animales',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦋', '🐝', '🌸', '🌹', '🌺', '🌻', '🌼', '🌷', '🍀', '🌈', '⭐', '🌙', '☀️', '🌤️', '⛅', '🌊']
  },
  {
    name: 'Comida & Bebida',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍑', '🥭', '🍍', '🥝', '🍔', '🍕', '🌮', '🌯', '🍜', '🍣', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '☕', '🍵', '🥤', '🍺', '🍷', '🥂', '🧃', '🥛', '🍹']
  }
];

const CATEGORY_ICONS = ['😊', '👍', '🔒', '🐶', '🍎'];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollRef = useRef(null);

  const handleCategoryClick = (idx) => {
    setActiveCategory(idx);
    // Scroll to top when switching categories
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div className="w-full bg-[#151C28] border-t border-gray-800 flex flex-col shrink-0" style={{ height: '280px' }}>
      {/* Category Tabs - WhatsApp style top row */}
      <div className="flex items-center border-b border-gray-800 px-1 shrink-0">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryClick(idx)}
            className={`flex-1 py-2.5 text-center text-lg transition-colors relative ${
              activeCategory === idx ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
          >
            {CATEGORY_ICONS[idx]}
            {activeCategory === idx && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        ))}
        {/* Close button at the end */}
        <button
          onClick={onClose}
          className="px-3 py-2.5 text-gray-400 hover:text-gray-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Label */}
      <div className="px-3 py-1.5 shrink-0">
        <span className="text-[10px] text-cyan-400 font-semibold font-mono uppercase tracking-wider">
          {EMOJI_CATEGORIES[activeCategory].name}
        </span>
      </div>

      {/* Emoji Grid - scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => onSelectEmoji(emoji)}
              className="w-full aspect-square rounded-lg hover:bg-gray-800 text-xl flex items-center justify-center transition active:scale-110 active:bg-cyan-500/20"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
