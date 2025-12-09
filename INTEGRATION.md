# 📖 Integración del Widget de Chat de SaleAds

Guía completa para integrar el widget de chat en cualquier sitio web.

---

## 🚀 Instalación Rápida (1 línea)

Agrega este código antes de cerrar `</body>`:

```html
<script src="https://cdn.saleads.com/widget.js"></script>
```

¡Listo! El widget aparecerá en la esquina inferior derecha de tu sitio.

---

## ⚙️ Instalación con Configuración Personalizada

Para personalizar colores, posición y mensajes:

```html
<script>
  window.saleadsConfig = {
    // Opcional: Tu clave API para tracking avanzado
    apiKey: 'sk_live_tu_clave_api_aqui',
    
    // Posición del widget
    position: 'bottom-right',  // 'bottom-right' o 'bottom-left'
    
    // Color principal del widget (hex)
    primaryColor: '#3B82F6',
    
    // Idioma
    language: 'es',  // 'es' o 'en'
    
    // Mensaje de bienvenida
    greeting: '¡Hola! ¿En qué puedo ayudarte hoy?',
    
    // Nombre del agente (aparece en el header)
    agentName: 'SaleAds',
    
    // Avatar del agente (URL de imagen)
    agentAvatar: 'https://tu-dominio.com/avatar.png',
    
    // Ocultar el widget en ciertas páginas (opcional)
    excludePages: ['/checkout', '/admin'],
    
    // Mostrar solo en ciertas páginas (opcional)
    includePages: ['/contacto', '/soporte']
  };
</script>
<script src="https://cdn.saleads.com/widget.js"></script>
```

---

## 🎨 Personalización de Colores

### Colores predefinidos

```javascript
// Azul (default)
primaryColor: '#3B82F6'

// Verde
primaryColor: '#10B981'

// Morado
primaryColor: '#8B5CF6'

// Rojo
primaryColor: '#EF4444'

// Naranja
primaryColor: '#F59E0B'
```

### Modo oscuro

```javascript
window.saleadsConfig = {
  theme: 'dark',  // 'light' o 'dark'
  primaryColor: '#3B82F6'
};
```

---

## 🌐 Integraciones por Plataforma

### WordPress

#### Método 1: Editor de Temas
1. Ve a: **Apariencia** → **Editor de Temas**
2. Selecciona: **footer.php**
3. Busca la etiqueta `</body>`
4. Pega el código **antes** de `</body>`:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
5. Click en **"Actualizar archivo"**

#### Método 2: Plugin (recomendado)
1. Instala el plugin **"Insert Headers and Footers"**
2. Ve a: **Ajustes** → **Insert Headers and Footers**
3. En la sección **"Scripts in Footer"**, pega:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
4. Guarda cambios

#### Método 3: functions.php
```php
function saleads_chat_widget() {
    ?>
    <script src="https://cdn.saleads.com/widget.js"></script>
    <?php
}
add_action('wp_footer', 'saleads_chat_widget');
```

---

### Shopify

1. Ve a: **Tienda Online** → **Temas**
2. Click en **"Acciones"** → **"Editar código"**
3. En la carpeta **"Layout"**, abre: `theme.liquid`
4. Busca la etiqueta `</body>` (casi al final)
5. Pega **antes** de `</body>`:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
6. Click en **"Guardar"**

#### Configuración personalizada para Shopify
```html
<script>
  window.saleadsConfig = {
    primaryColor: '{{ settings.color_primary }}',  // Usa el color de tu tema
    language: '{{ shop.locale }}',  // Idioma de la tienda
    greeting: '¡Hola! ¿Necesitas ayuda con tu compra?'
  };
</script>
<script src="https://cdn.saleads.com/widget.js"></script>
```

---

### Wix

1. Ve a: **Configuración** → **Configuración avanzada** → **Código personalizado**
2. Click en **"+ Agregar código personalizado"**
3. Configuración:
   - **Nombre:** SaleAds Chat Widget
   - **Ubicación:** Body - end
   - **Páginas:** Todas las páginas (o selecciona específicas)
