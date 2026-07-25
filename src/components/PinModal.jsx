import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, X, Delete, Check } from 'lucide-react';

export default function PinModal({ isOpen, onClose, onUnlockReal, onUnlockDecoy }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [step, setStep] = useState('enter'); // 'enter', 'setup_real', 'setup_decoy'
  const [tempRealPin, setTempRealPin] = useState('');

  const savedRealPin = localStorage.getItem('qn_real_pin');
  const savedDecoyPin = localStorage.getItem('qn_decoy_pin');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      if (!savedRealPin) {
        setIsSettingUp(true);
        setStep('setup_real');
      } else {
        setIsSettingUp(false);
        setStep('enter');
      }
    }
  }, [isOpen, savedRealPin]);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        processPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const processPin = (inputPin) => {
    if (step === 'setup_real') {
      setTempRealPin(inputPin);
      setPin('');
      setStep('setup_decoy');
    } else if (step === 'setup_decoy') {
      if (inputPin === tempRealPin) {
        setError('El PIN falso no puede ser igual al PIN real.');
        setPin('');
        return;
      }
      localStorage.setItem('qn_real_pin', tempRealPin);
      localStorage.setItem('qn_decoy_pin', inputPin);
      setIsSettingUp(false);
      onUnlockReal();
    } else if (step === 'enter') {
      if (inputPin === savedRealPin) {
        onUnlockReal();
      } else if (inputPin === savedDecoyPin) {
        onUnlockDecoy();
      } else {
        setError('PIN incorrecto. Reintenta.');
        setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#151C28] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
        {/* Close Button */}
        <div className="w-full flex justify-end">
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Icon */}
        <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-100 text-center mb-1">
          {step === 'setup_real' && 'Configura PIN Real (Chat)'}
          {step === 'setup_decoy' && 'Configura PIN Señuelo (Falso)'}
          {step === 'enter' && 'Acceso de Seguridad'}
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-gray-400 text-center mb-6 px-2">
          {step === 'setup_real' && 'Crea un PIN de 4 dígitos para ingresar a tu chat privado.'}
          {step === 'setup_decoy' && 'Crea un PIN alternativo que mostrará notas falsas.'}
          {step === 'enter' && 'Ingresa tu PIN de 4 dígitos para continuar.'}
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-cyan-500 border-cyan-400 scale-110'
                  : 'border-gray-700 bg-gray-900/50'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400 font-medium text-center mb-4 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-2xl bg-[#0B0F17] hover:bg-gray-800 text-xl font-semibold text-gray-200 border border-gray-800 transition active:scale-95 flex items-center justify-center mx-auto"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-[#0B0F17] hover:bg-gray-800 text-xl font-semibold text-gray-200 border border-gray-800 transition active:scale-95 flex items-center justify-center mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-[#0B0F17] hover:bg-gray-800 text-gray-400 hover:text-red-400 border border-gray-800 transition active:scale-95 flex items-center justify-center mx-auto"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
