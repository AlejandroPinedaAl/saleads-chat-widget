# Documentación Técnica del Proyecto: SaleAds Chat Widget & API

> **Última Actualización**: 2025-12-16
> **Propósito**: Contexto completo para desarrollo y mantenimiento.

## 1. Visión General
El proyecto consta de un Widget de Chat para sitios web que se comunica con una API Backend (Node.js). Esta API orquesta la comunicación entre el usuario final y dos sistemas principales:
1.  **Chatwoot**: Plataforma de soporte multicanal donde los agentes humanos responden.
2.  **n8n**: Sistema de automatización para procesamiento con IA y flujos de negocio.

## 2. Arquitectura del Sistema
```mermaid
graph LR
    User[Usuario Web] -- WebSocket/HTTP --> Proxy[Nginx (Puerto 8080)]
    Proxy -- Proxy Pass --> Backend[Node.js API (Puerto 5678)]
    Backend -- Events --> Redis[Upstash Redis]
    Backend -- Webhook --> N8N[n8n Workflow]
    Backend -- API --> CW[Chatwoot]
    
    subgraph "Flujo de Datos"
    Backend -- Guarda Sesión --> Redis
    Backend -- Envia Mensaje --> CW
    Backend -- Envia Mensaje + Adjuntos --> N8N
    end
```

## 3. Componentes Principales

### 3.1 Backend (Node.js/Express)
Ubicación: `/root/chat-api`
-   **Puerto Interno**: 5678
-   **Límites de Carga**: 50MB (configurado en Express y Multer).
-   **Middleware Clave**:
    -   `cors`: Permitir origen `null` (local) y dominios configurados.
    -   `trust proxy`: Set a `1` para trabajar tras Nginx.

### 3.2 Almacenamiento
-   **Redis (Upstash)**: Gestiona sesiones de usuario (`sessionId`), contadores de mensajes y estado de conexión.
-   **Sistema de Archivos**: Carpeta `/uploads` para archivos multimedia temporales.

### 3.3 Integraciones
-   **Chatwoot**:
    -   Identifica contactos por `sessionId` o email/teléfono.
    -   Sincroniza mensajes bidireccionalmente.
-   **n8n**:
    -   Recibe mensajes para lógica de IA.
    -   Detecta automáticamente adjuntos (imágenes, audio, video) y los incluye en el payload.

## 4. Configuración del Entorno (.env)

| Variable | Valor (Ejemplo/Notas) | Descripción |
| :--- | :--- | :--- |
| `PORT` | `5678` | Puerto interno de Node.js |
| `PUBLIC_URL` | `http://95.216.196.74:8080` | **CRÍTICO**. URL pública para generar links a archivos. |
| `N8N_DIRECT_ENABLED` | `true` | Habilita el envío directo a n8n. |
| `N8N_WEBHOOK_URL` | `https://...` | Webhook de n8n para recibir mensajes. |
| `CHATWOOT_API_URL` | `https://...` | URL de la instancia de Chatwoot. |
| `UPSTASH_REDIS_...` | `...` | Credenciales de Redis. |

## 5. Configuración del Servidor (Nginx)
El servidor usa Nginx como Reverse Proxy.
**Archivo de Configuración**: `/etc/nginx/nginx.conf`

**Configuración Crítica para Multimedia**:
```nginx
http {
    # ...
    client_max_body_size 50M; # Necesario para videos > 1MB
    # ...
}
```

## 6. Flujos de Trabajo Clave

### 6.1 Envío de Archivos (Multimedia)
1.  **Widget**: Envía `POST /api/chat/upload` con el archivo (`FormData`).
2.  **API (Multer)**:
    -   Valida tipo (img, audio, video/mp4/quicktime) y tamaño (50MB).
    -   Guarda en `/uploads`.
    -   Retorna URL pública usando `PUBLIC_URL` (ej: `http://IP:8080/uploads/file.mp4`).
3.  **API (n8nService)**:
    -   Detecta si el mensaje es una URL.
    -   Agrega el objeto `attachments` al payload JSON enviado a n8n.
    -   Estructura: `{ type: 'video', url: '...', fileSize: 0 }`.

### 6.2 Flujo de Mensajes
1.  **Usuario escribe**: `POST /api/chat/send` o evento Socket.io.
2.  **API**:
    -   Guarda/Actualiza sesión en Redis.
    -   Envía a Chatwoot (Conversation Inbox).
    -   Envía a n8n (Webhook).

## 7. Comandos de Despliegue
Para aplicar cambios en el servidor:

```bash
cd /root/chat-api
git pull
npm run build     # Muiy importante para TypeScript
pm2 restart all   # Recarga config y código
```

Si cambias configuración de Nginx:
```bash
service nginx reload
```

## 8. Solución de Problemas Comunes (Troubleshooting)

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| **Error 413 Payload Too Large** | Nginx limita el body a 1MB. | Ajustar `client_max_body_size 50M` en nginx.conf. |
| **Audio dura 0:00 o error de carga** | `PUBLIC_URL` incorrecta (localhost). | Ajustar `.env` con la IP pública y puerto 8080. |
| **CORS Error (origin null)** | Pruebas desde archivo local. | Verificado en `app.ts` (`origin === 'null'`). |
| **N8N no detecta adjunto** | Formato de mensaje plano. | `n8nService.ts` tiene lógica de auto-detección por extensión. |
