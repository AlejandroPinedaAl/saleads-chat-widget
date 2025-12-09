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
import { ghlService } from '../services/ghlService.js';
import { logger } from '../utils/logger.js';
import { validate, userMessageSchema, n8nWebhookSchema } from '../utils/validators.js';
import type { N8NWebhookRequest } from '../types/index.js';

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

    // Crear o actualizar contacto en GoHighLevel
    let contactId = session?.contactId || '';

    if (!contactId) {
      try {
        const upsertResult = await ghlService.upsertContact({
          sessionId: data.sessionId,
          phone: data.metadata?.phone,
          email: data.metadata?.email,
        });

        contactId = upsertResult.contactId;

        // Actualizar sesión con contactId
        await redisService.setSession(data.sessionId, {
          ...session!,
          contactId,
        });

        logger.info('[ChatRoutes] Contact created/updated', {
          sessionId: data.sessionId,
          contactId,
          isNew: upsertResult.isNew,
        });
      } catch (error: any) {
        logger.error('[ChatRoutes] Error creating/updating contact', {
          sessionId: data.sessionId,
          error: error.message,
        });
      }
    }

    // Enviar mensaje a GoHighLevel
    if (contactId) {
      try {
        await ghlService.sendMessage({
          type: 'Email',
          contactId,
          message: data.message,
          subject: 'Nuevo mensaje desde el widget',
          emailFrom: 'widget@saleads.com',
        });

        logger.info('[ChatRoutes] Message sent to GHL', {
          sessionId: data.sessionId,
          contactId,
        });
      } catch (error: any) {
        logger.error('[ChatRoutes] Error sending message to GHL', {
          sessionId: data.sessionId,
          contactId,
          error: error.message,
        });
      }
    }

    // Incrementar contador de mensajes
    await redisService.incrementMessageCount(data.sessionId);

    // Emitir indicador de "agente escribiendo" vía Socket.io
    socketService.emitAgentTyping(data.sessionId);

    res.json({
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        sessionId: data.sessionId,
        contactId,
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

    // Emitir respuesta del agente vía Socket.io
    socketService.emitAgentResponse(data.sessionId, {
      message: data.response,
      timestamp: data.metadata?.timestamp || new Date().toISOString(),
      metadata: data.metadata,
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
 * GET /api/health
 * Health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();

    // Verificar servicios
    const [redisHealthy, ghlHealthy, socketHealthy] = await Promise.all([
      redisService.healthCheck(),
      ghlService.healthCheck(),
      Promise.resolve(socketService.healthCheck()),
    ]);

    const allHealthy = redisHealthy && ghlHealthy && socketHealthy;
    const status = allHealthy ? 'ok' : 'degraded';

    const responseTime = Date.now() - startTime;

    const response = {
      status,
      services: {
        redis: redisHealthy ? 'connected' : 'disconnected',
        ghl: ghlHealthy ? 'connected' : 'disconnected',
        socket: socketHealthy ? 'running' : 'stopped',
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

export default router;

