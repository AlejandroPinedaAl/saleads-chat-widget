/**
 * GoHighLevel Service
 * Integración con la API de GoHighLevel
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
  GHLContact,
  GHLCreateContactRequest,
  GHLSendMessageRequest,
  GHLConversation,
} from '../types/index.js';

class GHLService {
  private client: AxiosInstance;
  private readonly locationId: string;

  constructor() {
    this.locationId = config.ghl.locationId;

    this.client = axios.create({
      baseURL: config.ghl.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.ghl.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      timeout: 30000,
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('[GHLService] Request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('[GHLService] Request error', { error });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('[GHLService] Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('[GHLService] Response error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.message || error.message,
        });
        return Promise.reject(error);
      }
    );

    logger.info('[GHLService] Initialized', { locationId: this.locationId });
  }

  /**
   * Buscar contacto por teléfono o email
   */
  async findContact(query: { phone?: string; email?: string }): Promise<GHLContact | null> {
    try {
      const params: any = {
        locationId: this.locationId,
      };

      if (query.phone) {
        params.query = query.phone;
      } else if (query.email) {
        params.query = query.email;
      } else {
        throw new Error('Phone or email is required');
      }

      const response = await this.client.get('/contacts/search', { params });

      if (response.data.contacts && response.data.contacts.length > 0) {
        const contact = response.data.contacts[0];
        logger.info('[GHLService] Contact found', { contactId: contact.id });
        return contact;
      }

      logger.info('[GHLService] Contact not found', query);
      return null;
    } catch (error: any) {
      logger.error('[GHLService] Error finding contact', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Crear nuevo contacto
   */
  async createContact(data: GHLCreateContactRequest): Promise<GHLContact> {
    try {
      const payload = {
        ...data,
        locationId: this.locationId,
      };

      const response = await this.client.post('/contacts', payload);

      const contact = response.data.contact;
      logger.info('[GHLService] Contact created', { contactId: contact.id });

      return contact;
    } catch (error: any) {
      logger.error('[GHLService] Error creating contact', {
        data,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Actualizar contacto existente
   */
  async updateContact(contactId: string, data: Partial<GHLCreateContactRequest>): Promise<GHLContact> {
    try {
      const response = await this.client.put(`/contacts/${contactId}`, data);

      const contact = response.data.contact;
      logger.info('[GHLService] Contact updated', { contactId });

      return contact;
    } catch (error: any) {
      logger.error('[GHLService] Error updating contact', {
        contactId,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Crear o actualizar contacto (upsert)
   */
  async upsertContact(data: {
    sessionId: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ contactId: string; isNew: boolean }> {
    try {
      // Buscar contacto existente
      let contact: GHLContact | null = null;

      if (data.phone) {
        contact = await this.findContact({ phone: data.phone });
      } else if (data.email) {
        contact = await this.findContact({ email: data.email });
      }

      if (contact) {
        // Actualizar contacto existente
        const updated = await this.updateContact(contact.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          customFields: [
            {
              field: 'widget_session_id',
              value: data.sessionId,
            },
          ],
        });

        return { contactId: updated.id, isNew: false };
      } else {
        // Crear nuevo contacto
        const created = await this.createContact({
          firstName: data.firstName || 'Widget',
          lastName: data.lastName || 'User',
          email: data.email,
          phone: data.phone,
          tags: ['widget-chat'],
          customFields: [
            {
              field: 'widget_session_id',
              value: data.sessionId,
            },
          ],
        });

        return { contactId: created.id, isNew: true };
      }
    } catch (error: any) {
      logger.error('[GHLService] Error upserting contact', {
        data,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Enviar mensaje a un contacto
   */
  async sendMessage(data: GHLSendMessageRequest): Promise<{ messageId: string }> {
    try {
      // Asegurar que locationId esté incluido
      const payload = {
        ...data,
        locationId: data.locationId || this.locationId,
      };

      const response = await this.client.post('/conversations/messages', payload);

      const messageId = response.data.messageId || response.data.id;
      logger.info('[GHLService] Message sent', { messageId, contactId: data.contactId, locationId: payload.locationId });

      return { messageId };
    } catch (error: any) {
      logger.error('[GHLService] Error sending message', {
        data,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Obtener conversación de un contacto
   */
  async getConversation(contactId: string): Promise<GHLConversation | null> {
    try {
      const response = await this.client.get(`/conversations/search`, {
        params: {
          locationId: this.locationId,
          contactId,
        },
      });

      if (response.data.conversations && response.data.conversations.length > 0) {
        return response.data.conversations[0];
      }

      return null;
    } catch (error: any) {
      logger.error('[GHLService] Error getting conversation', {
        contactId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/locations/' + this.locationId);
      return true;
    } catch (error) {
      logger.error('[GHLService] Health check failed', { error });
      return false;
    }
  }
}

// Exportar instancia singleton
export const ghlService = new GHLService();

