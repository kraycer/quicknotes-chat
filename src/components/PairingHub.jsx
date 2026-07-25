import React, { useState, useEffect } from 'react';
import { Copy, Plus, LogIn, ShieldCheck, User, Sparkles, Lock, Check, MessageSquare, Trash2, ChevronRight, Clock } from 'lucide-react';
import { getLocalMessages } from '../lib/supabase';

export default function PairingHub({ userId, onJoinRoom, onLockApp }) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Active rooms saved in local history
  const [recentRooms, setRecentRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('qn_recent_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qn_recent_rooms', JSON.stringify(recentRooms));
    } catch (e) {
      console.error(e);
    }
  }, [recentRooms]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addRecentRoom = (code) => {
    if (!recentRooms.includes(code)) {
      setRecentRooms([code, ...recentRooms]);
    }
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
    if (!cleanCode || cleanCode.length < 5) {
      setError('Ingresa un código válido de 6 dígitos (ej: 849-102)');
      return;
    }
    setError('');
    addRecentRoom(cleanCode);
    onJoinRoom(cleanCode);
  };

  const handleRemoveRoom = (code, e) => {
    e.stopPropagation();
    setRecentRooms(recentRooms.filter((r) => r !== code));
  };

  return (
    <div className="flex flex-col h-full h-[100dvh] bg-[#0B0F17] text-gray-100 p-4 max-w-md sm:max-w-lg mx-auto safe-pt safe-pb overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between py-3 mb-2 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 tracking-wide">Portal de Conversaciones</h1>
            <span className="text-[10px] text-cyan-400 font-mono">Modo Anónimo Activo</span>
          </div>
        </div>

        <button
          onClick={onLockApp}
          className="p-2.5 text-gray-400 hover:text-red-400 bg-[#151C28] rounded-xl border border-gray-800 transition"
          title="Bloquear y volver a Notas"
        >
          <Lock className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* User Identity Card */}
        <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Tu ID Anónimo
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full font-mono border border-cyan-500/20">
              Auto-Generado
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0B0F17] border border-gray-800/80 rounded-2xl p-3">
            <span className="text-lg font-mono font-bold tracking-wider text-gray-100">
              {userId}
            </span>
            <button
              onClick={handleCopyId}
              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-xl transition flex items-center gap-1 text-xs"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Create / Join Room Action Hub */}
        <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className="w-4 h-4" /> Crear Nueva Sala (Generar Código)
          </button>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Código Ej: 849-102"
              className="flex-1 text-center tracking-widest font-mono text-sm py-2.5 bg-[#0B0F17] border border-gray-800 rounded-2xl text-gray-100 outline-none focus:border-cyan-500/60 uppercase"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-2xl font-medium text-xs transition flex items-center gap-1 shrink-0"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
          </form>
          {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
        </div>

        {/* Active Conversations List (Estilo WhatsApp / Telegram) */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Conversaciones Activas ({recentRooms.length})
          </h2>

          {recentRooms.length === 0 ? (
            <div className="p-6 text-center bg-[#151C28]/60 border border-gray-800/80 rounded-3xl text-gray-500 text-xs">
              No tienes salas activas. Crea una sala o únete con un código de 6 dígitos.
            </div>
          ) : (
            <div className="space-y-2">
              {recentRooms.map((code) => {
                const roomMsgs = getLocalMessages(code);
                const lastMsg = roomMsgs[roomMsgs.length - 1];

                return (
                  <div
                    key={code}
                    onClick={() => onJoinRoom(code)}
                    className="p-3.5 bg-[#151C28] border border-gray-800 rounded-2xl hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between group active:scale-99"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        #
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-mono font-bold text-sm text-gray-200 group-hover:text-cyan-400 transition">
                            Sala {code}
                          </h3>
                          {lastMsg && (
                            <span className="text-[10px] text-gray-500">
                              {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lastMsg ? (lastMsg.content || '[Archivo multimedia]') : 'Sala abierta. Toca para chatear.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2">
                      <button
                        onClick={(e) => handleRemoveRoom(code, e)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center py-2 text-[10px] text-gray-500 shrink-0">
        🔒 Sin registros ni rastros. Chat anónimo efímero.
      </footer>
    </div>
  );
}
