# 📝 QuickNotes MVP - Aplicación de Chat Anónimo y Camuflado para Android

Una aplicación móvil camuflada como un Bloc de Notas inofensivo (**`QuickNotes`**) con portal de chat privado anónimo de alta seguridad.

---

## 🌟 Características Principales

1. **Camuflaje y Portada Señuelo**:
   - Nombre e icono de Bloc de Notas.
   - **Sistema de Doble PIN**:
     - **PIN Real** (desbloquea el portal de chat secreto).
     - **PIN Señuelo** (muestra notas genéricas falsas si alguien te exige abrir la app).
   - **Botón de Pánico (<0.5s)**: Bloqueo instantáneo de vuelta a la portada de notas.

2. **Identidad Anónima & Emparejamiento**:
   - Sin correo ni número celular.
   - ID numérico de 6 dígitos auto-generado (`ID-XXXXXX`).
   - Conexión entre dos dispositivos mediante código aleatorio de sala (ej. `849-102`).

3. **Mensajes Autodestructibles**:
   - Temporizador de autodestrucción configurable: **Desactivado, 1m, 2m, 3m, 4m, 5m, 6m, 7m, 8m, 24 horas**.
   - Contador en vivo en cada mensaje.
   - Botón de **Destrucción Total ("Burn Chat")** para purgar el historial en ambos dispositivos.

4. **Chat Interactivo Moderno**:
   - **Deslizar para responder (Swipe-to-Reply)** estilo Telegram/WhatsApp.
   - **Notas de voz** con micrófono.
   - **Fotos efímeras**.
   - **Indicador de "Escribiendo..."** y confirmaciones de lectura (✓ / ✓✓).
   - Selector de emoticonos / emojis.

5. **Notificaciones Disfrazadas**:
   - Alertas del sistema camufladas como *"Recordatorio: Revisar lista de compras"*.

---

## 🚀 Inicio Rápido (Local)

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir la URL mostrada en tu navegador (ej: `http://localhost:3000`).

---

## 📱 ¿Cómo generar el archivo `.apk` para Android?

Tienes **3 opciones ultra sencillas** para instalar la app en Android sin publicar en Play Store:

### Opción 1: Instalación Directa PWA (Recomendada y sin programas)
1. Compila la app o ejecútala en tu servidor local/Vercel/Netlify.
2. Abre la URL en Google Chrome desde tu teléfono Android.
3. Toca los 3 puntos del navegador → **"Agregar a la pantalla de inicio"** / **"Instalar aplicación"**.
4. ¡Listo! Se creará un icono con el nombre e icono **QuickNotes** que funciona como app nativa full screen.

### Opción 2: Generar `.apk` mediante Web2APK / Bubblewrap
1. Compila la app para producción: `npm run build`.
2. Sube los archivos a cualquier hosting gratuito (o utiliza [PWABuilder.com](https://www.pwabuilder.com/)).
3. Ingresa tu URL en PWABuilder y haz clic en **"Download Android Package (APK)"**.
4. ¡Descarga el archivo `.apk` directamente a tu teléfono e instálalo!

### Opción 3: Capacitor (Android Studio)
1. Agrega Capacitor al proyecto:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init QuickNotes com.quicknotes.app
   npm run build
   npx cap add android
   npx cap open android
   ```
2. En Android Studio: **Build → Build APK(s)** para generar tu ejecutable `.apk`.

---

## 🗄️ Configuración de Supabase (Opcional)

> **Nota**: La app incluye un motor de simulación instantáneo sin configuración para probar localmente entre pestañas.

Para usar tu propia base de datos en tiempo real:
1. Crea un proyecto gratuito en [Supabase.com](https://supabase.com).
2. Ve al Editor SQL e introduce el código ubicado en `supabase/schema.sql`.
3. Crea un archivo `.env` en la raíz del proyecto con tus llaves:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-llave-anon-publica
   ```
