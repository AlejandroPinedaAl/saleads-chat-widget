# 🚀 Deployment en Railway - SaleAds Chat Widget

Guía completa para deployar el sistema en Railway.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de haber completado:
- ✅ [MANUAL_SETUP.md](./MANUAL_SETUP.md) - Configuración de Upstash, GHL, n8n
- ✅ Cuenta en Railway (https://railway.app)
- ✅ Git instalado
- ✅ Node.js 20+ instalado localmente

---

## 🎯 Arquitectura de Deployment

```
Railway Project: saleads-chat-system
├── Service 1: chat-api (Backend)
│   ├── Domain: api-chat.saleads.com
│   ├── Port: 3000 (auto-asignado por Railway)
│   └── Variables: 15+ env vars
│
└── Service 2: chat-widget (Frontend - Opcional)
    ├── Domain: cdn.saleads.com
    ├── Static files: widget.js, widget.css
    └── Variables: 3 env vars
```

**Nota:** El frontend (widget) puede deployarse en Railway, Vercel, Netlify, o Cloudflare Pages. Railway es opcional para el widget.

---

## 📦 Parte 1: Preparación del Repositorio

### Paso 1.1: Inicializar Git (si no lo has hecho)

```bash
cd "C:\Developer\Widget soporte"
git init
git add .
git commit -m "Initial commit: SaleAds Chat Widget System"
```

### Paso 1.2: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `saleads-chat-widget`
3. Privado o Público (tu elección)
4. **NO** inicialices con README (ya tienes uno)
5. Click **"Create repository"**

### Paso 1.3: Conectar y pushear

```bash
git remote add origin https://github.com/TU-USUARIO/saleads-chat-widget.git
git branch -M main
git push -u origin main
```

---

## 🚂 Parte 2: Deploy del Backend (chat-api)

### Paso 2.1: Instalar Railway CLI

**Opción 1 - NPM (recomendado):**
```bash
npm install -g @railway/cli
```

**Opción 2 - Scoop (Windows):**
```bash
scoop install railway
```

**Verificar instalación:**
```bash
railway --version
```

### Paso 2.2: Login en Railway

```bash
railway login
```

Esto abrirá tu navegador para autenticarte.

### Paso 2.3: Crear proyecto en Railway

**Opción A - Desde CLI:**
```bash
cd chat-api
railway init
```

Selecciona:
- **"Create a new project"**
- Nombre: `saleads-chat-api`
- Región: Selecciona la más cercana (ej: `us-west1`)

**Opción B - Desde Dashboard:**
1. Ve a https://railway.app/new
2. Click **"Empty Project"**
3. Nombre: `saleads-chat-api`

### Paso 2.4: Conectar repositorio (Método recomendado)

1. En Railway Dashboard, click en tu proyecto
2. Click **"New"** → **"GitHub Repo"**
3. Autoriza Railway a acceder a tu GitHub
4. Selecciona el repo: `saleads-chat-widget`
5. **Root Directory:** `chat-api` (importante)
6. Click **"Deploy"**

### Paso 2.5: Configurar variables de entorno

En el dashboard de Railway:

1. Click en tu service **"chat-api"**
2. Ve a la pestaña **"Variables"**
3. Click **"New Variable"** y agrega:

```bash
# ============================================
# SERVER
# ============================================
NODE_ENV=production

# ============================================
# GOHIGHLEVEL
# ============================================
GHL_API_KEY=tu_ghl_api_key_del_manual_setup
GHL_LOCATION_ID=tu_location_id_del_manual_setup
GHL_API_URL=https://services.leadconnectorhq.com

# ============================================
# REDIS (UPSTASH)
# ============================================
UPSTASH_REDIS_REST_URL=tu_upstash_url_del_manual_setup
UPSTASH_REDIS_REST_TOKEN=tu_upstash_token_del_manual_setup

# ============================================
# SECURITY
# ============================================
WEBHOOK_SECRET=tu_webhook_secret_generado
JWT_SECRET=tu_jwt_secret_generado
CORS_ORIGINS=https://cdn.saleads.com,https://app.saleads.com,https://tu-dominio.com

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

4. Click **"Add"** después de cada variable

**⚠️ IMPORTANTE:** Railway asigna automáticamente la variable `PORT`, NO la agregues manualmente.

### Paso 2.6: Configurar dominio personalizado (Opcional)

1. En Railway, ve a **"Settings"** del service
2. Scroll a **"Networking"**
3. Click **"Generate Domain"** (Railway te dará un dominio gratuito como: `saleads-chat-api-production.up.railway.app`)
4. O agrega tu dominio personalizado:
   - Click **"Custom Domain"**
   - Ingresa: `api-chat.saleads.com`
   - Agrega el CNAME en tu DNS:
     ```
     Type: CNAME
     Name: api-chat
     Value: [valor que Railway te proporcione]
     TTL: 3600
     ```
   - Espera propagación DNS (5-30 minutos)

### Paso 2.7: Verificar deployment

1. Railway automáticamente detectará el `package.json` y ejecutará:
   ```bash
   npm install
   npm run build
   npm start
   ```

2. Verifica los logs:
   - En Railway Dashboard → **"Deployments"**
   - Debe mostrar: `✓ Server running on port XXXX`

3. Test el health check:
   ```bash
   curl https://tu-dominio-railway.up.railway.app/api/health
   ```
   
   Debe retornar:
   ```json
   {
     "status": "ok",
     "services": {
       "redis": "connected",
       "ghl": "connected",
       "socket": "running"
     },
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

---

## 🎨 Parte 3: Deploy del Frontend (chat-widget)

Tienes 3 opciones: Railway, Vercel, o Cloudflare Pages.

### Opción A: Railway (más simple, todo en un lugar)

#### Paso 3A.1: Crear nuevo service en el mismo proyecto

```bash
cd chat-widget
railway link  # Selecciona el proyecto existente
railway up
```

O desde Dashboard:
1. En tu proyecto `saleads-chat-api`
2. Click **"New"** → **"GitHub Repo"**
3. Selecciona el mismo repo
4. **Root Directory:** `chat-widget`
5. Click **"Deploy"**

#### Paso 3A.2: Configurar variables de entorno

```bash
VITE_API_URL=https://tu-dominio-railway-api.up.railway.app
VITE_SOCKET_URL=https://tu-dominio-railway-api.up.railway.app
VITE_DEFAULT_POSITION=bottom-right
VITE_DEFAULT_PRIMARY_COLOR=#3B82F6
VITE_DEFAULT_LANGUAGE=es
```

#### Paso 3A.3: Configurar build settings

Railway detectará automáticamente Vite, pero verifica en **"Settings"** → **"Build"**:

```bash
Build Command: npm run build
Start Command: npx serve -s dist -l $PORT
```

#### Paso 3A.4: Configurar dominio

1. **"Generate Domain"** o agrega custom domain: `cdn.saleads.com`
2. Agrega CNAME en tu DNS

### Opción B: Vercel (recomendado para frontend)

#### Paso 3B.1: Instalar Vercel CLI

```bash
npm install -g vercel
```

#### Paso 3B.2: Deploy

```bash
cd chat-widget
vercel login
vercel
```

Configuración:
- **Set up and deploy?** Yes
- **Which scope?** Tu cuenta
- **Link to existing project?** No
- **Project name:** saleads-chat-widget
- **Directory:** `./` (ya estás en chat-widget)
- **Override settings?** Yes
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`

#### Paso 3B.3: Configurar variables de entorno

```bash
vercel env add VITE_API_URL
# Pega: https://tu-dominio-railway-api.up.railway.app

vercel env add VITE_SOCKET_URL
# Pega: https://tu-dominio-railway-api.up.railway.app

vercel env add VITE_DEFAULT_PRIMARY_COLOR
# Pega: #3B82F6
```

O desde dashboard:
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. **"Settings"** → **"Environment Variables"**
4. Agrega las variables

#### Paso 3B.4: Deploy a producción

```bash
vercel --prod
```

#### Paso 3B.5: Configurar dominio

1. En Vercel Dashboard → **"Settings"** → **"Domains"**
2. Agrega: `cdn.saleads.com`
3. Configura DNS:
   ```
   Type: CNAME
   Name: cdn
   Value: cname.vercel-dns.com
   ```

### Opción C: Cloudflare Pages

#### Paso 3C.1: Conectar repositorio

1. Ve a https://dash.cloudflare.com
2. **"Pages"** → **"Create a project"**
3. **"Connect to Git"** → Selecciona tu repo
4. Configuración:
   - **Project name:** saleads-chat-widget
   - **Production branch:** main
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `chat-widget`

#### Paso 3C.2: Variables de entorno

En **"Settings"** → **"Environment variables"**:
```bash
VITE_API_URL=https://tu-dominio-railway-api.up.railway.app
VITE_SOCKET_URL=https://tu-dominio-railway-api.up.railway.app
```

#### Paso 3C.3: Deploy

Click **"Save and Deploy"**

#### Paso 3C.4: Configurar dominio

1. **"Custom domains"** → **"Set up a custom domain"**
2. Agrega: `cdn.saleads.com`
3. Cloudflare configurará automáticamente el DNS

---

## 🔧 Parte 4: Configuración Post-Deployment

### Paso 4.1: Actualizar CORS en el backend

Una vez tengas el dominio del widget, actualiza en Railway (chat-api):

```bash
CORS_ORIGINS=https://cdn.saleads.com,https://tu-sitio-cliente.com
```

Agrega todos los dominios que usarán el widget, separados por comas.

### Paso 4.2: Actualizar n8n webhook URL

En tu workflow de n8n:
1. Edita el nodo **"Send to API Bridge"**
2. Actualiza la URL a tu dominio de Railway:
   ```
   https://tu-dominio-railway-api.up.railway.app/api/webhook/n8n-response
   ```
3. Guarda y activa el workflow

### Paso 4.3: Actualizar widget loader

El archivo `widget-loader.js` debe apuntar a tu CDN:

```javascript
// En chat-widget/public/widget-loader.js
const WIDGET_JS_URL = 'https://cdn.saleads.com/widget.js';
const WIDGET_CSS_URL = 'https://cdn.saleads.com/widget.css';
const API_URL_DEFAULT = 'https://tu-dominio-railway-api.up.railway.app';
```

Commitea y pushea los cambios:
```bash
git add .
git commit -m "Update URLs to production domains"
git push
```

Railway/Vercel/Cloudflare re-deployará automáticamente.

---

## 🧪 Parte 5: Testing en Producción

### Paso 5.1: Test del backend

```bash
# Health check
curl https://tu-api.up.railway.app/api/health

# Debe retornar:
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "ghl": "connected",
    "socket": "running"
  }
}
```

### Paso 5.2: Test del widget

Crea un archivo HTML de prueba:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test Widget</title>
</head>
<body>
    <h1>Test SaleAds Widget</h1>
    
    <script>
        window.saleadsConfig = {
            apiUrl: 'https://tu-api.up.railway.app',
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="https://cdn.saleads.com/widget.js"></script>
</body>
</html>
```

