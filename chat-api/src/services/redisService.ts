/**
 * Redis Service
 * Manejo de sesiones con Upstash Redis
 */

import { Redis } from '@upstash/redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { SessionData } from '../types/index.js';

class RedisService {
  private client: Redis;
  private readonly SESSION_TTL = 86400; // 24 horas en segundos
  private readonly SESSION_PREFIX = 'session:';

  constructor() {
    this.client = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });

    logger.info('[RedisService] Initialized');
  }

  /**
   * Crear o actualizar sesión
   */
  async setSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      
      // Obtener sesión existente si existe
      const existing = await this.getSession(sessionId);
      
      const sessionData: SessionData = {
        sessionId,
        contactId: data.contactId || existing?.contactId || '',
        startedAt: existing?.startedAt || Date.now(),
        lastMessageAt: Date.now(),
        messageCount: (existing?.messageCount || 0) + 1,
        metadata: {
          ...existing?.metadata,
          ...data.metadata,
        },
      };

      await this.client.setex(key, this.SESSION_TTL, JSON.stringify(sessionData));

      logger.debug('[RedisService] Session saved', { sessionId, messageCount: sessionData.messageCount });
    } catch (error: any) {
      logger.error('[RedisService] Error saving session', {
        sessionId,
        error: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * Obtener sesión
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.getSessionKey(sessionId);
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      // Upstash Redis puede devolver string o objeto directamente
      if (typeof data === 'string') {
        return JSON.parse(data) as SessionData;
      } else if (typeof data === 'object') {
        return data as SessionData;
      }

      return null;
    } catch (error: any) {
      logger.error('[RedisService] Error getting session', {
        sessionId,
        error: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
      });
      return null;
    }
  }

  /**
   * Incrementar contador de mensajes
   */
  async incrementMessageCount(sessionId: string): Promise<number> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        logger.warn('[RedisService] Session not found for increment', { sessionId });
        return 0;
      }

      session.messageCount += 1;
      session.lastMessageAt = Date.now();

      await this.setSession(sessionId, session);

      return session.messageCount;
    } catch (error) {
      logger.error('[RedisService] Error incrementing message count', { sessionId, error });
      return 0;
    }
  }

  /**
   * Eliminar sesión
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await this.client.del(key);

      logger.info('[RedisService] Session deleted', { sessionId });
    } catch (error) {
      logger.error('[RedisService] Error deleting session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Verificar si una sesión existe
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const key = this.getSessionKey(sessionId);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('[RedisService] Error checking session existence', { sessionId, error });
      return false;
    }
  }

  /**
   * Extender TTL de una sesión
   */
  async extendSessionTTL(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await this.client.expire(key, this.SESSION_TTL);

      logger.debug('[RedisService] Session TTL extended', { sessionId });
    } catch (error) {
      logger.error('[RedisService] Error extending session TTL', { sessionId, error });
    }
  }

  /**
   * Obtener todas las sesiones activas (para debugging)
   */
  async getActiveSessions(): Promise<string[]> {
    try {
      const keys = await this.client.keys(`${this.SESSION_PREFIX}*`);
      return keys.map((key) => key.replace(this.SESSION_PREFIX, ''));
    } catch (error) {
      logger.error('[RedisService] Error getting active sessions', { error });
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('[RedisService] Health check failed', { error });
      return false;
    }
  }

  /**
   * Obtener key de sesión con prefijo
   */
  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }
}

// Exportar instancia singleton
export const redisService = new RedisService();

