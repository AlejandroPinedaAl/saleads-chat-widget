# 🔧 Configuración del Webhook de Respuesta de n8n

## ❌ **PROBLEMA DETECTADO**

Las respuestas del agente IA **NO están llegando al widget** porque n8n no está enviando la respuesta de vuelta al backend.

### **Síntomas:**
- ✅ Los mensajes llegan de Widget → Backend → n8n
- ✅ n8n procesa correctamente (ejecuciones exitosas)
- ✅ Las respuestas llegan a Chatwoot
- ❌ **Las respuestas NO llegan al Widget**

### **Causa:**
n8n no tiene configurado el nodo HTTP Request para enviar la respuesta al backend.

---

## ✅ **SOLUCIÓN: Agregar nodo HTTP Request al final del workflow de n8n**

### **Paso 1: Abrir el Workflow en n8n**

1. Ve a tu workflow: `Soporte_pruebas_alejo1.1`
2. Busca el nodo final donde se genera la respuesta del agente IA
3. Después de ese nodo, agrega un nuevo nodo: **HTTP Request**

---

### **Paso 2: Configurar el nodo HTTP Request**

#### **Configuración básica:**

| Campo | Valor |
|-------|-------|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/webhook/n8n-response` |

**IMPORTANTE:** Si tu backend está en otro servidor, usa la URL completa:
- Ejemplo Hetzner: `http://95.216.196.74:3000/api/webhook/n8n-response`
- Ejemplo Railway: `https://tu-api.railway.app/api/webhook/n8n-response`

#### **Authentication:**
- **Type**: `Header Auth`
- **Name**: `X-Webhook-Secret`
- **Value**: `{{ $env.WEBHOOK_SECRET }}`

#### **Body (JSON):**

```json
{
  "sessionId": "{{ $('Webhook').item.json.body.sessionId }}",
  "response": "{{ $('Agente_Orquestador').item.json.output }}",
  "metadata": {
    "subAgent": "{{ $('Agente_Orquestador').item.json.sub_agente }}",
    "processingTime": "{{ $('Agente_Orquestador').item.json.tiempo_respuesta || 0 }}",
    "timestamp": "{{ $now.toISO() }}",
    "conversationId": "{{ $('Webhook').item.json.body.metadata?.conversationId || null }}"
  }
}
```

**⚠️ IMPORTANTE:** Ajusta los nombres de los nodos según tu workflow:
- `$('Webhook')` → Nodo que recibe el mensaje inicial
- `$('Agente_Orquestador')` → Nodo que genera la respuesta IA

---

### **Paso 3: Configurar la Variable de Entorno**

En n8n, agrega la variable de entorno (si no existe):

```bash
WEBHOOK_SECRET=tu_webhook_secret_del_backend
```

**DEBE SER IDÉNTICO** al valor en el backend (archivo `.env`).

Para verificar el valor en el backend:
```powershell
cd "C:\Developer\Widget soporte\chat-api"
# Abre el archivo .env y busca WEBHOOK_SECRET
```

---

### **Paso 4: Orden de los nodos en n8n**

El flujo correcto debe ser:

```
1. Webhook (recibe mensaje del backend)
   ↓
2. Procesar mensaje / Extraer datos
   ↓
3. Agente IA (OpenAI, LangChain, etc.)
   ↓
4. Formatear respuesta
   ↓
5. HTTP Request → Backend (/api/webhook/n8n-response)  ← ESTE ES NUEVO
   ↓
6. (Opcional) Otros nodos si necesitas
```

---

## 🧪 **Verificación**

### **1. Guardar y Activar el Workflow**

- Guarda los cambios en n8n
- Asegúrate que el workflow esté **ACTIVO** (toggle verde)

### **2. Enviar un mensaje de prueba desde el widget**

### **3. Verificar en los logs del backend**

Deberías ver estos logs en orden:

```
✅ [SocketService] User message received
✅ [ChatwootService] Contact created/found
✅ [ChatwootService] Message sent (incoming)
✅ [N8NService] Message sent successfully
✅ [ChatRoutes] n8n response received  ← ESTE DEBE APARECER
✅ [SocketService] Agent response emitted
✅ [ChatwootService] Agent response saved to Chatwoot
```

