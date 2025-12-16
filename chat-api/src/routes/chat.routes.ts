/**
 * Chat Routes
 * Endpoints HTTP para el chat
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateWebhookSignature } from '../middleware/auth.js';
import { chatMessageRateLimiter, sessionRateLimiter } from '../middleware/rateLimit.js';
import { socketService } from '../services/socketService.js';
import { redisService } from '../services/redisService.js';
import { chatwootService } from '../services/chatwootService.js';
import { n8nService } from '../services/n8nService.js';
import { logger } from '../utils/logger.js';
import { validate, userMessageSchema, n8nWebhookSchema } from '../utils/validators.js';
import type { N8NWebhookRequest, ChatwootWebhookPayload } from '../types/index.js';
import type { N8NWebhookRequest, ChatwootWebhookPayload } from '../types/index.js';
import { upload } from '../config/multer.js';
import { config } from '../config/index.js';

const router = Router();

/**
 * POST /api/chat/send
 * Enviar mensaje del usuario (HTTP fallback si Socket.io no está disponible)
 */
router.post(
  '/send',
  chatMessageRateLimiter,
  sessionRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Validar request
    const data = validate(userMessageSchema, req.body);

    logger.info('[ChatRoutes] Message received via HTTP', {
      sessionId: data.sessionId,
      messageLength: data.message.length,
    });

    // Obtener o crear sesión
    let session = await redisService.getSession(data.sessionId);

    if (!session) {
      await redisService.setSession(data.sessionId, {
        sessionId: data.sessionId,
        contactId: '',
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
        metadata: data.metadata,
      });
      session = await redisService.getSession(data.sessionId);
    }

    // ========== NUEVO FLUJO: CHATWOOT ==========
    // Crear o obtener contacto y conversación en Chatwoot
    let contactId = session?.contactId || '';
    let conversationId: number | null = null;

    if (chatwootService.isEnabled()) {
      try {
        const contact = await chatwootService.getOrCreateContact({
          identifier: data.sessionId,
          name: data.metadata?.firstName && data.metadata?.lastName
            ? `${data.metadata.firstName} ${data.metadata.lastName}`
            : data.metadata?.firstName || data.metadata?.lastName || 'Usuario Widget',
          email: data.metadata?.email,
          phone: data.metadata?.phone,
          customAttributes: {
            session_id: data.sessionId,
            user_agent: data.metadata?.userAgent,
            page_url: data.metadata?.pageUrl,
          },
        });

        contactId = contact.id.toString();

        const conversation = await chatwootService.getOrCreateConversation(
          contactId,
          data.sessionId
        );

        conversationId = conversation.id;

        // Actualizar sesión con contactId y conversationId
        await redisService.setSession(data.sessionId, {
          ...session!,
          contactId,
          metadata: {
            ...session!.metadata,
            conversationId: conversationId.toString(),
          },
        });

        logger.info('[ChatRoutes] Chatwoot contact and conversation ready', {
          sessionId: data.sessionId,
          contactId,
          conversationId,
        });
      } catch (error: any) {
        logger.error('[ChatRoutes] Error with Chatwoot', {
          sessionId: data.sessionId,
          error: error.message,
        });
      }
    }

    // ========== GUARDAR MENSAJE EN CHATWOOT ==========
    if (chatwootService.isEnabled() && conversationId) {
      try {
        await chatwootService.sendMessage({
          conversationId,
          content: data.message,
          messageType: 'incoming',
          contentType: 'text',
        });

        logger.info('[ChatRoutes] User message saved to Chatwoot', {
          sessionId: data.sessionId,
          conversationId,
        });
      } catch (error: any) {
        logger.error('[ChatRoutes] Error saving message to Chatwoot', {
          sessionId: data.sessionId,
          error: error.message,
        });
      }
    }

    // ========== ENVIAR A N8N PARA PROCESAMIENTO IA ==========
    let n8nMessageId: string | undefined;

    if (n8nService.isEnabled()) {
      try {
        const n8nResult = await n8nService.sendMessage({
          sessionId: data.sessionId,
          message: data.message,
          contactId: contactId || undefined,
          phone: data.metadata?.phone,
          email: data.metadata?.email,
          firstName: data.metadata?.firstName,
          lastName: data.metadata?.lastName,
          metadata: {
            ...data.metadata,
            conversationId: conversationId?.toString(),
            timestamp: new Date().toISOString(),
          },
        });

        if (n8nResult.success) {
          n8nMessageId = n8nResult.messageId;
          logger.info('[ChatRoutes] Message sent to n8n for AI processing', {
            sessionId: data.sessionId,
            contactId,
            conversationId,
            messageId: n8nMessageId,
          });
        } else {
          logger.warn('[ChatRoutes] n8n returned error', {
            sessionId: data.sessionId,
            error: n8nResult.error,
          });
        }
      } catch (error: any) {
        logger.error('[ChatRoutes] Error sending message to n8n', {
          sessionId: data.sessionId,
          error: error.message,
        });
      }
    } else {
      logger.warn('[ChatRoutes] n8n service not enabled', {
        sessionId: data.sessionId,
      });
    }

    // Incrementar contador de mensajes
    await redisService.incrementMessageCount(data.sessionId);

    // Emitir indicador de "agente escribiendo" vía Socket.io
    socketService.emitAgentTyping(data.sessionId);

    res.json({
      success: true,
      data: {
        messageId: n8nMessageId || `msg_${Date.now()}`,
        sessionId: data.sessionId,
        contactId,
        conversationId,
        chatwootEnabled: chatwootService.isEnabled(),
        n8nEnabled: n8nService.isEnabled(),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/webhook/n8n-response
 * Recibir respuesta procesada de n8n
 */
router.post(
  '/n8n-response',
  validateWebhookSignature,
  asyncHandler(async (req: Request, res: Response) => {
    // Validar request
    const data = validate(n8nWebhookSchema, req.body) as N8NWebhookRequest;

    logger.info('[ChatRoutes] n8n response received', {
      sessionId: data.sessionId,
      responseLength: data.response.length,
    });

    // Verificar que la sesión existe
    const session = await redisService.getSession(data.sessionId);

    if (!session) {
      logger.warn('[ChatRoutes] Session not found for n8n response', {
        sessionId: data.sessionId,
      });
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Emitir respuesta del agente vía Socket.io (esto también guarda en Chatwoot)
    await socketService.emitAgentResponse(data.sessionId, {
      message: data.response,
      timestamp: data.metadata?.timestamp || new Date().toISOString(),
      metadata: {
        ...data.metadata,
        conversationId: session.metadata?.conversationId,
      },
    });

    // Actualizar sesión en Redis
    await redisService.setSession(data.sessionId, {
      ...session,
      lastMessageAt: Date.now(),
      metadata: {
        ...session.metadata,
        lastAgentResponse: Date.now(),
        ...data.metadata,
      },
    });

    res.json({
      success: true,
      data: {
        received: true,
        sessionId: data.sessionId,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/webhook/chatwoot
 * Recibir eventos de Chatwoot (respuestas manuales de agentes, cambios de estado)
 */
router.post(
  '/chatwoot',
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ChatwootWebhookPayload;

    logger.info('[ChatRoutes] Chatwoot webhook received', {
      event: payload.event,
      conversationId: payload.conversation?.id,
      messageId: payload.message?.id,
    });

    // Procesar solo eventos relevantes
    if (payload.event === 'message_created') {
      // Verificar que el mensaje es de un agente (no del bot o del usuario)
      if (
        payload.message &&
        payload.sender?.type !== 'contact' &&
        payload.message.message_type === 'outgoing' &&
        !payload.message.private
      ) {
        // Es una respuesta manual de un agente humano
        logger.info('[ChatRoutes] Manual agent response detected', {
          messageId: payload.message.id,
          conversationId: payload.conversation?.id,
          senderType: payload.sender?.type,
        });

        // Buscar la sesión asociada a esta conversación
        const conversationId = payload.conversation?.id.toString();

        if (conversationId) {
          // Buscar sesión por conversationId en metadata
          // Nota: Esto requeriría un índice secundario en Redis o iterar sesiones
          // Por ahora, usamos el custom_attributes de la conversación
          const sessionId = payload.conversation?.custom_attributes?.session_id;

          if (sessionId) {
            // Verificar que la sesión existe
            const session = await redisService.getSession(sessionId);

            if (session) {
              // Emitir respuesta del agente manual al widget
              await socketService.emitAgentResponse(sessionId, {
                message: payload.message.content,
                timestamp: new Date(payload.message.created_at * 1000).toISOString(),
                metadata: {
                  source: 'manual_agent',
                  agentName: payload.sender?.name,
                  agentId: payload.sender?.id,
                  conversationId,
                  messageId: payload.message.id,
                },
              });

              // Actualizar sesión
              await redisService.setSession(sessionId, {
                ...session,
                lastMessageAt: Date.now(),
                metadata: {
                  ...session.metadata,
                  lastManualResponse: Date.now(),
                  lastAgentName: payload.sender?.name,
                },
              });

              logger.info('[ChatRoutes] Manual agent response forwarded to widget', {
                sessionId,
                conversationId,
                agentName: payload.sender?.name,
              });
            } else {
              logger.warn('[ChatRoutes] Session not found for manual response', {
                sessionId,
                conversationId,
              });
            }
          } else {
            logger.warn('[ChatRoutes] No sessionId in conversation custom_attributes', {
              conversationId,
            });
          }
        }
      }
    } else if (payload.event === 'conversation_status_changed') {
      // Manejar cambios de estado (ej: resolved)
      logger.info('[ChatRoutes] Conversation status changed', {
        conversationId: payload.conversation?.id,
        status: payload.conversation?.status,
      });

      const sessionId = payload.conversation?.custom_attributes?.session_id;

      if (sessionId) {
        const session = await redisService.getSession(sessionId);

        if (session) {
          // Actualizar metadata de la sesión
          await redisService.setSession(sessionId, {
            ...session,
            metadata: {
              ...session.metadata,
              conversationStatus: payload.conversation?.status,
              statusChangedAt: Date.now(),
            },
          });

          logger.info('[ChatRoutes] Session updated with conversation status', {
            sessionId,
            status: payload.conversation?.status,
          });
        }
      }
    }

    // Responder a Chatwoot
    res.json({
      success: true,
      received: true,
      event: payload.event,
    });
  })
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();

    // Verificar servicios
    const [redisHealthy, chatwootHealthy, socketHealthy] = await Promise.all([
      redisService.healthCheck(),
      chatwootService.healthCheck(),
      Promise.resolve(socketService.healthCheck()),
    ]);

    const allHealthy = redisHealthy && chatwootHealthy && socketHealthy;
    const status = allHealthy ? 'ok' : 'degraded';

    const responseTime = Date.now() - startTime;

    const response = {
      status,
      services: {
        redis: redisHealthy ? 'connected' : 'disconnected',
        chatwoot: chatwootHealthy ? 'connected' : 'disconnected',
        socket: socketHealthy ? 'running' : 'stopped',
        n8n: n8nService.isEnabled() ? 'enabled' : 'disabled',
      },
      metrics: {
        connectedClients: socketService.getConnectedClientsCount(),
        activeSessions: socketService.getActiveSessions().length,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json(response);

    logger.info('[ChatRoutes] Health check', {
      status,
      responseTime,
      services: response.services,
    });
  })
);

/**
 * GET /api/session/:sessionId
 * Obtener información de una sesión (para debugging)
 */
router.get(
  '/session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await redisService.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/chat/upload
 * Subir archivos (imágenes, audio, video)
 */
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    // Construir URL completa
    // Usar PUBLIC_URL configurada o fallback a request host
    const baseUrl = config.publicUrl || `${req.protocol}://${req.get('host')}`;

    // Asegurar que no haya doble slash si baseUrl ya termina en /
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fileUrl = `${cleanBaseUrl}/uploads/${req.file.filename}`;

    logger.info('[ChatRoutes] File uploaded', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    res.json({
      success: true,
      url: fileUrl,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      size: req.file.size,
    });
  })
);

export default router;

