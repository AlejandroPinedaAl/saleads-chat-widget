# 🚀 Deployment en Hetzner - SaleAds Chat Widget

Guía completa para deployar el sistema en Hetzner (donde ya tienes n8n corriendo).

---

## 💰 Ventajas de Hetzner vs Railway

| Aspecto | Hetzner | Railway |
|---------|---------|---------|
| **Costo** | ~€5-20/mes (VPS) | $20-80/mes |
| **Control** | Total (SSH, root) | Limitado |
| **Recursos** | Dedicados | Compartidos |
| **n8n** | Ya lo tienes | Necesitas otro deploy |
| **Escalabilidad** | Manual | Automática |

**Recomendación:** Usa Hetzner para backend (chat-api) y Vercel/Cloudflare para frontend (widget).

---

## 📋 Pre-requisitos

- ✅ Servidor Hetzner con n8n ya corriendo
- ✅ Acceso SSH al servidor
- ✅ Node.js 20+ instalado en el servidor
- ✅ Nginx instalado (o Apache)
- ✅ Dominio configurado (opcional pero recomendado)

**¿No estás seguro si los tienes?** 
→ **[Ve a VERIFICACION_HETZNER.md](./VERIFICACION_HETZNER.md)** para verificar paso a paso.

---

## 🎯 Arquitectura Recomendada

```
Hetzner VPS
├── n8n (ya corriendo)
│   └── Puerto: 5678
│   └── Dominio: n8n.tu-dominio.com
│
├── chat-api (nuevo)
│   └── Puerto: 3000
│   └── Dominio: api-chat.tu-dominio.com
│
└── Nginx (reverse proxy)
    ├── n8n.tu-dominio.com → localhost:5678
    └── api-chat.tu-dominio.com → localhost:3000

Vercel/Cloudflare (CDN)
└── chat-widget
    └── cdn.tu-dominio.com
```

---

## 🚀 Parte 1: Preparar el Servidor

### Paso 1.1: Conectar vía SSH

```bash
ssh root@tu-servidor-hetzner.com
# O con tu usuario no-root:
ssh usuario@tu-servidor-hetzner.com
```

### Paso 1.2: Verificar Node.js

```bash
node --version
# Debe ser >= 20

# Si no está instalado o es versión antigua:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Guía completa de verificación:** [VERIFICACION_HETZNER.md](./VERIFICACION_HETZNER.md)

### Paso 1.3: Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verificar instalación
pm2 --version
```

### Paso 1.4: Crear directorio para el proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/saleads-chat-api
sudo chown -R $USER:$USER /var/www/saleads-chat-api

# Navegar al directorio
cd /var/www/saleads-chat-api
```

---

## 📦 Parte 2: Deploy del Backend (chat-api)

### Paso 2.1: Clonar repositorio

**Opción A - Desde GitHub:**
```bash
cd /var/www/saleads-chat-api
git clone https://github.com/TU-USUARIO/saleads-chat-widget.git .
cd chat-api
```

**Opción B - Subir vía SCP (desde tu PC local):**
```bash
# En tu PC local (Git Bash/PowerShell):
cd "C:\Developer\Widget soporte\chat-api"
scp -r . usuario@tu-servidor-hetzner.com:/var/www/saleads-chat-api/
```

**Opción C - Subir vía SFTP:**
Usa FileZilla o WinSCP para subir la carpeta `chat-api/` a `/var/www/saleads-chat-api/`

### Paso 2.2: Instalar dependencias

```bash
cd /var/www/saleads-chat-api
npm install
```

### Paso 2.3: Configurar variables de entorno

```bash
# Crear archivo .env
nano .env
```

Pega esto y edita con tus valores:

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=production

# ============================================
# GOHIGHLEVEL
# ============================================
GHL_API_KEY=tu_ghl_api_key_aqui
GHL_LOCATION_ID=tu_location_id_aqui
GHL_API_URL=https://services.leadconnectorhq.com

# ============================================
# REDIS (UPSTASH)
# ============================================
UPSTASH_REDIS_REST_URL=tu_upstash_url_aqui
UPSTASH_REDIS_REST_TOKEN=tu_upstash_token_aqui

# ============================================
# SECURITY
# ============================================
WEBHOOK_SECRET=tu_webhook_secret_aqui
JWT_SECRET=tu_jwt_secret_aqui
CORS_ORIGINS=https://cdn.tu-dominio.com,https://tu-sitio.com

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

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

### Paso 2.4: Build del proyecto

```bash
npm run build
```

### Paso 2.5: Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start dist/server.js --name saleads-chat-api

# Ver logs
pm2 logs saleads-chat-api

# Ver estado
pm2 status

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para auto-start en reboot
pm2 startup
# Ejecuta el comando que PM2 te muestre
```