4. Pega el código:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
5. Click en **"Aplicar"**

---

### Squarespace

1. Ve a: **Configuración** → **Avanzado** → **Inyección de código**
2. En la sección **"Footer"**, pega:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
3. Click en **"Guardar"**

---

### Webflow

1. Abre tu proyecto en Webflow
2. Ve a: **Project Settings** → **Custom Code**
3. En **"Footer Code"**, pega:
   ```html
   <script src="https://cdn.saleads.com/widget.js"></script>
   ```
4. Click en **"Save Changes"**
5. Publica tu sitio

---

### HTML/CSS/JS Puro

Simplemente agrega antes de `</body>`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Sitio</title>
</head>
<body>
    <!-- Tu contenido aquí -->
    
    <!-- SaleAds Chat Widget -->
    <script>
        window.saleadsConfig = {
            primaryColor: '#3B82F6',
            language: 'es'
        };
    </script>
    <script src="https://cdn.saleads.com/widget.js"></script>
</body>
</html>
```

---

### React / Next.js

#### React (Create React App, Vite)

```tsx
// components/SaleAdsChat.tsx
import { useEffect } from 'react';

declare global {
  interface Window {
    saleadsConfig?: {
      apiKey?: string;
      position?: 'bottom-right' | 'bottom-left';
      primaryColor?: string;
      language?: 'es' | 'en';
      greeting?: string;
    };
    SaleAdsWidget?: {
      init: (config: any) => void;
      open: () => void;
      close: () => void;
    };
  }
}

interface SaleAdsChatProps {
  apiKey?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  language?: 'es' | 'en';
  greeting?: string;
}

export default function SaleAdsChat({
  apiKey,
  position = 'bottom-right',
  primaryColor = '#3B82F6',
  language = 'es',
  greeting = '¡Hola! ¿En qué puedo ayudarte?'
}: SaleAdsChatProps) {
  useEffect(() => {
    // Configurar antes de cargar el script
    window.saleadsConfig = {
      apiKey,
      position,
      primaryColor,
      language,
      greeting
    };

    // Cargar script
    const script = document.createElement('script');
    script.src = 'https://cdn.saleads.com/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
      // Remover el widget del DOM
      const widgetRoot = document.getElementById('saleads-chat-root');
      if (widgetRoot) {
        widgetRoot.remove();
      }
    };
  }, [apiKey, position, primaryColor, language, greeting]);

  return null;
}
```

```tsx
// App.tsx
import SaleAdsChat from './components/SaleAdsChat';

function App() {
  return (
    <>
      {/* Tu app aquí */}
      <SaleAdsChat 
        apiKey="sk_live_tu_clave_aqui"
        primaryColor="#3B82F6"
        language="es"
      />
    </>
  );
}

export default App;
```

#### Next.js (App Router)

```tsx
// components/SaleAdsChat.tsx
'use client';

import { useEffect } from 'react';

export default function SaleAdsChat() {
  useEffect(() => {
    window.saleadsConfig = {
      primaryColor: '#3B82F6',
      language: 'es'
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.saleads.com/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      const widgetRoot = document.getElementById('saleads-chat-root');
      if (widgetRoot) widgetRoot.remove();
    };
  }, []);

  return null;
}
```

```tsx
// app/layout.tsx
import SaleAdsChat from '@/components/SaleAdsChat';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <SaleAdsChat />
      </body>
    </html>
  );
}
```

#### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import SaleAdsChat from '@/components/SaleAdsChat';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <SaleAdsChat />
    </>
  );
}
```

---

### Vue.js / Nuxt.js

#### Vue 3

