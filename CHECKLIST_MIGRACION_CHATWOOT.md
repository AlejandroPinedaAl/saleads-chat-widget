# ✅ Checklist de Migración: GoHighLevel → Chatwoot

**Versión actual (GHL):** `v1.0.0-ghl-n8n` (commit: `71ec4df`)  
**Versión objetivo:** `v2.0.0-chatwoot-n8n`  
**Fecha de inicio:** Diciembre 2024

---

## 📊 Estado General del Proyecto

### ✅ Completado
- [x] Chatwoot desplegado en Hetzner (Easypanel)
  - [x] Servicio `chatwoot` (app principal)
  - [x] Servicio `chatwoot-db` (PostgreSQL)
  - [x] Servicio `chatwoot-redis` (Redis)
  - [x] Servicio `chatwoot-sidekiq` (procesador de trabajos)

### ⏳ En Progreso
- [ ] Configuración inicial de Chatwoot
- [ ] Desarrollo del código de integración
- [ ] Testing de integración

### 🔴 Pendiente
- [ ] Deployment en producción
- [ ] Testing end-to-end
- [ ] Documentación final

---

## 📋 FASE 1: Configuración de Chatwoot (Manual)

### Objetivo
Configurar Chatwoot para recibir mensajes del widget y poder responder desde el dashboard.

### Tareas

#### 1.1: Acceso y Configuración Inicial
- [ ] Acceder a Chatwoot: `https://n8n-agencia-chatwoot.3e3qzn.easypanel.host`
- [ ] Crear cuenta admin (si no existe)
- [ ] Verificar que todos los servicios estén corriendo en Easypanel
  - [ ] `chatwoot` (estado: running)
  - [ ] `chatwoot-db` (estado: running)
  - [ ] `chatwoot-redis` (estado: running)
  - [ ] `chatwoot-sidekiq` (estado: running)

#### 1.2: Crear Inbox de Tipo API
- [ ] Ir a: **Settings → Inboxes** (o **Ajustes → Entradas**)
- [ ] Click en **"+ Nueva entrada"** o **"Add Inbox"**
- [ ] Seleccionar **"API"** (tarjeta con llaves `{}`)
- [ ] Configurar:
  - [ ] **Nombre del canal:** "SaleADS Widget"
  - [ ] **Descripción:** "Inbox para integración del widget de chat con n8n"
  - [ ] **URL de Webhook:** Dejar vacío por ahora (se configurará después)
- [ ] Click en **"Crear canal de API"**
- [ ] Guardar el **Inbox ID** (número al final de la URL después de crear)

#### 1.3: Obtener Credenciales
- [x] **Account ID:**
  - [x] Ir a cualquier página del dashboard
  - [x] Ver en la URL: `/app/accounts/2/...`
  - [x] Guardar el número: **2**
  
- [x] **API Access Token:**
  - [x] Ir a: **Settings → Profile Settings** (o **Ajustes → Configuración de Perfil**)
  - [x] Buscar sección **"Access Token"** o **"API Access Token"**
  - [x] Token obtenido: **MQ7eSFCmnrprSQk9ZXFR9kJ3**
  - [x] Guardado en lugar seguro

- [x] **Inbox ID:**
  - [x] Ir a: **Settings → Inboxes**
  - [x] Abrir el inbox "SaleADS Widget" que acabas de crear
  - [x] Ver en la URL: `/app/accounts/2/inbox/3`
  - [x] Guardar el número: **3**

#### 1.4: Verificar URL de la API
- [ ] URL Base: `https://n8n-agencia-chatwoot.3e3qzn.easypanel.host`
- [ ] Verificar que la API responde en: `/public/api/v1`
- [ ] (Opcional) Probar con curl:
  ```bash
  curl -H "api_access_token: TU_TOKEN" \
    https://n8n-agencia-chatwoot.3e3qzn.easypanel.host/public/api/v1/accounts/2/contacts
  ```

