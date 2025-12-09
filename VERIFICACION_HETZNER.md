# ✅ Verificación de Requisitos en Hetzner

Guía paso a paso para verificar Node.js, Nginx y dominio en tu servidor Hetzner.

---

## 🔌 Paso 1: Conectar vía SSH

Primero, conecta a tu servidor Hetzner:

```bash
ssh root@tu-servidor-hetzner.com
# O con tu usuario:
ssh usuario@tu-servidor-hetzner.com
```

Si no sabes la IP o el usuario, revisa tu panel de Hetzner.

---

## 📦 Paso 2: Verificar Node.js

### 2.1 Verificar si está instalado

```bash
node --version
```

**Resultados posibles:**

✅ **Si está instalado:**
```bash
v20.10.0
# O cualquier versión >= 20.0.0
```

❌ **Si NO está instalado:**
```bash
bash: node: command not found
```

❌ **Si está instalado pero versión antigua (< 20):**
```bash
v18.17.0
# O v16.x, v14.x, etc.
```

### 2.2 Verificar también npm

```bash
npm --version
```

Debe retornar algo como: `10.2.3` (cualquier versión >= 10 está bien)

### 2.3 Instalar Node.js 20 (si no está o es versión antigua)

**Opción A - NodeSource (Recomendado):**
```bash
# Descargar e instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

**Opción B - NVM (Node Version Manager - Útil para múltiples versiones):**
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar terminal
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20

# Verificar
node --version
```

**Opción C - Snap (Simple pero más lento):**
```bash
sudo snap install node --classic --channel=20
```

---

## 🌐 Paso 3: Verificar Nginx

### 3.1 Verificar si está instalado

```bash
nginx -v
```

**Resultados posibles:**

✅ **Si está instalado:**
```bash
nginx version: nginx/1.18.0 (Ubuntu)
# O cualquier versión
```

❌ **Si NO está instalado:**
```bash
bash: nginx: command not found
```

### 3.2 Verificar estado del servicio

```bash
sudo systemctl status nginx
```

**Resultados:**

✅ **Si está corriendo:**
```
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since...
```

⚠️ **Si está instalado pero detenido:**
```
Active: inactive (dead)
```

❌ **Si no está instalado:**
```
Unit nginx.service could not be found.
```

### 3.3 Instalar Nginx (si no está)

```bash
# Actualizar paquetes
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Iniciar servicio
sudo systemctl start nginx

# Habilitar auto-start en reboot
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx

# Verificar versión
nginx -v
```

### 3.4 Ver configuración de Nginx

```bash
# Ver archivos de configuración
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Ver configuración principal
cat /etc/nginx/nginx.conf | head -20
```

---

## 🌍 Paso 4: Verificar Dominio

### 4.1 Verificar si tienes dominio configurado

**Opción A - Ver archivos de Nginx:**

```bash
# Ver qué dominios están configurados en Nginx
sudo ls -la /etc/nginx/sites-enabled/

# Ver contenido de cada configuración
sudo cat /etc/nginx/sites-enabled/default
# O si tienes configuraciones personalizadas:
sudo cat /etc/nginx/sites-enabled/tu-dominio
```

**Opción B - Ver DNS del servidor:**

```bash
# Ver IP del servidor
hostname -I
# O
ip addr show

# Ver si hay registros DNS apuntando a esta IP
curl ifconfig.me
```

### 4.2 Verificar dominio en DNS

En tu PC local, verifica si tu dominio apunta al servidor:

```bash
# En Windows (PowerShell)
nslookup api-chat.tu-dominio.com

# En Linux/Mac
dig api-chat.tu-dominio.com +short
# O
nslookup api-chat.tu-dominio.com
```

**Resultado esperado:**
```
Server:  ...
Address: ...

Name:    api-chat.tu-dominio.com
Address: 123.45.67.89  # Esta debe ser la IP de tu servidor Hetzner
```

### 4.3 Verificar desde el navegador

Abre en tu navegador:
```
http://api-chat.tu-dominio.com
```

**Resultados:**

✅ **Si funciona:**
- Muestra una página (puede ser error 502 si el backend no está corriendo, pero significa que DNS funciona)

❌ **Si no funciona:**
- "Este sitio no puede ser alcanzado"
- Significa que el dominio no está configurado

---

## 🔧 ¿Puedo usar ngrok?

**Respuesta corta:** **NO, ngrok NO sirve para producción.**

### ¿Por qué no ngrok?

❌ **URLs temporales:**
- La URL de ngrok cambia cada vez que reinicias (gratis)
- El widget necesita una URL fija

❌ **Límites de tráfico:**
- Plan gratuito: 40 requests/minuto
- Plan pago: $8/mes (más caro que un dominio)

❌ **No es seguro:**
- URLs públicas accesibles para cualquiera
- Sin control de acceso

❌ **No funciona con Socket.io bien:**
- WebSockets pueden tener problemas
- CORS issues

### ¿Cuándo usar ngrok?

✅ **Solo para testing/desarrollo:**
- Testear localmente antes de deployar
- Compartir con cliente temporalmente
- Debugging

### Alternativas a ngrok para testing:

