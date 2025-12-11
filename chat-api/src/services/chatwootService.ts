/**
 * Chatwoot Service
 * Integración con la API de Chatwoot para gestión de contactos y conversaciones
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
  ChatwootContact,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootCreateContactRequest,
  ChatwootCreateConversationRequest,
  ChatwootSendMessageRequest,
} from '../types/index.js';

class ChatwootService {
  private client: AxiosInstance;
  private readonly accountId: string;
  private readonly inboxId: string;
  private enabled: boolean;

  constructor() {
    this.accountId = config.chatwoot.accountId;
    this.inboxId = config.chatwoot.inboxId;
    this.enabled = !!config.chatwoot.apiUrl && !!config.chatwoot.apiKey;

    if (!this.enabled) {
      logger.warn('[ChatwootService] Not enabled - Missing CHATWOOT_API_URL or CHATWOOT_API_KEY');
      // Crear un cliente dummy para evitar errores
      this.client = axios.create();
      return;
    }

    this.client = axios.create({
      baseURL: `${config.chatwoot.apiUrl}/api/v1`,
      headers: {
        'api_access_token': config.chatwoot.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para logging de requests
    this.client.interceptors.request.use(
      (requestConfig) => {
        logger.debug('[ChatwootService] Request', {
          method: requestConfig.method,
          url: requestConfig.url,
          data: requestConfig.data,
        });
        return requestConfig;
      },
      (error) => {
        logger.error('[ChatwootService] Request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('[ChatwootService] Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('[ChatwootService] Response error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );

    logger.info('[ChatwootService] Initialized', {
      accountId: this.accountId,
      inboxId: this.inboxId,
      apiUrl: config.chatwoot.apiUrl,
    });
  }

  /**
   * Verifica si el servicio está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Buscar contacto por identificador personalizado (sessionId)
   * Chatwoot permite usar custom_attributes para buscar contactos
   */
  async findContactByIdentifier(identifier: string): Promise<ChatwootContact | null> {
    if (!this.enabled) {
      logger.warn('[ChatwootService] Service not enabled, skipping findContactByIdentifier');
      return null;
    }

    try {
      // Buscar contacto por identifier en custom_attributes
      const response = await this.client.get(`/accounts/${this.accountId}/contacts/search`, {
        params: {
          q: identifier,
        },
      });

      if (response.data.payload && response.data.payload.length > 0) {
        // Buscar el contacto que tenga el identifier en custom_attributes
        const contact = response.data.payload.find((c: any) => 
          c.custom_attributes?.session_id === identifier ||
          c.identifier === identifier
        );

        if (contact) {
          logger.info('[ChatwootService] Contact found by identifier', {
            contactId: contact.id,
            identifier,
          });
          return contact;
        }
      }

      logger.info('[ChatwootService] Contact not found by identifier', { identifier });
      return null;
    } catch (error: any) {
      logger.error('[ChatwootService] Error finding contact by identifier', {
        identifier,
        error: error.response?.data || error.message,
      });
      return null;
    }
  }

  /**
   * Crear un nuevo contacto en Chatwoot
   * Permite crear contactos sin email ni phone usando identifier
   */
  async createContact(data: ChatwootCreateContactRequest): Promise<ChatwootContact> {
    if (!this.enabled) {
      throw new Error('ChatwootService not enabled');
    }

    try {
      const payload: any = {
        inbox_id: this.inboxId,
        name: data.name || 'Usuario Widget',
        identifier: data.identifier, // sessionId como identificador único
        custom_attributes: {
          session_id: data.identifier,
          ...(data.customAttributes || {}),
        },
      };

      // Agregar email y phone solo si están presentes
      if (data.email) {
        payload.email = data.email;
      }
      if (data.phone) {
        payload.phone_number = data.phone;
      }

      logger.info('[ChatwootService] Creating contact', {
        identifier: data.identifier,
        name: data.name,
        hasEmail: !!data.email,
        hasPhone: !!data.phone,
      });

      const response = await this.client.post(
        `/accounts/${this.accountId}/contacts`,
        payload
      );

      const contact = response.data.payload.contact;

      logger.info('[ChatwootService] Contact created', {
        contactId: contact.id,
        identifier: data.identifier,
      });

      return contact;
    } catch (error: any) {
      logger.error('[ChatwootService] Error creating contact', {
        data,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Obtener o crear un contacto
   * Primero intenta buscar, si no existe lo crea
   */
  async getOrCreateContact(data: ChatwootCreateContactRequest): Promise<ChatwootContact> {
    if (!this.enabled) {
      throw new Error('ChatwootService not enabled');
    }

    try {
      // Intentar buscar el contacto por identifier
      let contact = await this.findContactByIdentifier(data.identifier);

      if (contact) {
        logger.info('[ChatwootService] Using existing contact', {
          contactId: contact.id,
          identifier: data.identifier,
        });
        return contact;
      }

      // Si no existe, crear uno nuevo
      logger.info('[ChatwootService] Contact not found, creating new one', {
        identifier: data.identifier,
      });
      contact = await this.createContact(data);

      return contact;
    } catch (error: any) {
      logger.error('[ChatwootService] Error in getOrCreateContact', {
        data,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Crear una nueva conversación en Chatwoot
   */
  async createConversation(
    data: ChatwootCreateConversationRequest
  ): Promise<ChatwootConversation> {
    if (!this.enabled) {
      throw new Error('ChatwootService not enabled');
    }

    try {
      const payload = {
        source_id: data.sourceId || data.contactId,
        inbox_id: this.inboxId,
        contact_id: data.contactId,
        status: data.status || 'open',
        custom_attributes: data.customAttributes || {},
      };

      logger.info('[ChatwootService] Creating conversation', {
        contactId: data.contactId,
        sourceId: data.sourceId,
      });

      const response = await this.client.post(
        `/accounts/${this.accountId}/conversations`,
        payload
      );

      const conversation = response.data;

      logger.info('[ChatwootService] Conversation created', {
        conversationId: conversation.id,
        contactId: data.contactId,
      });

      return conversation;
    } catch (error: any) {
      logger.error('[ChatwootService] Error creating conversation', {
        data,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Buscar conversaciones de un contacto
   */
  async getContactConversations(contactId: string): Promise<ChatwootConversation[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await this.client.get(
        `/accounts/${this.accountId}/contacts/${contactId}/conversations`
      );

      const conversations = response.data.payload || [];

      logger.debug('[ChatwootService] Contact conversations retrieved', {
        contactId,
        count: conversations.length,
      });

      return conversations;
    } catch (error: any) {
      logger.error('[ChatwootService] Error getting contact conversations', {
        contactId,
        error: error.response?.data || error.message,
      });
      return [];
    }
  }

  /**
   * Obtener la última conversación abierta de un contacto
   * Si no hay ninguna abierta, devuelve null
   */
  async getOpenConversation(contactId: string): Promise<ChatwootConversation | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const conversations = await this.getContactConversations(contactId);

      // Buscar la conversación más reciente que esté abierta (status: 'open')
      const openConversation = conversations.find(
        (conv) => conv.status === 'open' || conv.status === 'pending'
      );

      if (openConversation) {
        logger.info('[ChatwootService] Open conversation found', {
          conversationId: openConversation.id,
          contactId,
        });
        return openConversation;
      }

      logger.info('[ChatwootService] No open conversation found', { contactId });
      return null;
    } catch (error: any) {
      logger.error('[ChatwootService] Error getting open conversation', {
        contactId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Obtener o crear una conversación para un contacto
   * Si ya existe una conversación abierta, la retorna
   * Si no, crea una nueva
   */
  async getOrCreateConversation(
    contactId: string,
    sourceId?: string
  ): Promise<ChatwootConversation> {
    if (!this.enabled) {
      throw new Error('ChatwootService not enabled');
    }

    try {
      // Buscar conversación abierta
      let conversation = await this.getOpenConversation(contactId);

      if (conversation) {
        logger.info('[ChatwootService] Using existing open conversation', {
          conversationId: conversation.id,
          contactId,
        });
        return conversation;
      }

      // Si no hay conversación abierta, crear una nueva
      logger.info('[ChatwootService] No open conversation, creating new one', {
        contactId,
      });

      conversation = await this.createConversation({
        contactId,
        sourceId: sourceId || contactId,
        status: 'open',
      });

      return conversation;
    } catch (error: any) {
      logger.error('[ChatwootService] Error in getOrCreateConversation', {
        contactId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Enviar un mensaje en una conversación
   */
  async sendMessage(data: ChatwootSendMessageRequest): Promise<ChatwootMessage> {
    if (!this.enabled) {
      throw new Error('ChatwootService not enabled');
    }

    try {
      const payload: any = {
        content: data.content,
        message_type: data.messageType || 'incoming',
        private: data.private || false,
      };

      // Agregar content_type si se especifica
      if (data.contentType) {
        payload.content_type = data.contentType;
      }

      // Agregar content_attributes si se especifican (para archivos, etc.)
      if (data.contentAttributes) {
        payload.content_attributes = data.contentAttributes;
      }

      logger.info('[ChatwootService] Sending message', {
        conversationId: data.conversationId,
        messageType: data.messageType,
        contentLength: data.content.length,
      });

      const response = await this.client.post(
        `/accounts/${this.accountId}/conversations/${data.conversationId}/messages`,
        payload
      );

      const message = response.data;

      logger.info('[ChatwootService] Message sent', {
        messageId: message.id,
        conversationId: data.conversationId,
      });

      return message;
    } catch (error: any) {
      logger.error('[ChatwootService] Error sending message', {
        conversationId: data.conversationId,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Actualizar el estado de una conversación
   */
  async updateConversationStatus(
    conversationId: number,
    status: 'open' | 'resolved' | 'pending'
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.client.post(
        `/accounts/${this.accountId}/conversations/${conversationId}/toggle_status`,
        { status }
      );

      logger.info('[ChatwootService] Conversation status updated', {
        conversationId,
        status,
      });
    } catch (error: any) {
      logger.error('[ChatwootService] Error updating conversation status', {
        conversationId,
        status,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getConversationMessages(conversationId: number): Promise<ChatwootMessage[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await this.client.get(
        `/accounts/${this.accountId}/conversations/${conversationId}/messages`
      );

      const messages = response.data.payload || [];

      logger.debug('[ChatwootService] Conversation messages retrieved', {
        conversationId,
        count: messages.length,
      });

      return messages;
    } catch (error: any) {
      logger.error('[ChatwootService] Error getting conversation messages', {
        conversationId,
        error: error.response?.data || error.message,
      });
      return [];
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Intentar obtener información de la cuenta
      await this.client.get(`/accounts/${this.accountId}`);
      logger.info('[ChatwootService] Health check passed');
      return true;
    } catch (error: any) {
      logger.error('[ChatwootService] Health check failed', {
        error: error.response?.data || error.message,
      });
      return false;
    }
  }
}

export const chatwootService = new ChatwootService();