### Paso 2.6: Verificar que funcione

```bash
# Test local
curl http://localhost:3000/api/health

# Debe retornar JSON con status: "ok"
```

---

## 🌐 Parte 3: Configurar Nginx (Reverse Proxy)

### Paso 3.1: Instalar Nginx (si no lo tienes)

```bash
sudo apt update
sudo apt install nginx -y
```

### Paso 3.2: Crear configuración para chat-api

```bash
sudo nano /etc/nginx/sites-available/saleads-chat-api
```

Pega esto (ajusta el dominio):

```nginx
server {
    listen 80;
    server_name api-chat.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/saleads-chat-api-access.log;
    error_log /var/log/nginx/saleads-chat-api-error.log;

    # Proxy al backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (Socket.io)
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (sin cache)
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

### Paso 3.3: Habilitar sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/saleads-chat-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Si todo OK, recargar Nginx
sudo systemctl reload nginx
```

### Paso 3.4: Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.):

```
Tipo: A
Nombre: api-chat
Valor: IP_DE_TU_SERVIDOR_HETZNER
TTL: 3600
```

Espera 5-30 minutos para propagación DNS.

### Paso 3.5: Configurar SSL con Let's Encrypt (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d api-chat.tu-dominio.com

# Certbot configurará automáticamente Nginx para HTTPS
# Elige opción 2: Redirect HTTP to HTTPS

# Verificar auto-renovación
sudo certbot renew --dry-run
```

### Paso 3.6: Verificar que funcione con HTTPS

```bash
curl https://api-chat.tu-dominio.com/api/health
```

Debe retornar JSON con `status: "ok"`.

---

## 🎨 Parte 4: Deploy del Frontend (Widget)

**Recomendación:** Usa Vercel o Cloudflare Pages para el widget (CDN global gratis).

### Opción A: Vercel (Recomendado)

```bash
# En tu PC local:
cd "C:\Developer\Widget soporte\chat-widget"

# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variables de entorno
vercel env add VITE_API_URL
# Pega: https://api-chat.tu-dominio.com

vercel env add VITE_SOCKET_URL
# Pega: https://api-chat.tu-dominio.com

# Deploy a producción
vercel --prod
```

### Opción B: Cloudflare Pages

1. Ve a https://dash.cloudflare.com
2. **Pages** → **Create a project**
3. Conecta tu repo de GitHub
4. Configuración:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `chat-widget`
5. Variables de entorno:
   ```
   VITE_API_URL=https://api-chat.tu-dominio.com
   VITE_SOCKET_URL=https://api-chat.tu-dominio.com
   ```
6. Deploy

### Opción C: Servir desde Hetzner (No recomendado)

Si insistes en servir el widget desde Hetzner:

```bash
# En el servidor Hetzner
cd /var/www
mkdir saleads-chat-widget
cd saleads-chat-widget

