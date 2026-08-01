import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  filterExpiredMessages,
  checkDatabaseHealth
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
  const [timerMinutes, setTimerMinutes] = useState(() => {
    const saved = localStorage.getItem('qn_timer_minutes');
    return saved !== null ? Number(saved) : 5; // Default 5 minutes
  });
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [connectionError, setConnectionError] = useState('');
  
  const typingTimeoutRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const channelRef = useRef(null); // SINGLE channel reference for all operations
  const presenceIntervalRef = useRef(null);

  // Persist timer preference
  useEffect(() => {
    localStorage.setItem('qn_timer_minutes', String(timerMinutes));
  }, [timerMinutes]);

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

  // ============================================================
  // CORE FIX: Single channel management for room subscription
  // ============================================================
  useEffect(() => {
    if (!activeRoomCode) return;

    // Load initial local messages
    const initialMsgs = filterExpiredMessages(getLocalMessages(activeRoomCode));
    setMessages(initialMsgs);

    let cleanup = () => {};

    if (isSupabaseConfigured && supabase) {
      setConnectionStatus('connecting');
      console.log(`[Chat] Joining room: ${activeRoomCode}, Supabase configured: true`);

      // Run health check first
      checkDatabaseHealth().then(({ ok, error }) => {
        if (!ok) {
          console.error('[Chat] Database health check failed:', error);
          setConnectionStatus('error');
          setConnectionError(error || 'No se puede acceder a la base de datos');
        }
      });

      // Load existing messages from server
      supabase
        .from('messages')
        .select('*')
        .eq('room_code', activeRoomCode)
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error('[Chat] Error loading messages:', error);
            setConnectionError('Error cargando mensajes: ' + error.message);
          } else if (data && data.length > 0) {
            console.log(`[Chat] Loaded ${data.length} messages from server`);
            setMessages((prev) => {
              const combined = [...prev];
              data.forEach((d) => {
                if (!combined.some((m) => m.id === d.id)) combined.push(d);
              });
              const filtered = filterExpiredMessages(combined);
              filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              saveLocalMessages(activeRoomCode, filtered);
              return filtered;
            });
          }
        });

      // CREATE A SINGLE CHANNEL for ALL operations in this room
      const channelName = `room_${activeRoomCode}_${Date.now()}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      });

      // Store the channel reference so send functions can use it
      channelRef.current = channel;

      // Set up all listeners on this ONE channel
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_code=eq.${activeRoomCode}` },
          (payload) => {
            const newMsg = payload.new;
            if (!newMsg) return;
            console.log('[Chat] Postgres INSERT received:', newMsg.id);
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
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
          const newMsg = payload;
          if (newMsg && newMsg.sender_id !== userId) {
            console.log('[Chat] Broadcast new_message received:', newMsg.id);
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
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
          const { msgId, emoji } = payload || {};
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
        .on('broadcast', { event: 'presence' }, ({ payload }) => {
          if (payload?.sender_id !== userId) {
            setIsPeerOnline(true);
          }
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload?.sender_id !== userId) {
            setIsPeerTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
          }
        })
        .on('broadcast', { event: 'burn' }, () => {
          setMessages([]);
          saveLocalMessages(activeRoomCode, []);
        })
        .subscribe((status, err) => {
          console.log(`[Chat] Channel subscription status: ${status}`, err || '');
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            setConnectionError('');
            console.log('[Chat] ✅ Successfully subscribed to room:', activeRoomCode);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('error');
            setConnectionError(`Error de conexión: ${status}`);
            console.error('[Chat] ❌ Channel error:', status, err);
          } else if (status === 'CLOSED') {
            setConnectionStatus('disconnected');
          }
        });

      // Heartbeat presence — use the SAME channel reference
      presenceIntervalRef.current = setInterval(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'presence',
            payload: { sender_id: userId }
          }).catch((e) => console.warn('[Chat] Presence broadcast error:', e));
        }
      }, 3000);

      // Peer online timeout (if no heartbeat received in 8s, set offline)
      const peerTimeout = setInterval(() => {
        setIsPeerOnline(false);
      }, 8000);

      cleanup = () => {
        console.log('[Chat] Cleaning up channel for room:', activeRoomCode);
        if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
        clearInterval(peerTimeout);
        channelRef.current = null;
        supabase.removeChannel(channel);
        setConnectionStatus('disconnected');
      };
    } else {
      // Mock Engine for local testing
      console.log('[Chat] Using MockEngine (Supabase not configured)');
      setConnectionStatus('connected');
      setConnectionError('Modo local — los mensajes no se sincronizan entre dispositivos');

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

      cleanup = () => {
        unSubMsg();
        unSubTyping();
        unSubBurn();
      };
    }

    return () => cleanup();
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

    // Ensure the room exists in Supabase (required by foreign key constraint)
    if (isSupabaseConfigured && supabase) {
      supabase.from('rooms').upsert(
        { code: code, autodestruct_minutes: timerMinutes },
        { onConflict: 'code', ignoreDuplicates: true }
      ).then(({ error }) => {
        if (error) {
          console.warn('[Chat] Room upsert warning:', error.message);
        } else {
          console.log('[Chat] ✅ Room ensured in database:', code);
        }
      });
    }
  };

  // ============================================================
  // CORE FIX: All sends use the SAME channelRef
  // ============================================================
  const handleSendMessage = useCallback(({ type, content, media_url, reply_to }) => {
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

    // 2. Broadcast & DB Insert via the SAME subscribed channel
    if (isSupabaseConfigured && supabase) {
      // Broadcast to peers (instant delivery)
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsg
        }).then(() => {
          console.log('[Chat] ✅ Broadcast sent successfully');
        }).catch((e) => {
          console.error('[Chat] ❌ Broadcast send error:', e);
        });
      } else {
        console.warn('[Chat] ⚠️ No channel ref available for broadcast');
      }

      // Ensure room exists first (foreign key constraint), then persist message
      supabase.from('rooms').upsert(
        { code: activeRoomCode, autodestruct_minutes: timerMinutes },
        { onConflict: 'code', ignoreDuplicates: true }
      ).then(() => {
        return supabase.from('messages').insert([newMsg]);
      }).then(({ error }) => {
        if (error) {
          console.error('[Chat] ❌ Error inserting message into Supabase:', error);
          setConnectionError('Error guardando mensaje: ' + error.message);
        } else {
          console.log('[Chat] ✅ Message persisted to database');
        }
      });
    } else {
      mockEngine.emit(`msg_${activeRoomCode}`, newMsg);
    }
  }, [activeRoomCode, timerMinutes, userId]);

  const handleReactMessage = useCallback((msgId, emoji) => {
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

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { msgId, emoji }
      }).catch((e) => console.warn('[Chat] Reaction broadcast error:', e));
    }
  }, []);

  const handleTyping = useCallback(() => {
    if (!activeRoomCode) return;
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: userId }
      }).catch((e) => console.warn('[Chat] Typing broadcast error:', e));
    } else if (!isSupabaseConfigured) {
      mockEngine.emit(`typing_${activeRoomCode}`, userId);
    }
  }, [activeRoomCode, userId]);

  const handleBurnRoom = useCallback(() => {
    if (window.confirm('¿Seguro que deseas destruir permanentemente todo el historial de esta sala?')) {
      setMessages([]);
      saveLocalMessages(activeRoomCode, []);
      if (isSupabaseConfigured && supabase) {
        supabase.from('messages').delete().eq('room_code', activeRoomCode).then(() => {});
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'burn'
          }).catch((e) => console.warn('[Chat] Burn broadcast error:', e));
        }
      } else {
        mockEngine.emit(`burn_${activeRoomCode}`, true);
      }
    }
  }, [activeRoomCode]);

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
            connectionStatus={connectionStatus}
            connectionError={connectionError}
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