Abre en navegador y verifica:
- ✅ Botón flotante aparece
- ✅ Click abre ventana de chat
- ✅ Enviar mensaje funciona
- ✅ Respuesta llega en tiempo real

### Paso 5.3: Test de Socket.io

```bash
# Instalar wscat
npm install -g wscat

# Conectar al WebSocket
wscat -c wss://tu-api.up.railway.app

# Enviar evento
> {"event": "join-session", "data": {"sessionId": "test-123"}}

# Debe responder con confirmación
```

### Paso 5.4: Test de integración completa

1. Envía un mensaje desde el widget
2. Verifica en Railway logs que llegó al backend
3. Verifica en n8n que el workflow se ejecutó
4. Verifica en GoHighLevel que se creó el contacto
5. Verifica que la respuesta llegó de vuelta al widget

---

## 📊 Parte 6: Monitoreo y Logs

### Paso 6.1: Ver logs en Railway

```bash
# Desde CLI
railway logs

# O desde Dashboard
# Click en tu service → "Deployments" → Click en el deployment → "View Logs"
```

### Paso 6.2: Configurar alertas (Opcional)

Railway no tiene alertas nativas, pero puedes integrar con:

**Opción 1 - Better Stack (recomendado):**
1. Crea cuenta en https://betterstack.com
2. Crea un **"Source"** para logs
3. En Railway, agrega variable:
   ```bash
   BETTERSTACK_SOURCE_TOKEN=tu_token_aqui
   ```
