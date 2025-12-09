# 🚀 SaleAds Chat API - Backend

API Bridge que conecta el widget de chat con GoHighLevel y n8n para soporte automatizado con IA.

## 📋 Características

- ✅ **Express + TypeScript** - API REST type-safe
- ✅ **Socket.io** - Comunicación en tiempo real
- ✅ **Upstash Redis** - Manejo de sesiones
- ✅ **GoHighLevel Integration** - CRM y mensajería
- ✅ **n8n Webhooks** - Respuestas de IA
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Winston Logger** - Logging estructurado
- ✅ **Zod Validation** - Validación de datos
- ✅ **Security** - Helmet, CORS, webhook signatures

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Configuración

```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

Variables requeridas:
- `GHL_API_KEY` - API key de GoHighLevel
- `GHL_LOCATION_ID` - Location ID de GoHighLevel
- `UPSTASH_REDIS_REST_URL` - URL de Upstash Redis
- `UPSTASH_REDIS_REST_TOKEN` - Token de Upstash Redis
- `WEBHOOK_SECRET` - Secret para validar webhooks de n8n

Ver [MANUAL_SETUP.md](../MANUAL_SETUP.md) para instrucciones detalladas.

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Build para Producción

```bash
npm run build
```

Output en `dist/`

### Iniciar en Producción

```bash
npm start
```

## 📁 Estructura del Proyecto

```
chat-api/
├── src/
│   ├── config/
│   │   └── index.ts                # Configuración de env vars
│   ├── middleware/
│   │   ├── auth.ts                 # Autenticación y validación
│   │   ├── rateLimit.ts            # Rate limiting
│   │   └── errorHandler.ts         # Manejo de errores
│   ├── routes/
│   │   └── chat.routes.ts          # Rutas HTTP
│   ├── services/
│   │   ├── socketService.ts        # Socket.io server
│   │   ├── redisService.ts         # Redis/Upstash
│   │   └── ghlService.ts           # GoHighLevel API
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── utils/
│   │   ├── logger.ts               # Winston logger
│   │   └── validators.ts           # Zod schemas
│   ├── app.ts                      # Express app
│   └── server.ts                   # Entry point
├── dist/                           # Build output (generado)
├── logs/                           # Log files (generado)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### POST /api/chat/send
Enviar mensaje del usuario (HTTP fallback).

