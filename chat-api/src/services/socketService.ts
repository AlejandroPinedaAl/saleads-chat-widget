/**
 * Socket.io Service
 * Manejo de conexiones WebSocket en tiempo real
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { redisService } from './redisService.js';
import { ghlService } from './ghlService.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  UserMessageData,
  AgentResponseData,
} from '../types/index.js';

class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
  private connectedClients: Map<string, string> = new Map(); // socketId -> sessionId

  /**
   * Inicializar Socket.io server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.security.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: config.socket.pingTimeout,
      pingInterval: config.socket.pingInterval,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();

    logger.info('[SocketService] Initialized', {
      corsOrigins: config.security.corsOrigins,
      pingTimeout: config.socket.pingTimeout,
      pingInterval: config.socket.pingInterval,
    });
  }

  /**
   * Configurar event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      logger.info('[SocketService] Client connected', { socketId: socket.id });

      // Emitir estado de conexión
      socket.emit('connection-status', true);

      // Verificar límite de conexiones
      if (this.connectedClients.size >= config.socket.maxConnections) {
        logger.warn('[SocketService] Max connections reached', {
          current: this.connectedClients.size,
          max: config.socket.maxConnections,
        });
        socket.emit('error', {
          code: 'MAX_CONNECTIONS',
          message: 'Server at maximum capacity. Please try again later.',
        });
        socket.disconnect(true);
        return;
      }

      // Event: Unirse a sesión
      socket.on('join-session', async (data) => {
        try {
          const { sessionId } = data;

          if (!sessionId) {
            socket.emit('error', {
              code: 'INVALID_SESSION',
              message: 'Session ID is required',
            });
            return;
          }

          // Unirse a la sala de la sesión
          socket.join(`session:${sessionId}`);
          socket.data.sessionId = sessionId;

          // Registrar conexión
          this.connectedClients.set(socket.id, sessionId);

          logger.info('[SocketService] Client joined session', {
            socketId: socket.id,
            sessionId,
          });

          // Verificar si la sesión existe en Redis
          const sessionExists = await redisService.sessionExists(sessionId);
          if (!sessionExists) {
            // Crear nueva sesión
            await redisService.setSession(sessionId, {
              sessionId,
              contactId: '',
              startedAt: Date.now(),
              lastMessageAt: Date.now(),
              messageCount: 0,
            });
            logger.info('[SocketService] New session created', { sessionId });
          } else {
            // Extender TTL de sesión existente
            await redisService.extendSessionTTL(sessionId);
          }
        } catch (error: any) {
          logger.error('[SocketService] Error joining session', {
            socketId: socket.id,
            error: error.message,
          });
          socket.emit('error', {
            code: 'SESSION_ERROR',
            message: 'Error joining session',
          });
        }
      });

      // Event: Mensaje del usuario
      socket.on('user-message', async (data: UserMessageData) => {
        try {
          const { sessionId, message, metadata } = data;

          if (!sessionId || !message) {
            socket.emit('error', {
              code: 'INVALID_MESSAGE',
              message: 'Session ID and message are required',
            });
            return;
          }

          logger.info('[SocketService] User message received', {
            socketId: socket.id,
            sessionId,
            messageLength: message.length,
          });

          // Obtener sesión de Redis
          let session = await redisService.getSession(sessionId);

          if (!session) {
            // Crear sesión si no existe
            await redisService.setSession(sessionId, {
              sessionId,
              contactId: '',
              startedAt: Date.now(),
              lastMessageAt: Date.now(),
              messageCount: 0,
              metadata,
            });
            session = await redisService.getSession(sessionId);
          }

          // Crear o actualizar contacto en GoHighLevel
          let contactId = session?.contactId || '';

          if (!contactId) {
            try {
              const upsertResult = await ghlService.upsertContact({
                sessionId,
                phone: metadata?.phone,
                email: metadata?.email,
                firstName: metadata?.firstName,
                lastName: metadata?.lastName,
              });

              contactId = upsertResult.contactId;

              // Actualizar sesión con contactId
              await redisService.setSession(sessionId, {
                ...session!,
                contactId,
              });

              logger.info('[SocketService] Contact created/updated', {
                sessionId,
                contactId,
                isNew: upsertResult.isNew,
              });
            } catch (error: any) {
              logger.error('[SocketService] Error creating/updating contact', {
                sessionId,
                error: error.message,
              });
              // Continuar sin contactId (se puede crear después)
            }
          }

          // Enviar mensaje a GoHighLevel
          if (contactId) {
            try {
              // Para WhatsApp, asegurar que el contacto tenga teléfono
              // Si tenemos teléfono en metadata, actualizar el contacto antes de enviar
              if (metadata?.phone) {
                try {
                  await ghlService.updateContact(contactId, {
                    phone: metadata.phone,
                  });
                  logger.info('[SocketService] Contact phone updated', {
                    contactId,
                    phone: metadata.phone,
                  });
                } catch (updateError: any) {
                  logger.warn('[SocketService] Could not update contact phone', {
                    contactId,
                    error: updateError.message,
                  });
                  // Continuar intentando enviar el mensaje
                }
              }

              await ghlService.sendMessage({
                type: 'WhatsApp',
                contactId,
                message,
              });

              logger.info('[SocketService] Message sent to GHL', {
                sessionId,
                contactId,
              });
            } catch (error: any) {
              logger.error('[SocketService] Error sending message to GHL', {
                sessionId,
                contactId,
                error: error.message,
              });
            }
          }

          // Incrementar contador de mensajes
          await redisService.incrementMessageCount(sessionId);

          // Emitir indicador de "agente escribiendo"
          this.emitAgentTyping(sessionId);

          // Nota: La respuesta del agente llegará vía webhook de n8n
          // y será emitida por el endpoint /api/webhook/n8n-response
        } catch (error: any) {
          logger.error('[SocketService] Error processing user message', {
            socketId: socket.id,
            error: error.message,
          });
          socket.emit('error', {
            code: 'MESSAGE_ERROR',
            message: 'Error processing message',
          });
        }
      });

      // Event: Desconexión
      socket.on('disconnect', (reason) => {
        const sessionId = this.connectedClients.get(socket.id);

        logger.info('[SocketService] Client disconnected', {
          socketId: socket.id,
          sessionId,
          reason,
        });

        // Remover de la lista de clientes conectados
        this.connectedClients.delete(socket.id);

        // Emitir estado de conexión
        socket.emit('connection-status', false);
      });
    });
  }

  /**
   * Emitir respuesta del agente a una sesión específica
   */
  emitAgentResponse(sessionId: string, data: AgentResponseData): void {
    if (!this.io) {
      logger.error('[SocketService] Socket.io not initialized');
      return;
    }

    this.io.to(`session:${sessionId}`).emit('agent-response', data);

    logger.info('[SocketService] Agent response emitted', {
      sessionId,
      messageLength: data.message.length,
    });
  }

  /**
   * Emitir indicador de "agente escribiendo"
   */
  emitAgentTyping(sessionId: string): void {
    if (!this.io) {
      logger.error('[SocketService] Socket.io not initialized');
      return;
    }

    this.io.to(`session:${sessionId}`).emit('agent-typing');

    logger.debug('[SocketService] Agent typing emitted', { sessionId });
  }

  /**
   * Emitir error a una sesión específica
   */
  emitError(sessionId: string, error: { code: string; message: string }): void {
    if (!this.io) {
      logger.error('[SocketService] Socket.io not initialized');
      return;
    }

    this.io.to(`session:${sessionId}`).emit('error', error);

    logger.warn('[SocketService] Error emitted', { sessionId, error });
  }

  /**
   * Obtener número de clientes conectados
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obtener sesiones activas
   */
  getActiveSessions(): string[] {
    return Array.from(new Set(this.connectedClients.values()));
  }

  /**
   * Health check
   */
  healthCheck(): boolean {
    return this.io !== null;
  }
}

// Exportar instancia singleton
export const socketService = new SocketService();