4. El backend enviará logs automáticamente

**Opción 2 - Sentry (para errores):**
1. Crea cuenta en https://sentry.io
2. Crea proyecto Node.js
3. En Railway, agrega:
   ```bash
   SENTRY_DSN=tu_sentry_dsn_aqui
   ```
4. Instala en backend:
   ```bash
   npm install @sentry/node
   ```

### Paso 6.3: Métricas de Railway

Railway proporciona métricas básicas:
- **CPU Usage**
- **Memory Usage**
- **Network (Ingress/Egress)**
- **Request Count**

Accede en: Dashboard → Service → **"Metrics"**

---

## 🔄 Parte 7: CI/CD y Auto-Deploy

### Configuración automática

Railway detecta automáticamente cambios en tu repo de GitHub y re-deploya.

**Configurar branches:**

1. **Production:** main
   - Deploy automático en cada push a `main`
   - URL: https://tu-api.up.railway.app

2. **Staging (Opcional):**
   - En Railway Dashboard → **"New Environment"**
   - Nombre: `staging`
   - Branch: `develop`
   - URL: https://tu-api-staging.up.railway.app

### Workflow recomendado

```bash
# Desarrollo local
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "Add nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Después de review, merge a develop

# Merge a develop → Deploy automático a staging
git checkout develop
git merge feature/nueva-funcionalidad
git push

# Test en staging, si todo OK:
git checkout main
git merge develop
git push  # Deploy automático a producción
```

