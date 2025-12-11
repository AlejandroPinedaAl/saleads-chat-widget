# 🔄 Plan de Migración: GoHighLevel → Chatwoot

**Versión actual (GHL):** `v1.0.0-ghl-n8n` (commit: `71ec4df`)  
**Versión objetivo:** `v2.0.0-chatwoot-n8n`  
**Fecha:** Diciembre 2024

---

## 📊 Análisis de Viabilidad: Chatwoot vs GoHighLevel

### ✅ Ventajas de Chatwoot

#### 1. **Open Source**
- ✅ Código abierto (MIT License)
- ✅ Self-hosted (control total de datos)
- ✅ Sin límites de contactos/conversaciones
- ✅ Gratis para siempre (si lo hosteas tú)

#### 2. **Diseñado para Chat**
- ✅ Inbox nativo para conversaciones
- ✅ Agentes múltiples con asignación automática
- ✅ Etiquetas, notas, conversaciones
- ✅ Historial completo de mensajes
- ✅ Búsqueda avanzada de conversaciones

#### 3. **API Completa**
- ✅ REST API bien documentada
- ✅ Webhooks nativos (incoming y outgoing)
- ✅ SDK oficial (JavaScript, Python, Ruby)
- ✅ WebSocket API para tiempo real

#### 4. **Integraciones Nativas**
- ✅ Widget de chat propio (similar al nuestro)
- ✅ WhatsApp Business API
- ✅ Facebook Messenger
- ✅ Instagram DM
- ✅ Email
- ✅ Telegram
- ✅ SMS

#### 5. **Features de Soporte**
- ✅ Canned responses (respuestas predefinidas)
- ✅ Macros (automatizaciones)
- ✅ SLA tracking
- ✅ Reports y analytics
- ✅ Team inbox (bandeja compartida)

#### 6. **Costo**
- ✅ Self-hosted: €0/mes (solo servidor)
- ✅ Cloud: $19/mes (plan Startup)
- ✅ Sin límites de contactos
- ✅ Sin límites de conversaciones

### ❌ Desventajas vs GoHighLevel

#### 1. **No es un CRM Completo**
- ❌ No tiene pipelines de ventas
- ❌ No tiene automatizaciones de marketing
- ❌ No tiene calendarios/citas
- ❌ No tiene funnels

#### 2. **Enfoque Diferente**
- ⚠️ Chatwoot = Soporte al cliente
- ⚠️ GHL = CRM + Marketing + Ventas

#### 3. **Configuración Inicial**
- ⚠️ Requiere setup (Docker o servidor)
- ⚠️ Necesitas configurar base de datos (PostgreSQL)
- ⚠️ Necesitas configurar Redis

---

## 🏗️ Nueva Arquitectura con Chatwoot

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Usuario)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SITIO WEB DEL CLIENTE                       │   │
│  │                                                           │  │
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
│  │  Servidor: Hetzner VPS                           │            │
│  │                                                  │            │
│  │  ┌──────────────────────────────────────────┐   │            │
│  │  │  Express.js + Socket.io                  │   │            │
│  │  └──────────────┬───────────────────────────┘   │            │
│  │                  │                               │            │
│  │  ┌───────────────▼────────────────────────────┐  │            │
│  │  │  Servicios                                  │  │            │
│  │  │  - socketService (WebSocket)               │  │            │
│  │  │  - redisService (sesiones)                 │  │            │
│  │  │  - chatwootService (nuevo)                 │  │            │
│  │  │  - n8nService (IA)                         │  │            │
│  │  └──────────────┬─────────────────────────────┘  │            │
│  └─────────────────┼─────────────────────────────────┘            │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────┐
        │             │             │                 │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼────────┐ ┌──────▼──────┐
│  Chatwoot    │ │   n8n    │ │   Redis    │ │  PostgreSQL │
│    API       │ │ Workflow │ │  (Upstash) │ │  (Chatwoot) │
│              │ │          │ │            │ │             │
│ - Inbox      │ │ - Agente │ │ - Sesiones │ │ - Contactos │
│ - Contacts   │ │   IA     │ │ - Cache    │ │ - Mensajes  │
│ - Messages   │ │ - Webhook│ │            │ │ - Inbox     │
│ - Webhooks   │ │          │ │            │ │             │
└──────────────┘ └──────────┘ └────────────┘ └─────────────┘
```

### Cambios Clave

#### 1. **Reemplazo de GHL por Chatwoot**
- ❌ Eliminar: `ghlService.ts`
- ✅ Crear: `chatwootService.ts`

#### 2. **Flujo de Mensajes Completo (Bidireccional)**

**Flujo con Respuesta Automática (IA - n8n):**
```
1. Usuario escribe en Widget
   ↓
2. Widget → Backend (Socket.io / HTTP)
   ↓
3. Backend → Chatwoot API
   - Crear/obtener Contacto
   - Crear/obtener Conversación
   - Enviar mensaje (tipo: incoming)
   ↓
4. Backend → n8n Webhook (procesar con IA)
   ↓
5. n8n → Backend Webhook (/api/webhook/n8n-response)
   - Respuesta generada por IA
   ↓
6. Backend → Chatwoot API
   - Enviar respuesta (tipo: outgoing)
   - Metadata: { source: 'ai', subAgent: '...' }
   ↓
7. Backend → Widget (Socket.io)
   - Emitir 'agent-response' con metadata
   ↓
8. Widget muestra respuesta
   - Indicador: "Respuesta automática" o "IA"
```

**Flujo con Respuesta Manual (Agente Humano):**
```
1. Agente humano escribe en Chatwoot Dashboard
   ↓
2. Chatwoot → Backend Webhook (/api/webhook/chatwoot)
   - Evento: message_created
   - Tipo: outgoing
   - Sender: { type: 'user', id: agentId }
   ↓
3. Backend procesa webhook
   - Identifica que es respuesta manual (sender.type === 'user')
   - Obtiene sessionId desde conversation.meta (custom attribute)
   ↓
4. Backend → n8n Postgres (OPCIONAL)
   - Guardar mensaje manual en BD para historial completo
   ↓
5. Backend → Widget (Socket.io)
   - Emitir 'agent-response' con metadata
   - Metadata: { source: 'manual', agentName: '...' }
   ↓
6. Widget muestra respuesta
   - Indicador: "Atención manual" o nombre del agente
```

**Sincronización de Estados:**
```
1. Agente cambia estado en Chatwoot (ej: "Resuelto")
   ↓
2. Chatwoot → Backend Webhook (/api/webhook/chatwoot)
   - Evento: conversation_status_changed
   - Status: resolved / pending / snoozed
   ↓
3. Backend procesa webhook
   - Actualiza estado en Redis (sesión)
   ↓
4. Backend → Widget (Socket.io)
   - Emitir 'conversation-status-update'
   ↓
5. Widget muestra estado
   - Badge: "Resuelto" / "Pendiente"
   - Deshabilitar input si está resuelto