### **4. Verificar en el widget**

- La respuesta del agente debe aparecer en el chat
- Debe estar del lado izquierdo (burbuja gris)
- Con el avatar del agente

---

## 📋 **Ejemplo completo del Body del HTTP Request**

Si tu workflow tiene esta estructura:

```
Webhook → Extract Data → OpenAI Agent → HTTP Response to Backend
```

El body sería:

```json
{
  "sessionId": "{{ $json.sessionId }}",
  "response": "{{ $('OpenAI Agent').item.json.message }}",
  "metadata": {
    "subAgent": "openai",
    "processingTime": 2000,
    "timestamp": "{{ $now.toISO() }}",
    "conversationId": "{{ $json.conversationId }}"
  }
}
```

---

## 🔍 **Troubleshooting**

### **Error: "Webhook signature invalid"**

**Causa:** El `WEBHOOK_SECRET` es diferente en backend y n8n.

**Solución:**
```bash
# Backend (.env)
WEBHOOK_SECRET=abc123...

# n8n (variables de entorno)
WEBHOOK_SECRET=abc123...  # DEBE SER IDÉNTICO
```

### **Error: "Session not found"**

**Causa:** El `sessionId` no se está pasando correctamente.

**Solución:** Verifica que el webhook inicial de n8n reciba el `sessionId`:
```json
// n8n debe recibir esto del backend:
{
  "sessionId": "session_...",
  "message": "...",
  "metadata": { ... }
}
```

### **No aparece el log "[ChatRoutes] n8n response received"**

**Causa:** n8n no está llamando al endpoint del backend.

**Solución:**
1. Verifica la URL del HTTP Request en n8n
2. Asegúrate que el backend esté corriendo
3. Prueba la URL manualmente:

```powershell
curl -X POST http://localhost:3000/api/webhook/n8n-response `
  -H "Content-Type: application/json" `
  -H "X-Webhook-Secret: tu_secret" `
  -d '{
    "sessionId": "session_test",
    "response": "Esta es una prueba",
    "metadata": {}
  }'
```

---

## 📊 **Flujo completo (correcto)**

```
┌─────────────────────────────────────────────────────────────┐
│                         WIDGET                               │
│  Usuario escribe: "Hola, necesito ayuda"                    │
└─────────────────┬───────────────────────────────────────────┘
                  │ Socket.io
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND                                │
│  1. Recibe mensaje del usuario                              │
│  2. Guarda en Chatwoot (incoming message)                   │
│  3. Envía a n8n para procesamiento IA                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP POST
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                          N8N                                 │
│  1. Recibe mensaje en Webhook                               │
│  2. Procesa con Agente IA                                   │
│  3. Genera respuesta: "¡Hola! ¿En qué puedo ayudarte?"     │
│  4. HTTP Request → Backend (/api/webhook/n8n-response)      │ ← NUEVO
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP POST
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND                                │
│  1. Recibe respuesta de n8n                                 │
│  2. Emite vía Socket.io al Widget                           │
│  3. Guarda en Chatwoot (outgoing message)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Socket.io
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                         WIDGET                               │
│  Muestra respuesta: "¡Hola! ¿En qué puedo ayudarte?"       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Checklist Final**

Antes de probar, verifica:

- [ ] Nodo HTTP Request agregado al final del workflow de n8n
- [ ] Method: POST
- [ ] URL correcta (localhost:3000 o IP del servidor)
- [ ] Authentication: Header Auth con X-Webhook-Secret
- [ ] Body JSON configurado con sessionId y response
- [ ] Variable WEBHOOK_SECRET configurada en n8n
- [ ] Variable WEBHOOK_SECRET idéntica en backend y n8n
- [ ] Workflow guardado y ACTIVO
- [ ] Backend corriendo en puerto 3000

---

**¿Necesitas ayuda?** Comparte:
1. Screenshot del nodo HTTP Request en n8n
2. Logs del backend después de enviar un mensaje
3. Logs de ejecución de n8n

---

**Desarrollado por SaleAds** | Versión 1.0.0 | Diciembre 2024

