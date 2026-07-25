import React, { useState, useEffect } from 'react';
import { Copy, Plus, LogIn, ShieldCheck, User, Sparkles, Lock, Check, MessageSquare, Trash2, ChevronRight, Mic, Camera, FileText, Search, Edit2, Zap } from 'lucide-react';
import { getLocalMessages, isSupabaseConfigured, supabase } from '../lib/supabase';

const DEFAULT_SHARED_ROOM = '777-888';

export default function PairingHub({ userId, onJoinRoom, onLockApp }) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [aliasInput, setAliasInput] = useState('');

  // Persistent list of active rooms (Default shared room included!)
  const [recentRooms, setRecentRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('qn_recent_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.includes(DEFAULT_SHARED_ROOM)) return [DEFAULT_SHARED_ROOM, ...parsed];
          return parsed;
        }
      }
      return [DEFAULT_SHARED_ROOM];
    } catch {
      return [DEFAULT_SHARED_ROOM];
    }
  });

  // Room Aliases stored locally
  const [aliases, setAliases] = useState(() => {
    try {
      const saved = localStorage.getItem('qn_room_aliases');
      return saved ? JSON.parse(saved) : { [DEFAULT_SHARED_ROOM]: 'Sala Principal Compartida' };
    } catch {
      return { [DEFAULT_SHARED_ROOM]: 'Sala Principal Compartida' };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qn_recent_rooms', JSON.stringify(recentRooms));
    } catch (e) {
      console.error('Error guardando salas recientes:', e);
    }
  }, [recentRooms]);

  useEffect(() => {
    try {
      localStorage.setItem('qn_room_aliases', JSON.stringify(aliases));
    } catch (e) {
      console.error('Error guardando apodos:', e);
    }
  }, [aliases]);

  // Sync rooms from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('messages')
        .select('room_code, created_at')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            const serverRooms = Array.from(new Set(data.map((d) => d.room_code)));
            setRecentRooms((prev) => {
              const combined = Array.from(new Set([...prev, ...serverRooms]));
              localStorage.setItem('qn_recent_rooms', JSON.stringify(combined));
              return combined;
            });
          }
        });
    }
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addRecentRoom = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setRecentRooms((prev) => {
      const updated = [clean, ...prev.filter((r) => r !== clean)];
      localStorage.setItem('qn_recent_rooms', JSON.stringify(updated));
      return updated;
    });
  };

  const handleJoinDefaultRoom = () => {
    addRecentRoom(DEFAULT_SHARED_ROOM);
    onJoinRoom(DEFAULT_SHARED_ROOM);
  };

  const handleCreateRoom = () => {
    const codePart1 = Math.floor(100 + Math.random() * 900);
    const codePart2 = Math.floor(100 + Math.random() * 900);
    const code = `${codePart1}-${codePart2}`;
    addRecentRoom(code);
    onJoinRoom(code);
  };

  const handleJoinWithCode = (e) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Ingresa un código de sala válido');
      return;
    }
    setError('');
    addRecentRoom(cleanCode);
    onJoinRoom(cleanCode);
  };

  const handleRemoveRoom = (code, e) => {
    e.stopPropagation();
    const updated = recentRooms.filter((r) => r !== code);
    setRecentRooms(updated);
    localStorage.setItem('qn_recent_rooms', JSON.stringify(updated));
    localStorage.removeItem(`qn_msgs_${code}`);
  };

  const handleSaveAlias = (code) => {
    setAliases({ ...aliases, [code]: aliasInput.trim() });
    setEditingRoom(null);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRooms = recentRooms.filter((r) => {
    const alias = aliases[r] || '';
    return r.toLowerCase().includes(search.toLowerCase()) || alias.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full h-[100dvh] bg-[#0B0F17] text-gray-100 p-3 sm:p-4 max-w-md sm:max-w-lg mx-auto safe-pb overflow-hidden top-safe-spacer">
      {/* Top Header with Notch Protection */}
      <header className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 tracking-wide">Chats Privados</h1>
            <span className="text-[10px] text-cyan-400 font-mono">Modo Anónimo Activo</span>
          </div>
        </div>

        <button
          onClick={onLockApp}
          className="p-2 text-gray-400 hover:text-red-400 bg-[#151C28] rounded-2xl border border-gray-800 transition active:scale-95"
          title="Bloquear y volver a Notas"
        >
          <Lock className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {/* User Identity Card */}
        <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-3.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Tu ID Anónimo
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-mono border border-cyan-500/20">
              Generado
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0B0F17] border border-gray-800/80 rounded-2xl p-2.5">
            <span className="text-sm font-mono font-bold tracking-wider text-gray-100">
              {userId}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-xl transition flex items-center gap-1 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* 1-Click Fast Shared Room Button */}
        <div className="bg-[#151C28] border border-cyan-500/30 rounded-3xl p-4 shadow-xl space-y-3">
          <button
            onClick={handleJoinDefaultRoom}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Zap className="w-4 h-4 fill-white text-white" /> Entrar a Sala Compartida ({DEFAULT_SHARED_ROOM})
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            🔒 Ambos usuarios entran directo a esta sala única en 1-clic.
          </p>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[10px] text-gray-500 font-mono uppercase">O ingresar otra sala</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Código ej: 849-102"
              className="flex-1 text-center tracking-widest font-mono text-xs py-2 bg-[#0B0F17] border border-gray-800 rounded-2xl text-gray-100 outline-none focus:border-cyan-500/60 uppercase"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-2xl font-medium text-xs transition flex items-center gap-1 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          </form>
          {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
        </div>

        {/* Active Conversations Section (Estilo WhatsApp) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Conversaciones Activas ({filteredRooms.length})
            </h2>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="p-6 text-center bg-[#151C28]/60 border border-gray-800/80 rounded-3xl text-gray-500 text-xs">
              No hay salas activas. Toca el botón azul arriba para entrar a la sala compartida.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRooms.map((code) => {
                const roomMsgs = getLocalMessages(code);
                const lastMsg = roomMsgs[roomMsgs.length - 1];
                const roomAlias = aliases[code];

                return (
                  <div
                    key={code}
                    onClick={() => {
                      addRecentRoom(code);
                      onJoinRoom(code);
                    }}
                    className="p-3 bg-[#151C28] border border-gray-800/90 rounded-2xl hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between group active:scale-98 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar Circle */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-inner">
                        {code === DEFAULT_SHARED_ROOM ? '★' : (roomAlias ? roomAlias.slice(0, 2).toUpperCase() : code.slice(0, 3))}
                      </div>

                      {/* Info & Last Message */}
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-cyan-400 transition truncate">
                            {roomAlias || `Sala ${code}`}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {lastMsg ? formatTime(lastMsg.created_at) : 'Ahora'}
                          </span>
                        </div>

                        {/* WhatsApp-style last message preview with icons */}
                        <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                          {lastMsg ? (
                            <>
                              {lastMsg.type === 'audio' && <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                              {lastMsg.type === 'photo' && <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                              <span className="truncate text-[11px]">
                                {lastMsg.type === 'audio'
                                  ? 'Nota de voz'
                                  : lastMsg.type === 'photo'
                                  ? 'Foto efímera'
                                  : lastMsg.content}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 italic text-[11px]">Conversación lista. Toca para chatear.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoom(code);
                          setAliasInput(aliases[code] || '');
                        }}
                        className="p-1.5 text-gray-500 hover:text-cyan-400 transition rounded-xl"
                        title="Cambiar Apodo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {code !== DEFAULT_SHARED_ROOM && (
                        <button
                          onClick={(e) => handleRemoveRoom(code, e)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition rounded-xl hover:bg-red-500/10"
                          title="Eliminar conversación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-5 w-full max-w-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-100">Asignar Apodo Privado</h3>
            <p className="text-xs text-gray-400">Asigna un nombre personalizado a la Sala {editingRoom} (Solo visible en tu teléfono).</p>
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="Ej: Contacto Alfa"
              className="w-full py-2.5 px-3 bg-[#0B0F17] border border-gray-800 rounded-2xl text-sm text-gray-100 outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingRoom(null)} className="px-3 py-1.5 text-xs text-gray-400">Cancelar</button>
              <button onClick={() => handleSaveAlias(editingRoom)} className="px-4 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="text-center py-2 text-[10px] text-gray-500 shrink-0 border-t border-gray-800/50 mt-2">
        🔒 Sin datos personales. Chat anónimo con autodestrucción.
      </footer>
    </div>
  );
}
