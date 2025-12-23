# 🚀 Despliegue en Servidor Hetzner

## 📋 Información del Servidor

- **IP:** 95.216.196.74
- **Puerto Backend:** 8080
- **Usuario:** root
- **Directorio del proyecto:** `/var/www/saleads-chat-api` (probablemente)

---

## 🔧 **PASO 1: Conectarse al servidor**

```bash
ssh root@95.216.196.74
```

---

## 🔄 **PASO 2: Actualizar el código del backend**

```bash
# Navegar al directorio del proyecto
cd /var/www/saleads-chat-api

# O si está en otro lugar:
cd /root/saleads-chat-api
# O buscar:
find / -name "saleads-chat-api" -type d 2>/dev/null

# Guardar cambios locales (si los hay)
git stash

# Obtener últimos cambios de GitHub
git fetch origin

# Cambiar a la rama correcta
git checkout feature/chatwoot-migration

# Actualizar con los últimos cambios
git pull origin feature/chatwoot-migration

# Restaurar cambios locales si los guardaste
# git stash pop
```

---

## 📦 **PASO 3: Compilar el backend**

```bash
# Asegúrate de estar en el directorio chat-api
cd chat-api

# Instalar dependencias (por si agregaste nuevas)
npm install

# Compilar TypeScript a JavaScript
npm run build
```

---

## 🔄 **PASO 4: Reiniciar el servicio**

### **Opción A: Si usas PM2**

```bash
# Verificar procesos de PM2
pm2 list

# Reiniciar el proceso (reemplaza "saleads-chat-api" con el nombre que veas en pm2 list)
pm2 restart saleads-chat-api

# Ver logs en tiempo real
pm2 logs saleads-chat-api
```

### **Opción B: Si usas systemd**

```bash
# Reiniciar servicio
sudo systemctl restart saleads-chat-api

# Ver logs
sudo journalctl -u saleads-chat-api -f
```

### **Opción C: Si lo corres manualmente**

```bash
# Detener proceso actual (Ctrl+C en la terminal donde corre)

# Iniciar de nuevo
cd /var/www/saleads-chat-api/chat-api
npm start

# O con PM2:
pm2 start dist/server.js --name saleads-chat-api
```

---

## ✅ **PASO 5: Verificar que funciona**

### **1. Health Check**

Desde tu computadora local:

```bash
curl http://95.216.196.74:8080/api/health
```

Deberías ver:

```json
{
  "status": "ok",
  "services": {
    "redis": "connected",
    "chatwoot": "connected",
    "socket": "running",
    "n8n": "enabled"
  }
}
```

### **2. Ver logs del servidor**

En el servidor (SSH):

```bash
# Si usas PM2:
pm2 logs saleads-chat-api

# Si usas systemd:
sudo journalctl -u saleads-chat-api -f
```

### **3. Probar el widget**

Abre el widget desde tu navegador y:
1. Envía un mensaje de texto
2. Envía un audio
3. Envía una imagen

**Verifica en los logs del servidor:**

```
✅ [SocketService] User message received
✅ [ChatwootService] Message sent
✅ [N8NService] Message sent successfully
✅ [ChatRoutes] n8n response received  ← ESTE DEBE APARECER AHORA
✅ [SocketService] Agent response emitted
```

---

## 🔧 **PASO 6: Actualizar el Widget (Frontend)**

### **Si el widget está alojado en el mismo servidor:**

```bash
# Navegar al directorio del widget
cd /var/www/saleads-chat-widget/chat-widget

# O donde esté alojado

# Actualizar código
git pull origin feature/chatwoot-migration

# Instalar dependencias
npm install

# Compilar
npm run build

# Los archivos compilados estarán en dist/
# Copiarlos al directorio servido por nginx (si aplica)
# cp dist/* /var/www/html/widget/
```

### **Si el widget está en Vercel/Cloudflare:**

El widget se actualizará automáticamente con el siguiente push a GitHub (si tienes integración continua).

O manualmente:

```bash
# Desde tu computadora local
cd "C:\Developer\Widget soporte\chat-widget"
vercel --prod
```

---

## 🐛 **Troubleshooting**

### **Error: "puerto 8080 ya en uso"**

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :8080

# O con netstat
sudo netstat -tulpn | grep 8080

# Matar el proceso
sudo kill -9 <PID>
```

### **Error: "npm: command not found"**

```bash
# Instalar Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **Error: "pm2: command not found"**

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2
```

### **Los cambios no se aplican**

```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules
npm install

# Recompilar desde cero
npm run build

# Reiniciar con --force
pm2 restart saleads-chat-api --force
```

### **Ver todos los procesos PM2**

```bash
pm2 list
pm2 logs
pm2 monit
```

---

## 📝 **Script de despliegue completo (copia y pega)**

```bash
#!/bin/bash
# Despliegue automático del backend

echo "🚀 Iniciando despliegue..."

# Variables
PROJECT_DIR="/var/www/saleads-chat-api"
BRANCH="feature/chatwoot-migration"
PM2_NAME="saleads-chat-api"

# Navegar al proyecto
cd $PROJECT_DIR

# Actualizar código
echo "📥 Descargando cambios de GitHub..."
git stash
git checkout $BRANCH
git pull origin $BRANCH

# Navegar a chat-api
cd chat-api

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar
echo "🔨 Compilando TypeScript..."
npm run build

# Reiniciar PM2
echo "🔄 Reiniciando servicio..."
pm2 restart $PM2_NAME

# Ver logs
echo "📊 Logs del servicio:"
pm2 logs $PM2_NAME --lines 50

echo "✅ Despliegue completado!"
```

Guarda este script como `deploy.sh` y ejecútalo:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 **Checklist Post-Despliegue**

- [ ] Backend reiniciado correctamente
- [ ] Health check responde OK
- [ ] Logs no muestran errores
- [ ] Mensajes de texto llegan del widget al backend
- [ ] Mensajes llegan de backend a n8n
- [ ] **Respuestas llegan de n8n al backend** (`[ChatRoutes] n8n response received`)
- [ ] Respuestas llegan del backend al widget
- [ ] Los archivos multimedia (audio/imagen) aparecen del lado del usuario
- [ ] Widget actualizado (si es necesario)

---

## 🆘 **Comandos útiles durante el despliegue**

```bash
# Ver procesos
ps aux | grep node

# Ver puertos en uso
sudo netstat -tulpn | grep LISTEN

# Ver espacio en disco
df -h

# Ver memoria
free -m

# Ver logs de nginx (si aplica)
sudo tail -f /var/log/nginx/error.log

# Reiniciar nginx (si aplica)
sudo systemctl restart nginx
```

---

**¿Necesitas ayuda durante el despliegue?**  
Comparte los logs o errores que veas.

---

**Desarrollado por SaleAds** | Versión 1.0.0 | Diciembre 2024

