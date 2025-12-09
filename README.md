# 💬 SaleAds Chat Widget - Sistema Completo

Sistema de chat widget embebido que se conecta a GoHighLevel y n8n para soporte automatizado con IA.

**✅ Código completo generado | ✅ Listo para producción | ✅ Documentación completa**

---

## 🚀 Empezar Aquí

### ⚡ Quick Start (30 minutos)
**[QUICKSTART.md](./QUICKSTART.md)** - Guía rápida para poner todo en marcha en 5 pasos.

### 📊 Resumen Ejecutivo
**[RESUMEN_PROYECTO.md](./RESUMEN_PROYECTO.md)** - Qué se generó, métricas, características.

### 📑 Índice General
**[INDICE.md](./INDICE.md)** - Navegación completa de toda la documentación.

### ⚡ Comandos Esenciales
**[COMANDOS_ESENCIALES.md](./COMANDOS_ESENCIALES.md)** - Comandos copy-paste para desarrollo y deploy.

---

## 📁 Estructura del Proyecto

```
Widget soporte/
├── chat-widget/                    # Frontend - Widget embebido
│   ├── src/
│   │   ├── components/             # 5 componentes React
│   │   ├── store/                  # Zustand state management
│   │   ├── services/               # Socket.io client
│   │   └── types/                  # TypeScript types
│   ├── public/
│   │   └── widget-loader.js        # Script de inyección
│   └── README.md                   # Docs del widget
│
├── chat-api/                       # Backend - API Bridge
│   ├── src/
│   │   ├── config/                 # Configuración
│   │   ├── middleware/             # Auth, rate limit, errors
│   │   ├── routes/                 # HTTP endpoints
│   │   ├── services/               # Redis, GHL, Socket.io
│   │   └── types/                  # TypeScript types
│   └── README.md                   # Docs de la API
│
├── README.md                       # Este archivo
├── INDICE.md                       # 📑 Índice de navegación
├── RESUMEN_PROYECTO.md             # 📊 Resumen ejecutivo
├── QUICKSTART.md                   # ⚡ Guía rápida (30 min)
├── COMANDOS_ESENCIALES.md          # ⚡ Comandos copy-paste
├── MANUAL_SETUP.md                 # 📋 Configuración manual
├── DEPLOYMENT.md                   # 🚀 Deploy en Railway
└── INTEGRATION.md                  # 📖 Integración en sitios
```

**Total:** 40+ archivos | 3,500+ líneas de código | 3,500+ líneas de documentación

---

## 📚 Documentación

### Para Empezar
- **[QUICKSTART.md](./QUICKSTART.md)** - Empezar en 30 minutos ⭐
- **[RESUMEN_PROYECTO.md](./RESUMEN_PROYECTO.md)** - Qué se generó ⭐
- **[INDICE.md](./INDICE.md)** - Navegación completa ⭐
- **[COMANDOS_ESENCIALES.md](./COMANDOS_ESENCIALES.md)** - Comandos útiles ⭐

### Configuración y Deploy
- **[MANUAL_SETUP.md](./MANUAL_SETUP.md)** - Configuración manual (Upstash, GHL, n8n)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy completo en Railway

### Integración
- **[INTEGRATION.md](./INTEGRATION.md)** - Integrar en sitios web (WordPress, Shopify, React, etc.)

### Código
- **[chat-widget/README.md](./chat-widget/README.md)** - Documentación del widget
- **[chat-api/README.md](./chat-api/README.md)** - Documentación de la API

---

## 🎯 Quick Start (Resumen)

### 1. Configuración Manual (15 minutos)
```bash
# Ver MANUAL_SETUP.md para detalles
# - Crear Upstash Redis database
# - Obtener credenciales de GoHighLevel
# - Generar secrets de seguridad
```

### 2. Deploy Backend (5 minutos)

**Opción A - Railway (fácil):**
```bash
cd chat-api
railway login
railway init
railway up
```

**Opción B - Hetzner (económico, recomendado si ya tienes n8n ahí):**
```bash
# Ver DEPLOYMENT_HETZNER.md para instrucciones completas
ssh root@tu-servidor-hetzner.com
cd /var/www/saleads-chat-api
git clone tu-repo
npm install && npm run build
pm2 start dist/server.js --name saleads-chat-api
```

**[→ Guía completa de Hetzner](./DEPLOYMENT_HETZNER.md)**

### 3. Deploy Frontend (3 minutos)
```bash
cd chat-widget
npm install

# Deploy a Vercel
vercel login
vercel
```

