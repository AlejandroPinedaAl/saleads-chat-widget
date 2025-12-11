# 🔧 Guía: Acceso al Servidor Hetzner

## 📋 Problema

No puedes acceder al directorio `/root/saleads-chat-api` porque:
1. El directorio puede tener otro nombre
2. Puede estar en otra ubicación
3. El proyecto puede estar en un usuario diferente

---

## 🔍 Paso 1: Conectar por SSH

```bash
ssh root@95.216.196.74
```

Ingresa la contraseña cuando te la pida.

---

## 🔍 Paso 2: Buscar el Directorio del Proyecto

Una vez conectado, ejecuta estos comandos uno por uno:

### 2.1 Ver qué hay en /root/

```bash
ls -la /root/
```

Esto mostrará todos los archivos y directorios. Busca algo como:
- `saleads-chat-api`
- `chat-api`
- `widget-chat`
- O cualquier nombre relacionado

### 2.2 Si no encuentras nada, buscar por nombre

```bash
find /root -type d -name "*chat*" 2>/dev/null
find /root -type d -name "*saleads*" 2>/dev/null
find /root -type d -name "*api*" 2>/dev/null
```

### 2.3 Buscar procesos de PM2

Si el backend está corriendo con PM2, podemos encontrarlo así:

```bash
pm2 list
```

Esto mostrará todos los procesos de PM2. Busca uno llamado `saleads-chat-api` o similar.

Luego, para ver dónde está ejecutándose:

```bash
pm2 describe saleads-chat-api
```

O si tiene otro nombre:

```bash
pm2 list | grep chat
pm2 list | grep api
```

---

## 🔍 Paso 3: Buscar por Puerto

Si el backend está corriendo en el puerto 5678, podemos encontrarlo:

```bash
lsof -i :5678 | grep LISTEN
```

O:

```bash
netstat -tlnp | grep 5678
```

Esto mostrará el PID del proceso. Luego:

```bash
ps aux | grep <PID>
```

O directamente:

```bash
ps aux | grep "node.*5678"
ps aux | grep "chat-api"
```

---

## 🔍 Paso 4: Buscar Archivos de Configuración

Buscar archivos `.env` o `package.json` que puedan indicar la ubicación:

```bash
find /root -name ".env" 2>/dev/null | head -5
find /root -name "package.json" 2>/dev/null | grep -i chat
```

---

## 🔍 Paso 5: Verificar Variables de Entorno de PM2

```bash
pm2 env saleads-chat-api
```

O si tiene otro nombre:

```bash
pm2 info saleads-chat-api
```

---

## 📝 Ubicaciones Comunes

El proyecto podría estar en:

1. `/root/chat-api/`
2. `/root/widget-chat-api/`
3. `/root/saleads-chat-api/`
4. `/opt/chat-api/`
5. `/var/www/chat-api/`
6. `/home/` (si hay otro usuario)

---

## ✅ Una vez que encuentres el directorio

Una vez que encuentres dónde está el proyecto:

```bash
cd /ruta/encontrada
pwd  # Verifica que estás en el lugar correcto
ls -la  # Ve los archivos del proyecto
```

---

## 🆘 Si no encuentras el proyecto

1. **Verificar si está en otro usuario:**
   ```bash
   ls -la /home/
   ```

2. **Buscar en todo el sistema (puede tardar):**
   ```bash
   find / -type d -name "*chat*" 2>/dev/null | grep -v proc | grep -v sys
   ```

3. **Verificar si el proyecto existe pero con otro nombre:**
   ```bash
   cd /root
   ls -la | grep -E "(api|chat|widget|saleads)"
   ```

---

## 🔧 Ejemplo de Búsqueda Completa

Ejecuta estos comandos en orden:

```bash
# 1. Ver contenido de /root
ls -la /root/

# 2. Ver procesos PM2
pm2 list

# 3. Buscar directorios relacionados
find /root -type d -maxdepth 2 -name "*chat*" 2>/dev/null
find /root -type d -maxdepth 2 -name "*api*" 2>/dev/null

# 4. Ver qué está corriendo en el puerto 5678
netstat -tlnp | grep 5678

# 5. Si encuentras el proceso, ver su directorio
# (Reemplaza <nombre-proceso> con el nombre que veas en pm2 list)
pm2 describe <nombre-proceso>
```

---

## 📌 Después de encontrar el directorio

Cuando encuentres el directorio correcto, ejecuta:

```bash
cd /ruta/encontrada
cat .env | grep N8N  # Ver variables de n8n actuales
nano .env            # Editar el .env
```

Y agrega estas líneas si no existen:

```env
N8N_WEBHOOK_URL=https://n8n-agencia-n8n.3e3qzn.easypanel.host/webhook/gohighlevel-webhook
N8N_DIRECT_ENABLED=true
N8N_TIMEOUT=30000
```

Luego reinicia:

```bash
pm2 restart saleads-chat-api
# O el nombre que tenga tu proceso
```