```

#### 3. **Gestión de Contactos**

**Antes (GHL):**
- Contacto en GHL con custom fields
- Notas para historial

**Después (Chatwoot):**
- Contacto en Chatwoot (inbox)
- Conversación nativa
- Mensajes persistentes

---

## 🔄 Arquitectura Bidireccional Completa

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Usuario)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              WIDGET EMBEBIDO (chat-widget)              │   │
│  │  - Botón flotante                                       │   │
│  │  - Ventana de chat                                      │   │
│  │  - Socket.io Client                                     │   │
│  │  - Indicadores: "IA" / "Atención Manual" / Estado      │   │
│  └───────────────┬─────────────────────────────────────────┘   │
└──────────────────┼───────────────────────────────────────────────┘
                   │
                   │ Socket.io / HTTP
                   │
┌──────────────────┼───────────────────────────────────────────────┐
│  ┌───────────────▼─────────────────────────────┐               │
│  │         BACKEND API (chat-api)               │               │
│  │                                               │               │
│  │  ┌──────────────────────────────────────┐   │               │
│  │  │  Endpoints:                          │   │               │
│  │  │  - POST /api/chat/send               │   │               │
│  │  │  - POST /api/webhook/n8n-response    │   │               │
│  │  │  - POST /api/webhook/chatwoot ⭐ NUEVO│   │               │
│  │  └──────────────┬───────────────────────┘   │               │
│  │                 │                             │               │
│  │  ┌──────────────▼───────────────────────┐   │               │
│  │  │  Servicios:                          │   │               │
│  │  │  - socketService (WebSocket)         │   │               │
│  │  │  - redisService (sesiones)           │   │               │
│  │  │  - chatwootService ⭐ NUEVO           │   │               │
│  │  │  - n8nService (IA)                   │   │               │
│  │  └──────────────┬───────────────────────┘   │               │
│  └─────────────────┼─────────────────────────────┘               │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────┐
        │             │             │                 │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼────────┐ ┌──────▼──────┐
│  Chatwoot    │ │   n8n    │ │   Redis    │ │  PostgreSQL │
│    API       │ │ Workflow │ │  (Upstash) │ │  (n8n BD)   │
│              │ │          │ │            │ │             │
│ - Inbox      │ │ - Agente │ │ - Sesiones │ │ - Mensajes  │
│ - Contacts   │ │   IA     │ │ - Cache    │ │ - Historial │
│ - Messages   │ │ - Webhook│ │            │ │             │
│ - Webhooks ⭐│ │          │ │            │ │             │
└───────┬──────┘ └──────────┘ └────────────┘ └─────────────┘
        │
        │ Webhook (eventos de Chatwoot)
        │ - message_created
        │ - conversation_status_changed
        │ - conversation_updated
        └─────────────────────────────────────────┐
                                                  │
                                        ┌─────────▼─────────┐
                                        │  Backend Webhook  │
                                        │  /api/webhook/    │
                                        │  chatwoot         │
                                        └───────────────────┘
```

### Eventos de Chatwoot que Debes Capturar

**1. `message_created` (CRÍTICO):**
- **Cuándo:** Agente humano envía mensaje desde Chatwoot
- **Payload:**
  ```json
  {
    "event": "message_created",
    "id": 12345,
    "content": "Hola, puedo ayudarte...",
    "message_type": "outgoing",
    "sender": {
      "id": 10,
      "type": "user",  // ← Identifica que es agente humano
      "name": "Juan Pérez"
    },
    "conversation": {
      "id": 567,
      "meta": {
        "sessionId": "sess_abc123"  // ← Guardado en custom attributes
      }
    },
    "created_at": "2024-12-20T10:30:00Z"
  }
  ```
- **Acción en Backend:**
  1. Identificar que es respuesta manual (`sender.type === 'user'`)
  2. Obtener `sessionId` desde `conversation.meta.sessionId`
  3. Emitir a widget vía Socket.io con metadata especial
  4. (Opcional) Guardar en n8n Postgres para historial completo

**2. `conversation_status_changed` (IMPORTANTE):**
- **Cuándo:** Estado cambia (resuelto, pendiente, snoozed)
- **Payload:**
  ```json
  {
    "event": "conversation_status_changed",
    "id": 567,
    "status": "resolved",  // ← Nuevo estado
    "meta": {
      "sessionId": "sess_abc123"
    }
  }
  ```
- **Acción en Backend:**
  1. Obtener `sessionId` desde metadata
  2. Actualizar estado en Redis
  3. Emitir evento `conversation-status-update` al widget
  4. Widget muestra badge de estado
  5. ⭐ **IMPORTANTE:** Si usuario escribe después de resuelto, se crea nueva conversación (ver lógica más abajo)

**3. `conversation_updated` (OPCIONAL):**
- **Cuándo:** Cualquier actualización de conversación
- **Uso:** Sincronización adicional si es necesario

**4. `message_updated` (OPCIONAL):**
- **Cuándo:** Mensaje es editado en Chatwoot
- **Uso:** Actualizar mensaje en widget si es necesario

### Diferenciación: Respuesta IA vs Manual

**En el Widget:**
```typescript
// Metadata para respuesta IA
{
  message: "Hola, puedo ayudarte...",
  source: "ai",  // ← Identificador
  subAgent: "soporte_tecnico",
  timestamp: "2024-12-20T10:30:00Z"
}

// Metadata para respuesta manual
{
  message: "Perfecto, te ayudo con eso...",
  source: "manual",  // ← Identificador
  agentName: "Juan Pérez",
  agentId: 10,
  timestamp: "2024-12-20T10:35:00Z"
}
```

**Visualización en Widget:**
- Respuesta IA: Badge azul "🤖 Respuesta automática" o "IA"
- Respuesta Manual: Badge verde "👤 Juan Pérez" o "Atención manual"
- Estado: Badge gris "Resuelto" / "Pendiente" / "En espera"
- Nueva conversación: Badge o mensaje "Nueva conversación iniciada" (cuando se crea automáticamente)

### ⭐ Lógica de Nueva Conversación (Cuando Conversación Está Resuelta)

**Problema identificado:**
- Si se deshabilita el input cuando la conversación está resuelta, el usuario queda bloqueado
- Si el estado queda en cache, no podría escribir aunque vuelva minutos después

**Solución implementada:**
Cuando un usuario envía un mensaje y la conversación actual está en estado "resolved":

```typescript
// Al recibir mensaje del usuario
const session = await redisService.getSession(sessionId);
const currentStatus = session.metadata?.conversationStatus;

if (currentStatus === 'resolved') {
  // 1. Crear nueva conversación en Chatwoot
  const newConversation = await chatwootService.createConversation(
    contactId,
    inboxId,
    sessionId  // Mismo sessionId, pero nueva conversación
  );
  
  // 2. Actualizar estado en Redis: nueva conversación = 'open'
  await redisService.setSession(sessionId, {
    ...session,
    conversationId: newConversation.conversationId,
    metadata: {
      ...session.metadata,
      conversationStatus: 'open',  // ← Cambiar a 'open'
      previousConversationId: session.metadata?.conversationId,  // Guardar ID anterior
    },
  });
  
  // 3. Continuar con el flujo normal
  // El mensaje se enviará a la nueva conversación
}
```

