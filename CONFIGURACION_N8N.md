# 🔧 Configuración de n8n para SaleAds Chat Widget

Guía paso a paso para conectar n8n con el backend del chat widget.

---

## 📋 Prerequisitos

- ✅ n8n ya corriendo en tu servidor Hetzner
- ✅ Backend del chat desplegado y funcionando (`http://95.216.196.74:8080`)
- ✅ Widget frontend funcionando
- ✅ Variables de entorno del backend configuradas

---

## 🎯 Flujo de Mensajes

```
Usuario escribe → Widget → Backend → GoHighLevel → n8n → Backend → Widget → Usuario
```

1. **Usuario escribe en el widget**
2. **Backend recibe el mensaje** (vía Socket.io)
3. **Backend envía a GoHighLevel** (crea/actualiza contacto y mensaje)
4. **n8n recibe webhook de GoHighLevel** (configurar en GHL)
5. **n8n procesa el mensaje** (IA, lógica de negocio, etc.)
6. **n8n envía respuesta al backend** (`POST /api/webhook/n8n-response`)
7. **Backend envía respuesta al widget** (vía Socket.io)
8. **Usuario ve la respuesta**

---

## 🔌 Opción 1: Integración con GoHighLevel (Recomendado)

### Paso 1: Configurar Webhook en GoHighLevel

1. Entra a tu cuenta de GoHighLevel
2. Ve a **Settings** → **Integrations** → **Webhooks**
3. Crea un nuevo webhook con:
   - **URL del webhook**: `https://tu-n8n-instance.com/webhook/ghl-chat`
   - **Eventos**: Selecciona "New Chat Message" o "New Conversation"
   - **Método**: `POST`

### Paso 2: Crear Workflow en n8n

#### 2.1 Nodo Webhook (Trigger)

1. Agrega un nodo **Webhook**
2. Configuración:
   - **HTTP Method**: `POST`
   - **Path**: `/webhook/ghl-chat` (o el que configuraste en GHL)
   - **Response Mode**: `Respond to Webhook`
   - **Options** → **Response Code**: `200`
   - **Authentication**: Opcional (según tu configuración)

#### 2.2 Extraer Datos del Webhook

1. Agrega un nodo **Set** o **Code** para extraer:
   ```json
   {
     "sessionId": "{{ $json.sessionId }}",
     "message": "{{ $json.message || $json.text }}",
     "contactId": "{{ $json.contactId }}",
     "phone": "{{ $json.phone }}",
     "email": "{{ $json.email }}"
   }
   ```

#### 2.3 Procesar Mensaje (IA, Lógica, etc.)

Aquí puedes agregar:
- Nodo **OpenAI** / **Anthropic** para respuestas con IA
- Nodos de **Switch** para routing según palabras clave
- Lógica de negocio personalizada
- Integraciones con otras APIs

**Ejemplo con Switch básico:**

```javascript
// Código para determinar respuesta
const message = $input.first().json.message.toLowerCase();

if (message.includes('hola') || message.includes('buenos días')) {
  return { response: '¡Hola! ¿En qué puedo ayudarte hoy?' };
} else if (message.includes('precio') || message.includes('costo')) {
  return { response: 'Te voy a conectar con nuestro equipo de ventas para darte más información sobre precios.' };
} else {
  return { response: 'Gracias por tu mensaje. Nuestro equipo te responderá pronto.' };
}
```

#### 2.4 Enviar Respuesta al Backend

1. Agrega un nodo **HTTP Request**
2. Configuración:
   - **Method**: `POST`
   - **URL**: `http://95.216.196.74:8080/api/webhook/n8n-response`
   - **Authentication**: `Header Auth`
     - **Name**: `X-Webhook-Secret`
     - **Value**: `be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c`
   - **Body Parameters** (JSON):
   ```json
   {
     "sessionId": "{{ $('Set').item.json.sessionId }}",
     "response": "{{ $('Code').item.json.response }}",
     "metadata": {
       "contactId": "{{ $('Set').item.json.contactId }}",
       "processingTime": "{{ $now.diff($('Webhook').item.json.timestamp).toMilliseconds() }}",
       "timestamp": "{{ $now.toISO() }}"
     }
   }
   ```

#### 2.5 Activar el Workflow

1. Guarda el workflow
2. **Activa el workflow** (toggle en la esquina superior derecha)
3. Copia la URL del webhook que n8n genera

---

## 🔌 Opción 2: Webhook Directo desde el Backend

Si prefieres que el backend envíe directamente a n8n (sin pasar por GoHighLevel):

### Paso 1: Modificar el Backend (Opcional)

Necesitarías agregar código en `socketService.ts` para enviar a n8n después de recibir el mensaje del usuario.

### Paso 2: Crear Webhook en n8n

1. Crea un workflow con un nodo **Webhook**
2. Configuración:
   - **Path**: `/webhook/chat-message`
   - **Method**: `POST`

