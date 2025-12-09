# ⚖️ Railway vs Hetzner - Comparación

Guía para decidir dónde deployar el backend del chat widget.

---

## 📊 Comparación Rápida

| Aspecto | Railway | Hetzner |
|---------|---------|---------|
| **Costo/mes** | $20-80 | €5-15 (~$5-16) |
| **Setup** | 5 minutos | 30 minutos |
| **Dificultad** | ⭐ Fácil | ⭐⭐⭐ Intermedio |
| **Control** | Limitado | Total (SSH, root) |
| **Escalabilidad** | Automática | Manual |
| **Recursos** | Compartidos | Dedicados |
| **CI/CD** | Automático | Manual (Git pull) |
| **Logs** | Dashboard web | SSH + PM2 |
| **SSL** | Automático | Manual (Certbot) |
| **Backup** | Automático | Manual |
| **Uptime** | 99.9% SLA | Depende de ti |

---

## 💰 Análisis de Costos

### Railway

**Plan Hobby (Gratis):**
- $5 de crédito mensual
- ~10,000 requests/mes
- Suficiente para testing

**Plan Pro ($20/mes):**
- $20 de crédito mensual
- ~100,000 requests/mes
- Priority support

**Costo por uso:**
- 1,000 conversaciones/mes: ~$2-5
- 10,000 conversaciones/mes: ~$15-20
- 100,000 conversaciones/mes: ~$50-80

**Total con servicios externos:**
- Railway: $20-80/mes
- Upstash Redis: $0-3/mes
- Vercel (widget): $0/mes
- **Total: $20-83/mes**

### Hetzner

**VPS Plans:**
- **CX11:** 1 vCPU, 2GB RAM, 20GB SSD - €4.15/mes (~$4.50)
- **CX21:** 2 vCPU, 4GB RAM, 40GB SSD - €5.83/mes (~$6.30) ⭐
- **CX31:** 2 vCPU, 8GB RAM, 80GB SSD - €10.59/mes (~$11.50)

**Servicios externos:**
- Upstash Redis: €0-3/mes
- Vercel (widget): €0/mes
- Dominio: €10-15/año (~€1/mes)

**Total:**
- Hetzner CX21: €5.83/mes
- Upstash Redis: €2/mes
- Dominio: €1/mes
- **Total: €8-9/mes (~$9-10/mes)**

**Ahorro:** ~$10-70/mes vs Railway

---

## 🎯 ¿Cuál Elegir?

### Elige Railway si:

✅ **Eres nuevo en DevOps**
- No tienes experiencia con servidores Linux
- No quieres lidiar con SSH, Nginx, PM2, etc.

✅ **Quieres deploy rápido**
- Git push → Deploy automático
- No configuración de servidor

✅ **Valoras la simplicidad**
- Dashboard web para todo
- Logs, métricas, variables de entorno en UI

✅ **Necesitas escalabilidad automática**
- Railway escala automáticamente según demanda
- No te preocupas por recursos

✅ **Presupuesto no es problema**
- Puedes pagar $20-80/mes
- Valoras el tiempo sobre el dinero

### Elige Hetzner si:

✅ **Ya tienes n8n en Hetzner** ⭐⭐⭐
- Todo en un solo servidor
- Más fácil de administrar
- Comunicación interna más rápida

✅ **Quieres ahorrar dinero**
- €9/mes vs $20-80/mes
- Hasta 90% de ahorro

✅ **Tienes experiencia con Linux**
- Cómodo con SSH, Nginx, PM2
- Sabes troubleshootear problemas

✅ **Quieres control total**
- Acceso root
- Instalar lo que quieras
- Configurar a tu medida

✅ **Necesitas recursos dedicados**
- CPU y RAM dedicados
- Mejor performance
- Sin "noisy neighbors"

---

## 🚀 Recomendación por Escenario

### Escenario 1: Testing/MVP
**Recomendación:** Railway (plan hobby gratis)
- Deploy en 5 minutos
- $5 de crédito gratis
- Perfecto para probar

### Escenario 2: Producción pequeña (< 10K conversaciones/mes)
**Recomendación:** Hetzner CX21
- €6/mes vs $15-20/mes en Railway
- Suficiente para empezar
- Fácil de escalar

### Escenario 3: Producción mediana (10K-100K conversaciones/mes)
**Recomendación:** Hetzner CX31
- €11/mes vs $50-80/mes en Railway
- Recursos dedicados
- Mejor performance

### Escenario 4: Ya tienes n8n en Hetzner
**Recomendación:** Hetzner (mismo servidor) ⭐⭐⭐
- Todo en un lugar
- Comunicación interna rápida
- Más fácil de administrar
- Ahorro significativo

