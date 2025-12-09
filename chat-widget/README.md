# 💬 SaleAds Chat Widget - Frontend

Widget de chat embebido construido con React 18, TypeScript, Vite, Tailwind CSS y Socket.io.

## 📋 Características

- ✅ **React 18 + TypeScript** - Type-safe y moderno
- ✅ **Vite** - Build ultra-rápido
- ✅ **Tailwind CSS** - Estilos utility-first con prefijo `sw-`
- ✅ **Socket.io Client** - Comunicación en tiempo real
- ✅ **Zustand** - State management ligero
- ✅ **Responsive** - Funciona en desktop y mobile
- ✅ **Customizable** - Colores, posición, idioma, etc.
- ✅ **Aislado** - No interfiere con estilos del sitio host

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Desarrollo

```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tu configuración local
# VITE_API_URL=http://localhost:3000

# Iniciar dev server
npm run dev
```

El widget estará disponible en `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

Output en `dist/`:
- `widget.js` - JavaScript bundle
- `widget.css` - CSS bundle

### Preview del Build

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
chat-widget/
├── src/
│   ├── components/
│   │   ├── ChatButton.tsx          # Botón flotante
│   │   ├── ChatWindow.tsx          # Ventana de chat
│   │   ├── MessageList.tsx         # Lista de mensajes
│   │   ├── MessageInput.tsx        # Input con envío
│   │   └── TypingIndicator.tsx     # "Escribiendo..."
│   ├── store/
│   │   └── chatStore.ts            # Zustand store
│   ├── services/
│   │   └── socketService.ts        # Socket.io wrapper
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── App.tsx                     # Componente principal
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── public/
│   └── widget-loader.js            # Script de inyección
├── dist/                           # Build output (generado)
│   ├── widget.js
│   └── widget.css
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🎨 Componentes

### ChatButton
Botón flotante circular (60x60px) que abre/cierra el chat.
- Badge con contador de mensajes no leídos
- Animación de entrada suave
- Posición configurable (bottom-right o bottom-left)

### ChatWindow
Ventana principal del chat (400x600px).
- Header con avatar, nombre y estado de conexión
- Body con lista de mensajes scrollable
- Footer con input de mensaje
- Animación slide-up al abrir

### MessageList
Lista de mensajes con auto-scroll.
- Mensajes del usuario: derecha, fondo azul
- Mensajes del agente: izquierda, fondo gris
- Timestamp en cada mensaje
- Soporte para markdown básico (bold, italic, links)

### MessageInput
Textarea que crece hasta 3 líneas.
- Enter envía, Shift+Enter nueva línea
- Disabled mientras envía
- Indicador de desconexión

### TypingIndicator
Animación de 3 dots con efecto bounce.
- Aparece cuando el agente está procesando
- Se oculta al recibir respuesta

## 🔧 Configuración

### Variables de Entorno

```bash
# .env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_DEFAULT_POSITION=bottom-right
VITE_DEFAULT_PRIMARY_COLOR=#3B82F6
VITE_DEFAULT_LANGUAGE=es
```

### Configuración del Widget

El widget se puede configurar vía `window.saleadsConfig`:

```javascript
window.saleadsConfig = {
  // API
  apiUrl: 'https://api-chat.saleads.com',
  apiKey: 'sk_live_...',

  // Visual
  position: 'bottom-right', // 'bottom-right' | 'bottom-left'
  primaryColor: '#3B82F6',
  theme: 'light', // 'light' | 'dark'

  // Contenido
  language: 'es', // 'es' | 'en'
  greeting: '¡Hola! ¿En qué puedo ayudarte?',
  agentName: 'SaleAds',
  agentAvatar: 'https://...',

  // Comportamiento
  autoOpen: false,
  autoOpenDelay: 5000, // ms
  includePages: ['/contacto', '/soporte'],
  excludePages: ['/checkout', '/admin'],

  // Usuario (pre-fill)
  user: {
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    phone: '+34612345678',
  },

  // GDPR
  gdprNotice: true,
  gdprText: 'Al usar este chat, aceptas nuestra política de privacidad.',
  gdprLink: 'https://tu-sitio.com/privacidad',
};
```

## 🔌 API Pública

El widget expone una API en `window.SaleAdsWidget`:

```javascript
// Abrir el widget
window.SaleAdsWidget.open();

// Cerrar el widget
window.SaleAdsWidget.close();

// Enviar mensaje programáticamente
window.SaleAdsWidget.sendMessage('Hola, necesito ayuda');

