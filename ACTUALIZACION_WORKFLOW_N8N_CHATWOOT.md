# 🔧 Actualización del Workflow n8n para Chatwoot

**Fecha:** 11 de Diciembre 2024  
**Workflow:** `Soporte_pruebas_andres`  
**Objetivo:** Adaptar el workflow para recibir mensajes directamente del backend (sin GHL)

---

## 📊 Comparación de Formatos

### ❌ Formato Antiguo (GHL)
```json
{
  "body": {
    "contactId": "awItGhEa8B1E1RCUeJRA",
    "message": "Hola, necesito ayuda",
    "phone": "+573053792179",
    "contactName": "Usuario Widget"
  }
}
```

### ✅ Formato Nuevo (Backend Directo)
```json
{
  "sessionId": "prod-test-001",
  "message": "Hola, necesito ayuda",
  "contactId": "6",
  "phone": "+573053792179",
  "firstName": "Test",
  "lastName": "Usuario",
  "metadata": {
    "conversationId": "14"
  },
  "source": "widget"
}
```

---

## 🔄 Cambios Necesarios en el Workflow

### 1. **Nodo: "Map GHL to Workflow Variables"** (ID: `6b9d8a7b-99ef-451c-bdf7-34cad9f46cbb`)

**Cambios necesarios:**

| Campo Actual | Valor Actual | Valor Nuevo |
|-------------|--------------|-------------|
| `conversation_id` | `{{ $json.body.contactId \|\| $json.body.contact_id }}` | `{{ $json.contactId \|\| $json.metadata?.conversationId \|\| '' }}` |
| `message_content` | `{{ $json.body.message \|\| $json.body.messageBody }}` | `{{ $json.message \|\| '' }}` |
| `contact_name` | `{{ $json.body.contactName \|\| 'Usuario' }}` | `{{ ($json.firstName || '') + ' ' + ($json.lastName || '') \|\| 'Usuario Widget' }}` |
| `phone` | `{{ $json.body.phone \|\| $json.body.contactPhone }}` | `{{ $json.phone \|\| '' }}` |
| `location_id` | `{{ $json.body.locationId }}` | `{{ '' }}` (ya no se usa) |
| `body` | `{{ $json.body }}` | `{{ $json }}` (preservar todo el objeto) |

**⚠️ IMPORTANTE:** Agregar un nuevo campo:
- **Nombre:** `sessionId`
- **Tipo:** `string`
- **Valor:** `{{ $json.sessionId || '' }}`

---

### 2. **Nodo: "Extract GHL Data"** (ID: `52498c38-faca-47ff-8bdb-10d6349d7613`)

**Cambios necesarios:**

| Campo Actual | Valor Actual | Valor Nuevo |
|-------------|--------------|-------------|
| `phone_number` | `{{ $json.phone \|\| '' }}` | `{{ $json.phone \|\| $('Map GHL to Workflow Variables').item.json.sessionId \|\| '' }}` |
| `sender_name` | `{{ $json.contact_name \|\| 'Usuario' }}` | `{{ $json.contact_name \|\| ($json.firstName + ' ' + $json.lastName) \|\| 'Usuario Widget' }}` |
| `content` | `{{ $json.message_content \|\| '' }}` | `{{ $json.message_content \|\| '' }}` (sin cambios) |

---

### 3. **Nodo: "Postgres Chat Memory2"** (ID: `05793497-7035-4e80-a243-5ec1cb2b1c81`)

**Cambio crítico:**

| Campo Actual | Valor Actual | Valor Nuevo |
|-------------|--------------|-------------|
| `sessionKey` | `{{ $('Extract GHL Data').item.json.phone_number }}` | `{{ $('Map GHL to Workflow Variables').item.json.sessionId \|\| $('Extract GHL Data').item.json.phone_number }}` |

**⚠️ IMPORTANTE:** Ahora usamos `sessionId` como identificador principal en lugar de `phone_number`, ya que Chatwoot permite contactos sin teléfono.

---

### 4. **Nodo: "HTTP Request"** (Respuesta al Backend) (ID: `aff8aa99-a9fd-4ea0-b18f-c4b1e29e8d17`)

**Cambios necesarios en el Body JSON:**

| Campo Actual | Valor Actual | Valor Nuevo |
|-------------|--------------|-------------|
| `sessionId` | `{{ $('Map GHL to Workflow Variables').item.json.body.customFields?.widget_session_id \|\| ... }}` | `{{ $('Map GHL to Workflow Variables').item.json.sessionId \|\| $('Extract GHL Data').item.json.phone_number }}` |
| `metadata.contactId` | `{{ $('Map GHL to Workflow Variables').item.json.conversation_id }}` | `{{ $('Map GHL to Workflow Variables').item.json.contactId \|\| $('Map GHL to Workflow Variables').item.json.conversation_id }}` |
| `metadata.phone` | `{{ $('Extract GHL Data').item.json.phone_number }}` | `{{ $('Map GHL to Workflow Variables').item.json.phone \|\| $('Extract GHL Data').item.json.phone_number }}` |

