/**
 * Authentication Middleware
 * Validación de API keys y webhook signatures
 */

import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Validar API key en header (para endpoints públicos)
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // TODO: Validar API key contra base de datos de clientes
  // Por ahora, aceptar cualquier key que empiece con 'sk_live_' o 'sk_test_'
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    logger.warn('[Auth] Invalid API key format', { apiKey: apiKey.substring(0, 10) + '...' });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.debug('[Auth] API key validated', { apiKey: apiKey.substring(0, 10) + '...' });
  next();
}

/**
 * Validar webhook signature de n8n
 */
export function validateWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-webhook-secret'] as string;

  if (!signature) {
    logger.warn('[Auth] Missing webhook signature');
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Webhook signature is required',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validar signature
  const expectedSignature = config.security.webhookSecret;

  try {
    // Usar timing-safe comparison para prevenir timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      throw new Error('Invalid signature length');
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new Error('Invalid signature');
    }

    logger.debug('[Auth] Webhook signature validated');
    next();
  } catch (error: any) {
    logger.warn('[Auth] Invalid webhook signature', { error: error.message });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Validar HMAC signature (para webhooks más seguros)
 */
export function validateHmacSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!signature || !timestamp) {
    logger.warn('[Auth] Missing HMAC signature or timestamp');
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Signature and timestamp are required',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Verificar que el timestamp no sea muy antiguo (5 minutos)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos

    if (currentTime - requestTime > maxAge) {
      throw new Error('Request timestamp too old');
    }

    // Generar HMAC
    const payload = JSON.stringify(req.body) + timestamp;
    const hmac = createHmac('sha256', config.security.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Comparar signatures
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      throw new Error('Invalid signature length');
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new Error('Invalid signature');
    }

    logger.debug('[Auth] HMAC signature validated');
    next();
  } catch (error: any) {
    logger.warn('[Auth] Invalid HMAC signature', { error: error.message });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid HMAC signature',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

