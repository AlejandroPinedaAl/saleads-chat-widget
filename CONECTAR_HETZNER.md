# 🔌 Conectar a tu Servidor Hetzner

Guía rápida para conectarte a tu servidor Hetzner.

---

## 📝 Información de tu Servidor

- **IP:** `95.216.196.74`
- **Usuario:** `root`
- **Acceso:** SSH (Root)

---

## 🚀 Comando para Conectarte

### Windows (PowerShell o Git Bash)

```bash
ssh root@95.216.196.74
```

### Si usas clave SSH personalizada

```bash
ssh -i ruta/a/tu/clave.pem root@95.216.196.74
```

---

## 🔑 Primera Conexión

### Si te pide contraseña:

Hetzner te envía la contraseña por email cuando creas el servidor. Búscala en:
- Email de bienvenida de Hetzner
- Panel de Hetzner → Servidor → Reset Password

### Si te pide confirmar fingerprint:

Primera vez que te conectas, verás algo como:
```
The authenticity of host '95.216.196.74 (95.216.196.74)' can't be established.
ECDSA key fingerprint is SHA256:xxxxx.
Are you sure you want to continue connecting (yes/no)?
```

Escribe `yes` y presiona Enter.

---

## ✅ Verificación Rápida

Una vez conectado, ejecuta estos comandos para verificar todo:

```bash
# 1. Verificar Node.js
node --version

# 2. Verificar Nginx
nginx -v
sudo systemctl status nginx

# 3. Ver IP del servidor
hostname -I

# 4. Ver n8n (si está corriendo)
pm2 list | grep n8n

# 5. Ver qué está corriendo
pm2 list
```

---

## 🔒 Si no puedes conectarte

### Error: "Connection refused"

```bash
# Verifica que el servidor esté encendido en el panel de Hetzner
# Verifica que el puerto 22 (SSH) esté abierto
```

### Error: "Permission denied"

**Opción 1 - Usar contraseña:**
```bash
# Asegúrate de usar la contraseña correcta del email de Hetzner
ssh root@95.216.196.74
```

**Opción 2 - Resetear contraseña:**
1. Ve al panel de Hetzner
2. Selecciona tu servidor
3. "Reset" → "Reset root password"
4. Copia la nueva contraseña
5. Intenta conectarte de nuevo

**Opción 3 - Configurar clave SSH:**
```bash
# En tu PC local, generar clave SSH (si no tienes)
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Copiar clave al servidor
ssh-copy-id root@95.216.196.74

# Ahora puedes conectarte sin contraseña
ssh root@95.216.196.74
```

### Error: "Host key verification failed"

```bash
# Limpiar clave conocida
ssh-keygen -R 95.216.196.74

# Intentar de nuevo
ssh root@95.216.196.74
```

---

## 📋 Comandos Útiles Una Vez Conectado

```bash
# Ver información del sistema
uname -a
cat /etc/os-release

# Ver uso de recursos
htop
# O
top

# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver qué puertos están abiertos
sudo netstat -tulpn | grep LISTEN

# Ver logs de sistema
sudo journalctl -u nginx
sudo journalctl -u n8n
```

---

## 🎯 Próximo Paso

Una vez conectado, sigue:

1. **[VERIFICACION_HETZNER.md](./VERIFICACION_HETZNER.md)** - Verificar requisitos
2. **[DEPLOYMENT_HETZNER.md](./DEPLOYMENT_HETZNER.md)** - Deploy del backend

---

**Comando para copiar y pegar:**

```bash
ssh root@95.216.196.74
```

¡Pega esto en tu terminal y presiona Enter! 🚀

---

**Desarrollado por SaleAds** | Versión 1.0.0