**Ventajas:**
- ✅ Historial preservado: La conversación resuelta queda como historial en Chatwoot
- ✅ Usuario puede seguir escribiendo: Nueva conversación se crea automáticamente
- ✅ Mismo sessionId: Continuidad de sesión para el usuario
- ✅ Nueva conversationId: Nueva conversación en Chatwoot para seguimiento
- ✅ Visualización opcional: Badge "Nueva conversación" o mensaje informativo

**Visualización en el Widget:**
- Opcionalmente mostrar mensaje: "Hemos iniciado una nueva conversación"
- Badge "Nueva conversación" temporal
- El historial anterior sigue visible (si se implementa)

### Almacenamiento Dual

**1. Chatwoot (Automático):**
- ✅ Todos los mensajes (incoming + outgoing)
- ✅ Todos los contactos
- ✅ Todas las conversaciones
- ✅ Estados y metadata
- ✅ Historial completo en interfaz de Chatwoot

**2. n8n Postgres (Ya existe):**
- ✅ Mensajes procesados por IA (ya lo hace)
- ⭐ **NUEVO:** Mensajes manuales (vía webhook)
- ✅ Historial completo para análisis

**Ventajas del almacenamiento dual:**
- Chatwoot: Interfaz visual, búsqueda, gestión de agentes
- Postgres: Análisis SQL, reportes custom, integraciones avanzadas

---

## 📋 Plan de Acción: Migración a Chatwoot

### Fase 1: Preparación (No Destructiva)

#### ✅ Paso 1.1: Instalar Chatwoot en Hetzner

**Opción A: Docker (Recomendado)**
```bash
# En el servidor Hetzner
cd /var/www
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot

# Configurar variables de entorno
cp .env.example .env
nano .env
# Editar:
# - POSTGRES_PASSWORD
# - REDIS_URL
# - SECRET_KEY_BASE
# - FRONTEND_URL

# Iniciar con Docker Compose
docker-compose up -d
```

**Opción B: Instalación Manual**
```bash
# Ver documentación oficial:
# https://www.chatwoot.com/docs/self-hosted/deployment/linux-vm
```

**Configuración de Nginx para Chatwoot:**
```nginx
server {
    listen 80;
    server_name chatwoot.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**SSL:**
```bash
sudo certbot --nginx -d chatwoot.tu-dominio.com
```

#### ✅ Paso 1.2: Configurar Chatwoot

**IMPORTANTE:** Ya tienes Chatwoot desplegado en Easypanel con los servicios:
- ✅ `chatwoot` (app principal)
- ✅ `chatwoot-db` (PostgreSQL)
- ✅ `chatwoot-redis` (Redis)
- ✅ `chatwoot-sidekiq` (procesador de trabajos)

**Ahora necesitas:**

1. **Acceder a Chatwoot:**
   - URL: `https://n8n-agencia-chatwoot.3e3qzn.easypanel.host`
   - Inicia sesión con tu cuenta admin

2. **Crear Inbox tipo "API":**
   - Ve a: **Settings → Inboxes** (o **Ajustes → Entradas**)
   - Click en **"+ Nueva entrada"** o **"Add Inbox"**
   - Selecciona la opción **"API"** (tarjeta con llaves `{}`)
   - Completa:
     - **Nombre del canal:** "SaleADS Widget" (o "Widget Chat API")
     - **URL de Webhook:** ✅ **CONFIGURA ESTO DESPUÉS** (sí es necesario)
       - Por ahora puedes dejarlo vacío para crear el inbox
       - Después de crear el endpoint en el backend, configura:
       - `https://tu-api.com/api/webhook/chatwoot`
       - **IMPORTANTE:** Este webhook es esencial para recibir respuestas de agentes humanos
       - También recibirá eventos de cambio de estado (resuelto, pendiente, etc.)
       - Ver sección "Configuración del Webhook" más abajo para detalles completos
   - Click en **"Crear canal de API"** o **"Create API channel"**

3. **Obtener Inbox ID:**
   - Después de crear, abre el inbox que acabas de crear
   - En la URL verás: `/app/accounts/2/settings/inboxes/1`
   - El número al final (`1`) es el **Inbox ID**
   - **Guarda este número**

4. **Obtener Account ID:**
   - En cualquier URL del dashboard verás: `/app/accounts/2/...`
   - El número (`2`) es el **Account ID**
   - **Guarda este número**

5. **Obtener API Access Token:**
   - Ve a: **Settings → Profile Settings** (o **Ajustes → Configuración de Perfil**)
   - Busca la sección **"Access Token"** o **"API Access Token"**
   - Si no tienes uno, click en **"Generate New Token"** o **"Crear nuevo token"**
   - Configura:
     - **Nombre:** "Widget Backend API"
     - **Permisos:** Full Access (o Administrator)
   - **IMPORTANTE:** Copia el token completo (solo se muestra una vez)
   - **Guarda este token de forma segura**

6. **Verificar URL de la API:**
   - URL Base: `https://n8n-agencia-chatwoot.3e3qzn.easypanel.host`
   - El servicio usa automáticamente la ruta `/public/api/v1` para la API

7. **⭐ Configurar Webhook de Chatwoot (DESPUÉS de crear el endpoint):**
   
   **IMPORTANTE:** Este paso se hace DESPUÉS de implementar el código del endpoint.
   
   **Paso 7.1: Crear el endpoint en el backend**
   - Endpoint: `POST /api/webhook/chatwoot`
   - Ver sección "Paso 2.7" más abajo para implementación
   
   **Paso 7.2: Configurar webhook en Chatwoot**
   - Ve al inbox que acabas de crear
   - Settings → Webhooks (o Configuración → Webhooks)
   - Click en "Add Webhook" o "Agregar Webhook"
   - Configuración:
     - **URL:** `https://tu-api-backend.com/api/webhook/chatwoot`
     - **Events:** Selecciona estos eventos:
       - ✅ `message_created` (CRÍTICO - respuestas manuales)
       - ✅ `conversation_status_changed` (CRÍTICO - cambios de estado)
       - ✅ `conversation_updated` (Opcional - sincronización adicional)
     - **Active:** ✅ Enabled
   - Click en "Save" o "Guardar"
   
   **Paso 7.3: Verificar webhook**
   - Chatwoot enviará un evento de prueba
   - Verifica en logs del backend que llegue correctamente

**Resumen de credenciales a guardar:**
```
CHATWOOT_API_URL=https://n8n-agencia-chatwoot.3e3qzn.easypanel.host
CHATWOOT_API_KEY=tu_api_access_token_aqui
CHATWOOT_ACCOUNT_ID=2
CHATWOOT_INBOX_ID=1  (o el que te haya dado Chatwoot)
CHATWOOT_WEBHOOK_URL=https://tu-api-backend.com/api/webhook/chatwoot
```

#### ✅ Paso 1.3: Crear Rama de Desarrollo

