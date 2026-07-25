import React, { useRef, useEffect, useState } from 'react';
import { Clock, CheckCheck, Check, Reply, Play, Pause, FileImage } from 'lucide-react';

export default function MessageList({ messages, currentUserId, onSwipeReply }) {
  const bottomRef = useRef(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef(new Map());

  // Swipe gesture tracking state
  const [swipeState, setSwipeState] = useState({ id: null, startX: 0, currentX: 0 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAudio = (id, audioUrl) => {
    if (playingAudioId === id) {
      const currentAudio = audioRefs.current.get(id);
      if (currentAudio) {
        currentAudio.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (playingAudioId) {
        const prevAudio = audioRefs.current.get(playingAudioId);
        if (prevAudio) prevAudio.pause();
      }
      let audio = audioRefs.current.get(id);
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.onended = () => setPlayingAudioId(null);
        audioRefs.current.set(id, audio);
      }
      audio.play();
      setPlayingAudioId(id);
    }
  };

  // Touch Swipe Handlers for mobile & mouse
  const handleTouchStart = (msg, e) => {
    const touchX = e.touches ? e.touches[0].clientX : e.clientX;
    setSwipeState({ id: msg.id, startX: touchX, currentX: touchX });
  };

  const handleTouchMove = (msg, e) => {
    if (swipeState.id !== msg.id) return;
    const touchX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = touchX - swipeState.startX;
    if (diff > 0 && diff < 120) {
      setSwipeState((prev) => ({ ...prev, currentX: touchX }));
    }
  };

  const handleTouchEnd = (msg) => {
    if (swipeState.id === msg.id) {
      const diff = swipeState.currentX - swipeState.startX;
      if (diff > 60) {
        onSwipeReply(msg);
      }
    }
    setSwipeState({ id: null, startX: 0, currentX: 0 });
  };

  // Helper for message timer remaining display
  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expirado';
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0F17]">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
          <div className="p-4 bg-[#151C28] rounded-full mb-3 border border-gray-800">
            <Clock className="w-8 h-8 text-cyan-400/60" />
          </div>
          <p className="text-sm font-medium text-gray-300">Sala de Chat Privada</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
            Los mensajes enviados aquí se autodestruyen según el temporizador seleccionado. Desliza cualquier mensaje a la derecha para responder.
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isSwiping = swipeState.id === msg.id;
          const swipeOffset = isSwiping ? Math.max(0, swipeState.currentX - swipeState.startX) : 0;
          const remaining = getRemainingTime(msg.expires_at);

          return (
            <div
              key={msg.id}
              className="relative flex items-center group"
              onTouchStart={(e) => handleTouchStart(msg, e)}
              onTouchMove={(e) => handleTouchMove(msg, e)}
              onTouchEnd={() => handleTouchEnd(msg)}
              onMouseDown={(e) => handleTouchStart(msg, e)}
              onMouseMove={(e) => handleTouchMove(msg, e)}
              onMouseUp={() => handleTouchEnd(msg)}
            >
              {/* Swipe Reply Icon Indicator */}
              <div 
                className="absolute left-2 text-cyan-400 transition-opacity"
                style={{ opacity: Math.min(1, swipeOffset / 50) }}
              >
                <Reply className="w-5 h-5" />
              </div>

              {/* Message Bubble Container */}
              <div
                className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'}`}
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                  transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
                }}
              >
                <div
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-lg relative ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                      : 'bg-[#151C28] border border-gray-800 text-gray-100 rounded-bl-xs'
                  }`}
                >
                  {/* Sender Tag */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-semibold ${isMe ? 'text-cyan-100' : 'text-cyan-400'}`}>
                      {isMe ? 'Tú' : `ID: ${msg.sender_id.slice(-6)}`}
                    </span>
                    {remaining && (
                      <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                        isMe ? 'bg-black/20 text-cyan-100' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        <Clock className="w-2.5 h-2.5 animate-pulse" /> {remaining}
                      </span>
                    )}
                  </div>

                  {/* Quoted Parent Message */}
                  {msg.reply_to && (
                    <div className={`p-2 rounded-xl mb-2 text-xs border-l-3 ${
                      isMe 
                        ? 'bg-black/20 border-white/60 text-cyan-50' 
                        : 'bg-[#0B0F17] border-cyan-500 text-gray-300'
                    }`}>
                      <span className="text-[10px] font-semibold block opacity-80">
                        {msg.reply_to.sender_id === currentUserId ? 'Tú' : `ID: ${msg.reply_to.sender_id.slice(-6)}`}
                      </span>
                      <p className="truncate text-[11px] opacity-90">{msg.reply_to.content || '[Archivo multimedia]'}</p>
                    </div>
                  )}

                  {/* Message Content: Audio Note */}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        onClick={() => toggleAudio(msg.id, msg.media_url)}
                        className={`p-2.5 rounded-full transition ${
                          isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
                        }`}
                      >
                        {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex-1">
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div className={`h-full ${isMe ? 'bg-white' : 'bg-cyan-400'} ${playingAudioId === msg.id ? 'animate-pulse' : 'w-1/2'}`} />
                        </div>
                        <span className="text-[10px] opacity-80 mt-1 block">Nota de voz</span>
                      </div>
                    </div>
                  )}

                  {/* Message Content: Photo Attachment */}
                  {msg.type === 'photo' && (
                    <div className="my-1 rounded-xl overflow-hidden border border-black/20">
                      <img src={msg.media_url} alt="Adjunto efímero" className="max-h-60 w-full object-cover" />
                    </div>
                  )}

                  {/* Message Content: Standard Text */}
                  {msg.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}

                  {/* Timestamp & Delivery status */}
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-cyan-100/80' : 'text-gray-400'}`}>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                      msg.read ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-cyan-100/70" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