#### 1.5: Documentar Credenciales
- [x] Credenciales obtenidas y documentadas:
  ```
  CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host
  CHATWOOT_API_KEY=MQ7eSFCmnrprSQk9ZXFR9kJ3
  CHATWOOT_ACCOUNT_ID=2
  CHATWOOT_INBOX_ID=3
  ```

#### 1.6: Configurar Webhook en Chatwoot
- [x] Ir a: **Settings → Integrations → Webhooks**
- [x] Crear nuevo webhook con:
  - [x] URL: `http://95.216.196.74:8080/api/webhook/chatwoot`
  - [x] Eventos seleccionados:
    - [x] `message_created` ✅
    - [x] `message_updated` ✅
    - [x] `conversation_updated` ✅
    - [x] `conversation_status_changed` ✅
    - [x] `conversation_typing_on` ✅
    - [x] `conversation_typing_off` ✅

**Estado de Fase 1:** ✅ **COMPLETADA**

---

## 📋 FASE 2: Preparación del Código (Desarrollo Local)

### Objetivo
Crear la estructura de código para la integración con Chatwoot en el entorno local.

### Tareas

#### 2.1: Git - Crear Rama y Tag
- [x] Verificar que estás en la rama `main` (ya estaba en `feature/chatwoot-migration`)
- [x] Verificar que el tag `v1.0.0-ghl-n8n` existe ✅
- [x] Rama `feature/chatwoot-migration` ya existe ✅
- [x] Push de la rama al remoto ✅

#### 2.2: Instalar Dependencias
- [x] Navegar a `chat-api/` ✅
- [x] Verificar que `node_modules` esté actualizado ✅ (`npm install` completado)
- [x] Verificar que el proyecto compile ✅ (`npm run build` exitoso)

#### 2.3: Actualizar Variables de Entorno Local
- [x] Archivo `.env` creado en `chat-api/` ✅
- [x] Variables de Chatwoot agregadas:
  - [x] `CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host`
  - [x] `CHATWOOT_API_KEY=MQ7eSFCmnrprSQk9ZXFR9kJ3`
  - [x] `CHATWOOT_ACCOUNT_ID=2`
  - [x] `CHATWOOT_INBOX_ID=3`
- [x] Variables del servidor copiadas (GHL, Redis, Security, N8N, Socket.io, Rate Limiting, Logging) ✅
- [x] Variables configuradas para desarrollo local (NODE_ENV=development, PORT=3000) ✅

**Estado de Fase 2:** ✅ **COMPLETADA**

---

## 📋 FASE 3: Desarrollo del Código

### Objetivo
Implementar toda la lógica de integración con Chatwoot en el código.

### Tareas

#### 3.1: Crear `chatwootService.ts`
- [ ] Crear archivo: `chat-api/src/services/chatwootService.ts`
- [ ] Implementar clase `ChatwootService`
- [ ] Implementar método `upsertContact()`
  - [ ] Usar `identifier` (sessionId) para crear contactos sin email/teléfono
  - [ ] Manejar búsqueda de contactos existentes
  - [ ] Actualizar contactos con email/teléfono si se proporcionan después
- [ ] Implementar método `createConversation()`
  - [ ] Guardar `sessionId` en `meta.sessionId` de la conversación
  - [ ] Verificar si existe conversación activa antes de crear nueva
- [ ] Implementar método `sendMessage()`
  - [ ] Enviar mensajes incoming (del usuario)
  - [ ] Enviar mensajes outgoing (del agente/IA)
  - [ ] Incluir metadata (source: 'ai' | 'manual', etc.)
- [ ] Implementar método `updateConversation()`
  - [ ] Actualizar estado de conversación
  - [ ] Actualizar metadata
- [ ] Implementar método `getConversationBySessionId()`
  - [ ] Buscar conversación activa por sessionId
- [ ] Implementar método `healthCheck()`
- [ ] Implementar método `getConversationMessages()` para historial
- [ ] Implementar método `uploadAttachment()` para archivos

#### 3.2: Actualizar `config/index.ts`
- [ ] Agregar configuración de Chatwoot
- [ ] Mantener configuración de n8n (sin cambios)
- [ ] Comentar configuración de GHL (mantener para rollback)