```bash
# En tu PC local
cd "C:\Developer\Widget soporte"

# Crear rama para Chatwoot
git checkout -b feature/chatwoot-migration

# Guardar versión actual
git tag v1.0.0-ghl-n8n
git push origin v1.0.0-ghl-n8n
```

---

### Fase 2: Desarrollo (Rama `feature/chatwoot-migration`)

#### 🔧 Paso 2.1: Crear `chatwootService.ts`

**Ubicación:** `chat-api/src/services/chatwootService.ts`

**Funcionalidades a implementar:**
```typescript
class ChatwootService {
  // 1. Crear/obtener contacto
  async upsertContact(data: {
    name?: string;
    email?: string;
    phone?: string;
    sessionId: string;  // ← Se guardará en custom_attributes
  }): Promise<{ contactId: number; isNew: boolean }>;

  // 2. Crear/obtener conversación
  async createConversation(
    contactId: number,
    inboxId: number,
    sessionId: string  // ← Se guardará en meta para el webhook
  ): Promise<{ conversationId: number }>;

  // 3. Enviar mensaje
  async sendMessage(
    conversationId: number,
    message: string,
    messageType: 'incoming' | 'outgoing',
    private: boolean = false,
    source?: 'ai' | 'manual',  // ← Para identificar origen
    metadata?: Record<string, any>  // ← Metadata adicional (subAgent, agentName, etc.)
  ): Promise<{ messageId: number }>;

  // 4. Actualizar contacto
  async updateContact(
    contactId: number,
    data: Partial<Contact>
  ): Promise<void>;

  // 5. Actualizar conversación (metadata, estado, etc.)
  async updateConversation(
    conversationId: number,
    data: {
      status?: 'open' | 'resolved' | 'pending' | 'snoozed';
      meta?: Record<string, any>;  // ← Para guardar sessionId
      customAttributes?: Record<string, any>;
    }
  ): Promise<void>;

  // 6. Obtener conversación por ID
  async getConversation(conversationId: number): Promise<Conversation>;

  // 7. Obtener conversación por sessionId (desde metadata)
  async getConversationBySessionId(sessionId: string): Promise<Conversation | null>;

  // 8. ⭐ NUEVO: Upload de archivo (Rich Media)
  async uploadAttachment(
    conversationId: number,
    file: Buffer,
    fileName: string,
    contentType: string,
    messageType: 'incoming' | 'outgoing'
  ): Promise<{ attachmentId: number; url: string }>;

  // 9. ⭐ NUEVO: Enviar mensaje con attachment
  async sendMessageWithAttachment(
    conversationId: number,
    message: string,
    attachmentUrl: string,
    attachmentName: string,
    messageType: 'incoming' | 'outgoing',
    source?: 'ai' | 'manual',
    metadata?: Record<string, any>
  ): Promise<{ messageId: number; attachmentId: number }>;

  // 10. ⭐ NUEVO: Obtener historial de conversaciones del contacto
  async getContactConversations(
    contactId: number,
    status?: 'open' | 'resolved' | 'pending' | 'snoozed'
  ): Promise<Conversation[]>;

  // 11. ⭐ NUEVO: Obtener mensajes de una conversación específica
  async getConversationMessages(
    conversationId: number,
    page: number = 1,
    perPage: number = 50
  ): Promise<{
    messages: Message[];
    pagination: { page: number; perPage: number; total: number };
  }>;

  // 12. Health check
  async healthCheck(): Promise<boolean>;
}
```

**Detalles Importantes:**

1. **Guardar sessionId en Conversación:**
   - Al crear conversación, guardar `sessionId` en `meta.sessionId`
   - Esto permite que el webhook identifique qué sesión del widget corresponde

2. **Custom Attributes en Contacto:**
   - Guardar `widget_session_id` en `custom_attributes` del contacto
   - Permite búsqueda y vinculación

3. **Metadata en Mensajes:**
   - Respuestas IA: `{ source: 'ai', subAgent: '...' }`
   - Respuestas Manuales: `{ source: 'manual', agentName: '...', agentId: 10 }`

4. **⭐ Rich Media (Archivos):**
   - Chatwoot soporta attachments nativamente vía API
   - Se pueden subir archivos y asociarlos a mensajes
   - Soporta imágenes, videos, documentos
   - Límites de tamaño deben configurarse (ej: 10MB máximo)

5. **⭐ Chat History:**
   - Obtener todas las conversaciones de un contacto
   - Cargar mensajes de conversación específica
   - Incluir attachments en los mensajes

#### 🔧 Paso 2.2: Actualizar `config/index.ts`

**Agregar configuración de Chatwoot:**
```typescript
export const config = {
  // ... existing config ...

  // Reemplazar GHL por Chatwoot
  chatwoot: {
    apiUrl: getEnv('CHATWOOT_API_URL', 'https://chatwoot.tu-dominio.com'),
    apiKey: getEnv('CHATWOOT_API_KEY', ''),
    accountId: getEnvNumber('CHATWOOT_ACCOUNT_ID', 1),
    inboxId: getEnvNumber('CHATWOOT_INBOX_ID', 0),
  },

  // Mantener n8n
  n8n: {
    webhookUrl: getEnv('N8N_WEBHOOK_URL', ''),
    enabled: getEnv('N8N_DIRECT_ENABLED', 'false') === 'true',
    webhookSecret: getEnv('N8N_WEBHOOK_SECRET', ''),
    timeout: getEnvNumber('N8N_TIMEOUT', 30000),
  },
};
```

#### 🔧 Paso 2.3: Actualizar `socketService.ts`

**Cambios en `handleUserMessage`:**
```typescript
// ANTES (GHL)
const contactResult = await ghlService.upsertContact(...);
await ghlService.logWidgetMessage(contactId, message, 'inbound');

// DESPUÉS (Chatwoot)
const contactResult = await chatwootService.upsertContact(...);
const conversation = await chatwootService.createConversation(
  contactResult.contactId,
  config.chatwoot.inboxId
);
await chatwootService.sendMessage(
  conversation.conversationId,
  message,
  'incoming'
);
```

#### 🔧 Paso 2.4: Actualizar `chat.routes.ts`

**Cambios en `/api/chat/send`:**
```typescript
// ANTES (GHL)
const upsertResult = await ghlService.upsertContact(...);
await ghlService.logWidgetMessage(...);

// DESPUÉS (Chatwoot)
const contactResult = await chatwootService.upsertContact(...);
const conversation = await chatwootService.createConversation(...);
await chatwootService.sendMessage(...);
```

**Cambios en `/api/webhook/n8n-response`:**
```typescript
// ANTES (GHL)
await ghlService.logWidgetMessage(contactId, data.response, 'outbound');

// DESPUÉS (Chatwoot)
await chatwootService.sendMessage(
  conversationId,
  data.response,
  'outgoing'
);
```

#### 🔧 Paso 2.5: Crear Endpoint Webhook de Chatwoot

**Ubicación:** `chat-api/src/routes/chat.routes.ts`

**Nuevo endpoint:** `POST /api/webhook/chatwoot`