**Opción 1 - Cloudflare Tunnel (Gratis):**
```bash
# Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Autenticar
cloudflared tunnel login

# Crear tunnel
cloudflared tunnel create saleads-chat

# Configurar
cloudflared tunnel route dns saleads-chat api-chat.tu-dominio.com

# Iniciar
cloudflared tunnel run saleads-chat
```

**Opción 2 - Dominio real (Recomendado):**

Comprar dominio: €10-15/año (~€1/mes)
- Namecheap
- Cloudflare Registrar
- Google Domains

---

## ✅ Checklist Completo

Ejecuta estos comandos en tu servidor Hetzner y marca lo que funcione:

```bash
# 1. Node.js
echo "=== Node.js ==="
node --version          # [ ] ✅ v20.x o superior
npm --version           # [ ] ✅ v10.x o superior

# 2. Nginx
echo "=== Nginx ==="
nginx -v                # [ ] ✅ Instalado
sudo systemctl status nginx  # [ ] ✅ Active (running)

# 3. Dominio
echo "=== Dominio ==="
hostname -I             # [ ] ✅ IP del servidor
curl ifconfig.me        # [ ] ✅ IP pública (debe coincidir)
# Verifica en tu PC:
# nslookup api-chat.tu-dominio.com  # [ ] ✅ Apunta a la IP correcta
```

---

## 🚀 Soluciones Rápidas

### Si Node.js no está instalado:

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### Si Nginx no está instalado:

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Si no tienes dominio:

**Opción A - Usar IP directamente (Solo para testing):**

```bash
# En el widget, usa la IP directamente:
apiUrl: 'http://123.45.67.89:3000'

# ⚠️ NO funciona con HTTPS
# ⚠️ NO recomendado para producción
```

**Opción B - Comprar dominio (Recomendado):**

1. Compra dominio en:
   - Namecheap.com (~$10/año)
   - Cloudflare Registrar (~$8/año)
   - Google Domains (~$12/año)

2. Configura DNS:
   ```
   Tipo: A
   Nombre: api-chat (o @ para raíz)
   Valor: IP_DE_TU_SERVIDOR_HETZNER
   TTL: 3600
   ```

3. Espera 5-30 minutos

4. Verifica:
   ```bash
   nslookup api-chat.tu-dominio.com
   ```

---

## 📝 Comandos Útiles de Verificación

### Ver todo el stack de una vez:

```bash
echo "=== INFORMACIÓN DEL SERVIDOR ==="
echo ""
echo "1. Sistema Operativo:"
uname -a
echo ""
echo "2. Node.js:"
node --version 2>/dev/null || echo "❌ No instalado"
npm --version 2>/dev/null || echo "❌ No instalado"
echo ""
echo "3. Nginx:"
nginx -v 2>/dev/null || echo "❌ No instalado"
sudo systemctl is-active nginx 2>/dev/null || echo "❌ No activo"
echo ""
echo "4. IP del servidor:"
hostname -I
echo ""
echo "5. IP pública:"
curl -s ifconfig.me
echo ""
echo "6. n8n (si está instalado):"
pm2 list | grep n8n || echo "❌ n8n no encontrado en PM2"
echo ""
echo "7. Puertos abiertos:"
sudo netstat -tulpn | grep LISTEN | head -10
```

Guarda este script como `check-server.sh` y ejecuta:
```bash
chmod +x check-server.sh
./check-server.sh
```

---

## 🆘 Troubleshooting

### Error: "Permission denied" al ejecutar comandos

```bash
# Usa sudo para comandos que lo requieren
sudo systemctl status nginx

# O cambia a usuario root
sudo su -
```

### Error: "Command not found" para node o nginx

```bash
# Verifica PATH
echo $PATH

# Si Node.js está instalado pero no en PATH:
which node
# Si retorna nada, reinstala siguiendo las instrucciones arriba
```

### Error: "Connection refused" al verificar dominio

```bash
# Verifica que el puerto 80 esté abierto
sudo ufw status
# Si está activo, permite HTTP/HTTPS:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## ✅ Resumen

**Para verificar todo rápidamente:**

```bash
# 1. Conecta al servidor
ssh usuario@tu-servidor-hetzner.com

# 2. Ejecuta verificaciones
node --version          # Debe ser >= v20.0.0
nginx -v                # Debe mostrar versión
sudo systemctl status nginx  # Debe estar "active (running)"
hostname -I             # IP del servidor
curl ifconfig.me        # IP pública (debe coincidir)

# 3. En tu PC, verifica DNS
nslookup api-chat.tu-dominio.com  # Debe apuntar a la IP del servidor
```

**Si algo falta:**
- Node.js: Instalar con NodeSource (instrucciones arriba)
- Nginx: `sudo apt install nginx -y`
- Dominio: Comprar dominio (~€10/año) o usar IP (solo testing)

**Sobre ngrok:**
- ❌ NO para producción
- ✅ Solo para testing local
- 💡 Mejor: Dominio real o Cloudflare Tunnel

---

**¿Necesitas ayuda con algo específico?** Ejecuta los comandos y comparte los resultados.

**Desarrollado por SaleAds** | Versión 1.0.0

