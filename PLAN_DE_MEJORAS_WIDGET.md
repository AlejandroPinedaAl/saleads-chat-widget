# Plan de Mejoras: Widget Multimedia e Instantáneo

Este documento detalla las fases para transformar tu widget actual en una experiencia moderna, eliminando el formulario inicial y agregando soporte para envío de archivos.

> **Nota:** Este plan respeta la arquitectura actual donde los `sessionIds` ya son generados automáticamente por el sistema (ej: `session_17655...`).

---

## Fase 1: Chat Instantáneo (Adiós Formulario) 🚀
**Objetivo:** Eliminar la barrera de entrada para que el usuario pueda escribir de inmediato.

### 1. Modificación en Frontend (`ChatWindow.tsx`)
-   **Situación Actual:** El componente verifica `phoneCaptured`. Si es falso, muestra `<PhoneCapture />` (el formulario que pide teléfono).
-   **El Cambio:** Eliminaremos o condicionaremos esa verificación para que **siempre** muestre la ventana de chat (`<MessageList />` y `<MessageInput />`).
-   **Identificación:** Como ya vimos, el sistema genera automáticamente un ID único (`sessionId`) basado en la fecha y un código aleatorio. Esto es perfecto, no necesitamos cambiar nada en el backend para identificar al usuario "anónimo".

### 2. Experiencia de Usuario
-   El usuario abre el chat y ve el saludo inicial (ej: "Hola, ¿en qué te ayudo?").
-   Puede escribir inmediatamente.
-   El `sessionId` se mantiene en su navegador, así que si recarga la página, ve su historial.

---

## Fase 2: Soporte Multimedia (Fotos, Audios, Videos) 📸
**Objetivo:** Permitir que el usuario envíe archivos y que el sistema los procese.

### 1. Backend: Almacenamiento Local
-   **Infraestructura:** Configuraremos el servidor (`chat-api`) para recibir archivos.
-   **Tecnología:** Usaremos una librería llamada `multer`.
-   **Funcionamiento:**
    1.  El usuario selecciona una foto.
    2.  El widget la envía a una nueva ruta: `POST /api/chat/upload`.
    3.  El servidor guarda el archivo en una carpeta `./uploads` en el disco duro del servidor.
    4.  El servidor responde con un link público: `http://tudominio.com/uploads/foto123.jpg`.

### 2. Frontend: Botones y Visualización
-   **Botones:** Agregaremos dos íconos nuevos al lado del campo de texto:
    -   📎 **Clip:** Para adjuntar imágenes y videos desde la galería.
    -   🎙️ **Micrófono:** Para grabar notas de voz directamente (como en WhatsApp).
-   **Visualización:** El chat dejará de ser solo texto plano. Si el mensaje es una imagen, mostraremos la miniatura. Si es video o audio, un pequeño reproductor.

### 3. Integración con n8n
-   **El Router:** El widget enviará un "tipo" de mensaje (`text`, `image`, `audio`).
-   **En n8n:** Usaremos el nodo "Switch" (que mostraste en tu imagen) para decidir qué hacer:
    -   Si es **Texto** -> Lo enviamos a Gemini (texto).
    -   Si es **Imagen** -> Lo enviamos a un nodo de Visión (Gemini/GPT-4o) para que "vea" la foto.
    -   Si es **Audio** -> Lo enviamos a Whisper para que lo transcriba a texto y luego la IA lo responda.

---

## Resumen de Cambios Técnicos
Para tu referencia, estos son los archivos clave que tocaremos cuando demos luz verde:

1.  **`chat-api/src/app.ts`**: Habilitar carpeta de uploads pública.
2.  **`chat-widget/src/components/ChatWindow.tsx`**: Quitar el bloqueo del formulario `PhoneCapture`.
3.  **`chat-widget/src/components/MessageInput.tsx`**: Agregar botones de adjuntar y micrófono.
4.  **`chat-widget/src/components/MessageList.tsx`**: Enseñar fotos y videos en el chat.