**Funcionalidad:**
1. Recibir eventos de Chatwoot (message_created, conversation_status_changed, etc.)
2. Validar el webhook (opcional: signature validation si Chatwoot lo soporta)
3. Procesar según el tipo de evento:
   - **message_created:** Si es respuesta manual → emitir al widget
   - **conversation_status_changed:** Emitir cambio de estado al widget
4. Opcionalmente: Guardar mensajes manuales en n8n Postgres

**Código del endpoint:**
```typescript
/**
 * POST /api/webhook/chatwoot
 * Recibir eventos de Chatwoot (respuestas manuales, cambios de estado)
 */
router.post(
  '/webhook/chatwoot',
  // TODO: Validar webhook signature si Chatwoot lo soporta
  asyncHandler(async (req: Request, res: Response) => {
    const event = req.body;
    
    logger.info('[ChatRoutes] Chatwoot webhook received', {
      event: event.event,
      id: event.id,
    });

    // Procesar según tipo de evento
    switch (event.event) {
      case 'message_created':
        // Si es mensaje outgoing y sender.type === 'user' → es agente humano
        if (event.message_type === 'outgoing' && event.sender?.type === 'user') {
          // Obtener sessionId desde conversation.meta
          const sessionId = event.conversation?.meta?.sessionId;
          
          if (sessionId) {
            // Emitir al widget vía Socket.io
            socketService.emitAgentResponse(sessionId, {
              message: event.content,
              timestamp: event.created_at,
              metadata: {
                source: 'manual',
                agentName: event.sender?.name,
                agentId: event.sender?.id,
                conversationId: event.conversation?.id,
              },
            });

            // (Opcional) Guardar en n8n Postgres vía n8n webhook
            // TODO: Implementar si lo necesitas para historial completo
          }
        }
        break;

      case 'conversation_status_changed':
        const sessionId = event.meta?.sessionId || event.conversation?.meta?.sessionId;
        
        if (sessionId) {
          // Emitir cambio de estado al widget
          socketService.emitConversationStatusUpdate(sessionId, {
            status: event.status,
            timestamp: new Date().toISOString(),
          });

          // Actualizar en Redis
          const session = await redisService.getSession(sessionId);
          if (session) {
            await redisService.setSession(sessionId, {
              ...session,
              metadata: {
                ...session.metadata,
                conversationStatus: event.status,
                lastStatusUpdate: Date.now(),
              },
            });
          }
        }
        break;
    }

    res.json({ success: true, received: true });
  })
);
```

**Nota:** También necesitarás agregar el método `emitConversationStatusUpdate` en `socketService.ts`.

#### 🔧 Paso 2.6: Crear Endpoints para Rich Media (Archivos, Imágenes, Videos)

**Ubicación:** `chat-api/src/routes/chat.routes.ts`

**Nuevo endpoint:** `POST /api/chat/upload`

**Funcionalidad:**
1. Aceptar archivos (imágenes, videos, documentos)
2. Validar tipo y tamaño de archivo
3. Subir a almacenamiento (Chatwoot o S3)
4. Guardar en Chatwoot como attachment
5. Retornar URL/ID del archivo

**Código del endpoint:**
```typescript
/**
 * POST /api/chat/upload
 * Subir archivo (imagen, video, documento) y asociarlo a conversación
 */
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/webm',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

router.post(
  '/upload',
  upload.single('file'),
  chatMessageRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, conversationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Obtener conversación
    const convId = conversationId || await getConversationFromSession(sessionId);
    
    // Subir a Chatwoot
    const result = await chatwootService.uploadAttachment(
      convId,
      file.buffer,
      file.originalname,
      file.mimetype,
      'incoming'
    );
    
    res.json({
      success: true,
      data: {
        attachmentId: result.attachmentId,
        url: result.url,
        fileName: file.originalname,
        contentType: file.mimetype,
        fileSize: file.size,
      },
    });
  })
);
```

**Actualizar `socketService.ts` para manejar attachments:**
- Cuando se recibe mensaje con attachment, incluir en el evento
- Emitir evento `message-with-attachment` al widget

#### 🔧 Paso 2.7: Crear Endpoints para Chat History

**Ubicación:** `chat-api/src/routes/chat.routes.ts`

**Nuevo endpoint 1:** `GET /api/chat/history`

**Funcionalidad:**
1. Listar todas las conversaciones del contacto por sessionId
2. Retornar metadata (última mensaje, fecha, estado)
3. Incluir información de si tiene attachments

**Código:**
```typescript
/**
 * GET /api/chat/history
 * Obtener historial de conversaciones del contacto
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.query;
    
    // Obtener sesión para obtener contactId
    const session = await redisService.getSession(sessionId as string);
    if (!session || !session.contactId) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Obtener conversaciones del contacto
    const conversations = await chatwootService.getContactConversations(
      parseInt(session.contactId)
    );
    
    res.json({
      success: true,
      data: {
        conversations: conversations.map(conv => ({
          id: conv.id,
          status: conv.status,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          hasAttachments: conv.hasAttachments,
        })),
      },
    });
  })
);
```

**Nuevo endpoint 2:** `GET /api/chat/conversation/:conversationId`

**Funcionalidad:**
1. Obtener mensajes de una conversación específica
2. Paginación (page, perPage)
3. Incluir attachments si existen

**Código:**
```typescript
/**
 * GET /api/chat/conversation/:conversationId
 * Obtener mensajes de una conversación específica
 */
router.get(
  '/conversation/:conversationId',
  asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 50;
    
    const result = await chatwootService.getConversationMessages(
      parseInt(conversationId),
      page,
      perPage
    );
    
    res.json({
      success: true,
      data: {
        messages: result.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
          sender: msg.sender,
          attachments: msg.attachments || [],
          metadata: msg.metadata,
        })),
        pagination: result.pagination,
      },
    });
  })
);
```

#### 🔧 Paso 2.8: Actualizar Widget para Rich Media

**Componentes a crear/modificar:**

1. **`MessageInput.tsx` - Agregar botón de adjuntar:**
   - Botón para seleccionar archivo
   - Preview de archivo seleccionado antes de enviar
   - Indicador de progreso de upload
   - Validación de tipo y tamaño en frontend

2. **`MessageList.tsx` - Mostrar attachments:**
   - Preview de imágenes (thumbnail + modal al hacer click)
   - Preview de videos (reproductor)
   - Iconos para documentos con nombre y tamaño
   - Botón de descarga para documentos

3. **`AttachmentPreview.tsx` (NUEVO):**
   - Componente para mostrar diferentes tipos de attachments
   - Preview de imágenes
   - Preview de videos
   - Preview de documentos

4. **Actualizar `types/index.ts`:**
   ```typescript
   export interface Attachment {
     id: number;
     url: string;
     fileName: string;
     contentType: string;
     fileSize?: number;
   }
   
   export interface Message {
     // ... existing fields
     attachments?: Attachment[];
   }
   ```

#### 🔧 Paso 2.9: Actualizar Widget para Chat History

**Componentes a crear/modificar:**

