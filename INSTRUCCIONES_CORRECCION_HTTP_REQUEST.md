# Corrección del Nodo HTTP Request - Error "JSON parameter needs to be valid JSON"

## Problema
El error ocurre porque el campo `response` contiene saltos de línea (`\n`) y caracteres especiales que rompen la sintaxis JSON cuando se construye como texto plano.

## Solución

### Paso 1: Abrir el nodo "HTTP Request"
En el workflow de n8n, busca el nodo "HTTP Request" que envía la respuesta al backend.

### Paso 2: Configurar el campo JSON Body

**IMPORTANTE:** En lugar de usar el campo "JSON" como texto plano, usa una **expresión** que construya el objeto completo.

1. En la sección **"Send Body"**, asegúrate de tener seleccionado **"JSON"**
2. En el campo **"JSON"**, borra todo el contenido actual
3. Pega esta expresión completa:

```javascript
={{ JSON.stringify({
  "sessionId": $('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number || '',
  "response": $('Agente_Orquestador').item.json.output || '',
  "metadata": {
    "contactId": $('Map GHL to Workflow Variables').item.json.contactId || $('Map GHL to Workflow Variables').item.json.conversation_id || '',
    "conversationId": $('Map GHL to Workflow Variables').item.json.metadata?.conversationId || '',
    "phone": $('Map GHL to Workflow Variables').item.json.phone || $('Extract GHL Data').item.json.phone_number || '',
    "timestamp": $now.toISO(),
    "subAgent": $('Agente_Orquestador').item.json.sub_agente || null
  }
}) }}
```

### Notas importantes:
- ✅ Usa `JSON.stringify()` para escapar correctamente todos los caracteres especiales
- ✅ No uses comillas dentro de las expresiones `{{ }}` cuando usas `JSON.stringify()`
- ✅ Los valores `null` se mantienen como `null` en el JSON final
- ✅ Los valores vacíos usan `|| ''` como fallback

### Paso 3: Verificar la configuración completa del nodo

Asegúrate de que el nodo tenga esta configuración:

- **Method:** `POST`
- **URL:** `http://95.216.196.74:5678/api/webhook/n8n-response`
- **Authentication:** `httpHeaderAuth` (con las credenciales configuradas)
- **Send Body:** ✅ Activado
- **Specify Body:** `JSON`
- **JSON:** (la expresión de arriba)

### Paso 4: Probar

1. Guarda el workflow
2. Activa el workflow si no está activo
3. Ejecuta una prueba desde el widget o con curl
4. Verifica en las ejecuciones de n8n que el nodo "HTTP Request" no dé error
5. Verifica en el backend que la respuesta llegue correctamente

## Alternativa: Si JSON.stringify() no funciona

Si por alguna razón `JSON.stringify()` no funciona en tu versión de n8n, usa esta expresión alternativa que construye el JSON manualmente escapando los caracteres:

```javascript
={{ '{"sessionId":"' + ($('Map GHL to Workflow Variables').item.json.sessionId || $('Extract GHL Data').item.json.phone_number || '') + '","response":"' + ($('Agente_Orquestador').item.json.output || '').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '","metadata":{"contactId":"' + ($('Map GHL to Workflow Variables').item.json.contactId || $('Map GHL to Workflow Variables').item.json.conversation_id || '') + '","conversationId":"' + ($('Map GHL to Workflow Variables').item.json.metadata?.conversationId || '') + '","phone":"' + ($('Map GHL to Workflow Variables').item.json.phone || $('Extract GHL Data').item.json.phone_number || '') + '","timestamp":"' + $now.toISO() + '","subAgent":' + ($('Agente_Orquestador').item.json.sub_agente ? '"' + $('Agente_Orquestador').item.json.sub_agente + '"' : 'null') + '}}' }}
```

**NOTA:** Esta alternativa es más compleja y propensa a errores, pero es compatible con versiones más antiguas de n8n.

## Formato esperado del JSON final

El backend espera recibir un JSON con este formato:

```json
{
  "sessionId": "abc123",
  "response": "¡Hola! Entiendo que estás teniendo un problema...",
  "metadata": {
    "contactId": "13",
    "conversationId": "23",
    "phone": "+1234567890",
    "timestamp": "2025-12-11T20:49:21.888-05:00",
    "subAgent": "Sub_Agente_Errores_Meta"
  }
}
```

## Troubleshooting

### Si sigue dando error:
1. Verifica que los nombres de los nodos sean exactos:
   - `Map GHL to Workflow Variables` (con espacios y mayúsculas)
   - `Extract GHL Data`
   - `Agente_Orquestador`

2. Prueba la expresión en el "Expression Editor" de n8n antes de guardar

3. Verifica que todos los campos requeridos tengan valores:
   - `sessionId` es obligatorio
   - `response` es obligatorio

### Si el backend no recibe los datos:
1. Verifica los logs del backend: `pm2 logs saleads-chat-api`
2. Verifica que la URL del webhook sea correcta
3. Verifica que las credenciales de autenticación sean correctas

