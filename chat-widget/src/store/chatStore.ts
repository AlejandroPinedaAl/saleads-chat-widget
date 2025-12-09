/**
 * Zustand Store para el estado global del chat
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { ChatState, Message, MessageStatus, WidgetConfig } from '@/types';

// Generar session ID único basado en timestamp + random
const generateSessionId = (): string => {
  return `session_${Date.now()}_${nanoid(10)}`;
};

// Cargar session ID del localStorage o crear uno nuevo
const getOrCreateSessionId = (): string => {
  const stored = localStorage.getItem('saleads_session_id');
  if (stored) {
    return stored;
  }
  const newSessionId = generateSessionId();
  localStorage.setItem('saleads_session_id', newSessionId);
  return newSessionId;
};

// Store de Zustand
export const useChatStore = create<ChatState>((set, get) => ({
  // ============================================
  // INITIAL STATE
  // ============================================
  isOpen: false,
  isMinimized: false,
  isConnected: false,
  isAgentTyping: false,
  userPhone: localStorage.getItem('saleads_user_phone') || null,
  phoneCaptured: !!localStorage.getItem('saleads_user_phone'),
  messages: [],
  unreadCount: 0,
  sessionId: getOrCreateSessionId(),
  config: {
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    language: 'es',
    theme: 'light',
    agentName: 'SaleAds',
  },

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Abrir/cerrar ventana de chat
   */
  setIsOpen: (open: boolean) => {
    set({ isOpen: open });
    
    // Si se abre el chat, marcar mensajes como leídos
    if (open) {
      get().markAsRead();
    }

    // Emitir evento personalizado para tracking
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(open ? 'saleads:widget-opened' : 'saleads:widget-closed')
      );
    }
  },

  /**
   * Minimizar/maximizar ventana
   */
  setIsMinimized: (minimized: boolean) => {
    set({ isMinimized: minimized });
  },

  /**
   * Actualizar estado de conexión
   */
  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  /**
   * Actualizar indicador de "agente escribiendo"
   */
  setAgentTyping: (typing: boolean) => {
    set({ isAgentTyping: typing });
  },

  /**
   * Guardar teléfono del usuario
   */
  setUserPhone: (phone: string) => {
    localStorage.setItem('saleads_user_phone', phone);
    set({ userPhone: phone, phoneCaptured: true });
  },

  /**
   * Agregar nuevo mensaje
   */
  addMessage: (messageData) => {
    const message: Message = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...messageData,
    };

    set((state) => ({
      messages: [...state.messages, message],
      // Incrementar contador de no leídos solo si el chat está cerrado y es mensaje del agente
      unreadCount:
        !state.isOpen && message.type === 'agent'
          ? state.unreadCount + 1
          : state.unreadCount,
    }));

    // Guardar mensajes en localStorage (últimos 50)
    const { messages } = get();
    const messagesToStore = messages.slice(-50);
    localStorage.setItem(
      `saleads_messages_${get().sessionId}`,
      JSON.stringify(messagesToStore)
    );

    // Emitir evento personalizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('saleads:message-added', { detail: message })
      );
    }
  },

  /**
   * Actualizar estado de un mensaje (sending -> sent -> error)
   */
  updateMessageStatus: (messageId: string, status: MessageStatus) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    }));
  },

  /**
   * Marcar todos los mensajes como leídos
   */
  markAsRead: () => {
    set({ unreadCount: 0 });
  },

  /**
   * Inicializar sesión (cargar mensajes del localStorage)
   */
  initSession: () => {
    const sessionId = get().sessionId;
    const storedMessages = localStorage.getItem(`saleads_messages_${sessionId}`);

    if (storedMessages) {
      try {
        const messages = JSON.parse(storedMessages) as Message[];
        set({ messages });
      } catch (error) {
        console.error('Error loading stored messages:', error);
      }
    }

    // Si no hay mensajes, agregar mensaje de bienvenida
    if (get().messages.length === 0) {
      const greeting = get().config.greeting || '¡Hola! ¿En qué puedo ayudarte?';
      get().addMessage({
        type: 'agent',
        content: greeting,
      });
    }
  },

  /**
   * Configurar widget
   */
  setConfig: (config: WidgetConfig) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  /**
   * Limpiar todos los mensajes
   */
  clearMessages: () => {
    set({ messages: [], unreadCount: 0 });
    const sessionId = get().sessionId;
    localStorage.removeItem(`saleads_messages_${sessionId}`);
  },
}));

// ============================================
// SELECTORS (para optimizar re-renders)
// ============================================

export const selectIsOpen = (state: ChatState) => state.isOpen;
export const selectIsConnected = (state: ChatState) => state.isConnected;
export const selectIsAgentTyping = (state: ChatState) => state.isAgentTyping;
export const selectMessages = (state: ChatState) => state.messages;
export const selectUnreadCount = (state: ChatState) => state.unreadCount;
export const selectConfig = (state: ChatState) => state.config;
export const selectSessionId = (state: ChatState) => state.sessionId;

