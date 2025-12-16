# 📝 Instrucciones Manuales para Actualizar el Workflow de n8n

**Workflow:** `Soporte_pruebas_andres`  
**Fecha:** 11 de Diciembre 2024

---

## ⚠️ IMPORTANTE: Lee esto primero

Estas instrucciones te guiarán paso a paso para actualizar cada campo manualmente en la interfaz de n8n. Sigue el orden indicado.

---

## 🔧 PASO 1: Actualizar "Map GHL to Workflow Variables"

**ID del nodo:** `6b9d8a7b-99ef-451c-bdf7-34cad9f46cbb`

1. **Abre el workflow** en n8n
2. **Haz clic en el nodo "Map GHL to Workflow Variables"**
3. En el panel derecho, busca la sección **"Assignments"** o **"Asignaciones"**
4. **Actualiza los siguientes campos** (uno por uno):

### Campo: `conversation_id`
- **Valor actual:** `={{ $json.body.contactId || $json.body.contact_id }}`
- **Valor nuevo:** `={{ $json.contactId || $json.metadata?.conversationId || '' }}`
- **Cómo hacerlo:** Haz clic en el campo, selecciona todo el texto, pégalo y presiona Enter

### Campo: `message_content`
- **Valor actual:** `={{ $json.body.message || $json.body.messageBody || $json.body.body }}`
- **Valor nuevo:** `={{ $json.message || '' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

### Campo: `contact_name`
- **Valor actual:** `={{ $json.body.contactName || $json.body.contact_name || 'Usuario' }}`
- **Valor nuevo:** `={{ ($json.firstName || '') + ' ' + ($json.lastName || '') || 'Usuario Widget' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

### Campo: `phone`
- **Valor actual:** `={{ $json.body.phone || $json.body.contactPhone || '' }}`
- **Valor nuevo:** `={{ $json.phone || '' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

### Campo: `location_id`
- **Valor actual:** `={{ $json.body.locationId || '' }}`
- **Valor nuevo:** `={{ '' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza con `''` (dos comillas simples)

### Campo: `body`
- **Valor actual:** `={{ $json.body }}`
- **Valor nuevo:** `={{ $json }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza `$json.body` por `$json`

### ⚠️ NUEVO CAMPO: `sessionId`
- **Cómo agregarlo:**
  1. Haz clic en el botón **"+ Add Assignment"** o **"+ Agregar Asignación"**
  2. En **"Name"** o **"Nombre"**: escribe `sessionId`
  3. En **"Type"** o **"Tipo"**: selecciona `String`
  4. En **"Value"** o **"Valor"**: pega: `={{ $json.sessionId || '' }}`
  5. Haz clic en **"Done"** o **"Listo"**

### ⚠️ NUEVO CAMPO: `contactId` (alias)
- **Cómo agregarlo:**
  1. Haz clic en el botón **"+ Add Assignment"** o **"+ Agregar Asignación"**
  2. En **"Name"** o **"Nombre"**: escribe `contactId`
  3. En **"Type"** o **"Tipo"**: selecciona `String`
  4. En **"Value"** o **"Valor"**: pega: `={{ $json.contactId || $json.metadata?.conversationId || '' }}`
  5. Haz clic en **"Done"** o **"Listo"**

**✅ Guarda los cambios** haciendo clic en el botón de guardar del nodo o presionando Ctrl+S

---

## 🔧 PASO 2: Actualizar "Extract GHL Data"

**ID del nodo:** `52498c38-faca-47ff-8bdb-10d6349d7613`

1. **Haz clic en el nodo "Extract GHL Data"**
2. En la sección **"Assignments"**

### Campo: `phone_number`
- **Valor actual:** `={{ $json.phone || '' }}`
- **Valor nuevo:** `={{ $json.phone || $('Map GHL to Workflow Variables').item.json.sessionId || '' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

### Campo: `sender_name`
- **Valor actual:** `={{ $json.contact_name || 'Usuario' }}`
- **Valor nuevo:** `={{ $json.contact_name || ($json.firstName + ' ' + $json.lastName) || 'Usuario Widget' }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

**✅ Guarda los cambios**

---

## 🔧 PASO 3: Actualizar "Postgres Chat Memory2"

**ID del nodo:** `05793497-7035-4e80-a243-5ec1cb2b1c81`

1. **Haz clic en el nodo "Postgres Chat Memory2"**
2. Busca el campo **"Session Key"** o **"Clave de Sesión"**

### Campo: `sessionKey`
- **Valor actual:** `={{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `={{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

**✅ Guarda los cambios**

---

## 🔧 PASO 4: Actualizar "HTTP Request" (Respuesta al Backend)

**ID del nodo:** `aff8aa99-a9fd-4ea0-b18f-c4b1e29e8d17`

1. **Haz clic en el nodo "HTTP Request"**
2. Verifica que la **URL** sea: `http://95.216.196.74:5678/api/webhook/n8n-response`
3. Busca la sección **"Body"** o **"Cuerpo"**
4. Selecciona **"JSON"**
5. **Reemplaza TODO el contenido** del campo JSON con:

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

**⚠️ IMPORTANTE:** Después de pegar el JSON, n8n puede convertir automáticamente las expresiones `{{ }}`. Verifica que cada expresión tenga el formato correcto.

**✅ Guarda los cambios**

---

## 🔧 PASO 5: Actualizar "Get message buffer" (Redis)

**ID del nodo:** `c741919e-968e-47f9-b9fe-c1631f0d6e5c`

1. **Haz clic en el nodo "Get message buffer"**
2. Busca el campo **"Key"** o **"Clave"**

### Campo: `key`
- **Valor actual:** `={{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `={{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

**✅ Guarda los cambios**

---

## 🔧 PASO 6: Actualizar "Delete message buffer" (Redis)

**ID del nodo:** `3e876e90-500d-4a41-9d8f-1cc08c403411`

1. **Haz clic en el nodo "Delete message buffer"**
2. Busca el campo **"Key"** o **"Clave"**

### Campo: `key`
- **Valor actual:** `={{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `={{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

**✅ Guarda los cambios**

---

## 🔧 PASO 7: Actualizar "redis" (Push to buffer)

**ID del nodo:** `d97f0226-a170-47d6-8362-dbd75d1a8d5f`

1. **Haz clic en el nodo "redis"**
2. Busca el campo **"List"** o **"Lista"**

### Campo: `list`
- **Valor actual:** `={{ $('Extract GHL Data').item.json.phone_number }}`
- **Valor nuevo:** `={{ $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number }}`
- **Cómo hacerlo:** Haz clic en el campo, reemplaza el contenido

**✅ Guarda los cambios**

---

## ✅ PASO 8: Guardar el Workflow y Activar

1. **Haz clic en el botón "Save"** (arriba derecha) o presiona **Ctrl+S**
2. **Verifica que no haya errores** en los nodos (deberían aparecer en rojo si hay problemas)
3. **Activa el workflow** usando el toggle en la esquina superior derecha (debe estar en verde)

---

## 🧪 PASO 9: Probar el Workflow

Después de realizar todos los cambios:

1. **Envía un mensaje de prueba** desde el servidor:
   ```bash
   curl -X POST http://localhost:5678/api/chat/send \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-manual-001",
       "message": "Hola, esto es una prueba manual",
       "metadata": {
         "firstName": "Test",
         "lastName": "Manual"
       }
     }'
   ```

2. **Verifica en n8n:**
   - Abre el workflow
   - Ve a **"Executions"** o **"Ejecuciones"**
   - Busca la ejecución más reciente
   - Verifica que:
     - El nodo "Map GHL to Workflow Variables" tenga valores correctos
     - El nodo "Extract GHL Data" tenga `phone_number` o `sessionId`
     - El nodo "Agente_Orquestador" haya procesado el mensaje
     - El nodo "HTTP Request" haya enviado la respuesta al backend

3. **Verifica en Chatwoot:**
   - Debe aparecer el mensaje del usuario
   - Debe aparecer la respuesta del agente IA

---

## 📋 Checklist Final

- [ ] Nodo "Map GHL to Workflow Variables" actualizado (7 campos + 2 nuevos)
- [ ] Nodo "Extract GHL Data" actualizado (2 campos)
- [ ] Nodo "Postgres Chat Memory2" actualizado (sessionKey)
- [ ] Nodo "HTTP Request" actualizado (jsonBody completo)
- [ ] Nodo "Get message buffer" actualizado (key)
- [ ] Nodo "Delete message buffer" actualizado (key)
- [ ] Nodo "redis" actualizado (list)
- [ ] Workflow guardado
- [ ] Workflow activado
- [ ] Prueba exitosa enviada y verificada

---

## 🆘 Si algo sale mal

Si algún campo no acepta el cambio o da error:

1. **Verifica la sintaxis** de las expresiones n8n
2. **Asegúrate de usar comillas simples** en las expresiones dentro de `{{ }}`
3. **Verifica que los nombres de los nodos** en las expresiones coincidan exactamente:
   - `Map GHL to Workflow Variables`
   - `Extract GHL Data`
   - `Agente_Orquestador`
4. **Si persiste el error**, comparte:
   - El nodo que da error
   - El mensaje de error exacto
   - El valor que intentaste poner

---

## 📝 Resumen de Cambios

### Variables que cambiaron de formato:

| Antes (GHL) | Ahora (Backend Directo) |
|------------|------------------------|
| `$json.body.contactId` | `$json.contactId` |
| `$json.body.message` | `$json.message` |
| `$json.body.phone` | `$json.phone` |
| `$json.body.contactName` | `$json.firstName + ' ' + $json.lastName` |
| (no existía) | `$json.sessionId` ⭐ NUEVO |
| (no existía) | `$json.metadata.conversationId` ⭐ NUEVO |

### Identificador principal:
- **Antes:** `phone_number` (teléfono del contacto)
- **Ahora:** `sessionId` (identificador único de sesión del widget)

---

¡Buena suerte con la actualización! 🚀

