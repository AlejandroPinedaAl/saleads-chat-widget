# 🧪 Pruebas Locales - Integración Chatwoot

## ✅ Estado Actual

- **Fase 3 COMPLETADA**: Código implementado y compilado sin errores
- **Commit**: `24ece64` - "feat: Implementar integración completa con Chatwoot"
- **Branch**: `feature/chatwoot-migration`

---

## 📋 Qué Debes Hacer Ahora

### 1️⃣ Iniciar el Backend Local

Abre una terminal en `chat-api/` y ejecuta:

```bash
cd chat-api
node dist/server.js
```

**Resultado esperado:**
```
[ChatwootService] Initialized { accountId: '2', inboxId: '3', apiUrl: 'https://n8n-agencia-chatwoot.3e3qzn.easypanel.host' }
[N8NService] Initialized { webhookUrl: 'https://n8n-agencia-n8n.3e3qzn.easypanel.host/webhook/gohighlevel-webhook', timeout: 30000 }
[RedisService] Connected to Upstash Redis
[SocketService] Initialized
Server running on port 3000
```

**Si ves errores:**
- ❌ `ChatwootService not enabled` → Verifica que las variables `CHATWOOT_*` estén en `.env`
- ❌ `Redis connection failed` → Verifica `UPSTASH_REDIS_*` en `.env`
- ❌ `Port 3000 already in use` → Cambia `PORT=3001` en `.env`

---

### 2️⃣ Verificar Health Check

En otra terminal o navegador, ejecuta:

```bash
curl http://localhost:3000/api/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "chatwoot": "connected",
    "socket": "running",
    "n8n": "enabled"
  },
  "metrics": {
    "connectedClients": 0,
    "activeSessions": 0,
    "responseTime": "45ms"
  },
  "timestamp": "2025-12-11T03:20:00.000Z",
  "uptime": 12.5
}
```

**Si `chatwoot: "disconnected"`:**
- Verifica que la URL de Chatwoot sea accesible
- Verifica que el API Key sea válido
- Revisa los logs del servidor para más detalles

---

### 3️⃣ Probar Creación de Contacto y Conversación

Envía un mensaje de prueba:

```bash
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "message": "Hola, esto es una prueba",
    "metadata": {
      "firstName": "Test",
      "lastName": "User",
      "pageUrl": "http://localhost:8000/test.html"
    }
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "messageId": "n8n_1234567890",
    "sessionId": "test-session-001",
    "contactId": "123",
    "conversationId": 456,
    "chatwootEnabled": true,
    "n8nEnabled": true
  },
  "timestamp": "2025-12-11T03:20:00.000Z"
}
```

**Verificar en Chatwoot:**
1. Abre Chatwoot: https://n8n-agencia-chatwoot.3e3qzn.easypanel.host
2. Ve a la bandeja de entrada "API" (ID: 3)
3. Deberías ver:
   - ✅ Un nuevo contacto con nombre "Test User"
   - ✅ Una conversación abierta
   - ✅ El mensaje "Hola, esto es una prueba"

**Verificar en los logs del servidor:**
```
[ChatwootService] Contact created { contactId: 123, identifier: 'test-session-001' }
[ChatwootService] Conversation created { conversationId: 456, contactId: '123' }
[ChatwootService] User message saved to Chatwoot { sessionId: 'test-session-001', conversationId: 456 }
[N8NService] Message sent to n8n for AI processing { sessionId: 'test-session-001', messageId: 'n8n_1234567890' }
```

---

### 4️⃣ Probar Respuesta del Agente IA

**Simular respuesta de n8n:**

```bash
curl -X POST http://localhost:3000/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c" \
  -d '{
    "sessionId": "test-session-001",
    "response": "¡Hola! Soy el agente IA. ¿En qué puedo ayudarte?",
    "metadata": {
      "subAgent": "Agente_Orquestador",
      "processingTime": 1234,
      "timestamp": "2025-12-11T03:20:00.000Z"
    }
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "received": true,
    "sessionId": "test-session-001"
  },
  "timestamp": "2025-12-11T03:20:00.000Z"
}
```

**Verificar en Chatwoot:**
1. Refresca la conversación en Chatwoot
2. Deberías ver:
   - ✅ La respuesta del agente IA: "¡Hola! Soy el agente IA..."
   - ✅ El mensaje marcado como "outgoing"
   - ✅ Metadata adicional (source: 'ai_agent', sub_agent: 'Agente_Orquestador')

**Verificar en los logs:**
```
[SocketService] Agent response emitted { sessionId: 'test-session-001', messageLength: 45 }
[SocketService] Agent response saved to Chatwoot { sessionId: 'test-session-001', conversationId: 456 }
```

---

### 5️⃣ Probar Respuesta Manual de Agente

**Desde Chatwoot:**
1. Abre la conversación de prueba
2. Escribe un mensaje como agente: "Hola, soy un agente humano"
3. Envía el mensaje