1. **`ChatHistory.tsx` (NUEVO):**
   - Lista de conversaciones anteriores
   - Selector de conversación
   - Indicador de conversación activa
   - Badge de estado (resuelto/pendiente)

2. **`ChatWindow.tsx` - Agregar botón de historial:**
   - Botón para abrir/cerrar historial
   - Toggle entre vista de chat actual y historial

3. **Actualizar `chatStore.ts`:**
   ```typescript
   interface ChatState {
     // ... existing fields
     conversations: Conversation[];
     selectedConversationId: number | null;
     isLoadingHistory: boolean;
     
     // Methods
     loadConversations: () => Promise<void>;
     selectConversation: (conversationId: number) => Promise<void>;
     loadConversationMessages: (conversationId: number) => Promise<void>;
   }
   ```

4. **Actualizar `types/index.ts`:**
   ```typescript
   export interface Conversation {
     id: number;
     status: 'open' | 'resolved' | 'pending' | 'snoozed';
     lastMessage?: string;
     lastMessageAt?: string;
     createdAt: string;
     hasAttachments: boolean;
   }
   ```

#### 🔧 Paso 2.10: Actualizar Variables de Entorno

**`.env` (desarrollo y producción):**
```bash
# ============================================
# CHATWOOT (reemplaza GHL)
# ============================================
CHATWOOT_API_URL=https://chatwoot.tu-dominio.com
CHATWOOT_API_KEY=tu_chatwoot_api_key_aqui
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=1

# ============================================
# N8N (mantener)
# ============================================
N8N_WEBHOOK_URL=https://n8n-agencia-n8n.3e3qzn.easypanel.host/webhook/gohighlevel-webhook
N8N_DIRECT_ENABLED=true
N8N_WEBHOOK_SECRET=tu_webhook_secret
N8N_TIMEOUT=30000

# Eliminar variables de GHL:
# GHL_API_KEY=...
# GHL_LOCATION_ID=...
# GHL_API_URL=...
```

#### 🔧 Paso 2.6: Actualizar `types/index.ts`

**Agregar tipos de Chatwoot:**
```typescript
// Chatwoot Types
export interface ChatwootContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  identifier?: string; // sessionId
  custom_attributes?: Record<string, any>;
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: 'open' | 'resolved' | 'pending';
  messages: ChatwootMessage[];
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
  sender?: {
    id: number;
    name: string;
    type: 'contact' | 'user';
  };
}

// Actualizar AppConfig
export interface AppConfig {
  // ... existing ...
  
  // Reemplazar ghl por chatwoot
  chatwoot: {
    apiUrl: string;
    apiKey: string;
    accountId: number;
    inboxId: number;
  };
  
  // Mantener n8n
  n8n: {
    webhookUrl: string;
    enabled: boolean;
    webhookSecret: string;
    timeout: number;
  };
}
```

---

### Fase 3: Testing (Rama `feature/chatwoot-migration`)

#### ✅ Paso 3.1: Testing Local

```bash
# En tu PC local
cd chat-api
npm install
npm run build
npm run dev

# Verificar logs
# Debe mostrar: [ChatwootService] Initialized
```

#### ✅ Paso 3.2: Testing de Integración

**Test 1: Crear contacto**
```bash
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "message": "Hola desde test",
    "metadata": {
      "phone": "+1234567890",
      "firstName": "Test",
      "lastName": "User"
    }
  }'
```

**Verificar en Chatwoot:**
- Ve a Chatwoot → Inbox
- Debe aparecer nueva conversación
- Debe aparecer el mensaje

**Test 2: Respuesta de n8n**
```bash
curl -X POST http://localhost:3000/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: tu_secret" \
  -d '{
    "sessionId": "test_session_123",
    "response": "Respuesta del agente IA",
    "metadata": {
      "conversationId": 123
    }
  }'
```

**Verificar en Chatwoot:**
- La respuesta debe aparecer en la conversación

#### ✅ Paso 3.3: Testing del Widget

```html
<!-- test.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>Test Chatwoot Migration</h1>
  
  <script>
    window.saleadsConfig = {
      apiUrl: 'http://localhost:3000',
      primaryColor: '#3B82F6'
    };
  </script>
  <script src="http://localhost:5173/src/main.tsx"></script>
</body>
</html>
```

**Flujo completo:**
1. Abrir test.html
2. Enviar mensaje desde widget
3. Verificar en Chatwoot que llegó
4. Verificar en n8n que se procesó
5. Verificar que la respuesta llegó al widget

---

### Fase 4: Deployment (Hetzner)

#### 🚀 Paso 4.1: Backup de Versión Actual

```bash
# En el servidor Hetzner
ssh root@95.216.196.74

cd /var/www/saleads-chat-api/chat-api

# Crear backup
tar -czf ../backup-ghl-$(date +%Y%m%d).tar.gz .

# Verificar
ls -lh ../backup-*.tar.gz
```

#### 🚀 Paso 4.2: Deploy de Nueva Versión

```bash
# Pull de la rama feature
git fetch origin
git checkout feature/chatwoot-migration
git pull origin feature/chatwoot-migration

# Instalar dependencias
npm install

# Build
npm run build

# Actualizar .env con variables de Chatwoot
nano .env
# Agregar:
# CHATWOOT_API_URL=...
# CHATWOOT_API_KEY=...
# CHATWOOT_ACCOUNT_ID=...
# CHATWOOT_INBOX_ID=...

# Reiniciar PM2
pm2 restart saleads-chat-api --update-env

# Ver logs
pm2 logs saleads-chat-api --lines 50
```

#### 🚀 Paso 4.3: Verificación en Producción

```bash
# Health check
curl https://api-chat.tu-dominio.com/api/health

# Debe mostrar:
# {
#   "status": "ok",
#   "services": {
#     "redis": "connected",
#     "chatwoot": "connected",  # <-- Nuevo
#     "socket": "running"
#   }
# }
```

#### 🚀 Paso 4.4: Testing End-to-End

1. Abrir sitio web con widget
2. Enviar mensaje de prueba
3. Verificar en Chatwoot → Inbox
4. Verificar respuesta del agente IA
5. Verificar que llegó al widget

---

### Fase 5: Rollback Plan (Si algo falla)

#### 🔙 Paso 5.1: Rollback Rápido

```bash
# En el servidor Hetzner
cd /var/www/saleads-chat-api/chat-api

# Volver a versión estable
git checkout main
git pull origin main

# Reinstalar dependencias (por si acaso)
npm install

# Rebuild
npm run build

# Restaurar .env con variables de GHL
nano .env
# Eliminar variables de Chatwoot
# Restaurar variables de GHL

# Reiniciar
pm2 restart saleads-chat-api --update-env
```

#### 🔙 Paso 5.2: Verificar Rollback

```bash
# Health check
curl https://api-chat.tu-dominio.com/api/health

# Debe mostrar GHL conectado
```

---

## 📊 Comparación: GHL vs Chatwoot

### Funcionalidades