#### 3.3: Actualizar `types/index.ts`
- [ ] Agregar tipos de Chatwoot:
  - [ ] `ChatwootContact`
  - [ ] `ChatwootConversation`
  - [ ] `ChatwootMessage`
  - [ ] `ChatwootAttachment`
- [ ] Actualizar `AppConfig` para incluir `chatwoot`
- [ ] Agregar tipos para Rich Media:
  - [ ] `AttachmentData`
  - [ ] `FileUploadResponse`

#### 3.4: Actualizar `socketService.ts`
- [ ] Reemplazar `ghlService` por `chatwootService`
- [ ] Actualizar `handleUserMessage()`:
  - [ ] Crear/obtener contacto en Chatwoot
  - [ ] Crear/obtener conversación en Chatwoot
  - [ ] Enviar mensaje a Chatwoot (incoming)
  - [ ] Enviar a n8n para procesamiento IA
  - [ ] Lógica de nueva conversación si está resuelta
- [ ] Agregar método `emitConversationStatusUpdate()`
- [ ] Actualizar `emitAgentResponse()`:
  - [ ] Enviar respuesta a Chatwoot (outgoing) con metadata

#### 3.5: Actualizar `chat.routes.ts`
- [ ] Actualizar endpoint `/api/chat/send`:
  - [ ] Usar `chatwootService` en lugar de `ghlService`
  - [ ] Crear/obtener contacto y conversación
  - [ ] Lógica de nueva conversación si está resuelta
- [ ] Actualizar endpoint `/api/webhook/n8n-response`:
  - [ ] Enviar respuesta a Chatwoot con metadata `source: 'ai'`
- [ ] Crear nuevo endpoint `/api/webhook/chatwoot`:
  - [ ] Recibir eventos de Chatwoot
  - [ ] Procesar `message_created` (respuestas manuales)
  - [ ] Procesar `conversation_status_changed` (cambios de estado)
  - [ ] Emitir eventos al widget vía Socket.io

#### 3.6: Crear Endpoint para Rich Media
- [ ] Crear endpoint `/api/chat/upload`:
  - [ ] Aceptar archivos (imágenes, videos, documentos)
  - [ ] Validar tipo y tamaño de archivo
  - [ ] Subir a almacenamiento (S3, local, o Chatwoot)
  - [ ] Guardar en Chatwoot como attachment
  - [ ] Retornar URL/ID del archivo
- [ ] Actualizar `chat.routes.ts` con el nuevo endpoint

#### 3.7: Crear Endpoint para Chat History
- [ ] Crear endpoint `/api/chat/history`:
  - [ ] Listar conversaciones del contacto por sessionId
  - [ ] Retornar lista de conversaciones con metadata
  - [ ] Incluir última mensaje, fecha, estado
- [ ] Crear endpoint `/api/chat/conversation/:conversationId`:
  - [ ] Obtener mensajes de una conversación específica
  - [ ] Retornar mensajes paginados
  - [ ] Incluir attachments si existen

#### 3.8: Actualizar Validators
- [ ] Actualizar `validators.ts`:
  - [ ] Agregar schema para upload de archivos
  - [ ] Agregar schema para chat history requests
  - [ ] Agregar schema para webhook de Chatwoot

#### 3.9: Actualizar Widget (Frontend)
- [ ] Actualizar `chatStore.ts`:
  - [ ] Agregar estado para historial de conversaciones
  - [ ] Agregar estado para attachments
  - [ ] Agregar métodos para cargar historial
- [ ] Actualizar `MessageList.tsx`:
  - [ ] Mostrar attachments (imágenes, videos, documentos)
  - [ ] Agregar preview de imágenes
  - [ ] Agregar descarga de archivos
- [ ] Crear componente `AttachmentPreview.tsx`:
  - [ ] Preview de imágenes
  - [ ] Preview de videos
  - [ ] Preview de documentos con iconos
- [ ] Crear componente `ChatHistory.tsx`:
  - [ ] Lista de conversaciones anteriores
  - [ ] Selector de conversación
  - [ ] Cargar mensajes de conversación seleccionada
