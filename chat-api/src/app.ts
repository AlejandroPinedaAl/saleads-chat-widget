/**
 * Express App Configuration
 * Configuración de Express con middlewares y rutas
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import chatRoutes from './routes/chat.routes.js';
import { redisService } from './services/redisService.js';
import { ghlService } from './services/ghlService.js';
import { socketService } from './services/socketService.js';
import { asyncHandler } from './middleware/errorHandler.js';

/**
 * Crear y configurar Express app
 */
export function createApp(): Express {
  const app = express();

  // ============================================
  // SECURITY MIDDLEWARES
  // ============================================

  // Helmet - Seguridad HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Deshabilitado para permitir WebSocket
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Verificar si el origin está en la whitelist
        if (config.security.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn('[App] CORS blocked', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Secret'],
    })
  );

  // ============================================
  // BODY PARSERS
  // ============================================

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ============================================
  // REQUEST LOGGING
  // ============================================

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('[App] Request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    });

    next();
  });

  // ============================================
  // RATE LIMITING
  // ============================================

  app.use('/api/', apiRateLimiter);

  // ============================================
  // ROUTES
  // ============================================

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'SaleAds Chat API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        chat: '/api/chat/*',
        webhook: '/api/webhook/*',
      },
    });
  });

  // Health check endpoint (direct access)
  app.get('/api/health', asyncHandler(async (_req, res) => {
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

    logger.info('[App] Health check', {
      status,
      responseTime,
      services: response.services,
    });
  }));

  // Chat routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/webhook', chatRoutes);

  // ============================================
  // ERROR HANDLING
  // ============================================

  // 404 handler
  app.use(notFoundHandler);

  // Error handler global
  app.use(errorHandler);

  logger.info('[App] Express app configured', {
    corsOrigins: config.security.corsOrigins,
    environment: config.nodeEnv,
  });

  return app;
}

