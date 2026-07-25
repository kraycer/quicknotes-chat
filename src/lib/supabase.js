import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let validUrl = rawUrl.trim();
if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
  validUrl = `https://${validUrl}`;
}

export const isSupabaseConfigured = Boolean(
  validUrl &&
  validUrl.length > 5 &&
  supabaseAnonKey &&
  !supabaseAnonKey.includes('tu-clave')
);

let supabaseInstance = null;
if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(validUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Error inicializando Supabase Client:', e);
  }
}

export const supabase = supabaseInstance;

// Built-in Mock Event Engine for offline / immediate zero-config testing
class LocalRealtimeEngine {
  constructor() {
    this.channel = new BroadcastChannel('quicknotes_mock_channel');
    this.listeners = new Map();

    this.channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (this.listeners.has(type)) {
        this.listeners.get(type).forEach((cb) => cb(payload));
      }
    };
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.listeners.get(type).delete(callback);
  }

  emit(type, payload) {
    this.channel.postMessage({ type, payload });
    // Execute locally as well
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach((cb) => cb(payload));
    }
  }
}

export const mockEngine = new LocalRealtimeEngine();

// Helper to save and get local rooms and messages
export const getLocalMessages = (roomCode) => {
  try {
    const raw = localStorage.getItem(`qn_msgs_${roomCode}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalMessages = (roomCode, messages) => {
  try {
    localStorage.setItem(`qn_msgs_${roomCode}`, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving local messages', e);
  }
};

// Purge expired messages automatically
export const filterExpiredMessages = (messages) => {
  const now = Date.now();
  return messages.filter((msg) => {
    if (!msg.expires_at) return true;
    return new Date(msg.expires_at).getTime() > now;
  });
};