```vue
<!-- components/SaleAdsChat.vue -->
<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  apiKey: String,
  primaryColor: {
    type: String,
    default: '#3B82F6'
  },
  language: {
    type: String,
    default: 'es'
  }
});

let scriptElement: HTMLScriptElement | null = null;

onMounted(() => {
  (window as any).saleadsConfig = {
    apiKey: props.apiKey,
    primaryColor: props.primaryColor,
    language: props.language
  };

  scriptElement = document.createElement('script');
  scriptElement.src = 'https://cdn.saleads.com/widget.js';
  scriptElement.async = true;
  document.body.appendChild(scriptElement);
});

onUnmounted(() => {
  if (scriptElement) {
    document.body.removeChild(scriptElement);
  }
  const widgetRoot = document.getElementById('saleads-chat-root');
  if (widgetRoot) widgetRoot.remove();
});
</script>
```

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- Tu app aquí -->
    <SaleAdsChat primary-color="#3B82F6" language="es" />
  </div>
</template>

<script setup lang="ts">
import SaleAdsChat from './components/SaleAdsChat.vue';
</script>
```

#### Nuxt 3

```ts
// plugins/saleads-chat.client.ts
export default defineNuxtPlugin(() => {
  if (process.client) {
    window.saleadsConfig = {
      primaryColor: '#3B82F6',
      language: 'es'
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.saleads.com/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }
});
```

---

### Angular

```typescript
// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private scriptElement?: HTMLScriptElement;

  ngOnInit() {
    // Configuración
    (window as any).saleadsConfig = {
      primaryColor: '#3B82F6',
      language: 'es'
    };

    // Cargar script
    this.scriptElement = document.createElement('script');
    this.scriptElement.src = 'https://cdn.saleads.com/widget.js';
    this.scriptElement.async = true;
    document.body.appendChild(this.scriptElement);
  }

  ngOnDestroy() {
    if (this.scriptElement) {
      document.body.removeChild(this.scriptElement);
    }
    const widgetRoot = document.getElementById('saleads-chat-root');
    if (widgetRoot) {
      widgetRoot.remove();
    }
  }
}
```

---

## 🎯 Casos de Uso Avanzados

### Mostrar solo en páginas específicas

```javascript
window.saleadsConfig = {
  includePages: ['/contacto', '/soporte', '/ayuda']
};
```

### Ocultar en páginas específicas

```javascript
window.saleadsConfig = {
  excludePages: ['/checkout', '/admin', '/login']
};
```

### Abrir automáticamente después de 10 segundos

```javascript
window.saleadsConfig = {
  autoOpen: true,
  autoOpenDelay: 10000  // milisegundos
};
```

### Pre-rellenar información del usuario

```javascript
window.saleadsConfig = {
  user: {
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    phone: '+34612345678'
  }
};
```

### Control programático

```javascript
// Abrir el widget
window.SaleAdsWidget.open();

// Cerrar el widget
window.SaleAdsWidget.close();

// Enviar mensaje programáticamente
window.SaleAdsWidget.sendMessage('Hola, necesito ayuda');

// Escuchar eventos
window.SaleAdsWidget.on('message-sent', (message) => {
  console.log('Usuario envió:', message);
});

window.SaleAdsWidget.on('message-received', (message) => {
  console.log('Agente respondió:', message);
});

window.SaleAdsWidget.on('widget-opened', () => {
  console.log('Widget abierto');
});