**Request:**
```json
{
  "sessionId": "session_123",
  "message": "Hola, necesito ayuda",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "pageUrl": "https://ejemplo.com/contacto"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_1234567890",
    "sessionId": "session_123",
    "contactId": "contact_abc"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/webhook/n8n-response
Recibir respuesta procesada de n8n.

**Headers:**
```
X-Webhook-Secret: your_webhook_secret
```

**Request:**
```json
{
  "sessionId": "session_123",
  "response": "Claro, puedo ayudarte con eso...",
  "metadata": {
    "subAgent": "soporte_tecnico",
    "processingTime": 2500,
    "contactId": "contact_abc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "received": true,
    "sessionId": "session_123"
  },
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

### GET /api/health
Health check del servidor.

**Response:**
```json
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "ghl": "connected",
    "socket": "running"
  },
  "metrics": {
    "connectedClients": 5,
    "activeSessions": 3,
    "responseTime": "15ms"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### GET /api/session/:sessionId
Obtener información de una sesión (debugging).

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_123",
    "contactId": "contact_abc",
    "startedAt": 1705315800000,
    "lastMessageAt": 1705315900000,
    "messageCount": 5,
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "pageUrl": "https://ejemplo.com/contacto"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔌 Socket.io Events

### Client → Server

**join-session**
```typescript
socket.emit('join-session', { sessionId: 'session_123' });
```

**user-message**
```typescript
socket.emit('user-message', {
  sessionId: 'session_123',
  message: 'Hola, necesito ayuda',
  metadata: {
    userAgent: 'Mozilla/5.0...',
    pageUrl: 'https://ejemplo.com/contacto'
  }
});
```

### Server → Client

**agent-response**
```typescript
socket.on('agent-response', (data) => {
  console.log(data.message);
  // "Claro, puedo ayudarte con eso..."
});
```

**agent-typing**
```typescript
socket.on('agent-typing', () => {
  console.log('Agente está escribiendo...');
});
```

**connection-status**
```typescript
socket.on('connection-status', (connected) => {
  console.log('Conectado:', connected);
});
```

**error**
```typescript
socket.on('error', (error) => {
  console.error('Error:', error.code, error.message);
});
```

## 🔐 Seguridad

### Webhook Signature Validation

Todos los webhooks de n8n deben incluir el header `X-Webhook-Secret`:

```bash
curl -X POST https://api-chat.saleads.com/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_webhook_secret" \
  -d '{"sessionId":"test","response":"test"}'
```

### CORS

Configurado en `.env`:
```bash
CORS_ORIGINS=https://cdn.saleads.com,https://app.saleads.com
```

### Rate Limiting

- **API general:** 10 requests/minuto por IP
- **Chat messages:** 10 mensajes/minuto por sesión
- **Sesión:** 100 mensajes/hora por sesión

## 📊 Logging

Los logs se guardan en:
- **Console:** Todos los niveles (con colores)
- **logs/error.log:** Solo errores (producción)
- **logs/combined.log:** Todos los niveles (producción)

Niveles de log:
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Debugging detallado

Configurar en `.env`:
```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

## 🧪 Testing

### Test Manual

```bash
# Health check
curl http://localhost:3000/api/health

# Enviar mensaje
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_123",
    "message": "Hola, esto es una prueba"
  }'

# Simular respuesta de n8n
curl -X POST http://localhost:3000/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_webhook_secret" \
  -d '{
    "sessionId": "test_123",
    "response": "Esta es una respuesta de prueba"
  }'
```

### Test de Socket.io

Usa una herramienta como [Socket.io Client Tool](https://amritb.github.io/socketio-client-tool/):

1. Connect to: `http://localhost:3000`
2. Emit event: `join-session`
   ```json
   { "sessionId": "test_123" }
   ```
3. Emit event: `user-message`
   ```json
   {
     "sessionId": "test_123",
     "message": "Hola, esto es una prueba"
   }
   ```
4. Listen for: `agent-response`, `agent-typing`, `error`

## 🚀 Deploy en Railway

Ver [DEPLOYMENT.md](../DEPLOYMENT.md) para instrucciones completas.

**Quick deploy:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd chat-api
railway up
```

**Variables de entorno en Railway:**

Agrega todas las variables del `.env.example` en el dashboard de Railway.

**⚠️ IMPORTANTE:** Railway asigna automáticamente `PORT`, no lo agregues manualmente.

## 🐛 Troubleshooting

### Error: "Redis connection failed"

**Causa:** Credenciales de Upstash incorrectas.

**Solución:**
1. Verifica `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
2. Asegúrate que no haya espacios extra
3. Verifica que la database esté activa en Upstash

### Error: "GoHighLevel API 401"

**Causa:** API key inválida o expirada.

**Solución:**
1. Verifica `GHL_API_KEY` en GoHighLevel
2. Asegúrate que tenga permisos de Contacts, Conversations, Messages
3. Regenera la API key si es necesario

### Error: "Webhook signature invalid"

**Causa:** `WEBHOOK_SECRET` diferente entre backend y n8n.

**Solución:**
1. Verifica que `WEBHOOK_SECRET` sea idéntico en:
   - Backend (.env)
   - n8n (variables de entorno)
2. No debe tener espacios ni saltos de línea

### Socket.io no conecta

**Causa:** CORS bloqueado o puerto incorrecto.

**Solución:**
1. Agrega el dominio del widget a `CORS_ORIGINS`
2. Verifica que el widget use la URL correcta
3. Revisa logs del servidor para ver errores de CORS

## 📚 Recursos

- **Express:** https://expressjs.com
- **Socket.io:** https://socket.io/docs/v4
- **Upstash Redis:** https://docs.upstash.com/redis
- **GoHighLevel API:** https://highlevel.stoplight.io
- **Winston Logger:** https://github.com/winstonjs/winston
- **Zod:** https://zod.dev

## 🆘 Soporte

- **Email:** soporte@saleads.com
- **Documentación:** Ver [MANUAL_SETUP.md](../MANUAL_SETUP.md)

---

**Desarrollado por SaleAds** | Versión 1.0.0

