import { createClient } from '@supabase/supabase-js';

// Primary: environment variables (for local dev with .env)
// Fallback: hardcoded credentials (for APK builds where .env is not available)
const FALLBACK_URL = 'https://unvgkzvqcrscdoxxnbhd.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmdrenZxY3JzY2RveHhuYmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk4NjI2NiwiZXhwIjoyMTAwNTYyMjY2fQ.p9O2B5igDWzzAH7CtFDQFN6d-gWJxrNTV3FlqCOuNT0';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || FALLBACK_URL;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || FALLBACK_KEY;

let validUrl = rawUrl;
if (validUrl && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
  validUrl = `https://${validUrl}`;
}

export const isSupabaseConfigured = Boolean(validUrl && validUrl.length > 5 && supabaseKey && supabaseKey.length > 10);

let supabaseInstance = null;
if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(validUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('[Supabase] Client initialized successfully. URL:', validUrl.substring(0, 40) + '...');
  } catch (e) {
    console.error('[Supabase] Error initializing client:', e);
  }
} else {
  console.warn('[Supabase] NOT configured. Running in local-only mock mode. URL:', rawUrl, 'Key length:', supabaseKey.length);
}

export const supabase = supabaseInstance;

// Health check: verify the messages table exists and is accessible
export const checkDatabaseHealth = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured — running in mock mode' };
  }
  try {
    const { data, error } = await supabase.from('messages').select('id').limit(1);
    if (error) {
      console.error('[Supabase] Health check failed:', error);
      return { ok: false, error: error.message };
    }
    console.log('[Supabase] Health check passed. Messages table accessible.');
    return { ok: true };
  } catch (e) {
    console.error('[Supabase] Health check exception:', e);
    return { ok: false, error: e.message };
  }
};

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
