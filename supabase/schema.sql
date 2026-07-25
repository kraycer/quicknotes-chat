-- ===================================================
-- SQL SCRIPT PARA BASE DE DATOS SUPABASE (QUICKNOTES MVP)
-- Copia y ejecuta este script en el Editor SQL de tu panel Supabase
-- ===================================================

-- 1. Crear tabla de Salas (Rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  autodestruct_minutes INT DEFAULT 1
);

-- 2. Crear tabla de Mensajes (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'audio', 'photo'
  content TEXT,
  media_url TEXT,
  reply_to JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT FALSE
);

-- 3. Habilitar Seguridad Nivel Fila (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas de Acceso Público
CREATE POLICY "Permitir acceso público a salas" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso público a mensajes" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 5. Habilitar Replicación en Tiempo Real para Mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Función opcional para purgar automáticamente mensajes vencidos
CREATE OR REPLACE FUNCTION purge_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
