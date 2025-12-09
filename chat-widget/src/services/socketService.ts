/**
 * Socket.io Service - Maneja la conexión WebSocket con el backend
 */

import { io, Socket } from 'socket.io-client';
import type { AgentResponseData, ErrorData } from '@/types';

export class SocketService {
  private socket: Socket | null = null;
  private sessionId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // ms

  /**
   * Conectar al servidor Socket.io
   */
  connect(apiUrl: string, sessionId: string): void {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    this.sessionId = sessionId;

    console.log('[SocketService] Connecting to:', apiUrl);

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'], // Intentar WebSocket primero, fallback a polling
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  /**
   * Configurar listeners de eventos del socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('[SocketService] Connected with ID:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Unirse a la sala de la sesión
      this.socket?.emit('join-session', { sessionId: this.sessionId });
    });

    // Evento: Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    // Evento: Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[SocketService] Max reconnection attempts reached');
      }
    });

    // Evento: Reconexión exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[SocketService] Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;

      // Re-unirse a la sala de la sesión
      this.socket?.emit('join-session', { sessionId: this.sessionId });
    });

    // Evento: Intentando reconectar
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketService] Reconnection attempt:', attemptNumber);
    });

    // Evento: Falló la reconexión
    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] Reconnection failed');
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Enviar mensaje al servidor
   */
  sendMessage(message: string, metadata?: any): void {
    if (!this.socket?.connected) {
      console.error('[SocketService] Cannot send message: not connected');
      throw new Error('Socket not connected');
    }

    console.log('[SocketService] Sending message:', message);

    this.socket.emit('user-message', {
      sessionId: this.sessionId,
      message,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Escuchar respuestas del agente
   */
  onAgentResponse(callback: (data: AgentResponseData) => void): void {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    this.socket.on('agent-response', (data: AgentResponseData) => {
      console.log('[SocketService] Agent response received:', data);
      callback(data);
    });
  }

  /**
   * Escuchar indicador de "agente escribiendo"
   */
  onAgentTyping(callback: () => void): void {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    this.socket.on('agent-typing', () => {
      console.log('[SocketService] Agent is typing...');
      callback();
    });
  }

  /**
   * Escuchar cambios en el estado de conexión
   */
  onConnectionStatus(callback: (connected: boolean) => void): void {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    this.socket.on('connect', () => callback(true));
    this.socket.on('disconnect', () => callback(false));
    this.socket.on('connect_error', () => callback(false));
  }

  /**
   * Escuchar errores del servidor
   */
  onError(callback: (error: ErrorData) => void): void {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    this.socket.on('error', (error: ErrorData) => {
      console.error('[SocketService] Server error:', error);
      callback(error);
    });
  }

  /**
   * Remover listener de un evento
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtener ID del socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Forzar reconexión
   */
  forceReconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Forcing reconnection...');
      this.socket.disconnect();
      this.socket.connect();
    }
  }
}

// Exportar instancia singleton
export const socketService = new SocketService();

