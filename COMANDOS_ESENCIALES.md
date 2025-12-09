# ⚡ Comandos Esenciales - SaleAds Chat Widget

Comandos rápidos para desarrollo y deployment.

---

## 🚀 Desarrollo Local

### Backend (chat-api)

```bash
# Instalar dependencias
cd chat-api
npm install

# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus credenciales
# (Usar nano, vim, o tu editor favorito)

# Iniciar en modo desarrollo (con hot reload)
npm run dev

# El servidor estará en: http://localhost:3000
# Health check: http://localhost:3000/api/health
```

### Frontend (chat-widget)

```bash
# Instalar dependencias
cd chat-widget
npm install

# Copiar .env.example a .env
cp .env.example .env

# Editar .env con la URL del backend
# VITE_API_URL=http://localhost:3000

# Iniciar en modo desarrollo
npm run dev

# El widget estará en: http://localhost:5173
```

---

## 🏗️ Build para Producción

### Backend

```bash
cd chat-api
npm run build

# Output en: dist/
# Iniciar en producción:
npm start
```

### Frontend

```bash
cd chat-widget
npm run build

# Output en: dist/
# - widget.js
# - widget.css

# Preview del build:
npm run preview
```

---

## 🚂 Deploy en Railway

### Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Login

```bash
railway login
```

### Deploy Backend

```bash
cd chat-api
railway init
# Selecciona: Create new project
# Nombre: saleads-chat-api

railway up
# Sube el código y deploya

# Ver logs:
railway logs

# Ver variables de entorno:
railway variables

# Agregar variable:
railway variables set GHL_API_KEY=tu_api_key_aqui
```

### Deploy Frontend (Opcional en Railway)

```bash
cd chat-widget
railway init
# Selecciona el proyecto existente

railway up
```

---

## 🌐 Deploy en Vercel (Frontend)

### Instalar Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
cd chat-widget
vercel

# Para producción:
vercel --prod
```

### Agregar Variables de Entorno

```bash
vercel env add VITE_API_URL
# Pega: https://tu-api-railway.up.railway.app

vercel env add VITE_SOCKET_URL
# Pega: https://tu-api-railway.up.railway.app

# Re-deploy con nuevas variables:
vercel --prod
```

---

## 🧪 Testing

### Test del Backend

```bash
# Health check
curl http://localhost:3000/api/health

# Enviar mensaje (HTTP)
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_123",
    "message": "Hola, esto es una prueba"
  }'

# Simular webhook de n8n
curl -X POST http://localhost:3000/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: tu_webhook_secret" \
  -d '{
    "sessionId": "test_123",
    "response": "Esta es una respuesta de prueba"
  }'
```

### Test del Widget

Crear archivo `test.html`:

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
            apiUrl: 'http://localhost:3000',
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="http://localhost:5173/src/main.tsx" type="module"></script>
</body>
</html>
```

Abrir en navegador.

---

## 🔍 Debugging

### Ver logs del backend (Railway)

```bash
cd chat-api
railway logs
```

### Ver logs en tiempo real

```bash
railway logs --follow
```

### Ver variables de entorno

```bash
railway variables
```

### Conectar a shell de Railway

```bash
railway shell
```

---

## 🛠️ Comandos Útiles

### Verificar versiones

```bash
node --version  # Debe ser >= 20
npm --version   # Debe ser >= 10
```

### Limpiar node_modules

```bash
# Backend
cd chat-api
rm -rf node_modules package-lock.json
npm install

# Frontend
cd chat-widget
rm -rf node_modules package-lock.json
npm install
```

### Type checking (sin build)

```bash
# Backend
cd chat-api
npm run type-check

# Frontend
cd chat-widget
npm run type-check
```

### Linting

```bash
# Backend
cd chat-api
npm run lint

# Frontend
cd chat-widget
npm run lint
```

---

## 🔐 Generar Secrets

### WEBHOOK_SECRET y JWT_SECRET

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# En PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### API Keys para clientes

```bash
node -e "console.log('sk_live_' + require('crypto').randomBytes(24).toString('hex'))"
```

---

## 📦 Git

### Inicializar repositorio

```bash
cd "C:\Developer\Widget soporte"
git init
git add .
git commit -m "Initial commit: SaleAds Chat Widget"
```

### Conectar con GitHub

```bash
git remote add origin https://github.com/TU-USUARIO/saleads-chat-widget.git
git branch -M main
git push -u origin main
```

### Commits frecuentes

```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push
```

---

## 🔄 Actualizar Dependencias

### Backend

```bash
cd chat-api
npm update
npm audit fix
```

### Frontend

```bash
cd chat-widget
npm update
npm audit fix
```

---

## 📊 Monitoreo

### Health check en producción

```bash
curl https://tu-api-railway.up.railway.app/api/health
```

### Ver métricas

```bash
# En Railway dashboard:
# - CPU usage
# - Memory usage
# - Network traffic
# - Request count
```

---

## 🆘 Troubleshooting Rápido

### Backend no inicia

```bash
# Verificar logs
railway logs

# Verificar variables de entorno
railway variables

# Verificar que PORT no esté configurado manualmente
# (Railway lo asigna automáticamente)
```

### Frontend no carga

```bash
# Verificar build
cd chat-widget
npm run build

# Verificar que los archivos existan
ls dist/

# Debe mostrar:
# - widget.js
# - widget.css
```

### Redis connection failed

```bash
# Verificar credenciales en .env:
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Verificar que no haya espacios extra
# Verificar que la database esté activa en Upstash
```

### CORS blocked

```bash
# Agregar dominio a CORS_ORIGINS en Railway:
railway variables set CORS_ORIGINS="https://cdn.saleads.com,https://tu-dominio.com"

# Re-deploy:
railway up
```

---

## 📚 Documentación Rápida

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Configuración:** [MANUAL_SETUP.md](./MANUAL_SETUP.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Integración:** [INTEGRATION.md](./INTEGRATION.md)
- **API Backend:** [chat-api/README.md](./chat-api/README.md)
- **Widget Frontend:** [chat-widget/README.md](./chat-widget/README.md)

---

## 🎯 Workflow Recomendado

### Día 1: Setup Inicial

```bash
# 1. Configurar servicios externos (15 min)
# - Upstash Redis
# - GoHighLevel API
# - Generar secrets

# 2. Deploy backend (5 min)
cd chat-api
railway init
railway up

# 3. Configurar variables en Railway
railway variables set GHL_API_KEY=...
# (todas las variables del .env.example)

# 4. Verificar health check
curl https://tu-api-railway.up.railway.app/api/health
```

### Día 2: Deploy Widget

```bash
# 1. Deploy frontend (3 min)
cd chat-widget
vercel

# 2. Configurar variables
vercel env add VITE_API_URL
vercel --prod

# 3. Test en HTML
# Crear test.html y abrir en navegador
```

### Día 3: Configurar n8n

```bash
# 1. Agregar nodo HTTP Request al workflow
# 2. Configurar URL del backend
# 3. Agregar WEBHOOK_SECRET a n8n
# 4. Activar workflow
# 5. Test completo
```

---

**¿Necesitas ayuda?** soporte@saleads.com

**Desarrollado por SaleAds** | Versión 1.0.0

