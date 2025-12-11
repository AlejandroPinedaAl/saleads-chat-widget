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
  'error': (error: { code: string; message: string }) => void;
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
// CHATWOOT TYPES
// ============================================

export interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, any>;
  created_at?: string;
  last_activity_at?: string;
}

export interface ChatwootCreateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  identifier: string; // sessionId como identificador único
  customAttributes?: Record<string, any>;
}

export interface ChatwootConversation {
  id: number;
  account_id: number;
  inbox_id: number;
  contact_id?: number;
  status: 'open' | 'resolved' | 'pending';
  messages?: ChatwootMessage[];
  custom_attributes?: Record<string, any>;
  created_at?: string;
  timestamp?: number;
}

export interface ChatwootCreateConversationRequest {
  contactId: string;
  sourceId?: string;
  status?: 'open' | 'resolved' | 'pending';
  customAttributes?: Record<string, any>;
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  content_type?: 'text' | 'input_select' | 'cards' | 'form' | 'article';
  content_attributes?: Record<string, any>;
  created_at: number;
  private: boolean;
  sender?: {
    id: number;
    name: string;
    type: 'agent_bot' | 'user' | 'contact';
  };
  conversation_id: number;
}

export interface ChatwootSendMessageRequest {
  conversationId: number;
  content: string;
  messageType?: 'incoming' | 'outgoing';
  contentType?: 'text' | 'input_select' | 'cards' | 'form' | 'article';
  contentAttributes?: Record<string, any>;
  private?: boolean;
}

export interface ChatwootWebhookPayload {
  event: 'message_created' | 'message_updated' | 'conversation_created' | 'conversation_updated' | 'conversation_status_changed';
  account?: {
    id: number;
    name: string;
  };
  conversation?: ChatwootConversation;
  message?: ChatwootMessage;
  sender?: {
    id: number;
    name: string;
    type: 'agent_bot' | 'user' | 'contact';
  };
}

// ============================================
// GOHIGHLEVEL TYPES (MANTENER PARA ROLLBACK)
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
  customFields?: Array<{
    field: string;
    value: string;
  }>;
}

export interface GHLSendMessageRequest {
  type: 'SMS' | 'Email' | 'WhatsApp' | 'GMB' | 'IG' | 'FB' | 'Custom' | 'Live_Chat';
  contactId: string;
  locationId?: string;
  message?: string;
  subject?: string;
  emailFrom?: string;
  html?: string;
  assignedTo?: string;
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
  
  chatwoot: {
    apiUrl: string;
    apiKey: string;
    accountId: string;
    inboxId: string;
  };
  
  ghl: {
    apiKey: string;
    locationId: string;
    apiUrl: string;
  };

  n8n: {
    webhookUrl: string;
    webhookSecret: string;
    enabled: boolean;
    timeout: number;
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