| Feature | GoHighLevel | Chatwoot |
|---------|-------------|----------|
| **Gestión de Contactos** | ✅ CRM completo | ✅ Contactos básicos |
| **Conversaciones** | ⚠️ Notas | ✅ Inbox nativo |
| **Historial de Chat** | ⚠️ Notas | ✅ Mensajes persistentes |
| **Búsqueda** | ✅ Avanzada | ✅ Avanzada |
| **Etiquetas** | ✅ Tags | ✅ Labels |
| **Asignación de Agentes** | ❌ No | ✅ Sí |
| **Canned Responses** | ❌ No | ✅ Sí |
| **Reports** | ✅ Avanzados | ✅ Básicos |
| **API** | ✅ Completa | ✅ Completa |
| **Webhooks** | ✅ Sí | ✅ Sí |
| **Integraciones** | ✅ Muchas | ✅ Muchas |
| **Pipelines de Ventas** | ✅ Sí | ❌ No |
| **Automatizaciones** | ✅ Sí | ⚠️ Limitadas |
| **Costo** | $97-297/mes | €0/mes (self-hosted) |

### Recomendación

**Usa Chatwoot si:**
- ✅ Solo necesitas soporte al cliente
- ✅ Quieres ahorrar dinero (self-hosted gratis)
- ✅ Necesitas inbox de conversaciones
- ✅ Tienes múltiples agentes

**Mantén GHL si:**
- ✅ Necesitas CRM completo
- ✅ Necesitas pipelines de ventas
- ✅ Necesitas automatizaciones de marketing
- ✅ Ya pagas por GHL

---

## 🎯 Resumen del Plan

### Cambios Manuales Requeridos

1. **Instalar Chatwoot en Hetzner** (Docker o manual)
2. **Configurar Nginx para Chatwoot** (reverse proxy)
3. **Crear Inbox en Chatwoot** (API type)
4. **Obtener API Key y IDs** (Account ID, Inbox ID)
5. **Actualizar variables de entorno** (.env)

### Cambios en el Código

1. **Crear `chatwootService.ts`** (nuevo archivo)
2. **Actualizar `config/index.ts`** (agregar config de Chatwoot)
3. **Actualizar `socketService.ts`** (reemplazar ghlService por chatwootService)
4. **Actualizar `chat.routes.ts`** (reemplazar ghlService por chatwootService)
5. **Actualizar `types/index.ts`** (agregar tipos de Chatwoot)
6. **Eliminar `ghlService.ts`** (ya no se usa)

### Archivos a Modificar

```
chat-api/src/
├── config/
│   └── index.ts                    # ✏️ Modificar (agregar Chatwoot config)
├── services/
│   ├── chatwootService.ts          # ✨ Crear (nuevo)
│   ├── ghlService.ts               # 🗑️ Eliminar (o mantener comentado)
│   ├── socketService.ts            # ✏️ Modificar (usar chatwootService)
│   └── n8nService.ts               # ✅ Mantener (sin cambios)
├── routes/
│   └── chat.routes.ts              # ✏️ Modificar (usar chatwootService)
├── types/
│   └── index.ts                    # ✏️ Modificar (agregar tipos Chatwoot)
└── .env                            # ✏️ Modificar (variables Chatwoot)
```

### Estimación de Tiempo

- **Instalación de Chatwoot:** 1-2 horas
- **Desarrollo del código:** 4-6 horas
- **Testing:** 2-3 horas
- **Deployment:** 1 hora
- **Total:** 8-12 horas

---

## ✅ Checklist de Migración

### Pre-Migración
- [ ] Crear tag `v1.0.0-ghl-n8n` (versión actual)
- [ ] Push del tag a GitHub
- [ ] Crear rama `feature/chatwoot-migration`
- [ ] Instalar Chatwoot en Hetzner
- [ ] Configurar Nginx para Chatwoot
- [ ] Obtener API Key de Chatwoot

### Desarrollo
- [ ] Crear `chatwootService.ts`
- [ ] Actualizar `config/index.ts`
- [ ] Actualizar `socketService.ts`
- [ ] Actualizar `chat.routes.ts`
- [ ] Actualizar `types/index.ts`
- [ ] Actualizar `.env` (local)

### Testing
- [ ] Test: Crear contacto en Chatwoot
- [ ] Test: Crear conversación
- [ ] Test: Enviar mensaje (incoming)
- [ ] Test: Recibir respuesta de n8n
- [ ] Test: Enviar mensaje (outgoing)
- [ ] Test: Widget end-to-end

### Deployment
- [ ] Backup de versión actual
- [ ] Deploy a Hetzner (rama feature)
- [ ] Actualizar `.env` (producción)
- [ ] Reiniciar PM2
- [ ] Health check
- [ ] Test end-to-end en producción

### Post-Migración
- [ ] Monitorear logs (24 horas)
- [ ] Verificar conversaciones en Chatwoot
- [ ] Merge a `main` (si todo OK)
- [ ] Crear tag `v2.0.0-chatwoot-n8n`
- [ ] Actualizar documentación

---

---

## 🎯 Características Adicionales para Considerar (Análisis de Requerimientos)

**IMPORTANTE:** Estas características se documentan para evaluación. El equipo decidirá cuáles son relevantes para el negocio antes de implementarlas.

### 📋 Lista de Características Potenciales

#### 1. **Read Receipts / Confirmaciones de Lectura**
**Descripción:** Mostrar al usuario cuando el agente ha leído su mensaje (check doble, "Leído", timestamps).

**Ventajas:**
- Mejora la confianza del usuario
- Transparencia en la comunicación
- Estándar en apps de mensajería moderna

**Desventajas:**
- Requiere tracking adicional de lecturas
- Puede generar expectativas sobre tiempo de respuesta

**Implementación:**
- Chatwoot API tiene eventos de lectura
- Emitir evento `message-read` al widget
- Actualizar UI con indicador visual

---

#### 2. **Rich Media Support (Archivos, Imágenes, Videos)**
**Descripción:** Permitir que usuarios y agentes envíen archivos, imágenes, videos, documentos.

**Ventajas:**
- Mejor resolución de problemas (screenshots, logs)
- Experiencia más completa
- Necesario para soporte técnico avanzado

**Desventajas:**
- Requiere almacenamiento de archivos (S3, etc.)
- Límites de tamaño
- Validación de tipos de archivo

**Implementación:**
- Chatwoot soporta attachments nativamente
- Backend necesita endpoint para upload
- Widget necesita UI para selección de archivos

---

#### 3. **Chat History / Historial Completo**
**Descripción:** Mostrar conversaciones anteriores del mismo usuario (no solo la actual).

**Ventajas:**
- Contexto completo para el usuario
- Mejor continuidad de soporte
- Reduce repetición de información

**Desventajas:**
- Requiere UI más compleja (vista de conversaciones)
- Puede ser confuso si hay muchas conversaciones

**Implementación:**
- Listar conversaciones del contacto desde Chatwoot API
- UI de selección de conversación
- Cargar mensajes de conversación seleccionada

---

#### 4. **Proactive Chat / Chat Proactivo**
**Descripción:** Iniciar conversación automáticamente basado en comportamiento (tiempo en página, páginas visitadas, etc.).