---

## 🔐 Parte 8: Seguridad Post-Deployment

### Paso 8.1: Configurar rate limiting en Railway

Railway no tiene rate limiting nativo, pero tu backend ya lo implementa.

Verifica en logs que funcione:
```bash
railway logs | grep "Rate limit"
```

### Paso 8.2: Configurar firewall (Opcional)

Si usas Cloudflare:
1. Agrega tu dominio a Cloudflare
2. Activa **"Firewall Rules"**
3. Crea regla:
   ```
   If: (http.request.uri.path contains "/api/webhook/n8n-response")
   Then: Block
   Unless: (ip.src in {IP_DE_N8N})
   ```

### Paso 8.3: Rotar secrets periódicamente

Cada 90 días, regenera:
- `WEBHOOK_SECRET`
- `JWT_SECRET`
- API Keys de clientes

Actualiza en:
1. Railway variables
2. n8n environment variables
3. Documentación de clientes

---

## 💰 Parte 9: Costos Estimados

### Railway (Backend)

**Plan Hobby (Gratis):**
- $5 de crédito mensual
- Suficiente para ~10,000 requests/mes
- 512MB RAM, 1GB storage

**Plan Pro ($20/mes):**
- $20 de crédito mensual
- ~100,000 requests/mes
- 8GB RAM, 100GB storage
- Priority support

**Uso estimado:**
- 1,000 conversaciones/mes: ~$2-5
- 10,000 conversaciones/mes: ~$15-20
- 100,000 conversaciones/mes: ~$50-80

### Upstash Redis

**Plan Free:**
- 10,000 commands/day
- 256MB storage
- Suficiente para empezar

