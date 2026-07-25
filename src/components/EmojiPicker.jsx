import React from 'react';
import { X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '🥱', '😴', '😌', '😛', '😜']
  },
  {
    name: 'Reacciones & Gestos',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🧠', '🫀', '👀', '👁️', '👅', '👄', '🔥', '💥', '✨', '⚡', '🌟', '💖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎']
  },
  {
    name: 'Privacidad & Objetos',
    emojis: ['🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🛡️', '⚡', '🕵️', '🕵️‍♀️', '🤫', '👻', '💀', '☠️', '👀', '📱', '💻', '✉️', '📝', '📌', '⏱️', '⌛', '⏰', '🚀', '🎯', '💣', '🎉', '🎊']
  }
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  return (
    <div className="absolute bottom-16 right-4 w-72 sm:w-80 bg-[#151C28] border border-gray-800 rounded-3xl shadow-2xl p-3 z-30 max-h-72 flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2">
        <span className="text-xs font-bold text-gray-300">Emoticonos</span>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <span className="text-[10px] text-cyan-400 font-semibold block mb-1 font-mono">{cat.name}</span>
            <div className="grid grid-cols-7 gap-1">
              {cat.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-800 text-lg flex items-center justify-center transition active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
