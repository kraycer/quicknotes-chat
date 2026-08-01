import React, { useState } from 'react';
import { ArrowLeft, Clock, Flame, Lock, Copy, Check, ChevronDown, Wifi, WifiOff, Loader2 } from 'lucide-react';

const TIMER_OPTIONS = [
  { label: 'Desactivado', value: 0 },
  { label: '1 Minuto', value: 1 },
  { label: '2 Minutos', value: 2 },
  { label: '3 Minutos', value: 3 },
  { label: '4 Minutos', value: 4 },
  { label: '5 Minutos', value: 5 },
  { label: '6 Minutos', value: 6 },
  { label: '7 Minutos', value: 7 },
  { label: '8 Minutos', value: 8 },
  { label: '24 Horas', value: 1440 }
];

export default function ChatHeader({
  roomCode,
  timerMinutes,
  onTimerChange,
  onBack,
  onPanicLock,
  onBurnRoom,
  isTyping,
  isOnline,
  connectionStatus = 'disconnected',
  connectionError = ''
}) {
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTimerLabel = TIMER_OPTIONS.find((t) => t.value === timerMinutes)?.label || '5 Minutos';

  // Connection status display
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        if (isTyping) return { text: 'Escribiendo...', color: 'text-cyan-400', icon: null };
        if (isOnline) return { text: 'En línea', color: 'text-emerald-400', icon: 'online' };
        return { text: 'Conectado', color: 'text-emerald-400', icon: 'online' };
      case 'connecting':
        return { text: 'Conectando...', color: 'text-yellow-400', icon: 'connecting' };
      case 'error':
        return { text: 'Sin conexión', color: 'text-red-400', icon: 'error' };
      default:
        return { text: 'Desconectado', color: 'text-gray-400', icon: 'offline' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <header className="bg-[#151C28] border-b border-gray-800 px-3 sm:px-4 pb-3 flex flex-col select-none relative z-20 top-safe-spacer shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Back & Room Code */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition"
            title="Volver a lista de chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleCopyCode}>
              <span className="text-xs sm:text-sm font-bold font-mono tracking-wide text-gray-100">
                Sala {roomCode}
              </span>
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-cyan-400" />}
            </div>
            <div className="flex items-center gap-1.5">
              {statusInfo.icon === 'online' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
              )}
              {statusInfo.icon === 'connecting' && (
                <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
              )}
              {statusInfo.icon === 'error' && (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              {statusInfo.icon === 'offline' && (
                <span className="w-2 h-2 rounded-full bg-gray-500" />
              )}
              <span className={`text-[10px] font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {/* Timer Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className="flex items-center gap-1 px-2 py-1 bg-[#0B0F17] hover:bg-gray-800 border border-gray-800 rounded-xl text-[11px] text-cyan-400 font-medium transition"
              title="Temporizador de Autodestrucción"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="max-w-[65px] truncate">{selectedTimerLabel}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showTimerMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-[#151C28] border border-gray-800 rounded-2xl shadow-2xl py-1 z-30 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase font-mono border-b border-gray-800">
                  Autodestrucción
                </div>
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onTimerChange(opt.value);
                      setShowTimerMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-800 transition ${
                      timerMinutes === opt.value ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-gray-300'
                    }`}
                  >
                    {opt.label}
                    {timerMinutes === opt.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Burn Room Action */}
          <button
            onClick={onBurnRoom}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
            title="Destrucción Total (Purga)"
          >
            <Flame className="w-4 h-4 text-red-500" />
          </button>

          {/* Panic Lock Button */}
          <button
            onClick={onPanicLock}
            className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-xl transition"
            title="Bloqueo de Pánico Instantáneo"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && connectionStatus === 'error' && (
        <div className="mt-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-[10px] text-red-400 truncate">⚠️ {connectionError}</p>
        </div>
      )}
    </header>
  );
}
