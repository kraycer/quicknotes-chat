import React, { useState, useEffect, useRef } from 'react';
import DecoyNotepad from './components/DecoyNotepad';
import PinModal from './components/PinModal';
import PairingHub from './components/PairingHub';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import {
  isSupabaseConfigured,
  supabase,
  mockEngine,
  getLocalMessages,
  saveLocalMessages,
  filterExpiredMessages
} from './lib/supabase';
import { playSendSound, playReceiveSound } from './lib/soundUtils';

export default function App() {
  // Auto-generate numeric User ID if not present e.g. ID-749201
  const [userId] = useState(() => {
    let saved = localStorage.getItem('qn_user_id');
    if (!saved) {
      const randNum = Math.floor(100000 + Math.random() * 900000);
      saved = `ID-${randNum}`;
      localStorage.setItem('qn_user_id', saved);
    }
    return saved;
  });

  const [mode, setMode] = useState('decoy'); // 'decoy' | 'pin' | 'pairing' | 'chat'
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(1); // Default 1 minute
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  // Auto-Lock on Inactivity or Visibility Change
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      // Auto-lock to decoy after 60 seconds of zero touch/mouse input
      inactivityTimerRef.current = setTimeout(() => {
        if (mode !== 'decoy') {
          setMode('decoy');
        }
      }, 60000);
    };

    const handleVisibility = () => {
      if (document.hidden && mode !== 'decoy') {
        setMode('decoy'); // Instantly lock on app switch
      }
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    document.addEventListener('visibilitychange', handleVisibility);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [mode]);

  // Request system notification permission for disguised alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Timer loop to purge expired messages dynamically locally and on Supabase server
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRoomCode) {
        setMessages((prev) => {
          const filtered = filterExpiredMessages(prev);
          if (filtered.length !== prev.length) {
            saveLocalMessages(activeRoomCode, filtered);
            if (isSupabaseConfigured && supabase) {
              supabase
                .from('messages')
                .delete()
                .lte('expires_at', new Date().toISOString())
                .then(() => {});
            }
          }
          return filtered;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoomCode]);

  // Heartbeat Presence Broadcast
  useEffect(() => {
    if (!activeRoomCode) return;
    const interval = setInterval(() => {
      if (isSupabaseConfigured && supabase) {
        supabase.channel(`room:${activeRoomCode}`).send({
          type: 'broadcast',
          event: 'presence',
          payload: { sender_id: userId }
        });
      } else {
        mockEngine.emit(`presence_${activeRoomCode}`, userId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRoomCode, userId]);

  // Load and subscribe to room messages
  useEffect(() => {
    if (!activeRoomCode) return;

    // Load initial local messages
    const initialMsgs = filterExpiredMessages(getLocalMessages(activeRoomCode));
    setMessages(initialMsgs);

    let unsubscribe = () => {};

    if (isSupabaseConfigured && supabase) {
      try {
        supabase
          .from('messages')
          .select('*')
          .eq('room_code', activeRoomCode)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setMessages((prev) => {
                const combined = [...prev];
                data.forEach((d) => {
                  if (!combined.some((m) => m.id === d.id)) combined.push(d);
                });
                const filtered = filterExpiredMessages(combined);
                saveLocalMessages(activeRoomCode, filtered);
                return filtered;
              });
            }
          });
      } catch (e) {
        console.warn('Error al cargar mensajes:', e);
      }

      const channel = supabase.channel(`room:${activeRoomCode}`, {
        config: { broadcast: { self: false } }
      });

      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_code=eq.${activeRoomCode}` },
          (payload) => {
            const newMsg = payload.new;
            if (!newMsg) return;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const updated = filterExpiredMessages([...prev, newMsg]);
              saveLocalMessages(activeRoomCode, updated);
              return updated;
            });
            if (newMsg.sender_id !== userId) {
              playReceiveSound();
              if (document.hidden) triggerDisguisedNotification();
            }
          }
        )
        .on('broadcast', { event: 'new_message' }, (payload) => {
          const newMsg = payload.payload;
          if (newMsg && newMsg.sender_id !== userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const updated = filterExpiredMessages([...prev, newMsg]);
              saveLocalMessages(activeRoomCode, updated);
              return updated;
            });
            playReceiveSound();
            if (document.hidden) triggerDisguisedNotification();
          }
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
          const { msgId, emoji } = payload.payload || {};
          if (msgId && emoji) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === msgId) {
                  const reactions = { ...(m.reactions || {}) };
                  reactions[emoji] = (reactions[emoji] || 0) + 1;
                  return { ...m, reactions };
                }
                return m;
              })
            );
          }
        })
        .on('broadcast', { event: 'presence' }, (payload) => {
          if (payload.payload?.sender_id !== userId) {
            setIsPeerOnline(true);
          }
        })
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload?.sender_id !== userId && payload.sender_id !== userId) {
            setIsPeerTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
          }
        })
        .on('broadcast', { event: 'burn' }, () => {
          setMessages([]);
          saveLocalMessages(activeRoomCode, []);
        })
        .subscribe();

      unsubscribe = () => supabase.removeChannel(channel);
    } else {
      // Mock Engine for local testing
      const unSubMsg = mockEngine.on(`msg_${activeRoomCode}`, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = filterExpiredMessages([...prev, newMsg]);
          saveLocalMessages(activeRoomCode, updated);
          return updated;
        });

        if (newMsg.sender_id !== userId) {
          playReceiveSound();
          if (document.hidden) triggerDisguisedNotification();
        }
      });

      const unSubTyping = mockEngine.on(`typing_${activeRoomCode}`, (senderId) => {
        if (senderId !== userId) {
          setIsPeerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
        }
      });

      const unSubBurn = mockEngine.on(`burn_${activeRoomCode}`, () => {
        setMessages([]);
        saveLocalMessages(activeRoomCode, []);
      });

      unsubscribe = () => {
        unSubMsg();
        unSubTyping();
        unSubBurn();
      };
    }

    return () => unsubscribe();
  }, [activeRoomCode, userId]);

  const triggerDisguisedNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('QuickNotes - Recordatorio', {
        body: 'Revisar notas pendientes de la lista.',
        icon: '/icon-192.png'
      });
    }
  };

  const handleJoinRoom = (code) => {
    setActiveRoomCode(code);
    setMode('chat');
  };

  const handleSendMessage = ({ type, content, media_url, reply_to }) => {
    if (!activeRoomCode) return;

    let expiresAt = null;
    if (timerMinutes > 0) {
      expiresAt = new Date(Date.now() + timerMinutes * 60 * 1000).toISOString();
    }

    const newMsg = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room_code: activeRoomCode,
      sender_id: userId,
      type: type || 'text',
      content: content || '',
      media_url: media_url || null,
      reply_to: reply_to ? { sender_id: reply_to.sender_id, content: reply_to.content } : null,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      read: false
    };

    // Play send pop sound
    playSendSound();

    // 1. Optimistic Local Update
    setMessages((prev) => {
      const updated = filterExpiredMessages([...prev, newMsg]);
      saveLocalMessages(activeRoomCode, updated);
      return updated;
    });

    // 2. Broadcast & DB Insert
    if (isSupabaseConfigured && supabase) {
      supabase.channel(`room:${activeRoomCode}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMsg
      });

      supabase.from('messages').insert([newMsg]).then(({ error }) => {
        if (error) console.error('Error insertando mensaje en Supabase:', error);
      });
    } else {
      mockEngine.emit(`msg_${activeRoomCode}`, newMsg);
    }
  };

  const handleReactMessage = (msgId, emoji) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const reactions = { ...(m.reactions || {}) };
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...m, reactions };
        }
        return m;
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.channel(`room:${activeRoomCode}`).send({
        type: 'broadcast',
        event: 'reaction',
        payload: { msgId, emoji }
      });
    }
  };

  const handleTyping = () => {
    if (!activeRoomCode) return;
    if (isSupabaseConfigured && supabase) {
      supabase.channel(`room:${activeRoomCode}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: userId }
      });
    } else {
      mockEngine.emit(`typing_${activeRoomCode}`, userId);
    }
  };

  const handleBurnRoom = () => {
    if (window.confirm('¿Seguro que deseas destruir permanentemente todo el historial de esta sala?')) {
      setMessages([]);
      saveLocalMessages(activeRoomCode, []);
      if (isSupabaseConfigured && supabase) {
        supabase.from('messages').delete().eq('room_code', activeRoomCode).then(() => {});
        supabase.channel(`room:${activeRoomCode}`).send({
          type: 'broadcast',
          event: 'burn'
        });
      } else {
        mockEngine.emit(`burn_${activeRoomCode}`, true);
      }
    }
  };

  const handlePanicLock = () => {
    setMode('decoy');
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-[#0B0F17]">
      {/* 1. Decoy Notepad View */}
      {mode === 'decoy' && (
        <DecoyNotepad onOpenPinModal={() => setMode('pin')} />
      )}

      {/* 2. Security PIN Modal */}
      <PinModal
        isOpen={mode === 'pin'}
        onClose={() => setMode('decoy')}
        onUnlockReal={() => setMode('pairing')}
        onUnlockDecoy={() => setMode('decoy')}
      />

      {/* 3. Pairing Hub with Active Conversations List */}
      {mode === 'pairing' && (
        <PairingHub
          userId={userId}
          onJoinRoom={handleJoinRoom}
          onLockApp={() => setMode('decoy')}
        />
      )}

      {/* 4. Active Chat View */}
      {mode === 'chat' && (
        <div className="flex flex-col h-[100dvh] max-w-md sm:max-w-lg mx-auto bg-[#0B0F17] overflow-hidden">
          <ChatHeader
            roomCode={activeRoomCode}
            timerMinutes={timerMinutes}
            onTimerChange={setTimerMinutes}
            onBack={() => setMode('pairing')}
            onPanicLock={handlePanicLock}
            onBurnRoom={handleBurnRoom}
            isTyping={isPeerTyping}
            isOnline={isPeerOnline}
          />

          <MessageList
            messages={messages}
            currentUserId={userId}
            onSwipeReply={(msg) => setReplyingTo(msg)}
            onReactMessage={handleReactMessage}
            pinnedMessage={pinnedMessage}
            onPinMessage={setPinnedMessage}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onTyping={handleTyping}
          />
        </div>
      )}
    </div>
  );
}