### Escenario 5: Startup con funding
**Recomendación:** Railway
- Enfócate en producto, no en infraestructura
- Escalabilidad automática
- Menos tiempo de DevOps

---

## 📈 Migración Railway → Hetzner

Si empiezas en Railway y luego quieres migrar a Hetzner:

### Paso 1: Preparar Hetzner
```bash
# Seguir DEPLOYMENT_HETZNER.md
```

### Paso 2: Configurar variables de entorno
```bash
# Copiar .env de Railway a Hetzner
railway variables > .env
```

### Paso 3: Deploy en Hetzner
```bash
# Build y start con PM2
npm run build
pm2 start dist/server.js --name saleads-chat-api
```

### Paso 4: Actualizar DNS
```bash
# Cambiar A record de:
# api-chat.tu-dominio.com → IP de Railway
# a:
# api-chat.tu-dominio.com → IP de Hetzner
```

### Paso 5: Verificar y apagar Railway
```bash
# Test en Hetzner
curl https://api-chat.tu-dominio.com/api/health

# Si todo OK, apagar Railway
railway down
```

**Downtime:** ~5-10 minutos (propagación DNS)

---

## 🔧 Mantenimiento

### Railway
- ✅ Automático
- ✅ Updates de seguridad
- ✅ Backups automáticos
- ✅ Monitoreo incluido

**Tiempo de mantenimiento:** ~0 horas/mes

### Hetzner
- ⚠️ Manual
- ⚠️ Updates de seguridad (tú los aplicas)
- ⚠️ Backups manuales
- ⚠️ Monitoreo manual (PM2, htop)

**Tiempo de mantenimiento:** ~2-4 horas/mes

**Costo de tu tiempo:**
- Si tu hora vale $50: $100-200/mes
- Si tu hora vale $20: $40-80/mes

**Conclusión:** Si tu tiempo vale más de $20/hora, Railway puede ser más barato en total.

---

## 🎓 Curva de Aprendizaje

### Railway
- **Tiempo de aprendizaje:** 1 hora
- **Skills necesarios:** Git básico
- **Dificultad:** ⭐ Fácil

### Hetzner
- **Tiempo de aprendizaje:** 4-8 horas
- **Skills necesarios:**
  - Linux básico (SSH, comandos)
  - Nginx (reverse proxy)
  - PM2 (process manager)
  - SSL/TLS (Certbot)
  - DNS
- **Dificultad:** ⭐⭐⭐ Intermedio

---

## 🆘 Soporte

### Railway
- ✅ Discord community
- ✅ Email support (plan Pro)
- ✅ Documentación completa
- ✅ Status page

### Hetzner
- ✅ Email support (24/7)
- ✅ Documentación (en inglés/alemán)
- ⚠️ No soporte para aplicaciones (solo infraestructura)
- ⚠️ Debes resolver problemas de tu app

---

## 📊 Tabla de Decisión

Suma los puntos y elige la opción con más puntos:

| Criterio | Railway | Hetzner |
|----------|---------|---------|
| Soy nuevo en DevOps | +5 | -5 |
| Ya tengo n8n en Hetzner | -3 | +10 |
| Presupuesto limitado | -3 | +5 |
| Quiero deploy rápido | +5 | -2 |
| Necesito control total | -2 | +5 |
| Valoro mi tiempo | +3 | -3 |
| Tengo experiencia con Linux | -2 | +5 |
| Necesito escalabilidad automática | +5 | -3 |
| Quiero recursos dedicados | -2 | +5 |
| Startup con funding | +5 | -2 |

**Resultado:**
- **Railway gana:** Deploy en Railway
- **Hetzner gana:** Deploy en Hetzner
- **Empate:** Empieza en Railway, migra a Hetzner después

---

## 🎯 Conclusión

### Para ti (con n8n en Hetzner):

**Recomendación: Hetzner** ⭐⭐⭐

**Razones:**
1. Ya tienes n8n ahí (todo en un lugar)
2. Ahorro de €10-70/mes
3. Comunicación interna más rápida
4. Más fácil de administrar (un solo servidor)
5. Recursos dedicados

**Sigue:** [DEPLOYMENT_HETZNER.md](./DEPLOYMENT_HETZNER.md)

---

### Para otros usuarios:

**Recomendación: Railway para empezar, Hetzner para escalar**

**Estrategia:**
1. **Fase 1 (MVP):** Railway (5 minutos de setup)
2. **Fase 2 (Validación):** Seguir en Railway
3. **Fase 3 (Crecimiento):** Migrar a Hetzner (ahorrar costos)

---

**¿Necesitas ayuda para decidir?** soporte@saleads.com

**Desarrollado por SaleAds** | Versión 1.0.0

