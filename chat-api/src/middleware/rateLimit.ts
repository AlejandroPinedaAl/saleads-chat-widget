/**
 * Rate Limiting Middleware
 * Limitar número de requests por IP y por sesión
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { redisService } from '../services/redisService.js';

/**
 * Rate limiter general para la API
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.messagesPerMinute,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter específico para mensajes de chat
 */
export const chatMessageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.rateLimit.messagesPerMinute,
  message: {
    success: false,
    error: {
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
      message: `You can only send ${config.rateLimit.messagesPerMinute} messages per minute`,
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar sessionId como key en lugar de IP
  keyGenerator: (req: Request) => {
    return req.body.sessionId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] Chat message rate limit exceeded', {
      sessionId: req.body.sessionId,
      ip: req.ip,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
        message: `You can only send ${config.rateLimit.messagesPerMinute} messages per minute`,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter personalizado usando Redis
 * Permite límites más granulares por sesión
 */
export async function sessionRateLimiter(
  req: Request,
  res: Response,
  next: Function
): Promise<void> {
  try {
    const sessionId = req.body.sessionId;

    if (!sessionId) {
      next();
      return;
    }

    // Obtener sesión de Redis
    const session = await redisService.getSession(sessionId);

    if (!session) {
      next();
      return;
    }

    // Verificar límite por hora
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (session.startedAt > hourAgo && session.messageCount >= config.rateLimit.messagesPerHour) {
      logger.warn('[RateLimit] Session hourly rate limit exceeded', {
        sessionId,
        messageCount: session.messageCount,
      });
      res.status(429).json({
        success: false,
        error: {
          code: 'SESSION_RATE_LIMIT_EXCEEDED',
          message: `You can only send ${config.rateLimit.messagesPerHour} messages per hour`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error('[RateLimit] Error in session rate limiter', { error: error.message });
    // En caso de error, permitir el request
    next();
  }
}

