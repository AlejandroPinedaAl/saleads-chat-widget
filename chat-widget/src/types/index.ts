/**
 * Tipos TypeScript para el Chat Widget de SaleAds
 */

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'user' | 'agent' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  metadata?: {
    subAgent?: string;
    processingTime?: number;
    [key: string]: any;
  };
}

// ============================================
// WIDGET CONFIGURATION
// ============================================

export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetLanguage = 'es' | 'en';
export type WidgetTheme = 'light' | 'dark';

export interface WidgetConfig {
  // API Configuration
  apiUrl?: string;
  apiKey?: string;

  // Visual Configuration
  position?: WidgetPosition;
  primaryColor?: string;
  theme?: WidgetTheme;

  // Content Configuration
  language?: WidgetLanguage;
  greeting?: string;
  agentName?: string;
  agentAvatar?: string;

  // Behavior Configuration
  autoOpen?: boolean;
  autoOpenDelay?: number; // milliseconds
  includePages?: string[];
  excludePages?: string[];

  // User Information (pre-fill)
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };

  // GDPR
  gdprNotice?: boolean;
  gdprText?: string;
  gdprLink?: string;
}

// ============================================
// SOCKET EVENTS
// ============================================

export interface SocketEvents {
  // Client -> Server
  'join-session': (data: { sessionId: string }) => void;
  'user-message': (data: { sessionId: string; message: string; metadata?: any }) => void;
  'disconnect': () => void;

  // Server -> Client
  'agent-response': (data: AgentResponseData) => void;
  'agent-typing': () => void;
  'connection-status': (connected: boolean) => void;
  'error': (error: ErrorData) => void;
}

export interface AgentResponseData {
  message: string;
  timestamp: string;
  metadata?: {
    subAgent?: string;
    processingTime?: number;
    contactId?: string;
    [key: string]: any;
  };
}

export interface ErrorData {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// CHAT STATE
// ============================================

export interface ChatState {
  // UI State
  isOpen: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  isAgentTyping: boolean;
  userPhone: string | null;
  phoneCaptured: boolean;

  // Data
  messages: Message[];
  unreadCount: number;
  sessionId: string;

  // Configuration
  config: WidgetConfig;

  // Actions
  setIsOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setAgentTyping: (typing: boolean) => void;
  setUserPhone: (phone: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  markAsRead: () => void;
  initSession: () => void;
  setConfig: (config: WidgetConfig) => void;
  clearMessages: () => void;
}

// ============================================
// API TYPES
// ============================================

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  metadata?: {
    userAgent?: string;
    pageUrl?: string;
    [key: string]: any;
  };
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  services: {
    redis: 'connected' | 'disconnected';
    ghl: 'connected' | 'disconnected';
    socket: 'running' | 'stopped';
  };
  timestamp: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface WindowWithWidget extends Window {
  saleadsConfig?: WidgetConfig;
  SaleAdsWidget?: {
    init: (config: WidgetConfig) => void;
    open: () => void;
    close: () => void;
    minimize: () => void;
    sendMessage: (message: string) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
  };
}

// ============================================
// TRANSLATIONS
// ============================================

export interface Translations {
  greeting: string;
  placeholder: string;
  send: string;
  typing: string;
  online: string;
  offline: string;
  minimize: string;
  close: string;
  errorSending: string;
  errorConnection: string;
  rateLimitExceeded: string;
  gdprNotice: string;
}

export const translations: Record<WidgetLanguage, Translations> = {
  es: {
    greeting: '¡Hola! ¿En qué puedo ayudarte?',
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    typing: 'está escribiendo...',
    online: 'En línea',
    offline: 'Desconectado',
    minimize: 'Minimizar',
    close: 'Cerrar',
    errorSending: 'Error al enviar mensaje. Intenta de nuevo.',
    errorConnection: 'Sin conexión. Reconectando...',
    rateLimitExceeded: 'Demasiados mensajes. Espera un momento.',
    gdprNotice: 'Al usar este chat, aceptas nuestra política de privacidad.',
  },
  en: {
    greeting: 'Hello! How can I help you?',
    placeholder: 'Type your message...',
    send: 'Send',
    typing: 'is typing...',
    online: 'Online',
    offline: 'Offline',
    minimize: 'Minimize',
    close: 'Close',
    errorSending: 'Error sending message. Try again.',
    errorConnection: 'No connection. Reconnecting...',
    rateLimitExceeded: 'Too many messages. Wait a moment.',
    gdprNotice: 'By using this chat, you accept our privacy policy.',
  },
};