# Subir build del widget (desde tu PC)
# En tu PC:
cd "C:\Developer\Widget soporte\chat-widget"
npm run build
scp -r dist/* usuario@tu-servidor-hetzner.com:/var/www/saleads-chat-widget/

# Configurar Nginx para servir archivos estáticos
sudo nano /etc/nginx/sites-available/saleads-chat-widget
```

```nginx
server {
    listen 80;
    server_name cdn.tu-dominio.com;

    root /var/www/saleads-chat-widget;
    index index.html;

    # Logs
    access_log /var/log/nginx/saleads-widget-access.log;
    error_log /var/log/nginx/saleads-widget-error.log;

    # Cache para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # CORS
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

```bash
sudo ln -s /etc/nginx/sites-available/saleads-chat-widget /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d cdn.tu-dominio.com
```

---

## 🔧 Parte 5: Configurar n8n

### Paso 5.1: Agregar nodo HTTP Request

1. Abre tu workflow en n8n (ya corriendo en Hetzner)
2. Al final del workflow, agrega nodo **"HTTP Request"**
3. Configuración:
   - **Method:** `POST`
   - **URL:** `https://api-chat.tu-dominio.com/api/webhook/n8n-response`
   - **Authentication:** Header Auth
     - **Name:** `X-Webhook-Secret`
     - **Value:** `{{ $env.WEBHOOK_SECRET }}`
   - **Body (JSON):**
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

### Paso 5.2: Agregar variable de entorno en n8n

Si n8n está corriendo con PM2:

```bash
# Ver apps de PM2
pm2 list

# Editar variables de entorno de n8n
pm2 env n8n

# O agregar variable directamente
pm2 restart n8n --update-env --env WEBHOOK_SECRET=tu_webhook_secret_aqui

# O editar el archivo de configuración de n8n
nano ~/.n8n/.env
# Agregar:
WEBHOOK_SECRET=tu_webhook_secret_aqui

# Reiniciar n8n
pm2 restart n8n
```

### Paso 5.3: Guardar y activar workflow

1. Click en **"Save"**
2. Asegúrate que esté **"Active"** (toggle en verde)
3. Test con **"Execute Workflow"**

---

## ✅ Parte 6: Verificación Completa

### Test 1: Backend Health Check

```bash
curl https://api-chat.tu-dominio.com/api/health
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

### Test 2: Widget en HTML

Crea `test.html`:

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
            apiUrl: 'https://api-chat.tu-dominio.com',
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="https://cdn.tu-dominio.com/widget.js"></script>
</body>
</html>
```

Abre en navegador y verifica:
- ✅ Botón flotante aparece
- ✅ Click abre ventana
- ✅ Enviar mensaje funciona
- ✅ Respuesta llega del agente IA

### Test 3: Flujo Completo

1. Envía mensaje desde el widget
2. Verifica logs del backend:
   ```bash
   pm2 logs saleads-chat-api
   ```
3. Verifica en n8n que el workflow se ejecutó
4. Verifica en GoHighLevel que se creó el contacto
5. Verifica que la respuesta llegó al widget

---

## 📊 Parte 7: Monitoreo y Mantenimiento

### Ver logs del backend

```bash
# Logs en tiempo real
pm2 logs saleads-chat-api

# Logs de Nginx
sudo tail -f /var/log/nginx/saleads-chat-api-access.log
sudo tail -f /var/log/nginx/saleads-chat-api-error.log
```

### Reiniciar servicios

```bash
# Reiniciar backend
pm2 restart saleads-chat-api

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar n8n
pm2 restart n8n
```

### Ver uso de recursos

```bash
# CPU y memoria
pm2 monit

# Recursos del servidor
htop
# O
top
```

### Actualizar código

```bash
cd /var/www/saleads-chat-api

# Pull cambios de GitHub
git pull

# Reinstalar dependencias (si cambiaron)
npm install

# Rebuild
npm run build

# Reiniciar
pm2 restart saleads-chat-api
```

---

## 🔐 Parte 8: Seguridad Adicional

### Configurar Firewall (UFW)

```bash
# Instalar UFW
sudo apt install ufw -y

# Permitir SSH (IMPORTANTE: antes de habilitar UFW)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar UFW
sudo ufw enable

# Ver estado
sudo ufw status
```

### Fail2ban (Protección contra ataques)

```bash
# Instalar Fail2ban
sudo apt install fail2ban -y

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true
```

```bash
# Reiniciar Fail2ban
sudo systemctl restart fail2ban

# Ver estado
sudo fail2ban-client status
```

---

## 💰 Costos Estimados en Hetzner

### Servidor VPS

| Plan | vCPU | RAM | Storage | Precio/mes |
|------|------|-----|---------|------------|
| CX11 | 1 | 2GB | 20GB | €4.15 |
| CX21 | 2 | 4GB | 40GB | €5.83 |
| CX31 | 2 | 8GB | 80GB | €10.59 |

**Recomendación:** CX21 (€5.83/mes) es suficiente para empezar.

### Servicios Adicionales

- **Upstash Redis:** €0-3/mes
- **Vercel (Widget):** €0/mes
- **Dominio:** €10-15/año

**Total estimado:** €10-15/mes (mucho más barato que Railway)

---

## 🆘 Troubleshooting

### Backend no inicia

```bash
# Ver logs de PM2
pm2 logs saleads-chat-api --lines 100

# Ver si el puerto 3000 está en uso
sudo lsof -i :3000

# Verificar variables de entorno
pm2 env saleads-chat-api
```

### Nginx error 502 Bad Gateway

```bash
# Verificar que el backend esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/saleads-chat-api-error.log

# Reiniciar backend
pm2 restart saleads-chat-api
```

### Socket.io no conecta

```bash
# Verificar configuración de Nginx (debe tener proxy_set_header Upgrade)
sudo nano /etc/nginx/sites-available/saleads-chat-api

# Verificar que CORS_ORIGINS incluya el dominio del widget
nano /var/www/saleads-chat-api/.env

# Reiniciar servicios
pm2 restart saleads-chat-api
sudo systemctl reload nginx
```

### SSL no funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew

# Verificar configuración de Nginx
sudo nginx -t
```

---

## 📚 Comandos Útiles

```bash
# PM2
pm2 list                          # Ver todas las apps
pm2 logs saleads-chat-api         # Ver logs
pm2 restart saleads-chat-api      # Reiniciar
pm2 stop saleads-chat-api         # Detener
pm2 delete saleads-chat-api       # Eliminar
pm2 monit                         # Monitor en tiempo real

# Nginx
sudo nginx -t                     # Verificar configuración
sudo systemctl status nginx       # Ver estado
sudo systemctl restart nginx      # Reiniciar
sudo systemctl reload nginx       # Recargar (sin downtime)

# Logs
pm2 logs saleads-chat-api --lines 100
sudo tail -f /var/log/nginx/saleads-chat-api-access.log
sudo tail -f /var/log/nginx/saleads-chat-api-error.log

# Sistema
htop                              # Monitor de recursos
df -h                             # Espacio en disco
free -m                           # Memoria RAM
```

---

## 🎉 Conclusión

Has deployado el sistema completo en Hetzner:

- ✅ Backend (chat-api) corriendo con PM2
- ✅ Nginx como reverse proxy con SSL
- ✅ Frontend (widget) en Vercel/Cloudflare
- ✅ n8n integrado (ya estaba corriendo)
- ✅ Todo en HTTPS

**Ventajas de esta configuración:**
- 💰 Más económico (~€10-15/mes vs $80-115/mes en Railway)
- 🎛️ Control total del servidor
- 🚀 Mejor performance (recursos dedicados)
- 🔧 Fácil de escalar (upgrade del VPS)

**Siguiente paso:** Actualiza el `CORS_ORIGINS` en el `.env` con tu dominio real y reinicia el backend.

---

**¿Necesitas ayuda?** soporte@saleads.com

**Desarrollado por SaleAds** | Versión 1.0.0