- [ ] Actualizar `MessageInput.tsx`:
  - [ ] Botón para adjuntar archivos
  - [ ] Input de tipo file
  - [ ] Preview de archivos seleccionados antes de enviar
  - [ ] Upload de archivos al backend
- [ ] Actualizar tipos en `types/index.ts`:
  - [ ] `Attachment`
  - [ ] `Conversation`
  - [ ] `ChatHistory`

**Estado de Fase 3:** ⏳ Pendiente

---

## 📋 FASE 4: Testing Local

### Objetivo
Verificar que toda la integración funciona correctamente en el entorno local.

### Tareas

#### 4.1: Testing de `chatwootService`
- [ ] Test: Crear contacto sin email/teléfono (usando identifier)
- [ ] Test: Crear contacto con email/teléfono
- [ ] Test: Buscar contacto existente por identifier
- [ ] Test: Actualizar contacto con datos nuevos
- [ ] Test: Crear conversación
- [ ] Test: Obtener conversación por sessionId
- [ ] Test: Enviar mensaje incoming
- [ ] Test: Enviar mensaje outgoing con metadata
- [ ] Test: Crear nueva conversación cuando está resuelta
- [ ] Test: Upload de archivo (imagen)
- [ ] Test: Upload de archivo (documento)
- [ ] Test: Obtener historial de conversaciones
- [ ] Test: Obtener mensajes de conversación específica
- [ ] Test: Health check

#### 4.2: Testing de Endpoints HTTP
- [ ] Test: `POST /api/chat/send`
  - [ ] Crear nuevo contacto y conversación
  - [ ] Enviar mensaje a conversación existente
  - [ ] Crear nueva conversación si está resuelta
- [ ] Test: `POST /api/webhook/n8n-response`
  - [ ] Recibir respuesta de IA
  - [ ] Verificar que se guarda en Chatwoot
  - [ ] Verificar metadata correcta
- [ ] Test: `POST /api/webhook/chatwoot`
  - [ ] Simular evento `message_created` (respuesta manual)
  - [ ] Simular evento `conversation_status_changed`
  - [ ] Verificar que se emite al widget
- [ ] Test: `POST /api/chat/upload`
  - [ ] Subir imagen
  - [ ] Subir documento
  - [ ] Validar tipos de archivo no permitidos
  - [ ] Validar tamaño máximo
- [ ] Test: `GET /api/chat/history`
  - [ ] Listar conversaciones del contacto
  - [ ] Verificar metadata correcta
- [ ] Test: `GET /api/chat/conversation/:conversationId`
  - [ ] Obtener mensajes de conversación
  - [ ] Verificar paginación
  - [ ] Verificar que incluye attachments

#### 4.3: Testing de Socket.io
- [ ] Test: Conexión de cliente
- [ ] Test: Unirse a sesión
- [ ] Test: Enviar mensaje de usuario
- [ ] Test: Recibir respuesta de agente (IA)
- [ ] Test: Recibir respuesta de agente (manual)
- [ ] Test: Recibir cambio de estado
- [ ] Test: Indicador de "agente escribiendo"
- [ ] Test: Reconexión automática

#### 4.4: Testing del Widget
- [ ] Test: Abrir widget
- [ ] Test: Enviar mensaje de texto
- [ ] Test: Enviar mensaje con attachment (imagen)
- [ ] Test: Enviar mensaje con attachment (documento)
- [ ] Test: Ver preview de imagen en chat
- [ ] Test: Descargar archivo adjunto
- [ ] Test: Ver historial de conversaciones
- [ ] Test: Seleccionar conversación anterior
- [ ] Test: Cargar mensajes de conversación anterior
- [ ] Test: Ver badge de respuesta IA
- [ ] Test: Ver badge de respuesta manual
- [ ] Test: Ver badge de estado (resuelto/pendiente)
- [ ] Test: Crear nueva conversación automáticamente cuando está resuelta

