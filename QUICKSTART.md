# 🚀 Quick Start - SaleAds Chat Widget

Guía rápida para poner en marcha el sistema completo en 15 minutos.

---

## 📋 Pre-requisitos

- ✅ Node.js 20+ instalado
- ✅ Cuenta en Railway (https://railway.app)
- ✅ Cuenta en Upstash (https://upstash.com)
- ✅ Cuenta en GoHighLevel con API access
- ✅ n8n corriendo (tu instancia en Railway)

---

## 🎯 Paso 1: Configuración Manual (5 minutos)

### 1.1 Upstash Redis

1. Ve a https://upstash.com → Create Database
2. Nombre: `saleads-chat-sessions`
3. Region: Más cercana a tu servidor
4. Copia: `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`

### 1.2 GoHighLevel

1. Settings → API Key → Create API Key
2. Copia: `GHL_API_KEY`
3. Copia de la URL: `GHL_LOCATION_ID`

### 1.3 Generar Secrets

En tu terminal (Git Bash/PowerShell):

```bash
# WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarda estos valores, los necesitarás en el siguiente paso.

---

## 🚂 Paso 2: Deploy del Backend (5 minutos)

**Tienes 2 opciones:**

### Opción A: Railway (Más fácil, automático)
Sigue las instrucciones abajo.

### Opción B: Hetzner (Más económico, más control) ⭐
Si ya tienes n8n en Hetzner, **[ve a DEPLOYMENT_HETZNER.md](./DEPLOYMENT_HETZNER.md)** para instrucciones completas.

**Ventajas de Hetzner:**
- 💰 Más barato (~€10/mes vs $20-80/mes)
- 🎛️ Control total del servidor
- 🚀 n8n ya está ahí
- 📊 Recursos dedicados

---

### Opción A: Deploy en Railway

### 2.1 Preparar Repositorio

```bash
cd "C:\Developer\Widget soporte"
git init
git add .
git commit -m "Initial commit: SaleAds Chat Widget"
```

Sube a GitHub:
1. Crea repo en https://github.com/new
2. Sigue las instrucciones para pushear

### 2.2 Deploy en Railway

1. Ve a https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Selecciona tu repo: `saleads-chat-widget`
4. Root Directory: `chat-api`
5. Click "Deploy"

### 2.3 Configurar Variables de Entorno

En Railway Dashboard → Variables, agrega:

```bash
NODE_ENV=production
GHL_API_KEY=tu_ghl_api_key_del_paso_1
GHL_LOCATION_ID=tu_location_id_del_paso_1
GHL_API_URL=https://services.leadconnectorhq.com
UPSTASH_REDIS_REST_URL=tu_upstash_url_del_paso_1
UPSTASH_REDIS_REST_TOKEN=tu_upstash_token_del_paso_1
WEBHOOK_SECRET=tu_webhook_secret_generado
JWT_SECRET=tu_jwt_secret_generado
CORS_ORIGINS=https://cdn.saleads.com,https://tu-dominio.com
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
SOCKET_MAX_CONNECTIONS=1000
RATE_LIMIT_MESSAGES_PER_MINUTE=10
RATE_LIMIT_MESSAGES_PER_HOUR=100
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2.4 Obtener URL del Backend

Railway te asignará una URL como:
```
https://saleads-chat-api-production.up.railway.app
```

Guarda esta URL, la necesitarás para el widget y n8n.

---

## 🎨 Paso 3: Deploy del Widget (Frontend) en Vercel (3 minutos)

### 3.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Deploy

```bash
cd chat-widget
vercel login
vercel
```

Configuración:
- Project name: `saleads-chat-widget`
- Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

### 3.3 Configurar Variables de Entorno

```bash
vercel env add VITE_API_URL
# Pega: https://tu-api-railway.up.railway.app

vercel env add VITE_SOCKET_URL
# Pega: https://tu-api-railway.up.railway.app

vercel --prod
```

### 3.4 Obtener URL del Widget

Vercel te asignará una URL como:
```
https://saleads-chat-widget.vercel.app
```

Los archivos estarán en:
- `https://saleads-chat-widget.vercel.app/widget.js`
- `https://saleads-chat-widget.vercel.app/widget.css`

---

## 🔧 Paso 4: Configurar n8n (2 minutos)

### 4.1 Agregar Nodo HTTP Request

1. Abre tu workflow en n8n
2. Al final, agrega nodo "HTTP Request"
3. Configuración:
   - Method: `POST`
   - URL: `https://tu-api-railway.up.railway.app/api/webhook/n8n-response`
   - Authentication: Header Auth
     - Name: `X-Webhook-Secret`
     - Value: `{{ $env.WEBHOOK_SECRET }}`
   - Body (JSON):
   ```json
   {
     "sessionId": "{{ $('Extract GHL Data').item.json.phone_number }}",
     "response": "{{ $('Agente_Orquestador').item.json.output }}",
     "metadata": {
       "subAgent": "{{ $('Agente_Orquestador').item.json.sub_agente || null }}",
       "processingTime": "{{ $('Agente_Orquestador').item.json.tiempo_respuesta || 0 }}",
       "timestamp": "{{ $now.toISO() }}"
     }
   }
   ```

### 4.2 Agregar Variable de Entorno en n8n

En Railway (proyecto de n8n) → Variables:
```bash
WEBHOOK_SECRET=tu_webhook_secret_del_paso_1
```

Deploy y activa el workflow.

---

## ✅ Paso 5: Verificar que Todo Funcione (2 minutos)

### 5.1 Test del Backend

```bash
curl https://tu-api-railway.up.railway.app/api/health
```

Debe retornar:
```json
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "ghl": "connected",
    "socket": "running"
  }
}
```

### 5.2 Test del Widget

Crea archivo `test.html`:

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
            apiUrl: 'https://tu-api-railway.up.railway.app',
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="https://saleads-chat-widget.vercel.app/widget.js"></script>
</body>
</html>
```

Abre en navegador y verifica:
- ✅ Botón flotante aparece
- ✅ Click abre ventana de chat
- ✅ Enviar mensaje funciona
- ✅ Respuesta llega del agente IA

### 5.3 Test Completo

1. Envía mensaje desde el widget
2. Verifica en Railway logs que llegó al backend
3. Verifica en n8n que el workflow se ejecutó
4. Verifica en GoHighLevel que se creó el contacto
5. Verifica que la respuesta llegó de vuelta al widget

---

## 🎉 ¡Listo!

Tu sistema de chat widget está funcionando. Ahora puedes:

### Integrar en tu sitio web

```html
<script>
    window.saleadsConfig = {
        apiUrl: 'https://tu-api-railway.up.railway.app',
        primaryColor: '#3B82F6',
        language: 'es'
    };
</script>
<script src="https://saleads-chat-widget.vercel.app/widget.js"></script>
```

### Personalizar

Ver [INTEGRATION.md](./INTEGRATION.md) para opciones de personalización.

### Monitorear

- **Backend logs:** `railway logs` (en carpeta chat-api)
- **Health check:** `https://tu-api-railway.up.railway.app/api/health`
- **n8n executions:** Panel de n8n

---

## 🆘 Problemas Comunes

### El widget no aparece
- Verifica la consola del navegador (F12)
- Asegúrate que la URL del script sea correcta
- Verifica que no haya bloqueadores de contenido

### Los mensajes no se envían
- Verifica que el backend esté corriendo (health check)
- Verifica que CORS_ORIGINS incluya tu dominio
- Revisa logs del backend en Railway

### No llega respuesta del agente
- Verifica que el workflow de n8n esté activo
- Verifica que WEBHOOK_SECRET sea idéntico en backend y n8n
- Revisa logs de n8n

---

## 📚 Documentación Completa

- **[README.md](./README.md)** - Overview del proyecto
- **[MANUAL_SETUP.md](./MANUAL_SETUP.md)** - Configuración manual detallada
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy completo en Railway
- **[INTEGRATION.md](./INTEGRATION.md)** - Integración en sitios web
- **[chat-widget/README.md](./chat-widget/README.md)** - Docs del widget
- **[chat-api/README.md](./chat-api/README.md)** - Docs de la API

---

**¿Necesitas ayuda?** soporte@saleads.com

**Desarrollado por SaleAds** | Versión 1.0.0

