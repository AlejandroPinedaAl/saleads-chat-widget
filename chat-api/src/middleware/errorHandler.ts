/**
 * Error Handler Middleware
 * Manejo centralizado de errores
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Error handler global
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log del error
  logger.error('[ErrorHandler] Error caught', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Axios errors (de llamadas a APIs externas)
  if (error.name === 'AxiosError') {
    const axiosError = error as any;
    res.status(502).json({
      success: false,
      error: {
        code: 'EXTERNAL_API_ERROR',
        message: 'Error communicating with external service',
        details: axiosError.response?.data || axiosError.message,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler para rutas no encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('[ErrorHandler] Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async handler wrapper
 * Permite usar async/await en route handlers sin try/catch
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

