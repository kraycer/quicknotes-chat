import React, { useState, useRef } from 'react';
import { Send, Smile, Mic, X, Image as ImageIcon, Keyboard } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import EmojiPicker from './EmojiPicker';
import { compressImage } from '../lib/imageUtils';

export default function MessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping
}) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef(null);
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
    onCancelReply();

    // Maintain keyboard focus on mobile without closing virtual keyboard!
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Compress photo to lightweight base64 image (max 800px width, 0.7 quality)
      const compressedDataUrl = await compressImage(file, 800, 0.7);
      onSendMessage({
        type: 'photo',
        media_url: compressedDataUrl,
        content: '',
        reply_to: replyingTo
      });
      onCancelReply();
    } catch (err) {
      console.error('Error procesando imagen:', err);
      alert('No se pudo procesar la imagen.');
    } finally {
      setIsCompressing(false);
      e.target.value = null; // reset
    }
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

  const handleToggleEmoji = () => {
    if (showEmoji) {
      // Closing emoji → re-focus the text input so the keyboard opens
      setShowEmoji(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Opening emoji → blur the text input so the keyboard closes
      inputRef.current?.blur();
      setShowEmoji(true);
    }
  };

  return (
    <div className="shrink-0 bg-[#151C28] border-t border-gray-800 z-20">
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
        <div className="flex items-center justify-between bg-[#0B0F17] border-b border-cyan-500/30 px-3 py-2">
          <div className="flex-1 pr-2 border-l-2 border-cyan-500 pl-2 min-w-0">
            <span className="text-[10px] font-semibold text-cyan-400 block">
              Respondiendo a ID: {replyingTo.sender_id.slice(-6)}
            </span>
            <p className="text-xs text-gray-300 truncate">
              {replyingTo.content || '[Archivo multimedia]'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-100 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recorder Active View */}
      {isRecordingVoice ? (
        <div className="p-2.5 sm:p-3">
          <VoiceRecorder
            onSendAudio={handleSendAudio}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      ) : (
        /* Standard Input Bar */
        <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3">
          {/* Emoji Toggle — shows keyboard icon when emoji is open */}
          <button
            type="button"
            onClick={handleToggleEmoji}
            className={`p-2 rounded-xl transition ${
              showEmoji ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400 hover:text-gray-200'
            }`}
            title={showEmoji ? 'Mostrar Teclado' : 'Añadir Emojis'}
          >
            {showEmoji ? <Keyboard className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
          </button>

          {/* Photo Attach */}
          <button
            type="button"
            disabled={isCompressing}
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-cyan-400 rounded-xl transition disabled:opacity-50"
            title="Adjuntar Foto Efímera"
          >
            <ImageIcon className={`w-5 h-5 ${isCompressing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onFocus={() => {
              // If emoji is open and user taps the input, close emoji panel
              if (showEmoji) setShowEmoji(false);
            }}
            placeholder="Mensaje privado..."
            className="flex-1 py-2.5 px-3.5 bg-[#0B0F17] border border-gray-800 rounded-2xl text-sm text-gray-100 outline-none focus:border-cyan-500/50"
          />

          {/* Mic or Send Button */}
          {text.trim() ? (
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur on click/touch!
              onTouchStart={(e) => e.preventDefault()} // Prevents keyboard from closing on mobile touch!
              onClick={handleSend}
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

      {/* Emoji Panel — full-width bottom panel (replaces keyboard area like WhatsApp) */}
      {showEmoji && (
        <EmojiPicker
          onSelectEmoji={(emoji) => {
            setText((prev) => prev + emoji);
          }}
          onClose={() => {
            setShowEmoji(false);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        />
      )}

      {/* Bottom safe area */}
      {!showEmoji && <div className="safe-pb" />}
    </div>
  );
}
