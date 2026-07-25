import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

export default function VoiceRecorder({ onSendAudio, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          onSendAudio(reader.result);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('No se pudo acceder al micrófono en este dispositivo.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Don't trigger send
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    onCancel();
  };

  React.useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between bg-[#151C28] border border-cyan-500/30 rounded-2xl p-2 px-4 shadow-lg w-full animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-mono font-bold text-red-400">
          Grabando audio ({formatDuration(duration)})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 text-gray-400 hover:text-red-400 rounded-xl transition"
          title="Cancelar"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={stopRecording}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md transition flex items-center gap-1 text-xs font-medium"
        >
          <Send className="w-4 h-4" /> Enviar
        </button>
      </div>
    </div>
  );
}