**Body JSON completo actualizado:**
```json
{
  "sessionId": "{{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}",
  "response": "{{ $('Agente_Orquestador').item.json.output }}",
  "metadata": {
    "contactId": "{{ $('Map GHL to Workflow Variables').item.json.contactId || $('Map GHL to Workflow Variables').item.json.conversation_id }}",
    "conversationId": "{{ $('Map GHL to Workflow Variables').item.json.metadata?.conversationId || '' }}",
    "phone": "{{ $('Map GHL to Workflow Variables').item.json.phone || $('Extract GHL Data').item.json.phone_number }}",
    "timestamp": "{{ $now.toISO() }}",
    "subAgent": "{{ $('Agente_Orquestador').item.json.sub_agente || null }}"
  }
}
```

**⚠️ IMPORTANTE:** Verificar que la URL del nodo HTTP Request sea:
- **URL:** `http://95.216.196.74:5678/api/webhook/n8n-response`
- **Header:** `X-Webhook-Secret: be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c`

---

### 5. **Nodo: "Filter for User Messages"** (ID: `0de4f886-bc72-4247-82f6-7d5406f09dfb`)

**Cambio en la condición:**

La condición actual busca `$json.body.sender.type === 'user'`, pero el nuevo formato no tiene `body`. 

**Actualizar condición a:**
```
{{ $json.source === 'widget' || $json.body?.sender?.type === 'user' || true }}
```

O simplemente eliminar este filtro si siempre queremos procesar mensajes del widget.

---

### 6. **Nodos que usan `phone_number` para Redis/Postgres**

Los siguientes nodos usan `phone_number` como clave. Debes actualizar para usar `sessionId` como fallback:

#### Nodo: "redis" (ID: `d97f0226-a170-47d6-8362-dbd75d1a8d5f`)
- **Campo:** `list`
- **Valor actual:** `{{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `{{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`

#### Nodo: "Get message buffer" (ID: `c741919e-968e-47f9-b9fe-c1631f0d6e5c`)
- **Campo:** `key`
- **Valor actual:** `{{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `{{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`

#### Nodo: "Delete message buffer" (ID: `3e876e90-500d-4a41-9d8f-1cc08c403411`)
- **Campo:** `key`
- **Valor actual:** `{{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `{{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`

---

## ✅ Checklist de Actualización

- [ ] Actualizar nodo "Map GHL to Workflow Variables" con las nuevas expresiones
- [ ] Agregar campo `sessionId` al nodo "Map GHL to Workflow Variables"
- [ ] Actualizar nodo "Extract GHL Data" para usar `sessionId` como fallback
- [ ] Actualizar nodo "Postgres Chat Memory2" para usar `sessionId` como `sessionKey`
- [ ] Actualizar nodo "HTTP Request" (respuesta) con el nuevo formato de `sessionId`
- [ ] Actualizar nodo "redis" para usar `sessionId` como clave
- [ ] Actualizar nodo "Get message buffer" para usar `sessionId` como clave
- [ ] Actualizar nodo "Delete message buffer" para usar `sessionId` como clave
- [ ] Actualizar nodo "Filter for User Messages" (opcional, si es necesario)
- [ ] Verificar que la URL del nodo "HTTP Request" sea `http://95.216.196.74:5678/api/webhook/n8n-response`
- [ ] Activar el workflow en n8n
- [ ] Probar el flujo completo con un mensaje de prueba

---

## 🧪 Prueba del Flujo

Después de realizar los cambios:

1. **Activa el workflow** en n8n
2. **Envía un mensaje de prueba** desde el backend:
   ```bash
   curl -X POST http://localhost:5678/api/chat/send \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-n8n-001",
       "message": "Hola, necesito ayuda con mi cuenta",
       "metadata": {
         "firstName": "Test",
         "lastName": "Usuario"
       }
     }'
   ```

3. **Verifica en n8n:**
   - Que el webhook se haya recibido
   - Que el nodo "Map GHL to Workflow Variables" tenga los valores correctos
   - Que el "Agente_Orquestador" procese el mensaje
   - Que el nodo "HTTP Request" envíe la respuesta al backend

4. **Verifica en Chatwoot:**
   - Que el mensaje del usuario aparezca
   - Que la respuesta del agente IA aparezca

---

## 📝 Notas Importantes

1. **SessionId es el identificador principal:** Ahora usamos `sessionId` en lugar de `phone_number` para identificar sesiones, ya que Chatwoot permite contactos sin teléfono.

2. **Compatibilidad hacia atrás:** Las expresiones incluyen fallbacks (`|| phone_number`) para mantener compatibilidad si algún mensaje aún viene con formato antiguo.

3. **Webhook de entrada:** El workflow recibe mensajes en el webhook `gohighlevel-webhook` pero ahora el formato es diferente. El backend envía directamente a esta URL.

4. **Redis/Postgres:** Los nodos de memoria usan `sessionId` como clave principal, con `phone_number` como fallback.

---

## 🔗 Referencias

- **Backend Code:** `chat-api/src/services/n8nService.ts`
- **Webhook Endpoint:** `http://95.216.196.74:5678/api/webhook/n8n-response`
- **Workflow ID:** `obrK2Xs9esjYHSrO`