window.SaleAdsWidget.on('widget-closed', () => {
  console.log('Widget cerrado');
});
```

---

## ✅ Testing

### Verificar instalación

1. Abre tu sitio web
2. Abre la consola del navegador (F12)
3. Verifica que no haya errores
4. Deberías ver el botón flotante en la esquina inferior derecha

### Test de funcionalidad

1. **Click en el botón:** Debe abrir la ventana de chat
2. **Enviar mensaje:** Escribe "Hola" y envía
3. **Recibir respuesta:** Deberías recibir respuesta del agente IA en 2-5 segundos
4. **Indicador de escritura:** Debe aparecer "SaleAds está escribiendo..." mientras procesa
5. **Cerrar ventana:** Click en X debe cerrar el chat
6. **Reabrir:** El historial debe persistir

### Verificar en diferentes dispositivos

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet
- ✅ Diferentes resoluciones

---

## 🐛 Troubleshooting

### El widget no aparece

**Posibles causas:**

1. **Script no cargado correctamente**
   - Abre la consola (F12) y busca errores
   - Verifica que la URL del script sea correcta
   - Asegúrate que esté antes de `</body>`

2. **Bloqueador de contenido activo**
   - Desactiva ad-blockers temporalmente
   - Agrega tu sitio a la whitelist

3. **Conflicto con otros scripts**
   - Verifica que no haya errores JavaScript en la consola
   - Prueba desactivando otros plugins/scripts

4. **CSP (Content Security Policy) bloqueando**
   - Agrega a tu CSP:
     ```
     script-src 'self' https://cdn.saleads.com;
     connect-src 'self' https://api-chat.saleads.com wss://api-chat.saleads.com;
     ```

### Los mensajes no se envían

**Posibles causas:**

1. **Sin conexión a internet**
   - Verifica tu conexión
   - El widget mostrará "offline" en el header

2. **Rate limit alcanzado**
   - Límite: 10 mensajes por minuto
   - Espera 60 segundos y vuelve a intentar

3. **API caída**
   - Verifica el status: https://status.saleads.com
   - Contacta soporte si persiste

### Los estilos se ven rotos

**Solución:**
- Nuestro widget usa Shadow DOM (aislado de tus estilos)
- Si persiste, limpia caché del navegador (Ctrl + Shift + R)
- Verifica que el archivo CSS se cargue correctamente

### El widget aparece detrás de otros elementos

**Solución:**
```css
/* Agrega esto a tu CSS */
#saleads-chat-root {
  z-index: 999999 !important;
}
```

---

## 🔒 Seguridad y Privacidad

### Datos recopilados

El widget recopila:
- Mensajes del chat
- Timestamp de conversaciones
- Session ID (anónimo)
- User agent (navegador)
- Información proporcionada voluntariamente (email, teléfono)

### Datos NO recopilados

- ❌ Contraseñas
- ❌ Información de tarjetas de crédito
- ❌ Datos de navegación fuera del chat
- ❌ Cookies de terceros

### GDPR Compliance

Para cumplir con GDPR, agrega un aviso:

```javascript
window.saleadsConfig = {
  gdprNotice: true,  // Muestra aviso de privacidad
  gdprText: 'Al usar este chat, aceptas nuestra política de privacidad.',
  gdprLink: 'https://tu-sitio.com/privacidad'
};
```

---

## 📊 Analytics y Tracking

### Google Analytics

Trackear eventos del widget:

```javascript
window.SaleAdsWidget.on('message-sent', (message) => {
  gtag('event', 'chat_message_sent', {
    'event_category': 'Chat',
    'event_label': 'User Message'
  });
});

window.SaleAdsWidget.on('widget-opened', () => {
  gtag('event', 'chat_opened', {
    'event_category': 'Chat',
    'event_label': 'Widget Opened'
  });
});
```

### Facebook Pixel

```javascript
window.SaleAdsWidget.on('message-sent', () => {
  fbq('track', 'Contact');
});
```

---

## 🆘 Soporte

### Documentación adicional
- **API Reference:** https://docs.saleads.com/api
- **Changelog:** https://docs.saleads.com/changelog
- **Status Page:** https://status.saleads.com

### Contacto
- **Email:** soporte@saleads.com
- **Chat en vivo:** https://app.saleads.com/soporte
- **GitHub Issues:** https://github.com/saleads/widget/issues

### Comunidad
- **Discord:** https://discord.gg/saleads
- **Stack Overflow:** Tag `saleads-widget`

---

## 📝 Changelog

### v1.0.0 (Actual)
- ✅ Widget embebido con React + TypeScript
- ✅ Conexión en tiempo real con Socket.io
- ✅ Integración con GoHighLevel
- ✅ Respuestas de IA vía n8n
- ✅ Soporte mobile responsive
- ✅ Modo oscuro
- ✅ Personalización de colores

### Próximas features (v1.1.0)
- 🔜 Soporte para archivos adjuntos
- 🔜 Emojis y GIFs
- 🔜 Notificaciones push
- 🔜 Historial de conversaciones
- 🔜 Múltiples idiomas

---

**Desarrollado por SaleAds** | Versión 1.0.0 | Última actualización: Diciembre 2024

