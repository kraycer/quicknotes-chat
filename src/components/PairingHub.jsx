import React, { useState } from 'react';
import { Copy, Plus, LogIn, ShieldCheck, User, Sparkles, Lock, Check } from 'lucide-react';

export default function PairingHub({ userId, onJoinRoom, onLockApp }) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = () => {
    // Generate a random 6-digit code e.g. 849-102
    const codePart1 = Math.floor(100 + Math.random() * 900);
    const codePart2 = Math.floor(100 + Math.random() * 900);
    const code = `${codePart1}-${codePart2}`;
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
    onJoinRoom(cleanCode);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F17] text-gray-100 p-4 justify-between max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-200">Portal Privado</h1>
            <span className="text-[10px] text-cyan-400 font-mono">Modo Anónimo Activo</span>
          </div>
        </div>

        <button
          onClick={onLockApp}
          className="p-2 text-gray-400 hover:text-red-400 bg-[#151C28] rounded-xl border border-gray-800 transition"
          title="Bloquear y volver a Notas"
        >
          <Lock className="w-4 h-4" />
        </button>
      </header>

      {/* Main Action Container */}
      <div className="flex-1 flex flex-col justify-center space-y-6">
        {/* User Identity Card */}
        <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Tu ID Anónimo
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full font-mono border border-cyan-500/20">
              Generado Auto
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0B0F17] border border-gray-800/80 rounded-2xl p-3.5">
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

        {/* Pairing Actions */}
        <div className="bg-[#151C28] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-200 mb-1">Enlazar dos Chats</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Crea un código aleatorio para compartir o ingresa el código generado por el otro usuario.
            </p>
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className="w-4 h-4" /> Crear Nuevo Código de Sala
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[11px] text-gray-500 uppercase font-mono">O Ingresar Código</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoinWithCode} className="space-y-3">
            <div>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ej: 849-102"
                className="w-full text-center tracking-widest font-mono text-lg py-3 bg-[#0B0F17] border border-gray-800 rounded-2xl text-gray-100 outline-none focus:border-cyan-500/60 uppercase"
              />
              {error && <p className="text-[11px] text-red-400 mt-1 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-2xl font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-cyan-400" /> Conectar a Chat
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center py-3 text-[11px] text-gray-500">
        🔒 Sin registro de datos ni correos. Conexión directa y privada.
      </footer>
    </div>
  );
}
