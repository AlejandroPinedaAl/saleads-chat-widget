/**
 * Server Entry Point
 * Inicializa Express y Socket.io
 */

import { createServer } from 'http';
import { config, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';
import { socketService } from './services/socketService.js';
import { redisService } from './services/redisService.js';
import { ghlService } from './services/ghlService.js';

/**
 * Iniciar servidor
 */
async function startServer(): Promise<void> {
  try {
    // Validar configuración
    validateConfig();

    // Crear Express app
    const app = createApp();

    // Crear HTTP server
    const httpServer = createServer(app);

    // Inicializar Socket.io
    socketService.initialize(httpServer);

    // Verificar servicios externos
    logger.info('[Server] Checking external services...');

    const [redisHealthy, ghlHealthy] = await Promise.all([
      redisService.healthCheck(),
      ghlService.healthCheck(),
    ]);

    if (!redisHealthy) {
      logger.error('[Server] Redis connection failed');
      throw new Error('Redis connection failed');
    }

    if (!ghlHealthy) {
      logger.warn('[Server] GoHighLevel connection failed (continuing anyway)');
    }

    logger.info('[Server] External services checked', {
      redis: redisHealthy ? 'OK' : 'FAILED',
      ghl: ghlHealthy ? 'OK' : 'FAILED',
    });

    // Iniciar servidor HTTP
    const port = config.port;

    httpServer.listen(port, () => {
      logger.info('[Server] Server started', {
        port,
        environment: config.nodeEnv,
        nodeVersion: process.version,
      });
      logger.info(`[Server] 🚀 Server running on http://localhost:${port}`);
      logger.info(`[Server] 📊 Health check: http://localhost:${port}/api/health`);
    });

    // Manejo de señales de terminación
    const gracefulShutdown = async (signal: string) => {
      logger.info(`[Server] ${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info('[Server] HTTP server closed');

        // Cerrar conexiones de Socket.io
        // socketService.close(); // Implementar si es necesario

        logger.info('[Server] All connections closed');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('[Server] Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[Server] Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('[Server] Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