#### 4.5: Testing End-to-End
- [ ] Test completo:
  1. Usuario abre widget
  2. Usuario envía mensaje
  3. IA responde automáticamente
  4. Usuario envía imagen
  5. Agente humano responde desde Chatwoot
  6. Usuario ve respuesta manual en widget
  7. Agente marca conversación como resuelta
  8. Usuario ve badge de "Resuelto"
  9. Usuario envía nuevo mensaje
  10. Se crea nueva conversación automáticamente
  11. Usuario ve historial de conversaciones
  12. Usuario selecciona conversación anterior
  13. Usuario ve mensajes de conversación anterior

**Estado de Fase 4:** ⏳ Pendiente

---

## 📋 FASE 5: Configuración del Webhook en Chatwoot

### Objetivo
Configurar el webhook de Chatwoot para recibir eventos (respuestas manuales, cambios de estado).

### Tareas

#### 5.1: Verificar que el Endpoint Está Listo
- [ ] Verificar que el endpoint `/api/webhook/chatwoot` está implementado
- [ ] Verificar que está desplegado en el servidor de producción
- [ ] Probar el endpoint manualmente (debe responder 200)

#### 5.2: Configurar Webhook en Chatwoot
- [ ] Ir al inbox "SaleADS Widget" en Chatwoot
- [ ] Ir a: **Settings → Webhooks** (o **Configuración → Webhooks**)
- [ ] Click en **"Add Webhook"** o **"Agregar Webhook"**
- [ ] Configurar:
  - [ ] **URL:** `https://tu-api-backend.com/api/webhook/chatwoot`
  - [ ] **Events:** Seleccionar:
    - [ ] `message_created` (CRÍTICO)
    - [ ] `conversation_status_changed` (CRÍTICO)
    - [ ] `conversation_updated` (Opcional)
  - [ ] **Active:** ✅ Enabled
- [ ] Click en **"Save"** o **"Guardar"**

#### 5.3: Probar Webhook
- [ ] Desde Chatwoot, enviar mensaje de prueba como agente
- [ ] Verificar en logs del backend que llegó el evento
- [ ] Verificar en el widget que se recibió el mensaje
- [ ] Cambiar estado de conversación en Chatwoot
- [ ] Verificar en logs del backend que llegó el evento
- [ ] Verificar en el widget que se actualizó el estado

**Estado de Fase 5:** ⏳ Pendiente

---

## 📋 FASE 6: Deployment en Producción

### Objetivo
Desplegar el código actualizado en el servidor de producción (Hetzner).

### Tareas

#### 6.1: Backup de Versión Actual
- [ ] Conectarse al servidor Hetzner
  ```bash
  ssh root@95.216.196.74
  ```
- [ ] Navegar al directorio del proyecto
  ```bash
  cd /var/www/saleads-chat-api/chat-api
  ```
- [ ] Crear backup completo
  ```bash
  tar -czf ../backup-ghl-$(date +%Y%m%d-%H%M%S).tar.gz .
  ```
- [ ] Verificar que el backup se creó correctamente
  ```bash
  ls -lh ../backup-*.tar.gz
  ```

#### 6.2: Actualizar Código en Servidor
- [ ] Pull de la rama `feature/chatwoot-migration`
  ```bash
  git fetch origin
  git checkout feature/chatwoot-migration
  git pull origin feature/chatwoot-migration
  ```
- [ ] Instalar dependencias (si hay nuevas)
  ```bash
  npm install
  ```
- [ ] Build del proyecto
  ```bash
  npm run build
  ```
- [ ] Verificar que el build fue exitoso
  ```bash
  ls -lh dist/
  ```

#### 6.3: Actualizar Variables de Entorno
- [ ] Editar `.env` en el servidor
  ```bash
  nano .env
  ```
- [ ] Agregar variables de Chatwoot:
  ```bash
  CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host
  CHATWOOT_API_KEY=tu_api_access_token
  CHATWOOT_ACCOUNT_ID=2
  CHATWOOT_INBOX_ID=1
  ```
- [ ] Verificar que las variables de n8n estén correctas
- [ ] (Opcional) Comentar variables de GHL (mantener para rollback)

