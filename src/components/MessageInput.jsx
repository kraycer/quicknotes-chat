import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip, Mic, X, Image as ImageIcon } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import EmojiPicker from './EmojiPicker';

export default function MessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping
}) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onSendMessage({
      type: 'text',
      content: text.trim(),
      reply_to: replyingTo
    });

    setText('');
    setShowEmoji(false);
    onCancelReply();
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onSendMessage({
        type: 'photo',
        media_url: reader.result,
        content: '',
        reply_to: replyingTo
      });
      onCancelReply();
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input
  };

  const handleSendAudio = (audioDataUrl) => {
    onSendMessage({
      type: 'audio',
      media_url: audioDataUrl,
      content: '',
      reply_to: replyingTo
    });
    setIsRecordingVoice(false);
    onCancelReply();
  };

  return (
    <div className="bg-[#151C28] border-t border-gray-800 p-3 relative z-20">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <EmojiPicker
          onSelectEmoji={(emoji) => setText((prev) => prev + emoji)}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Hidden Photo Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#0B0F17] border border-cyan-500/30 rounded-xl p-2 px-3 mb-2 animate-fadeIn">
          <div className="flex-1 pr-2 border-l-2 border-cyan-500 pl-2">
            <span className="text-[10px] font-semibold text-cyan-400">
              Respondiendo a ID: {replyingTo.sender_id.slice(-6)}
            </span>
            <p className="text-xs text-gray-300 truncate">
              {replyingTo.content || '[Archivo multimedia]'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recorder Active View */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSendAudio={handleSendAudio}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* Standard Input Bar */
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-xl transition ${
              showEmoji ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Añadir Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Photo Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-cyan-400 rounded-xl transition"
            title="Adjuntar Foto Efímera"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Mensaje privado..."
            className="flex-1 py-2.5 px-4 bg-[#0B0F17] border border-gray-800 rounded-2xl text-sm text-gray-100 outline-none focus:border-cyan-500/50"
          />

          {/* Mic or Send Button */}
          {text.trim() ? (
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl shadow-lg shadow-cyan-600/20 transition active:scale-95 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 bg-[#0B0F17] hover:bg-gray-800 text-cyan-400 border border-gray-800 rounded-2xl transition active:scale-95"
              title="Grabar Nota de Voz"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
