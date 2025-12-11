# 🚀 Setup: Integración Directa con n8n (Bypass GHL)

Esta guía explica cómo configurar el nuevo flujo de mensajes que envía directamente a n8n sin depender del canal de mensajes de GHL.

---

## 📊 Nuevo Flujo de Mensajes

```
┌─────────────┐
│   Usuario   │
│  (Widget)   │
└──────┬──────┘
       │ 1. Ingresa teléfono
       │ 2. Envía mensaje
       ▼
┌─────────────────┐
│    Backend      │
│  (Socket.io)    │
└──────┬──────────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌─────────────────┐            ┌──────────────────┐
│   GHL API       │            │   n8n DIRECTO    │
├─────────────────┤            ├──────────────────┤
│ ✅ Crea contacto│            │ ✅ Recibe webhook│
│ ✅ Guarda notas │            │ ✅ Procesa IA    │
│    (historial)  │            │ ✅ Responde      │
└─────────────────┘            └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │    Backend       │
                               │ /api/webhook/    │
                               │   n8n-response   │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │    Widget        │
                               │  (Socket.io)     │
                               └──────────────────┘
```

---

## ⚙️ Paso 1: Configurar Variables de Entorno en Hetzner

Conéctate al servidor y edita el archivo `.env`:

```bash
ssh root@95.216.196.74
cd /root/saleads-chat-api
nano .env
```

Agrega estas **NUEVAS** variables:

```env
# n8n Direct Integration
N8N_WEBHOOK_URL=https://n8n-agencia-n8n.3e3qzn.easypanel.host/webhook/gohighlevel-webhook
N8N_WEBHOOK_SECRET=
N8N_DIRECT_ENABLED=true
N8N_TIMEOUT=30000
```

### Variables Explicadas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `N8N_WEBHOOK_URL` | URL del webhook de n8n que recibirá los mensajes | `https://primary-production-01a1.up.railway.app/webhook/widget-message` |
| `N8N_WEBHOOK_SECRET` | Secret opcional para autenticar (n8n lo valida) | `mi-secret-123` |
| `N8N_DIRECT_ENABLED` | Habilitar/deshabilitar el flujo directo | `true` |
| `N8N_TIMEOUT` | Timeout en ms para la petición | `30000` |

---

## 🔧 Paso 2: Crear Workflow en n8n

### 2.1 Nodo Webhook (Trigger)

1. Crea un nuevo workflow en n8n
2. Agrega un nodo **Webhook**
3. Configuración:
   - **HTTP Method**: `POST`
   - **Path**: `widget-message` (esto genera la URL completa)
   - **Response Mode**: `Respond to Webhook`

### 2.2 Payload que Recibirás

El backend enviará este JSON:

```json
{
  "sessionId": "session_1765263161982__kVWxeyVx2",
  "message": "Hola, necesito ayuda",
  "contactId": "awItGhEa8B1E1RCUeJRA",
  "phone": "+521234567890",
  "email": "usuario@ejemplo.com",
  "firstName": "Widget",
  "lastName": "User",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "pageUrl": "https://tusitio.com/productos",
    "timestamp": "2025-06-09T12:00:00.000Z"
  },
  "timestamp": "2025-06-09T12:00:00.000Z",
  "source": "widget"
}
```

### 2.3 Procesar con IA

Agrega tu nodo de procesamiento (OpenAI, tu Agente_Orquestador, etc.)

### 2.4 Responder al Backend

Agrega un nodo **HTTP Request** al final:

- **Method**: `POST`
- **URL**: `http://95.216.196.74:8080/api/webhook/n8n-response`
- **Headers**:
  - `Content-Type`: `application/json`
  - `X-Webhook-Secret`: `be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c`
- **Body** (JSON):

```json
{
  "sessionId": "{{ $('Webhook').item.json.sessionId }}",
  "response": "{{ $('Tu_Nodo_IA').item.json.output }}",
  "metadata": {
    "contactId": "{{ $('Webhook').item.json.contactId }}",
    "timestamp": "{{ $now.toISO() }}",
    "subAgent": "{{ $('Tu_Nodo_IA').item.json.sub_agente || null }}"
  }
}
```

---

## 🔄 Paso 3: Reiniciar el Backend

```bash
ssh root@95.216.196.74
cd /root/saleads-chat-api
pm2 restart saleads-chat-api
pm2 logs saleads-chat-api --lines 20
```

---

## ✅ Paso 4: Verificar

### Test desde terminal:

```bash
# 1. Verificar que n8n está habilitado
curl http://95.216.196.74:8080/api/health | jq

# Deberías ver algo como:
# "n8nEnabled": true
```

### Test del flujo completo:

1. Abre el widget en `http://95.216.196.74:8081/test.html`
2. Ingresa un número de teléfono
3. Envía un mensaje
4. Verifica en los logs del backend:
   ```
   [N8NService] Message sent successfully
   ```
5. Verifica en n8n que el webhook se recibió
6. Verifica que la respuesta llegó al widget

---

## 📝 Lo que se guarda en GHL

Aunque los mensajes NO pasan por el canal de mensajes de GHL, **SÍ se guarda historial** en las notas del contacto:

```
[Widget Chat - 09/06/25, 12:00]
👤 Usuario: Hola, necesito ayuda

[Widget Chat - 09/06/25, 12:01]
🤖 Agente: ¡Hola! Claro, ¿en qué puedo ayudarte?
```

Esto permite que los agentes humanos vean el historial de la conversación en la ficha del contacto de GHL.

---

## 🐛 Troubleshooting

### "n8n service not enabled"

**Causa**: `N8N_WEBHOOK_URL` no está configurado o `N8N_DIRECT_ENABLED=false`

**Solución**: Verifica el `.env` y reinicia PM2

### "Error sending message to n8n"

**Causa**: URL incorrecta o n8n no responde

**Solución**: 
1. Verifica que el workflow está **activado** en n8n
2. Prueba la URL del webhook manualmente con curl
3. Verifica que no hay firewall bloqueando

### "Session not found" en la respuesta

**Causa**: El `sessionId` en la respuesta de n8n no coincide

**Solución**: Asegúrate de pasar el `sessionId` exactamente como lo recibiste

---

## 🎯 Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `config/index.ts` | Agregadas variables `n8n.*` |
| `types/index.ts` | Agregado tipo `n8n` en `AppConfig` |
| `services/n8nService.ts` | **NUEVO** - Servicio para enviar a n8n |
| `services/ghlService.ts` | Agregado `addContactNote()` y `logWidgetMessage()` |
| `services/socketService.ts` | Flujo cambiado a n8n directo |
| `routes/chat.routes.ts` | Flujo cambiado a n8n directo |
| `.env` | Agregar variables `N8N_*` |

---

## 📌 Configuración Mínima Requerida

En el `.env` del servidor:

```env
N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/widget-message
N8N_DIRECT_ENABLED=true
```

¡Eso es todo! El resto tiene valores por defecto.