#### 6.4: Reiniciar Servicio
- [ ] Reiniciar PM2 con nuevas variables de entorno
  ```bash
  pm2 restart saleads-chat-api --update-env
  ```
- [ ] Verificar logs para confirmar que inició correctamente
  ```bash
  pm2 logs saleads-chat-api --lines 50
  ```
- [ ] Verificar que `ChatwootService` se inicializó correctamente
  - [ ] Buscar en logs: `[ChatwootService] Initialized`
- [ ] Verificar health check
  ```bash
  curl https://tu-api-backend.com/api/health
  ```

#### 6.5: Verificar Servicios
- [ ] Verificar estado de PM2
  ```bash
  pm2 status
  ```
- [ ] Verificar que el puerto está escuchando
  ```bash
  netstat -tlnp | grep 5678
  # o
  ss -tlnp | grep 5678
  ```

**Estado de Fase 6:** ⏳ Pendiente

---

## 📋 FASE 7: Testing en Producción

### Objetivo
Verificar que todo funciona correctamente en producción.

### Tareas

#### 7.1: Testing Básico
- [ ] Health check endpoint responde correctamente
- [ ] Verificar que ChatwootService está conectado
- [ ] Verificar que n8nService sigue funcionando
- [ ] Verificar que Redis está conectado

#### 7.2: Testing de Flujo Completo
- [ ] Abrir widget en sitio web de prueba
- [ ] Enviar mensaje de prueba
- [ ] Verificar que se creó contacto en Chatwoot
- [ ] Verificar que se creó conversación en Chatwoot
- [ ] Verificar que el mensaje llegó a n8n
- [ ] Verificar que la respuesta de IA llegó al widget
- [ ] Verificar que la respuesta se guardó en Chatwoot
- [ ] Verificar badges (IA, manual, estado) en el widget

#### 7.3: Testing de Rich Media
- [ ] Enviar imagen desde el widget
- [ ] Verificar que se subió correctamente
- [ ] Verificar que se muestra en el widget
- [ ] Verificar que se ve en Chatwoot
- [ ] Enviar documento desde el widget
- [ ] Verificar descarga del archivo
- [ ] Agente envía archivo desde Chatwoot
- [ ] Verificar que llega al widget

#### 7.4: Testing de Chat History
- [ ] Crear múltiples conversaciones
- [ ] Verificar que se listan en el historial
- [ ] Seleccionar conversación anterior
- [ ] Verificar que se cargan los mensajes
- [ ] Verificar que se cargan los attachments

#### 7.5: Testing de Respuestas Manuales
- [ ] Agente responde desde Chatwoot
- [ ] Verificar que llega al widget en tiempo real
- [ ] Verificar badge de "Atención manual"
- [ ] Verificar nombre del agente

#### 7.6: Testing de Cambios de Estado
- [ ] Agente marca conversación como resuelta
- [ ] Verificar que el badge aparece en el widget
- [ ] Usuario envía nuevo mensaje
- [ ] Verificar que se crea nueva conversación
- [ ] Verificar que el estado cambia a "open"

#### 7.7: Testing de Límites y Errores
- [ ] Probar con archivo muy grande (debe rechazar)
- [ ] Probar con tipo de archivo no permitido
- [ ] Probar con sesión expirada
- [ ] Probar reconexión de Socket.io
- [ ] Verificar manejo de errores en logs

**Estado de Fase 7:** ⏳ Pendiente

---

## 📋 FASE 8: Monitoreo y Ajustes

### Objetivo
Monitorear el sistema en producción y hacer ajustes necesarios.

### Tareas

#### 8.1: Monitoreo Inicial (24 horas)
- [ ] Monitorear logs de PM2
  ```bash
  pm2 logs saleads-chat-api --lines 100
  ```
- [ ] Verificar errores en logs
- [ ] Verificar métricas de rendimiento
- [ ] Verificar que no hay memory leaks
- [ ] Verificar uso de CPU y memoria

