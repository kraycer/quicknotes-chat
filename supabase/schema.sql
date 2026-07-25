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
  room_code TEXT NOT NULL,
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

-- 4. Crear Políticas de Acceso Público Total (Anon/Public role)
DROP POLICY IF EXISTS "Permitir acceso público a salas" ON public.rooms;
CREATE POLICY "Permitir acceso público a salas" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso público a mensajes" ON public.messages;
CREATE POLICY "Permitir acceso público a mensajes" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 5. Habilitar Replicación en Tiempo Real para Mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Función y Trigger de Autodestrucción FÍSICA en la Base de Datos
-- Borra físicamente del disco de Supabase cualquier mensaje vencido al insertar o consultar
CREATE OR REPLACE FUNCTION purge_expired_messages()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purge_expired ON public.messages;
CREATE TRIGGER trigger_purge_expired
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH STATEMENT
  EXECUTE FUNCTION purge_expired_messages();
