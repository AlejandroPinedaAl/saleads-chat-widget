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
  // Nuevos campos opcionales para IDs reales de Chatwoot
  conversationId?: number;
  chatwootContactId?: number;
  labels?: string[];
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  attachments?: Array<{
    type: 'image' | 'audio' | 'video' | 'file';
    url: string;
    fileSize?: number;
  }>;
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
   * Generar un ID numérico a partir de un string (hash)
   * N8N espera IDs numéricos para conversation_id y contact_id
   */
  private generateNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
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
      // Usar IDs reales si existen, o generar basados en strings como fallback
      const conversationId = payload.conversationId || this.generateNumericId(payload.sessionId);

      const contactId = payload.chatwootContactId
        ? payload.chatwootContactId
        : (payload.contactId
          ? this.generateNumericId(payload.contactId)
          : this.generateNumericId(payload.sessionId + '_contact'));

      const inboxId = config.chatwoot.inboxId ? parseInt(config.chatwoot.inboxId) : 5; // Default fallback
      const accountId = config.chatwoot.accountId ? parseInt(config.chatwoot.accountId) : 1; // Default fallback

      // Construir payload compatible con Chatwoot
      // Estructura:
      // {
      //   body: {
      //     message_type: 'incoming',
      //     content: "Hola",
      //     conversation: { id: 123, status: "open" },
      //     sender: { id: 456, name: "Usuario", phone_number: "+57..." },
      //     account: { id: 1 },
      //     inbox: { id: 5 },
      //     attachments: [...]
      //   }
      // }

      // Preparar attachments si existen
      const attachments = payload.attachments?.map(att => {
        // Asegurar que la URL sea absoluta/pública
        let dataUrl = att.url;
        if (dataUrl.startsWith('/')) {
          dataUrl = `${config.publicUrl}${dataUrl}`;
        }

        return {
          file_type: att.type,
          data_url: dataUrl,
          file_size: att.fileSize || 0
        };
      }) || [];

      // Nombre del remitente
      const senderName = payload.firstName && payload.lastName
        ? `${payload.firstName} ${payload.lastName}`
        : payload.firstName || payload.lastName || 'Usuario Web';

      const requestPayload = {
        message_type: 'incoming',
        content: payload.message || null,
        conversation: {
          id: conversationId,
          status: 'open',
          labels: payload.labels,
          custom_attributes: {
            sessionId: payload.sessionId, // Mantener el sessionId original
            pageUrl: payload.metadata?.pageUrl
          }
        },
        sender: {
          id: contactId,
          name: senderName,
          // Usamos el teléfono real o el sessionId como fallback para identificación
          phone_number: payload.phone || payload.sessionId,
          email: payload.email,
          custom_attributes: {
            sessionId: payload.sessionId // Redundancia útil
          }
        },
        account: { id: accountId },
        inbox: { id: inboxId },
        ...(attachments.length > 0 && { attachments }),

        // Metadatos adicionales nuestros (por si acaso el flujo cambia para usarlos)
        metadata: {
          sessionId: payload.sessionId,
          timestamp: payload.metadata?.timestamp || new Date().toISOString(),
          ...payload.metadata
        },
        source: 'widget'
      };

      logger.info('[N8NService] Sending message to n8n', {
        sessionId: payload.sessionId,
        conversationId,
        messageLength: payload.message?.length || 0,
        hasAttachments: attachments.length > 0
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

