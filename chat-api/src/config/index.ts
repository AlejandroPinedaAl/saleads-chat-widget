/**
 * Configuration Management
 * Carga y valida variables de entorno
 */

import { config as dotenvConfig } from 'dotenv';
import type { AppConfig } from '../types/index.js';

// Cargar variables de entorno
dotenvConfig();

/**
 * Obtener variable de entorno con valor por defecto
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

/**
 * Obtener variable de entorno como número
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

/**
 * Obtener variable de entorno como array
 */
function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map((v) => v.trim());
}

/**
 * Configuración de la aplicación
 */
export const config: AppConfig = {
  // Server
  port: getEnvNumber('PORT', 3000),
  nodeEnv: (getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test'),

  // Chatwoot
  chatwoot: {
    apiUrl: getEnv('CHATWOOT_API_URL', ''),
    apiKey: getEnv('CHATWOOT_API_KEY', ''),
    accountId: getEnv('CHATWOOT_ACCOUNT_ID', ''),
    inboxId: getEnv('CHATWOOT_INBOX_ID', ''),
  },

  // GoHighLevel (Mantener para rollback)
  ghl: {
    apiKey: getEnv('GHL_API_KEY', ''),
    locationId: getEnv('GHL_LOCATION_ID', ''),
    apiUrl: getEnv('GHL_API_URL', 'https://services.leadconnectorhq.com'),
  },

  // N8N Integration (Direct Webhook)
  n8n: {
    webhookUrl: getEnv('N8N_WEBHOOK_URL', ''),
    webhookSecret: getEnv('N8N_WEBHOOK_SECRET', ''),
    enabled: getEnv('N8N_DIRECT_ENABLED', 'true') === 'true',
    timeout: getEnvNumber('N8N_TIMEOUT', 30000),
  },

  // Public URL for attachments
  publicUrl: getEnv('PUBLIC_URL', 'http://localhost:3000'),

  // Redis (Upstash)
  redis: {
    url: getEnv('UPSTASH_REDIS_REST_URL'),
    token: getEnv('UPSTASH_REDIS_REST_TOKEN'),
  },

  // Security
  security: {
    webhookSecret: getEnv('WEBHOOK_SECRET'),
    jwtSecret: getEnv('JWT_SECRET', 'default-jwt-secret-change-me'),
    corsOrigins: getEnvArray('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:3000']),
  },

  // Socket.io
  socket: {
    pingTimeout: getEnvNumber('SOCKET_PING_TIMEOUT', 60000),
    pingInterval: getEnvNumber('SOCKET_PING_INTERVAL', 25000),
    maxConnections: getEnvNumber('SOCKET_MAX_CONNECTIONS', 1000),
  },

  // Rate Limiting
  rateLimit: {
    messagesPerMinute: getEnvNumber('RATE_LIMIT_MESSAGES_PER_MINUTE', 10),
    messagesPerHour: getEnvNumber('RATE_LIMIT_MESSAGES_PER_HOUR', 100),
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
  },

  // Logging
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: (getEnv('LOG_FORMAT', 'json') as 'json' | 'simple'),
  },
};

/**
 * Validar configuración al inicio
 */
export function validateConfig(): void {
  console.log('[Config] Validating configuration...');

  // Validar URLs
  try {
    new URL(config.redis.url);
  } catch (error) {
    throw new Error(`Invalid UPSTASH_REDIS_REST_URL: ${config.redis.url}`);
  }

  try {
    new URL(config.ghl.apiUrl);
  } catch (error) {
    throw new Error(`Invalid GHL_API_URL: ${config.ghl.apiUrl}`);
  }

  // Validar secrets
  if (config.security.webhookSecret.length < 32) {
    console.warn('[Config] WARNING: WEBHOOK_SECRET is too short (< 32 characters)');
  }

  if (config.security.jwtSecret === 'default-jwt-secret-change-me') {
    console.warn('[Config] WARNING: Using default JWT_SECRET (change in production!)');
  }

  // Validar CORS origins
  config.security.corsOrigins.forEach((origin) => {
    try {
      new URL(origin);
    } catch (error) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  });

  console.log('[Config] Configuration validated successfully');
  console.log('[Config] Environment:', config.nodeEnv);
  console.log('[Config] Port:', config.port);
  console.log('[Config] CORS Origins:', config.security.corsOrigins.join(', '));
}