**Ventajas:**
- Mejor conversión de leads
- Intervención en el momento correcto
- Reduce fricción para iniciar chat

**Desventajas:**
- Puede ser intrusivo si no está bien configurado
- Requiere lógica de triggers

**Implementación:**
- Widget puede detectar eventos del sitio
- Configuración de triggers en backend
- Mensaje automático después de X segundos/páginas

---

#### 5. **Chatbot Pre-Chat Survey / Encuesta Pre-Chat**
**Descripción:** Formulario corto antes de iniciar el chat (nombre, email, asunto, categoría).

**Ventajas:**
- Mejor routing a agente correcto
- Contexto previo para el agente
- Captura de información importante

**Desventajas:**
- Puede disuadir a usuarios impacientes
- Fricción adicional

---

#### 6. **Queue Position / Posición en Cola**
**Descripción:** Mostrar al usuario su posición en la cola de espera si todos los agentes están ocupados.

**Ventajas:**
- Transparencia
- Set expectations
- Reduce frustración

**Desventajas:**
- Menos relevante si siempre hay agentes disponibles
- Requiere tracking de cola

---

#### 7. **Satisfaction Survey / Encuesta de Satisfacción**
**Descripción:** Solicitar rating (1-5 estrellas, thumbs up/down) al finalizar la conversación.

**Ventajas:**
- Feedback valioso
- Métricas de satisfacción
- Identificar áreas de mejora

**Desventajas:**
- Puede interrumpir si no está bien diseñado
- Posible fatiga del usuario

**Implementación:**
- Trigger automático cuando conversación se resuelve
- Widget muestra modal de encuesta
- Guardar en Chatwoot y/o Postgres

---

#### 8. **Business Hours / Horario Comercial**
**Descripción:** Mostrar horario disponible, mensaje fuera de horario, opción de dejar mensaje.

**Ventajas:**
- Set expectations claras
- Reduce frustración fuera de horario
- Mejor gestión de expectativas

**Desventajas:**
- Requiere configuración de horarios
- Zonas horarias pueden complicar

---

#### 9. **Presence Indicators / Indicadores de Presencia Mejorados**
**Descripción:** Ya tienes online/offline básico, pero podría mejorarse:
- Mostrar si hay agentes disponibles
- Tiempo estimado de respuesta basado en disponibilidad
- Status de agentes (disponible, ocupado, ausente)

**Ventajas:**
- Mejor comunicación de disponibilidad
- Set expectations realistas

---

#### 10. **Quick Replies / Respuestas Rápidas**
**Descripción:** Botones con respuestas predefinidas que el usuario puede seleccionar.

**Ventajas:**
- Más rápido para el usuario
- Mejora UX en móvil
- Útil para opciones comunes

**Desventajas:**
- Puede limitar la comunicación
- Menos flexible

**Ejemplo:**
- "Sí, por favor"
- "No, gracias"
- "Necesito más información"

---

#### 11. **Email Transcript / Transcript por Email**
**Descripción:** Enviar resumen de la conversación por email al finalizar.

**Ventajas:**
- Referencia futura para el usuario
- Documentación automática
- Mejor experiencia de servicio

**Desventajas:**
- Requiere configuración de email
- Puede ser spam si no está bien configurado

---

#### 12. **Voice Messages / Mensajes de Voz**
**Descripción:** Permitir grabar y enviar mensajes de voz.

**Ventajas:**
- Más rápido que escribir
- Tono más natural
- Útil para explicaciones complejas

**Desventajas:**
- Requiere almacenamiento de audio
- No siempre apropiado para soporte técnico
- Accesibilidad (personas sordas)

---

#### 13. **Co-Browsing / Navegación Compartida**
**Descripción:** Permitir que el agente vea la pantalla del usuario (con permiso) para ayudarle mejor.

**Ventajas:**
- Resolución de problemas más rápida
- Visualización directa del problema
- Experiencia premium de soporte

**Desventajas:**
- Requiere servicio especializado (LiveSession, etc.)
- Consideraciones de privacidad
- Más complejo de implementar

---

#### 14. **Message Translation / Traducción**
**Descripción:** Traducir automáticamente mensajes entre idiomas.

**Ventajas:**
- Soporte multi-idioma sin barreras
- Útil para empresas internacionales

**Desventajas:**
- Requiere integración con servicio de traducción
- Puede perder matices del idioma original

---

#### 15. **Dark Mode / Modo Oscuro**
**Descripción:** Soporte para tema oscuro además del tema claro.

**Ventajas:**
- Mejor para usuarios nocturnos
- Reducción de fatiga visual
- Preferencia moderna

**Desventajas:**
- Ya tienes configuración de theme
- Puede añadirse dark mode fácilmente

---

#### 16. **Accessibility Features / Características de Accesibilidad**
**Descripción:** 
- Soporte para lectores de pantalla
- Navegación por teclado
- Contraste mejorado
- Tamaño de fuente ajustable

**Ventajas:**
- Cumplimiento de estándares (WCAG)
- Mejor experiencia para todos
- Requisito legal en muchos países

**Desventajas:**
- Requiere trabajo adicional
- Testing más complejo

---

#### 17. **GDPR Compliance Features / Características de Cumplimiento GDPR**
**Descripción:**
- Consentimiento explícito para chat
- Opción de eliminar datos
- Política de privacidad visible
- Consentimiento para cookies

**Ventajas:**
- Cumplimiento legal
- Confianza del usuario
- Evita multas

**Desventajas:**
- Ya tienes algunas (gdprLink)
- Puede expandirse

---

#### 18. **Real-time Analytics / Analytics en Tiempo Real**
**Descripción:** Dashboard para ver métricas en tiempo real (usuarios online, conversaciones activas, tiempo de respuesta).

**Ventajas:**
- Mejor gestión del equipo
- Identificación rápida de problemas
- Métricas de rendimiento

**Desventajas:**
- Requiere backend adicional
- Dashboard separado del widget

---

### 📊 Características Ya Implementadas (Para Referencia)

✅ **Básicas:**
- Indicador de conexión (online/offline)
- Indicador de "agente escribiendo"
- Estados de mensaje (sending, sent, error)
- Auto-scroll
- Contador de no leídos
- Persistencia de mensajes (localStorage)
- Soporte multi-idioma básico (es/en)
- Temas (light)

✅ **Avanzadas:**
- Socket.io para tiempo real
- Reconexión automática
- Rate limiting
- Validación de mensajes
- Logging estructurado

---

### 🎯 Próximos Pasos

1. **Revisar esta lista** con el equipo de negocio
2. **Priorizar características** según necesidad y ROI
3. **Documentar decisiones** de qué implementar
4. **Crear roadmap** de implementación

---

## 📞 Soporte

**¿Preguntas sobre la migración?** soporte@saleads.com

**Documentación de Chatwoot API:**  
https://www.chatwoot.com/developers/api/

**Desarrollado por SaleAds** | Versión 1.0.0 → 2.0.0

