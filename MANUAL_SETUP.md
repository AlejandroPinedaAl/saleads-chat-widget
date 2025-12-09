# 📋 Configuración Manual - SaleAds Chat Widget

Este documento contiene todos los pasos de configuración manual que debes realizar antes de deployar el sistema.

---

## 📑 Índice

1. [Upstash Redis](#1-upstash-redis)
2. [GoHighLevel](#2-gohighlevel)
3. [n8n Workflow](#3-n8n-workflow)
4. [Secrets de Seguridad](#4-secrets-de-seguridad)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Verificación](#6-verificación)

---

## 1. Upstash Redis

### Paso 1.1: Crear cuenta
1. Ve a https://upstash.com
2. Regístrate con Google/GitHub o email
3. Confirma tu email

### Paso 1.2: Crear Redis Database
1. Click en **"Create Database"**
2. Configuración:
   - **Name:** `saleads-chat-sessions`
   - **Type:** Regional (más barato)
   - **Region:** Selecciona el más cercano a tu servidor Railway
   - **Eviction:** No eviction (importante para sesiones)
   - **TLS:** Enabled (seguridad)
3. Click **"Create"**

### Paso 1.3: Obtener credenciales
1. En el dashboard de tu database, ve a **"Details"**
2. Copia y guarda:
   ```
   UPSTASH_REDIS_REST_URL: https://xxxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
   ```
3. **IMPORTANTE:** Estas credenciales irán en el `.env` del backend

### Paso 1.4: Configurar TTL (Time To Live)
1. Ve a **"CLI"** en el dashboard
2. Ejecuta estos comandos para configurar expiración automática:
   ```redis
   CONFIG SET maxmemory-policy allkeys-lru
   ```
3. Esto asegura que las sesiones antiguas se eliminen automáticamente

---

## 2. GoHighLevel

### Paso 2.1: Obtener API Key
1. Inicia sesión en tu cuenta de GoHighLevel
2. Ve a **Settings** → **API Key**
3. Si no tienes una, click en **"Create API Key"**
4. Copia y guarda:
   ```
   GHL_API_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Paso 2.2: Obtener Location ID
1. En GoHighLevel, ve a **Settings** → **Business Profile**
2. En la URL verás algo como:
   ```
   https://app.gohighlevel.com/location/LOCATION_ID_AQUI/settings
   ```
3. Copia ese `LOCATION_ID_AQUI` y guárdalo:
   ```
   GHL_LOCATION_ID: tu_location_id_aqui
   ```

### Paso 2.3: Verificar permisos de API
Asegúrate que tu API Key tenga permisos para:
- ✅ **Contacts:** Read, Write
- ✅ **Conversations:** Read, Write
- ✅ **Messages:** Send

Para verificar:
1. Settings → API Key → Click en tu key
2. Revisa la sección **"Scopes"**
3. Si faltan permisos, edita y guarda

### Paso 2.4: Configurar Custom Field (Opcional pero recomendado)
Para trackear sesiones del widget:
1. Ve a **Settings** → **Custom Fields**
2. Click **"Add Custom Field"**
3. Configuración:
   - **Field Name:** `Widget Session ID`
   - **Field Key:** `widget_session_id`
   - **Type:** Text
   - **Applies to:** Contacts
4. Guarda

---

## 3. n8n Workflow

### Paso 3.1: Acceder a tu workflow existente
1. Abre n8n en: https://primary-production-01a1.up.railway.app
2. Busca el workflow **"Soporte_cambios_funcional_1.1"**
3. Click para editarlo

### Paso 3.2: Agregar nodo HTTP Request
1. Al final del workflow (después de "Send Response to GoHighLevel")
2. Click en **"+"** → Busca **"HTTP Request"**
3. Arrastra y conecta desde el último nodo

### Paso 3.3: Configurar el nodo HTTP Request

**Configuración básica:**
```
Node Name: Send to API Bridge
Method: POST
URL: https://TU-API-RAILWAY.up.railway.app/api/webhook/n8n-response
```

**Authentication:**
1. Click en **"Add Auth"** → **"Header Auth"**
2. Configuración:
   - **Name:** `X-Webhook-Secret`
   - **Value:** `{{ $env.WEBHOOK_SECRET }}`
   
   ⚠️ **IMPORTANTE:** Debes agregar `WEBHOOK_SECRET` a las variables de entorno de n8n en Railway

**Headers:**
Click en **"Add Header"**:
```
Content-Type: application/json
```

**Body (JSON):**
Activa **"JSON"** y pega:
```json
{
  "sessionId": "{{ $('Extract GHL Data').item.json.phone_number || $('Extract GHL Data').item.json.contact_id }}",
  "response": "{{ $('Agente_Orquestador').item.json.output }}",
  "metadata": {
    "subAgent": "{{ $('Agente_Orquestador').item.json.sub_agente || null }}",
    "processingTime": "{{ $('Agente_Orquestador').item.json.tiempo_respuesta || 0 }}",
    "timestamp": "{{ $now.toISO() }}",
    "contactId": "{{ $('Extract GHL Data').item.json.contact_id }}"
  }
}
```

**Opciones adicionales:**
- ✅ **Ignore SSL Issues:** OFF (seguridad)
- ✅ **Timeout:** 30000 (30 segundos)
- ✅ **Retry On Fail:** ON
- ✅ **Max Tries:** 3

### Paso 3.4: Agregar variable de entorno en n8n (Railway)
1. Ve a tu proyecto n8n en Railway
2. Click en **"Variables"**
3. Agrega:
   ```
   WEBHOOK_SECRET=tu_secret_generado_en_paso_4
   ```
4. Click **"Deploy"** para aplicar cambios

### Paso 3.5: Guardar y activar workflow
1. Click en **"Save"** (arriba derecha)
2. Asegúrate que el workflow esté **"Active"** (toggle en verde)
3. Click en **"Execute Workflow"** para probar

### Paso 3.6: Verificar conexión
1. Revisa los logs del nodo "Send to API Bridge"
2. Debe mostrar: **"200 OK"** o **"Success"**
3. Si hay error, verifica:
   - URL correcta
   - WEBHOOK_SECRET configurado
   - API Bridge deployado y corriendo

---

## 4. Secrets de Seguridad

### Paso 4.1: Generar WEBHOOK_SECRET
En tu terminal (Git Bash, PowerShell, o CMD):

**Opción 1 - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción 2 - PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**Opción 3 - Online:**
Ve a https://generate-secret.vercel.app/32

Guarda el resultado:
```
WEBHOOK_SECRET=a1b2c3d4e5f6...
```

### Paso 4.2: Generar JWT_SECRET (para futuras features)
Repite el proceso anterior y guarda:
```
JWT_SECRET=x1y2z3w4v5u6...
```

### Paso 4.3: Generar API Keys para clientes
Para cada cliente que embeba el widget, genera una API key única:

```bash
node -e "console.log('sk_live_' + require('crypto').randomBytes(24).toString('hex'))"
```

Ejemplo de resultado:
```
sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Guarda estas keys en una hoja de cálculo:
```
Cliente          | API Key                                    | Fecha creación
----------------|--------------------------------------------|--------------
Cliente Demo    | sk_live_abc123...                          | 2024-01-15
Cliente Prod    | sk_live_xyz789...                          | 2024-01-16
```

---

## 5. Variables de Entorno

### Paso 5.1: Backend (chat-api)
Crea un archivo `.env` en `chat-api/` con:

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=production

# ============================================
# GOHIGHLEVEL
# ============================================
GHL_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GHL_LOCATION_ID=tu_location_id_aqui
GHL_API_URL=https://services.leadconnectorhq.com

# ============================================
# REDIS (UPSTASH)
# ============================================
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ

# ============================================
# SECURITY
# ============================================
WEBHOOK_SECRET=tu_webhook_secret_del_paso_4
JWT_SECRET=tu_jwt_secret_del_paso_4
CORS_ORIGINS=https://cdn.saleads.com,https://app.saleads.com

# ============================================
# SOCKET.IO
# ============================================
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
SOCKET_MAX_CONNECTIONS=1000

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_MESSAGES_PER_MINUTE=10
RATE_LIMIT_MESSAGES_PER_HOUR=100
RATE_LIMIT_WINDOW_MS=60000

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FORMAT=json
```

### Paso 5.2: Frontend (chat-widget)
Crea un archivo `.env` en `chat-widget/` con:

```bash
# ============================================
# API CONFIGURATION
# ============================================
VITE_API_URL=https://tu-api-railway.up.railway.app
VITE_SOCKET_URL=https://tu-api-railway.up.railway.app

# ============================================
# WIDGET CONFIGURATION
# ============================================
VITE_DEFAULT_POSITION=bottom-right
VITE_DEFAULT_PRIMARY_COLOR=#3B82F6
VITE_DEFAULT_LANGUAGE=es
```

### Paso 5.3: Railway (Producción)
Cuando hagas deploy a Railway, agrega estas variables en el dashboard:

**Para chat-api:**
1. Ve a tu proyecto en Railway
2. Click en **"Variables"**
3. Click en **"New Variable"**
4. Agrega TODAS las variables del `.env` del backend (excepto PORT, Railway lo asigna automáticamente)

**Para chat-widget:**
1. Las variables `VITE_*` se compilan en build time
2. Configúralas en Railway antes del primer deploy
3. O usa Railway's **"Build Args"**

---

## 6. Verificación

### Checklist de configuración ✅

**Upstash Redis:**
- [ ] Database creada
- [ ] UPSTASH_REDIS_REST_URL copiado
- [ ] UPSTASH_REDIS_REST_TOKEN copiado
- [ ] TTL configurado

**GoHighLevel:**
- [ ] API Key obtenida
- [ ] Location ID obtenido
- [ ] Permisos verificados (Contacts, Conversations, Messages)
- [ ] Custom field creado (opcional)

**n8n:**
- [ ] Nodo HTTP Request agregado al workflow
- [ ] URL del API Bridge configurada
- [ ] Authentication configurada (X-Webhook-Secret)
- [ ] Body JSON configurado
- [ ] WEBHOOK_SECRET agregado a variables de entorno de n8n
- [ ] Workflow guardado y activado

**Secrets:**
- [ ] WEBHOOK_SECRET generado
- [ ] JWT_SECRET generado
- [ ] API Keys de clientes generadas (si aplica)

**Variables de Entorno:**
- [ ] `.env` del backend creado y completo
- [ ] `.env` del frontend creado y completo
- [ ] Variables agregadas a Railway (cuando hagas deploy)

### Test de conectividad

**Test 1: Upstash Redis**
```bash
curl -X POST https://TU-UPSTASH-URL/set/test/hello \
  -H "Authorization: Bearer TU-UPSTASH-TOKEN"
```
Debe retornar: `{"result":"OK"}`

**Test 2: GoHighLevel API**
```bash
curl https://services.leadconnectorhq.com/locations/TU-LOCATION-ID \
  -H "Authorization: Bearer TU-GHL-API-KEY"
```
Debe retornar: JSON con datos de tu location

**Test 3: n8n Webhook (después de deploy)**
```bash
curl -X POST https://TU-API-RAILWAY.up.railway.app/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: TU-WEBHOOK-SECRET" \
  -d '{"sessionId":"test","response":"test","metadata":{}}'
```
Debe retornar: `{"received":true}`

---

## 🆘 Troubleshooting

### Error: "Redis connection failed"
- Verifica que UPSTASH_REDIS_REST_URL y TOKEN sean correctos
- Asegúrate que no haya espacios extra al copiar
- Verifica que la database esté activa en Upstash

### Error: "GoHighLevel API 401 Unauthorized"
- Verifica que GHL_API_KEY sea correcta
- Asegúrate que la API key no haya expirado
- Verifica permisos de la API key

### Error: "n8n webhook signature invalid"
- Verifica que WEBHOOK_SECRET sea idéntico en:
  - Backend (.env)
  - n8n (variables de entorno)
- No debe tener espacios ni saltos de línea

### Error: "CORS blocked"
- Agrega el dominio del widget a CORS_ORIGINS
- Formato: `https://dominio.com` (sin trailing slash)
- Separa múltiples dominios con comas

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs del backend: `railway logs`
2. Verifica el health check: `GET /api/health`
3. Contacta: soporte@saleads.com

---

**Siguiente paso:** Una vez completada esta configuración, procede a [DEPLOYMENT.md](./DEPLOYMENT.md) para deployar en Railway.

