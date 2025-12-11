# 📚 Documentación Técnica Completa - SaleAds Chat Widget

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024  
**Autor:** SaleAds

---

## 📑 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Estructura del Código](#estructura-del-código)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Ventajas y Desventajas de Hetzner](#ventajas-y-desventajas-de-hetzner)
5. [Cómo Añadir a una Plataforma](#cómo-añadir-a-una-plataforma)
6. [Conceptos Técnicos Clave](#conceptos-técnicos-clave)
7. [Flujo de Datos](#flujo-de-datos)
8. [Seguridad](#seguridad)
9. [Escalabilidad](#escalabilidad)

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Usuario)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SITIO WEB DEL CLIENTE                       │   │
│  │  (WordPress, Shopify, React, HTML estático, etc.)       │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────┐         │   │
│  │  │         WIDGET EMBEBIDO (chat-widget)       │         │   │
│  │  │  - Botón flotante                           │         │   │
│  │  │  - Ventana de chat                          │         │   │
│  │  │  - Socket.io Client (WebSocket)             │         │   │
│  │  └───────────────┬─────────────────────────────┘         │   │
│  └──────────────────┼───────────────────────────────────────┘   │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       │ HTTPS / WebSocket
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│                      │                                            │
│  ┌───────────────────▼─────────────────────────────┐            │
│  │         BACKEND API (chat-api)                   │            │
│  │  Servidor: Hetzner VPS (95.216.196.74:8080)     │            │
│  │                                                  │            │
│  │  ┌──────────────────────────────────────────┐   │            │
│  │  │  Express.js (HTTP REST API)              │   │            │
│  │  │  - POST /api/chat/send                   │   │            │
│  │  │  - GET  /api/health                      │   │            │
│  │  │  - POST /api/webhook/n8n-response        │   │            │
│  │  └──────────────┬───────────────────────────┘   │            │
│  │                  │                               │            │
│  │  ┌───────────────▼───────────────────────────┐   │            │
│  │  │  Socket.io Server (WebSocket)             │   │            │
│  │  │  - Mensajes en tiempo real                │   │            │
│  │  │  - Eventos: message, agent-response, etc. │   │            │
│  │  └──────────────┬────────────────────────────┘   │            │
│  │                  │                                │            │
│  │  ┌───────────────▼────────────────────────────┐  │            │
│  │  │  Servicios                                  │  │            │
│  │  │  - socketService (gestión de conexiones)   │  │            │
│  │  │  - redisService (sesiones y cache)         │  │            │
│  │  │  - ghlService (integración GoHighLevel)    │  │            │
│  │  │  - n8nService (enviar a n8n)               │  │            │
│  │  └──────────────┬─────────────────────────────┘  │            │
│  └─────────────────┼─────────────────────────────────┘            │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────┐
        │             │             │                 │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼────────┐ ┌──────▼──────┐
│   Upstash    │ │   GHL    │ │    n8n     │ │   Redis     │
│    Redis     │ │    API   │ │  Workflow  │ │  (Upstash)  │
│              │ │          │ │            │ │             │
│ - Sesiones   │ │ - CRM    │ │ - Agente   │ │ - Cache     │
│ - Cache      │ │ - Contacts│ │   IA      │ │ - Mensajes  │
│ - Mensajes   │ │ - Notes  │ │ - Webhook  │ │   buffer    │
└──────────────┘ └──────────┘ └────────────┘ └─────────────┘
```

### Componentes Principales

#### 1. **Frontend (chat-widget)**
- **Tecnología:** React 18 + TypeScript + Vite
- **Propósito:** Widget embebido que se inyecta en cualquier sitio web
- **Características:**
  - Botón flotante con badge de mensajes no leídos
  - Ventana de chat responsive (400x600px)
  - Conexión WebSocket para mensajes en tiempo real
  - Persistencia local (localStorage)
  - Personalizable (colores, posición, idioma)

#### 2. **Backend (chat-api)**
- **Tecnología:** Node.js 20 + Express + Socket.io + TypeScript
- **Propósito:** Bridge entre widget, GHL, n8n y Redis
- **Características:**
  - REST API para endpoints HTTP
  - WebSocket Server (Socket.io) para tiempo real
  - Gestión de sesiones (Redis)
  - Integración con GoHighLevel (CRM)
  - Webhook receiver para respuestas de n8n
  - Rate limiting y seguridad

#### 3. **Integraciones Externas**

**GoHighLevel (GHL):**
- CRM donde se guardan los contactos
- Se crean/actualizan contactos desde el widget
- Se guarda el historial como notas

**n8n:**
- Workflow automation con agente IA
- Procesa los mensajes del usuario
- Devuelve respuestas al backend vía webhook

**Upstash Redis:**
- Almacenamiento de sesiones
- Cache de mensajes
- Buffer de mensajes para procesamiento

---

## 📁 Estructura del Código

### Raíz del Proyecto

```
Widget soporte/
├── chat-api/              # Backend API
├── chat-widget/           # Frontend Widget
├── README.md              # Documentación principal
├── INDICE.md              # Índice de documentación
├── QUICKSTART.md          # Guía rápida
└── [otros .md]            # Documentación adicional
```

---

### 📂 chat-api/ (Backend)

```
chat-api/
├── src/
│   ├── app.ts                 # Configuración Express
│   ├── server.ts              # Punto de entrada del servidor
│   │
│   ├── config/
│   │   └── index.ts           # Configuración centralizada (env vars)
│   │
│   ├── middleware/
│   │   ├── auth.ts            # Validación de webhooks (firmas)
│   │   ├── errorHandler.ts    # Manejo global de errores
│   │   └── rateLimit.ts       # Rate limiting (10 msg/min, 100/hora)
│   │
│   ├── routes/
│   │   └── chat.routes.ts     # Endpoints HTTP:
│   │                          #   - POST /api/chat/send
│   │                          #   - GET  /api/health
│   │                          #   - POST /api/webhook/n8n-response
│   │
│   ├── services/
│   │   ├── socketService.ts   # Gestión Socket.io (conexiones, eventos)
│   │   ├── redisService.ts    # Cliente Redis (sesiones, cache)
│   │   ├── ghlService.ts      # Cliente GoHighLevel API
│   │   └── n8nService.ts      # Enviar mensajes a n8n (HTTP POST)
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces y tipos
│   │
│   └── utils/
│       ├── logger.ts          # Winston logger (logs estructurados)
│       └── validators.ts      # Schemas Zod (validación de datos)
│
├── dist/                      # Código compilado (JavaScript)
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración TypeScript
└── README.md                  # Docs del backend
```

#### Descripción de Archivos Clave

**`src/server.ts`**
- Punto de entrada del servidor
- Inicializa Express y Socket.io
- Verifica conexiones externas (Redis, GHL)
- Maneja graceful shutdown

**`src/app.ts`**
- Configuración de Express
- Middlewares (CORS, Helmet, rate limiting)
- Rutas HTTP
- Error handlers

**`src/services/socketService.ts`**
- Gestión de conexiones WebSocket
- Emisión de eventos (agent-response, agent-typing)
- Manejo de sesiones de usuario
- Cleanup de conexiones

**`src/services/redisService.ts`**
- CRUD de sesiones
- Cache de datos
- TTL (time-to-live) para sesiones

**`src/services/ghlService.ts`**
- Upsert de contactos en GHL
- Actualización de contactos
- Agregar notas (historial del chat)

**`src/services/n8nService.ts`**
- Envío de mensajes a n8n vía HTTP POST
- Configuración de webhook URL
- Manejo de timeouts y errores

**`src/routes/chat.routes.ts`**
- `/api/chat/send`: Recibe mensajes del usuario (HTTP fallback)
- `/api/health`: Health check del sistema
- `/api/webhook/n8n-response`: Recibe respuestas de n8n

---

### 📂 chat-widget/ (Frontend)

```
chat-widget/
├── src/
│   ├── main.tsx               # Punto de entrada (inyecta React en DOM)
│   ├── App.tsx                # Componente raíz del widget
│   ├── index.css              # Estilos globales
│   │
│   ├── components/
│   │   ├── ChatButton.tsx     # Botón flotante con badge
│   │   ├── ChatWindow.tsx     # Ventana principal del chat
│   │   ├── MessageList.tsx    # Lista de mensajes
│   │   ├── MessageInput.tsx   # Input para escribir mensaje
│   │   ├── PhoneCapture.tsx   # Formulario captura de teléfono
│   │   └── TypingIndicator.tsx # Indicador "agente escribiendo..."
│   │
│   ├── store/
│   │   └── chatStore.ts       # Zustand store (estado global):
│   │                          #   - Mensajes
│   │                          #   - Estado de conexión
│   │                          #   - Sesión ID
│   │                          #   - UI state (abierto/cerrado)
│   │
│   ├── services/
│   │   └── socketService.ts   # Cliente Socket.io:
│   │                          #   - Conexión al backend
│   │                          #   - Escucha eventos
│   │                          #   - Emite mensajes
│   │
│   └── types/
│       └── index.ts           # TypeScript interfaces
│
├── public/
│   └── widget-loader.js       # Script de inyección (no React)
│                              # Se carga en el sitio del cliente
│
├── dist/                      # Build de producción:
│   ├── widget.js              # Bundle completo (React inlined)
│   ├── widget.css             # CSS minificado
│   └── widget-loader.js       # Script de inyección
│
├── package.json               # Dependencias y scripts
├── vite.config.ts             # Configuración Vite (build como IIFE)
├── tailwind.config.js         # Configuración Tailwind CSS
└── README.md                  # Docs del widget
```

#### Descripción de Archivos Clave

**`src/main.tsx`**
- Crea contenedor en el DOM (`#saleads-chat-root`)
- Renderiza el componente `<App />`
- Punto de entrada cuando se carga el widget

**`src/App.tsx`**
- Componente raíz que orquesta todo
- Maneja la inicialización del Socket.io client
- Gestiona el estado global (Zustand)
- Renderiza `<ChatButton />` y `<ChatWindow />`

**`src/store/chatStore.ts`**
- Store de Zustand (estado global reactivo)
- Estado:
  - `messages`: Array de mensajes
  - `isOpen`: Ventana abierta/cerrada
  - `isConnected`: Socket conectado/desconectado
  - `sessionId`: ID de sesión actual
  - `typing`: Agente escribiendo (boolean)

**`src/services/socketService.ts`**
- Cliente Socket.io que se conecta al backend
- Eventos que escucha:
  - `agent-response`: Respuesta del agente IA
  - `agent-typing`: Agente escribiendo
  - `connect/disconnect`: Estado de conexión
- Métodos:
  - `sendMessage()`: Envía mensaje del usuario

**`src/components/ChatButton.tsx`**
- Botón flotante en la esquina
- Muestra badge con número de mensajes no leídos
- Click para abrir/cerrar ventana

**`src/components/ChatWindow.tsx`**
- Ventana principal del chat
- Contiene `<MessageList />`, `<MessageInput />`, `<TypingIndicator />`
- Maneja scroll automático
- Persiste estado en localStorage

**`vite.config.ts`**
- Configuración de build como **IIFE** (Immediately Invoked Function Expression)
- Inline de React y dependencias (bundle único)
- Minificación con Terser
- Output: `widget.js` y `widget.css`

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.3.3 | Tipado estático |
| **Vite** | 5.1.0 | Build tool (rápido) |
| **Tailwind CSS** | 3.4.1 | Estilos utilitarios |
| **Socket.io Client** | 4.7.2 | WebSocket client |
| **Zustand** | 4.5.0 | State management (liviano) |
| **date-fns** | 3.0.6 | Formateo de fechas |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | >=20.0.0 | Runtime |
| **Express** | 4.18.2 | Framework HTTP |
| **Socket.io** | 4.7.2 | WebSocket server |
| **TypeScript** | 5.3.3 | Tipado estático |
| **Axios** | 1.6.5 | Cliente HTTP (n8n, GHL) |
| **@upstash/redis** | 1.28.2 | Cliente Redis (HTTP) |
| **Winston** | 3.11.0 | Logging estructurado |
| **Zod** | 3.22.4 | Validación de schemas |
| **Helmet** | 7.1.0 | Security headers |
| **CORS** | 2.8.5 | Control CORS |
| **express-rate-limit** | 7.1.5 | Rate limiting |

### Infraestructura

| Servicio | Propósito | Costo |
|----------|-----------|-------|
| **Hetzner VPS** | Servidor backend | €5-20/mes |
| **Vercel/Cloudflare** | Hosting widget (CDN) | €0/mes |
| **Upstash Redis** | Sesiones y cache | €0-3/mes |
| **GoHighLevel** | CRM | Plan existente |
| **n8n** | Workflow automation | Plan existente |

---

## ⚖️ Ventajas y Desventajas de Hetzner

### ✅ Ventajas

#### 1. **Costo**
- **€5-20/mes** vs **$80-115/mes** en Railway (similar configuración)
- Plan básico CX21 (2 vCPU, 4GB RAM): **€5.83/mes**
- Recursos dedicados (no compartidos)

#### 2. **Control Total**
- Acceso SSH completo (root)
- Puedes instalar cualquier software
- Configuración personalizada (Nginx, PM2, etc.)
- No hay límites de "uso justo" (fair use)

#### 3. **Performance**
- Recursos dedicados garantizados
- No hay "vecinos ruidosos" (noisy neighbors)
- Latencia baja (servidor en Europa)
- Mejor para WebSocket (conexiones persistentes)

#### 4. **Escalabilidad Manual**
- Puedes hacer upgrade del VPS cuando quieras
- Sin cambios de código
- Control sobre cuándo escalar

#### 5. **n8n en el mismo servidor**
- Latencia mínima entre backend y n8n
- No necesitas otro servicio
- Mismo firewall, misma red

#### 6. **Sin límites de "vendor lock-in"**
- No dependes de una plataforma específica
- Puedes migrar fácilmente
- Código portable

### ❌ Desventajas

#### 1. **Gestión Manual**
- Tú eres responsable de:
  - Actualizaciones de seguridad
  - Backups
  - Monitoreo
  - Configuración del servidor

#### 2. **Sin Auto-scaling**
- Tienes que escalar manualmente
- No hay escalado automático por demanda
- Debes prever el tráfico

#### 3. **Curva de Aprendizaje**
- Necesitas conocimientos de:
  - Linux
  - Nginx
  - PM2
  - SSL/TLS
  - Firewall

#### 4. **Sin Soporte Técnico**
- No hay soporte 24/7 incluido
- Tú resuelves los problemas
- Comunidad y documentación

#### 5. **Configuración Inicial Compleja**
- Debes configurar:
  - Nginx (reverse proxy)
  - SSL con Let's Encrypt
  - Firewall (UFW)
  - PM2 (process manager)
  - Monitoreo (opcional)

#### 6. **Posible Over-provisioning**
- Puedes pagar por recursos que no usas
- Railway escala según uso (pay-as-you-go)

### 📊 Comparación: Hetzner vs Railway

| Aspecto | Hetzner | Railway |
|---------|---------|---------|
| **Costo (inicio)** | €5.83/mes | $20/mes |
| **Costo (100K msg/mes)** | €10-15/mes | $80-115/mes |
| **Control** | Total (root) | Limitado |
| **Auto-scaling** | ❌ Manual | ✅ Automático |
| **Setup inicial** | ⚠️ Complejo | ✅ Fácil |
| **Gestión** | Manual | Automática |
| **Soporte** | Comunidad | Email/chat |
| **Performance** | ✅ Excelente | ✅ Buena |
| **Vendor lock-in** | ❌ No | ⚠️ Parcial |

### 🎯 ¿Cuándo usar Hetzner?

**Usa Hetzner si:**
- ✅ Tienes experiencia con Linux/servidores
- ✅ Quieres ahorrar dinero (€10-15 vs $80-115)
- ✅ Ya tienes n8n corriendo en Hetzner
- ✅ Necesitas control total
- ✅ El tráfico es predecible
- ✅ Tienes tiempo para gestión manual

**Usa Railway si:**
- ✅ Quieres facilidad de uso
- ✅ No tienes experiencia con servidores
- ✅ Necesitas auto-scaling
- ✅ Prefieres pagar más por menos trabajo
- ✅ El tráfico es impredecible

---

## 🌐 Cómo Añadir a una Plataforma

### Método Universal (Cualquier Plataforma)

El widget se añade con **2 líneas de código** en cualquier HTML:

```html
<script>
  window.saleadsConfig = {
    apiUrl: 'https://api-chat.tu-dominio.com',
    primaryColor: '#3B82F6',
    language: 'es'
  };
</script>
<script src="https://cdn.tu-dominio.com/widget.js"></script>
```

---

### 📝 Integración por Plataforma

#### 1. **WordPress**

**Opción A: Plugin (Recomendado)**
1. Instala plugin "Insert Headers and Footers"
2. Ve a Settings → Insert Headers and Footers
3. Pega el código en "Scripts in Header"

**Opción B: Theme Editor**
1. Appearance → Theme Editor → header.php
2. Antes de `</head>`, pega el código

**Opción C: Functions.php**
```php
function add_saleads_widget() {
    ?>
    <script>
        window.saleadsConfig = {
            apiUrl: 'https://api-chat.tu-dominio.com',
            primaryColor: '#3B82F6'
        };
    </script>
    <script src="https://cdn.tu-dominio.com/widget.js"></script>
    <?php
}
add_action('wp_footer', 'add_saleads_widget');
```

---

#### 2. **Shopify**

1. Ve a Online Store → Themes → Actions → Edit Code
2. Abre `theme.liquid`
3. Antes de `</body>`, pega:
```liquid
<script>
  window.saleadsConfig = {
    apiUrl: 'https://api-chat.tu-dominio.com',
    primaryColor: '{{ settings.color_primary }}'
  };
</script>
<script src="https://cdn.tu-dominio.com/widget.js"></script>
```

---

#### 3. **React / Next.js**

**Next.js (_app.tsx o _document.tsx):**
```tsx
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script id="saleads-config">
        {`
          window.saleadsConfig = {
            apiUrl: 'https://api-chat.tu-dominio.com',
            primaryColor: '#3B82F6'
          };
        `}
      </Script>
      <Script src="https://cdn.tu-dominio.com/widget.js" strategy="lazyOnload" />
      <Component {...pageProps} />
    </>
  );
}
```

**React (index.html):**
```html
<script>
  window.saleadsConfig = {
    apiUrl: 'https://api-chat.tu-dominio.com'
  };
</script>
<script src="https://cdn.tu-dominio.com/widget.js"></script>
```

---

#### 4. **HTML Estático**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio</title>
</head>
<body>
  <h1>Contenido</h1>
  
  <!-- Widget al final del body -->
  <script>
    window.saleadsConfig = {
      apiUrl: 'https://api-chat.tu-dominio.com',
      primaryColor: '#3B82F6',
      language: 'es'
    };
  </script>
  <script src="https://cdn.tu-dominio.com/widget.js"></script>
</body>
</html>
```

---

#### 5. **Wix**

1. Settings → Custom Code
2. Add Code → Footer
3. Pega el código

---

#### 6. **Squarespace**

1. Settings → Advanced → Code Injection
2. Footer, pega el código

---

#### 7. **Webflow**

1. Project Settings → Custom Code
2. Footer Code, pega el código

---

#### 8. **Vue.js / Nuxt.js**

**Nuxt.js (nuxt.config.js):**
```js
export default {
  head: {
    script: [
      {
        innerHTML: `
          window.saleadsConfig = {
            apiUrl: 'https://api-chat.tu-dominio.com'
          };
        `,
        type: 'text/javascript'
      },
      {
        src: 'https://cdn.tu-dominio.com/widget.js',
        async: true
      }
    ]
  }
}
```

---

### 🔧 Configuración Avanzada

El objeto `window.saleadsConfig` acepta:

```javascript
window.saleadsConfig = {
  // REQUERIDO: URL del backend API
  apiUrl: 'https://api-chat.tu-dominio.com',
  
  // OPCIONAL: Personalización
  primaryColor: '#3B82F6',        // Color principal del botón
  position: 'bottom-right',        // 'bottom-right' | 'bottom-left'
  language: 'es',                  // 'es' | 'en'
  
  // OPCIONAL: Callbacks
  onMessage: (message) => {
    console.log('Nuevo mensaje:', message);
  },
  onOpen: () => {
    console.log('Chat abierto');
  },
  onClose: () => {
    console.log('Chat cerrado');
  }
};
```

---

## 🧠 Conceptos Técnicos Clave

### 1. **WebSocket vs HTTP REST**

**HTTP REST:**
- Request → Response (una vez)
- Cliente pregunta, servidor responde
- No hay conexión persistente
- Ejemplo: `POST /api/chat/send` → respuesta inmediata

**WebSocket:**
- Conexión persistente bidireccional
- Servidor puede enviar datos sin que el cliente pregunte
- Perfecto para mensajes en tiempo real
- Ejemplo: Chat (mensajes instantáneos)

**En este proyecto:**
- HTTP REST: Fallback, health checks
- WebSocket (Socket.io): Mensajes en tiempo real

---

### 2. **Sesiones y Estado**

**Problema:** HTTP es stateless (sin estado). Cada request es independiente.

**Solución:** Usamos **sesiones** almacenadas en Redis.

**Flujo:**
1. Usuario abre widget → se crea `sessionId` único
2. `sessionId` se guarda en localStorage del navegador
3. Backend guarda sesión en Redis con datos:
   ```json
   {
     "sessionId": "session_123",
     "contactId": "awItGhEa8B1E1RCUeJRA",
     "startedAt": 1702000000000,
     "lastMessageAt": 1702000100000,
     "messageCount": 5
   }
   ```
4. Cada mensaje incluye `sessionId` → backend recupera sesión
5. Sesión expira después de inactividad (TTL en Redis)

---

### 3. **Bypass de GHL para Mensajería**

**Problema original:**
- GHL requiere teléfono/email para enviar mensajes
- Widget puede no tener esta info inicialmente
- Tipos de mensajería (WhatsApp, Live_Chat) no funcionaban bien

**Solución implementada:**
- **Bypass completo:** Backend envía mensajes directamente a n8n (HTTP POST)
- **GHL solo para CRM:** Se guardan contactos y notas (historial)
- **Flujo:**
  1. Usuario envía mensaje → Backend → n8n (directo)
  2. n8n procesa con IA → responde al backend (webhook)
  3. Backend emite respuesta vía Socket.io → Widget
  4. Opcionalmente: Backend guarda mensaje como nota en GHL

---

### 4. **Rate Limiting**

**Problema:** Prevenir spam y abuso.

**Solución:** Rate limiting en múltiples niveles.

**Nivel 1: Por IP (express-rate-limit)**
- 10 mensajes por minuto
- 100 mensajes por hora
- Bloquea IPs abusivas

**Nivel 2: Por sesión (Redis)**
- Límite por `sessionId`
- Evita que una sesión abuse

**Nivel 3: Por Socket.io**
- Máximo de conexiones por IP
- Timeout de conexiones inactivas

---

### 5. **Build del Widget (IIFE)**

**Problema:** El widget debe funcionar en cualquier sitio sin conflictos.

**Solución:** Build como **IIFE** (Immediately Invoked Function Expression).

**¿Qué es IIFE?**
```javascript
(function() {
  // Código aquí
  // No contamina el scope global
})();
```

**En este proyecto:**
- Vite compila React + dependencias en un bundle único
- Todo está encapsulado en una función anónima
- No hay conflictos con otras librerías del sitio
- Output: `widget.js` (todo en un archivo)

---

### 6. **CORS (Cross-Origin Resource Sharing)**

**Problema:** Navegador bloquea requests entre diferentes orígenes.

**Solución:** CORS configurado en el backend.

**Configuración:**
```typescript
cors({
  origin: (origin, callback) => {
    // Solo permite orígenes en whitelist
    if (config.security.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
})
```

**En producción:**
- `CORS_ORIGINS=https://cdn.tu-dominio.com,https://tu-sitio.com`
- Solo estos dominios pueden hacer requests al backend

---

### 7. **Webhook Signature Validation**

**Problema:** Cualquiera podría enviar webhooks falsos.

**Solución:** Firma HMAC-SHA256.

**Flujo:**
1. n8n genera firma: `HMAC-SHA256(secret, body)`
2. n8n envía webhook con header `X-Webhook-Secret: firma`
3. Backend valida: `HMAC-SHA256(secret, body) === firma`
4. Si coincide → procesa, si no → rechaza

---

### 8. **PM2 (Process Manager)**

**Problema:** Si el proceso Node.js crashea, el servidor se cae.

**Solución:** PM2 gestiona el proceso.

**Características:**
- Auto-restart si crashea
- Auto-start en reboot del servidor
- Logs centralizados
- Monitoreo de recursos (CPU, RAM)
- Zero-downtime deployments

**Comandos clave:**
```bash
pm2 start dist/server.js --name saleads-chat-api
pm2 restart saleads-chat-api
pm2 logs saleads-chat-api
pm2 monit
pm2 save
pm2 startup
```

---

### 9. **Nginx Reverse Proxy**

**Problema:** Backend corre en puerto 3000, pero queremos HTTPS en puerto 443.

**Solución:** Nginx como reverse proxy.

**Flujo:**
```
Cliente → HTTPS (443) → Nginx → HTTP (3000) → Backend
```

**Ventajas:**
- SSL/TLS terminación (Let's Encrypt)
- Load balancing (si tienes múltiples instancias)
- Cache de archivos estáticos
- Compresión gzip
- Rate limiting adicional

---

### 10. **Upstash Redis (Serverless Redis)**

**Problema:** Redis tradicional requiere servidor dedicado.

**Solución:** Upstash Redis (serverless).

**Características:**
- HTTP API (no necesitas servidor Redis)
- Pay-as-you-go (€0-3/mes)
- Auto-scaling
- Persistencia automática
- Global edge locations

**En este proyecto:**
- Sesiones almacenadas con TTL
- Cache de datos frecuentes
- Buffer de mensajes

---

## 🔄 Flujo de Datos Completo

### Flujo: Usuario envía mensaje

```
1. Usuario escribe mensaje en widget
   ↓
2. Widget (Socket.io Client) emite evento "message"
   ↓
3. Backend (Socket.io Server) recibe evento
   ↓
4. Backend valida sesión (Redis)
   ↓
5. Backend crea/actualiza contacto en GHL (opcional)
   ↓
6. Backend envía mensaje a n8n (HTTP POST)
   POST https://n8n.tu-dominio.com/webhook/gohighlevel-webhook
   Body: {
     sessionId: "session_123",
     message: "Hola",
     contactId: "contact_456",
     phone: "+1234567890"
   }
   ↓
7. n8n procesa con agente IA
   ↓
8. n8n envía respuesta al backend (HTTP POST)
   POST https://api-chat.tu-dominio.com/api/webhook/n8n-response
   Body: {
     sessionId: "session_123",
     response: "¡Hola! ¿En qué puedo ayudarte?",
     metadata: { ... }
   }
   ↓
9. Backend valida firma del webhook
   ↓
10. Backend emite evento vía Socket.io
    io.to('session:session_123').emit('agent-response', {
      message: "¡Hola! ¿En qué puedo ayudarte?",
      timestamp: "..."
    })
    ↓
11. Widget recibe evento y muestra mensaje
    ↓
12. Backend guarda mensaje como nota en GHL (opcional)
```

### Flujo: Usuario abre widget

```
1. Usuario carga página web
   ↓
2. Script widget.js se carga
   ↓
3. Widget se inicializa
   ↓
4. Widget busca sessionId en localStorage
   - Si existe → usa ese
   - Si no existe → genera nuevo (nanoid)
   ↓
5. Widget se conecta a Socket.io
   socket.connect('https://api-chat.tu-dominio.com')
   ↓
6. Backend crea sesión en Redis
   {
     sessionId: "session_123",
     startedAt: Date.now(),
     messageCount: 0
   }
   ↓
7. Widget muestra botón flotante
```

---

## 🔐 Seguridad

### Capas de Seguridad Implementadas

#### 1. **HTTPS (SSL/TLS)**
- Certificado Let's Encrypt
- Todas las comunicaciones cifradas
- HTTP → HTTPS redirect (Nginx)

#### 2. **CORS Whitelist**
- Solo dominios autorizados pueden hacer requests
- Configurado en `CORS_ORIGINS`

#### 3. **Rate Limiting**
- 10 mensajes/minuto por IP
- 100 mensajes/hora por IP
- Prevención de spam y DDoS

#### 4. **Webhook Signature Validation**
- HMAC-SHA256 para webhooks de n8n
- Solo webhooks firmados son aceptados

#### 5. **Helmet.js**
- Security headers HTTP
- XSS protection
- Clickjacking protection

#### 6. **Input Sanitization**
- Validación con Zod schemas
- XSS prevention
- SQL injection prevention (no usamos SQL directo)

#### 7. **Firewall (UFW)**
- Solo puertos necesarios abiertos (22, 80, 443)
- Resto bloqueados

#### 8. **Environment Variables**
- Secrets no están en código
- Archivo `.env` en `.gitignore`
- Variables sensibles en servidor

---

## 📈 Escalabilidad

### Escalabilidad Horizontal (Múltiples Instancias)

**Actualmente:** 1 instancia del backend

**Escalar a múltiples instancias:**

1. **Load Balancer (Nginx):**
```nginx
upstream backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

2. **Sticky Sessions (Socket.io):**
- Socket.io requiere sticky sessions
- Usar `sessionAffinity` en load balancer
- O usar Redis Adapter para Socket.io

3. **Redis Adapter:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = redis.createClient(...);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

### Escalabilidad Vertical (Más Recursos)

**Hetzner:**
- Upgrade del VPS (CX21 → CX31 → CX41)
- Más CPU, RAM, storage
- Sin cambios de código

**Railway:**
- Auto-scaling según uso
- Pago por uso

---

### Optimizaciones Futuras

1. **CDN para Widget:**
   - Ya implementado (Vercel/Cloudflare)
   - Edge locations globales

2. **Cache de Respuestas:**
   - Cache frecuentes en Redis
   - Reducir llamadas a n8n

3. **Connection Pooling:**
   - Pool de conexiones HTTP (axios)
   - Reutilizar conexiones

4. **Compression:**
   - Gzip en Nginx
   - Menor tamaño de responses

5. **Monitoring:**
   - Prometheus + Grafana
   - Alertas automáticas

---

## 📊 Métricas y Monitoreo

### Métricas Actuales

**Backend (PM2):**
```bash
pm2 monit
# Muestra:
# - CPU usage
# - Memory usage
# - Requests/min
```

**Health Check:**
```
GET /api/health
# Retorna:
# - Status de servicios
# - Número de conexiones activas
# - Número de sesiones activas
```

### Logs

**Backend (Winston):**
- Logs estructurados (JSON)
- Niveles: error, warn, info, debug
- Output: stdout (capturado por PM2)

**Nginx:**
```bash
# Access logs
/var/log/nginx/saleads-chat-api-access.log

# Error logs
/var/log/nginx/saleads-chat-api-error.log
```

---

## 🎓 Conclusión

### Resumen Técnico

**Arquitectura:**
- Frontend: React widget embebido
- Backend: Node.js + Express + Socket.io
- Integraciones: GHL, n8n, Redis

**Despliegue:**
- Backend: Hetzner VPS (€5-20/mes)
- Frontend: Vercel/Cloudflare (€0/mes)
- Redis: Upstash (€0-3/mes)

**Ventajas de Hetzner:**
- ✅ Económico
- ✅ Control total
- ✅ Performance excelente
- ✅ n8n en mismo servidor

**Desventajas:**
- ❌ Gestión manual
- ❌ Sin auto-scaling
- ❌ Curva de aprendizaje

**Próximos Pasos:**
1. Monitoreo avanzado (Prometheus)
2. Auto-scaling horizontal
3. Cache de respuestas IA
4. Analytics de conversaciones

---

**¿Preguntas técnicas?** soporte@saleads.com

**Desarrollado por SaleAds** | Versión 1.0.0 | Diciembre 2024