**Verificar en los logs del backend:**
```
[ChatRoutes] Chatwoot webhook received { event: 'message_created', conversationId: 456, messageId: 789 }
[ChatRoutes] Manual agent response detected { messageId: 789, conversationId: 456, senderType: 'user' }
[ChatRoutes] Manual agent response forwarded to widget { sessionId: 'test-session-001', conversationId: 456, agentName: 'Tu Nombre' }
```

**Verificar metadata:**
- El mensaje debería tener `source: 'manual_agent'`
- Debería incluir `agentName` y `agentId`

---

### 6️⃣ Probar con el Widget (Opcional)

Si tienes el widget corriendo:

1. Abre el widget en tu navegador
2. Envía un mensaje
3. Verifica que:
   - ✅ El mensaje se guarda en Chatwoot
   - ✅ La respuesta IA llega al widget
   - ✅ Las respuestas manuales llegan al widget

---

## 🔍 Verificaciones Importantes

### Verificar Variables de Entorno

```bash
cd chat-api
cat .env | grep CHATWOOT
```

Deberías ver:
```
CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host
CHATWOOT_API_KEY=MQ7eSFCmnrprSQk9ZXFR9kJ3
CHATWOOT_ACCOUNT_ID=2
CHATWOOT_INBOX_ID=3
```

### Verificar Webhook en Chatwoot

1. Ve a Chatwoot → Settings → Integrations → Webhooks
2. Verifica que exista un webhook con:
   - **URL**: `http://localhost:3000/api/webhook/chatwoot` (para pruebas locales)
   - **Eventos suscritos**:
     - ✅ `message_created`
     - ✅ `conversation_status_changed`

**⚠️ IMPORTANTE para pruebas locales:**
- El webhook de Chatwoot NO podrá llegar a `localhost` desde el servidor de Chatwoot
- Para probar webhooks localmente, necesitas:
  - **Opción 1**: Usar ngrok o similar para exponer tu localhost
  - **Opción 2**: Probar solo el flujo de salida (widget → backend → Chatwoot)
  - **Opción 3**: Desplegar en el servidor y probar ahí

---

## 🐛 Troubleshooting

### Error: "ChatwootService not enabled"

**Causa**: Variables de entorno faltantes o incorrectas

**Solución**:
```bash
# Verificar .env
cat chat-api/.env | grep CHATWOOT

# Si faltan, agregarlas:
echo "CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host" >> chat-api/.env
echo "CHATWOOT_API_KEY=MQ7eSFCmnrprSQk9ZXFR9kJ3" >> chat-api/.env
echo "CHATWOOT_ACCOUNT_ID=2" >> chat-api/.env
echo "CHATWOOT_INBOX_ID=3" >> chat-api/.env

# Reiniciar servidor
```

### Error: "Contact not found by identifier"

**Causa**: Normal en la primera ejecución, el contacto se creará automáticamente

**Solución**: No hacer nada, el sistema creará el contacto

### Error: "No open conversation found"

**Causa**: Normal, se creará una nueva conversación

**Solución**: No hacer nada, el sistema creará la conversación

### Error: "Error saving message to Chatwoot"

**Causa posible**:
- API Key inválido
- Account ID o Inbox ID incorrecto
- Chatwoot no accesible

**Solución**:
```bash
# Verificar conectividad
curl -H "api_access_token: MQ7eSFCmnrprSQk9ZXFR9kJ3" \
  https://n8n-agencia-chatwoot.3e3qzn.easypanel.host/api/v1/accounts/2

# Debería retornar información de la cuenta
```

### Error: "Session not found for n8n response"

**Causa**: La sesión expiró en Redis o no se creó correctamente

**Solución**:
1. Verificar que Redis esté conectado
2. Enviar primero un mensaje del usuario (crea la sesión)
3. Luego enviar la respuesta de n8n

---

## 📊 Checklist de Pruebas

- [ ] Backend inicia sin errores
- [ ] Health check retorna `status: "ok"`
- [ ] Chatwoot aparece como `"connected"` en health check
- [ ] Se crea contacto en Chatwoot al enviar mensaje
- [ ] Se crea conversación en Chatwoot
- [ ] Mensaje del usuario se guarda en Chatwoot
- [ ] Mensaje se envía a n8n para procesamiento
- [ ] Respuesta de n8n se guarda en Chatwoot
- [ ] Respuesta de n8n llega al widget (si está corriendo)
- [ ] Logs muestran todas las operaciones correctamente

---

## ✅ Siguiente Paso

Una vez que todas las pruebas locales pasen:

**Fase 4**: Desplegar en el servidor Hetzner

Instrucciones en: `CHECKLIST_MIGRACION_CHATWOOT.md` → Fase 4

---

## 📞 Notas

- **GHL sigue funcionando**: El código de GHL se mantiene para rollback
- **n8n sigue funcionando**: La integración con n8n no se modificó
- **Dual storage**: Los mensajes se guardan tanto en Chatwoot como en n8n Postgres
- **Rollback disponible**: Si algo falla, puedes volver al tag `v1.0.0-ghl-n8n`