// Escuchar eventos
window.SaleAdsWidget.on('message-sent', (message) => {
  console.log('Usuario envió:', message);
});

window.SaleAdsWidget.on('message-received', (message) => {
  console.log('Agente respondió:', message);
});

window.SaleAdsWidget.on('widget-opened', () => {
  console.log('Widget abierto');
});

window.SaleAdsWidget.on('widget-closed', () => {
  console.log('Widget cerrado');
});

// Remover listener
window.SaleAdsWidget.off('message-sent', callback);
```

## 🎯 Eventos Personalizados

El widget emite eventos personalizados en `window`:

```javascript
// Widget cargado
window.addEventListener('saleads:loaded', () => {
  console.log('Widget cargado');
});

// Mensaje enviado
window.addEventListener('saleads:message-sent', (e) => {
  console.log('Mensaje enviado:', e.detail);
});

// Mensaje recibido
window.addEventListener('saleads:message-received', (e) => {
  console.log('Mensaje recibido:', e.detail);
});

// Widget abierto/cerrado
window.addEventListener('saleads:widget-opened', () => {
  console.log('Widget abierto');
});

window.addEventListener('saleads:widget-closed', () => {
  console.log('Widget cerrado');
});
```

## 🧪 Testing

### Test Manual

1. Inicia el dev server: `npm run dev`
2. Abre `http://localhost:5173`
3. Verifica:
   - ✅ Botón flotante aparece
   - ✅ Click abre ventana de chat
   - ✅ Mensaje de bienvenida se muestra
   - ✅ Input funciona (escribe y envía)
   - ✅ Indicador de conexión (online/offline)
   - ✅ Cerrar ventana funciona

### Test de Integración

Crea un archivo HTML de prueba:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test Widget</title>
</head>
<body>
    <h1>Test SaleAds Widget</h1>
    
    <script>
        window.saleadsConfig = {
            apiUrl: 'http://localhost:3000',
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="http://localhost:5173/src/main.tsx" type="module"></script>
</body>
</html>
```

## 📦 Deploy

### Opción 1: Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Opción 2: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Opción 3: Cloudflare Pages

1. Conecta tu repo en Cloudflare Dashboard
2. Configura:
   - Build command: `npm run build`
   - Output directory: `dist`

### Post-Deploy

Actualiza las URLs en `public/widget-loader.js`:

```javascript
const WIDGET_JS_URL = 'https://cdn.saleads.com/widget.js';
const WIDGET_CSS_URL = 'https://cdn.saleads.com/widget.css';
```

## 🔒 Seguridad

- ✅ XSS Prevention: Escapado de HTML en mensajes
- ✅ CORS: Configurado en el backend
- ✅ Shadow DOM: Aislamiento de estilos (opcional)
- ✅ Input Sanitization: Validación de inputs
- ✅ Rate Limiting: Implementado en el backend

## 🎨 Personalización Avanzada

### Cambiar Estilos

Los estilos usan Tailwind con prefijo `sw-` para evitar conflictos:

```css
/* En src/index.css */
#saleads-chat-root .sw-custom-class {
  /* tus estilos */
}
```

### Agregar Idioma

1. Edita `src/types/index.ts`:

```typescript
export type WidgetLanguage = 'es' | 'en' | 'fr'; // Agregar 'fr'

export const translations: Record<WidgetLanguage, Translations> = {
  // ...
  fr: {
    greeting: 'Bonjour! Comment puis-je vous aider?',
    placeholder: 'Tapez votre message...',
    // ...
  },
};
```

2. Rebuild: `npm run build`

## 🐛 Troubleshooting

### El widget no aparece

1. Verifica la consola del navegador (F12)
2. Asegúrate que el script se cargue correctamente
3. Verifica que no haya errores de CORS

### Los mensajes no se envían

1. Verifica que el backend esté corriendo
2. Verifica la URL en `VITE_API_URL`
3. Revisa los logs del Socket.io

### Los estilos se ven rotos

1. Limpia caché del navegador (Ctrl + Shift + R)
2. Verifica que `widget.css` se cargue correctamente
3. Revisa conflictos con estilos del sitio host

## 📚 Recursos

- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Socket.io Client:** https://socket.io/docs/v4/client-api
- **Zustand:** https://github.com/pmndrs/zustand

## 🆘 Soporte

- **Email:** soporte@saleads.com
- **Documentación:** Ver [INTEGRATION.md](../INTEGRATION.md) en la raíz del proyecto

---

**Desarrollado por SaleAds** | Versión 1.0.0