### Paso 3: Procesar y Responder

Sigue los pasos 2.3-2.5 de la Opción 1.

---

## 🔐 Variables de Entorno en n8n

Para mayor seguridad, guarda el `WEBHOOK_SECRET` como variable de entorno en n8n:

1. En n8n, ve a **Settings** → **Variables**
2. Agrega:
   ```
   WEBHOOK_SECRET=be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c
   ```
3. En el nodo HTTP Request, usa:
   ```
   {{ $env.WEBHOOK_SECRET }}
   ```

---

## ✅ Verificación y Testing

### 1. Test del Webhook de n8n

```bash
curl -X POST https://tu-n8n-instance.com/webhook/ghl-chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "message": "Hola, esto es una prueba",
    "contactId": "contact_123"
  }'
```

### 2. Test del Endpoint del Backend

```bash
curl -X POST http://95.216.196.74:8080/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c" \
  -d '{
    "sessionId": "session_1765263161982__kVWxeyVx2",
    "response": "Esta es una respuesta de prueba desde n8n",
    "metadata": {
      "timestamp": "2025-01-09T06:00:00.000Z"
    }
  }'
```

### 3. Test Completo desde el Widget

1. Abre la página de prueba: `http://95.216.196.74:8081/test.html`
2. Escribe un mensaje en el widget
3. Verifica en los logs de n8n que el webhook se recibió
4. Verifica en los logs del backend que la respuesta llegó
5. Verifica que el mensaje apareció en el widget

---

## 📊 Monitoreo

### Logs del Backend

```bash
pm2 logs saleads-chat-api --lines 50
```

Busca:
- `[ChatRoutes] n8n response received` - Respuesta recibida de n8n
- `[SocketService] Agent response emitted` - Respuesta enviada al widget

### Logs de n8n

- Ve a **Executions** en n8n para ver el historial de ejecuciones
- Revisa los logs de cada nodo para debugging

---

## 🐛 Troubleshooting

### Error: "Session not found"

**Causa**: El `sessionId` no existe en Redis.

**Solución**: 
- Verifica que el widget está generando sesiones correctamente
- Revisa los logs del backend para ver los `sessionId` creados
- Asegúrate de usar el mismo `sessionId` en la respuesta de n8n

### Error: "Webhook signature invalid"

**Causa**: El header `X-Webhook-Secret` no coincide.

**Solución**:
- Verifica que el `WEBHOOK_SECRET` en el `.env` del backend es el mismo que usas en n8n
- Verifica que el header está configurado correctamente en el nodo HTTP Request

### n8n no recibe webhooks

**Causa**: Firewall o configuración de red.

**Solución**:
- Verifica que el puerto de n8n está abierto en el firewall
- Si n8n está detrás de Traefik/Nginx, verifica la configuración del reverse proxy
- Verifica que el workflow está activado en n8n

### El mensaje no aparece en el widget

**Causa**: Error en la conexión Socket.io o formato incorrecto.

**Solución**:
- Verifica los logs del backend para errores de Socket.io
- Verifica que el formato del JSON en n8n es correcto
- Verifica que el `sessionId` en la respuesta coincide con la sesión activa

---

## 📝 Formato del Webhook desde n8n

El backend espera este formato:

```json
{
  "sessionId": "session_1234567890_abc123",
  "response": "Tu respuesta aquí",
  "metadata": {
    "contactId": "contact_abc",
    "subAgent": "soporte_tecnico",
    "processingTime": 1500,
    "timestamp": "2025-01-09T06:00:00.000Z"
  }
}
```

**Campos requeridos:**
- `sessionId`: ID de la sesión del widget
- `response`: Texto de la respuesta al usuario

**Campos opcionales:**
- `metadata`: Objeto con información adicional

---

## 🎯 Ejemplo Completo de Workflow

### Workflow Básico:

```
Webhook (GHL) 
  → Set (Extraer datos)
  → Code (Procesar mensaje / IA)
  → HTTP Request (Enviar al backend)
  → Respond to Webhook (200 OK)
```

### Workflow Avanzado:

```
Webhook (GHL)
  → Set (Extraer datos)
  → IF (¿Es pregunta de soporte?)
    → Sí: OpenAI (Respuesta técnica)
    → No: IF (¿Es pregunta de ventas?)
      → Sí: Responder con información de productos
      → No: Responder genérico
  → HTTP Request (Enviar al backend)
  → Respond to Webhook
```

---

## 🚀 Siguiente Paso

Una vez configurado n8n:

1. **Prueba el flujo completo** desde el widget
2. **Configura respuestas más inteligentes** con IA
3. **Añade integraciones adicionales** (CRM, bases de datos, etc.)
4. **Monitorea el rendimiento** y ajusta según sea necesario

---

**¿Preguntas?** Revisa los logs o contacta soporte.

**Versión:** 1.0.0 | **Última actualización:** 2025-01-09

