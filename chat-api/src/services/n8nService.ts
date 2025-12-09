/**
 * n8n Direct Webhook Service
 * Envía mensajes directamente a n8n sin pasar por el canal de mensajes de GHL
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface N8NMessagePayload {
  sessionId: string;
  message: string;
  contactId?: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  metadata?: {
    userAgent?: string;
    pageUrl?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface N8NResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class N8NService {
  private client: AxiosInstance | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = config.n8n.enabled && !!config.n8n.webhookUrl;

    if (this.enabled) {
      this.client = axios.create({
        baseURL: config.n8n.webhookUrl,
        timeout: config.n8n.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.webhookSecret && {
            'X-N8N-Webhook-Secret': config.n8n.webhookSecret,
          }),
        },
      });

      // Interceptor para logging
      this.client.interceptors.request.use(
        (reqConfig) => {
          logger.debug('[N8NService] Sending request', {
            url: reqConfig.url,
            method: reqConfig.method,
          });
          return reqConfig;
        },
        (error) => {
          logger.error('[N8NService] Request error', { error: error.message });
          return Promise.reject(error);
        }
      );

      this.client.interceptors.response.use(
        (response) => {
          logger.debug('[N8NService] Response received', {
            status: response.status,
          });
          return response;
        },
        (error) => {
          logger.error('[N8NService] Response error', {
            status: error.response?.status,
            message: error.response?.data || error.message,
          });
          return Promise.reject(error);
        }
      );

      logger.info('[N8NService] Initialized', {
        webhookUrl: config.n8n.webhookUrl,
        timeout: config.n8n.timeout,
      });
    } else {
      logger.warn('[N8NService] Not enabled - N8N_WEBHOOK_URL not configured or N8N_DIRECT_ENABLED=false');
    }
  }

  /**
   * Verificar si el servicio está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enviar mensaje del usuario a n8n
   */
  async sendMessage(payload: N8NMessagePayload): Promise<N8NResponse> {
    if (!this.enabled || !this.client) {
      logger.warn('[N8NService] Service not enabled, skipping message send');
      return { success: false, error: 'N8N service not enabled' };
    }

    try {
      const requestPayload = {
        ...payload,
        timestamp: payload.metadata?.timestamp || new Date().toISOString(),
        source: 'widget',
      };

      logger.info('[N8NService] Sending message to n8n', {
        sessionId: payload.sessionId,
        messageLength: payload.message.length,
        hasContactId: !!payload.contactId,
        hasPhone: !!payload.phone,
      });

      const response = await this.client.post('', requestPayload);

      const messageId = response.data?.messageId || response.data?.id || `n8n_${Date.now()}`;

      logger.info('[N8NService] Message sent successfully', {
        sessionId: payload.sessionId,
        messageId,
        status: response.status,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      logger.error('[N8NService] Error sending message', {
        sessionId: payload.sessionId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Solo verificamos que la URL sea válida
      new URL(config.n8n.webhookUrl);
      return true;
    } catch {
      return false;
    }
  }
}

// Exportar instancia singleton
export const n8nService = new N8NService();