### 4. Configurar n8n (2 minutos)
```bash
# Ver MANUAL_SETUP.md - Sección 3
# - Agregar nodo HTTP Request al workflow
# - Configurar webhook URL
# - Activar workflow
```

### 5. Testing (5 minutos)
```bash
# Health check
curl https://tu-api-railway.up.railway.app/api/health

# Test del widget
# Crear test.html y abrir en navegador
```

**Total: 30 minutos**

Ver [QUICKSTART.md](./QUICKSTART.md) para instrucciones detalladas paso a paso.

---

## 💻 Desarrollo Local

### Backend
```bash
cd chat-api
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
# http://localhost:3000
```

### Frontend
```bash
cd chat-widget
npm install
npm run dev
# http://localhost:5173
```

Ver [COMANDOS_ESENCIALES.md](./COMANDOS_ESENCIALES.md) para más comandos.

## ✨ Características

### Widget (Frontend)
- ✅ Botón flotante con badge de no leídos
- ✅ Ventana de chat responsive (400x600px)
- ✅ Mensajes en tiempo real (Socket.io)
- ✅ Indicador de "escribiendo..."
- ✅ Soporte para markdown (bold, italic, links)
- ✅ Persistencia de mensajes (localStorage)
- ✅ Personalizable (colores, posición, idioma)
- ✅ API pública para control programático
- ✅ Eventos personalizados

### Backend (API)
- ✅ REST API + WebSocket (Socket.io)
- ✅ Sesiones en Redis (Upstash)
- ✅ Integración GoHighLevel (CRM)
- ✅ Webhook receiver para n8n
- ✅ Rate limiting multi-nivel
- ✅ Logging estructurado (Winston)
- ✅ Validación con Zod
- ✅ Security (Helmet, CORS, signatures)

### Integraciones
- ✅ GoHighLevel (crear/actualizar contactos)
- ✅ n8n (respuestas de IA)
- ✅ Upstash Redis (sesiones)
- ✅ 8+ plataformas soportadas (WordPress, Shopify, React, etc.)

---

## 🔧 Stack Tecnológico

### Frontend
React 18 · TypeScript 5 · Vite 5 · Tailwind CSS 3 · Socket.io Client 4 · Zustand 4

### Backend
Node.js 20 · TypeScript 5 · Express 4 · Socket.io 4 · Upstash Redis · Winston · Zod

### Infraestructura
Railway · Vercel · Upstash · GoHighLevel · n8n

---

## 🔐 Seguridad

- ✅ HTTPS obligatorio en producción
- ✅ CORS whitelist de dominios
- ✅ Rate limiting (10 msg/min, 100 msg/hora)
- ✅ Webhook signature validation
- ✅ Input sanitization (XSS prevention)
- ✅ Helmet (HTTP security headers)
- ✅ Error handling sin leaks

---

## 📊 Métricas del Proyecto

- **Código:** 3,500+ líneas (TypeScript/React)
- **Documentación:** 3,500+ líneas (10 archivos markdown)
- **Archivos:** 40+ archivos generados
- **Componentes:** 5 componentes React
- **Endpoints:** 4 endpoints HTTP
- **Events:** 6 eventos Socket.io
- **Features:** 40+ características implementadas

---

## 💰 Costos Estimados

- **Railway (Backend):** $0-20/mes
- **Vercel (Widget):** $0/mes
- **Upstash Redis:** $0-3/mes
- **Total:** $0-25/mes para empezar

Para 10K conversaciones/mes: ~$15-20/mes
Para 100K conversaciones/mes: ~$80-115/mes

---

## 🆘 Soporte

**Email:** soporte@saleads.com

**Documentación completa:**
- [INDICE.md](./INDICE.md) - Navegación completa
- [QUICKSTART.md](./QUICKSTART.md) - Guía rápida
- [MANUAL_SETUP.md](./MANUAL_SETUP.md) - Configuración
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy
- [INTEGRATION.md](./INTEGRATION.md) - Integración

---

## 🎉 ¡Listo para Empezar!

1. Lee **[RESUMEN_PROYECTO.md](./RESUMEN_PROYECTO.md)** para entender qué se generó
2. Sigue **[QUICKSTART.md](./QUICKSTART.md)** para poner todo en marcha (30 min)
3. Usa **[COMANDOS_ESENCIALES.md](./COMANDOS_ESENCIALES.md)** como referencia rápida

**Desarrollado por SaleAds** | Versión 1.0.0 | Diciembre 2024