**Plan Pay-as-you-go:**
- $0.2 por 100,000 commands
- $0.25 por GB de storage

**Uso estimado:**
- 1,000 sesiones/mes: Gratis
- 10,000 sesiones/mes: ~$2-3
- 100,000 sesiones/mes: ~$10-15

### Vercel (Frontend)

**Plan Hobby (Gratis):**
- 100GB bandwidth/mes
- Unlimited requests
- Suficiente para la mayoría

**Plan Pro ($20/mes):**
- 1TB bandwidth
- Priority CDN

### Total estimado

| Volumen | Railway | Upstash | Vercel | Total/mes |
|---------|---------|---------|--------|-----------|
| Bajo (1K) | Gratis | Gratis | Gratis | $0 |
| Medio (10K) | $5-10 | $2-3 | Gratis | $7-13 |
| Alto (100K) | $50-80 | $10-15 | $20 | $80-115 |

---

## 🆘 Troubleshooting

### Error: "Application failed to respond"

**Causa:** El backend no está escuchando en el puerto correcto.

**Solución:**
```typescript
// En server.ts, asegúrate de usar process.env.PORT
const PORT = process.env.PORT || 3000;
```

### Error: "CORS policy blocked"

**Causa:** El dominio del widget no está en CORS_ORIGINS.

**Solución:**
```bash
# En Railway, actualiza:
CORS_ORIGINS=https://cdn.saleads.com,https://cliente.com
```

### Error: "Redis connection timeout"

**Causa:** Upstash URL o token incorrectos.

**Solución:**
1. Verifica en Upstash Dashboard
2. Copia nuevamente URL y token
3. Actualiza en Railway
4. Re-deploya

### Error: "Webhook signature invalid"

**Causa:** WEBHOOK_SECRET diferente entre backend y n8n.

**Solución:**
1. Genera nuevo secret
2. Actualiza en Railway (backend)
3. Actualiza en Railway (n8n)
4. Re-deploya ambos

### Build fails en Railway

**Causa:** Dependencias faltantes o error de TypeScript.

**Solución:**
```bash
# Verifica localmente
cd chat-api
npm install
npm run build

# Si funciona local, verifica package.json:
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

---

## 📚 Recursos Adicionales

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Upstash
- Docs: https://docs.upstash.com
- Discord: https://discord.gg/upstash

### Vercel
- Docs: https://vercel.com/docs
- Discord: https://discord.gg/vercel

---

## ✅ Checklist Final

Antes de considerar el deployment completo:

**Backend:**
- [ ] Deployado en Railway
- [ ] Todas las variables de entorno configuradas
- [ ] Health check responde OK
- [ ] Logs muestran "Server running"
- [ ] Dominio personalizado configurado (opcional)
- [ ] CORS configurado correctamente

**Frontend:**
- [ ] Deployado en Railway/Vercel/Cloudflare
- [ ] Variables VITE_* configuradas
- [ ] widget.js accesible vía CDN
- [ ] widget.css accesible vía CDN
- [ ] Dominio personalizado configurado (opcional)

**Integración:**
- [ ] n8n webhook apunta a Railway URL
- [ ] WEBHOOK_SECRET idéntico en backend y n8n
- [ ] Test de mensaje completo funciona
- [ ] Respuesta llega del agente IA
- [ ] Contacto se crea en GoHighLevel

**Seguridad:**
- [ ] HTTPS habilitado (automático en Railway)
- [ ] Rate limiting funcionando
- [ ] Secrets rotados y guardados de forma segura
- [ ] CORS restringido a dominios específicos

**Monitoreo:**
- [ ] Logs accesibles en Railway
- [ ] Métricas visibles en dashboard
- [ ] Alertas configuradas (opcional)

---

**¡Felicidades!** 🎉 Tu sistema de chat widget está deployado y listo para producción.

**Siguiente paso:** Lee [INTEGRATION.md](./INTEGRATION.md) para saber cómo integrar el widget en sitios de clientes.