#### 8.2: Verificar Conversaciones en Chatwoot
- [ ] Revisar que las conversaciones se están creando correctamente
- [ ] Verificar que los mensajes se están guardando
- [ ] Verificar que los attachments se están guardando
- [ ] Verificar que los contactos se están creando correctamente

#### 8.3: Verificar Base de Datos n8n
- [ ] Verificar que los mensajes de IA se están guardando
- [ ] Verificar que los mensajes manuales se están guardando (si se implementó)
- [ ] Verificar que no hay duplicados
- [ ] Verificar rendimiento de queries

#### 8.4: Ajustes y Optimizaciones
- [ ] Ajustar timeouts si es necesario
- [ ] Optimizar queries si hay problemas de rendimiento
- [ ] Ajustar límites de rate limiting si es necesario
- [ ] Corregir cualquier bug encontrado

**Estado de Fase 8:** ⏳ Pendiente

---

## 📋 FASE 9: Finalización y Documentación

### Objetivo
Completar la migración y documentar todo.

### Tareas

#### 9.1: Merge a Main
- [ ] Verificar que todas las pruebas pasaron
- [ ] Code review (si aplica)
- [ ] Merge de `feature/chatwoot-migration` a `main`
  ```bash
  git checkout main
  git merge feature/chatwoot-migration
  git push origin main
  ```

#### 9.2: Crear Tag de Versión
- [ ] Crear tag de la nueva versión
  ```bash
  git tag -a v2.0.0-chatwoot-n8n -m "Migración completa a Chatwoot con Rich Media y Chat History"
  git push origin v2.0.0-chatwoot-n8n
  ```

#### 9.3: Actualizar Documentación
- [ ] Actualizar README.md con nuevas características
- [ ] Actualizar documentación técnica
- [ ] Crear guía de usuario para agentes
- [ ] Documentar configuración de webhooks

#### 9.4: Limpieza
- [ ] Eliminar código de GHL (opcional, mantener comentado para rollback)
- [ ] Limpiar variables de entorno no usadas
- [ ] Limpiar imports no usados
- [ ] Actualizar comentarios en el código

**Estado de Fase 9:** ⏳ Pendiente

---

## 📋 FASE 10: Rollback Plan (Solo si es Necesario)

### Objetivo
Tener un plan de rollback por si algo sale mal.

### Tareas

#### 10.1: Verificar Backup
- [ ] Verificar que el backup existe
  ```bash
  ls -lh /var/www/saleads-chat-api/backup-*.tar.gz
  ```

#### 10.2: Rollback de Código
- [ ] Volver a la rama `main` (versión anterior)
  ```bash
  cd /var/www/saleads-chat-api/chat-api
  git checkout main
  git pull origin main
  ```
- [ ] Restaurar variables de entorno (GHL)
- [ ] Rebuild
  ```bash
  npm install
  npm run build
  ```
- [ ] Reiniciar PM2
  ```bash
  pm2 restart saleads-chat-api --update-env
  ```

#### 10.3: Verificar Rollback
- [ ] Verificar que el servicio inició correctamente
- [ ] Health check
- [ ] Probar flujo básico
- [ ] Verificar logs

---

## 📊 Resumen de Progreso

### Fases Completadas: 1 / 10
- ✅ Fase 1: Configuración de Chatwoot (Parcial - Chatwoot desplegado, falta configurar)

### Fases En Progreso: 0 / 10

### Fases Pendientes: 9 / 10

### Próximos Pasos:
1. Completar Fase 1 (Configurar Inbox y obtener credenciales)
2. Comenzar Fase 2 (Preparación del código)
3. Desarrollo de Fase 3 (Implementación)

---

## 📝 Notas Importantes

- **NO commitees credenciales** al repositorio Git
- **Mantén backup** de la versión anterior hasta confirmar que todo funciona
- **Prueba cada fase** antes de pasar a la siguiente
- **Documenta cualquier problema** encontrado durante el proceso
- **Monitorea logs** continuamente durante las primeras 24-48 horas

---

**Última actualización:** Diciembre 2024  
**Versión del documento:** 1.0.0

