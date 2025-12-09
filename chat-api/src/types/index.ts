/**
 * TypeScript Types para el API Bridge
 */

// ============================================
// SOCKET.IO EVENTS
// ============================================

export interface ServerToClientEvents {
  'agent-response': (data: AgentResponseData) => void;
  'agent-typing': () => void;
  'connection-status': (connected: boolean) => void;
  'error': (error: ErrorResponse) => void;
}

export interface ClientToServerEvents {
  'join-session': (data: { sessionId: string }) => void;
  'user-message': (data: UserMessageData) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  sessionId: string;
  userId?: string;
}

// ============================================
// MESSAGE DATA
// ============================================

export interface UserMessageData {
  sessionId: string;
  message: string;
  metadata?: {
    userAgent?: string;
    pageUrl?: string;
    timestamp?: string;
    [key: string]: any;
  };
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

// ============================================
// GOHIGHLEVEL TYPES
// ============================================

export interface GHLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  dateAdded?: string;
  dateUpdated?: string;
}

export interface GHLCreateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customField?: Record<string, any>;
}

export interface GHLSendMessageRequest {
  type: 'SMS' | 'Email' | 'WhatsApp' | 'GMB' | 'IG' | 'FB' | 'Custom' | 'Live_Chat';
  contactId: string;
  message?: string;
  subject?: string;
  emailFrom?: string;
  html?: string;
}

export interface GHLConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageDate: string;
  lastMessageType: string;
  unreadCount: number;
}

// ============================================
// REDIS SESSION
// ============================================

export interface SessionData {
  sessionId: string;
  contactId: string;
  startedAt: number;
  lastMessageAt: number;
  messageCount: number;
  metadata?: {
    userAgent?: string;
    pageUrl?: string;
    [key: string]: any;
  };
}

// ============================================
// N8N WEBHOOK
// ============================================

export interface N8NWebhookRequest {
  sessionId: string;
  response: string;
  metadata?: {
    subAgent?: string;
    processingTime?: number;
    contactId?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

// ============================================
// API RESPONSES
// ============================================

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
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
  uptime: number;
}

// ============================================
// RATE LIMIT
// ============================================

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetAt: number;
}

// ============================================
// CONFIGURATION
// ============================================

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  ghl: {
    apiKey: string;
    locationId: string;
    apiUrl: string;
  };
  
  redis: {
    url: string;
    token: string;
  };
  
  security: {
    webhookSecret: string;
    jwtSecret: string;
    corsOrigins: string[];
  };
  
  socket: {
    pingTimeout: number;
    pingInterval: number;
    maxConnections: number;
  };
  
  rateLimit: {
    messagesPerMinute: number;
    messagesPerHour: number;
    windowMs: number;
  };
  
  logging: {
    level: string;
    format: 'json' | 'simple';
  };
}

