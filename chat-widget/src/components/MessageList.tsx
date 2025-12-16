/**
 * MessageList Component
 * Lista de mensajes del chat con auto-scroll
 */

import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useChatStore, selectMessages, selectConfig, selectIsAgentTyping } from '@/store/chatStore';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '@/types';

export const MessageList: React.FC = () => {
  const messages = useChatStore(selectMessages);
  const config = useChatStore(selectConfig);
  const isAgentTyping = useChatStore(selectIsAgentTyping);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llega un nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  // Formatear timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const locale = config.language === 'es' ? es : enUS;
      return format(date, 'HH:mm', { locale });
    } catch (error) {
      return '';
    }
  };

  // Renderizar mensaje individual
  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    // Tipos multimedia se tratan como mensajes de usuario o agente según el origen, 
    // pero aquí asumimos que si no es system, se renderiza en burbuja


    // Mensaje del sistema (errores, notificaciones)
    if (isSystem) {
      return (
        <div key={message.id} className="sw-flex sw-justify-center sw-px-4 sw-py-2">
          <div className="sw-bg-yellow-50 sw-border sw-border-yellow-200 sw-rounded-lg sw-px-3 sw-py-2 sw-text-xs sw-text-yellow-800 sw-max-w-xs sw-text-center">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`sw-flex sw-items-start sw-gap-2 sw-px-4 sw-py-2 ${isUser ? 'sw-flex-row-reverse' : 'sw-flex-row'
          }`}
      >
        {/* Avatar (solo para mensajes del agente) */}
        {!isUser && (
          <div className="sw-flex-shrink-0">
            {config.agentAvatar ? (
              <img
                src={config.agentAvatar}
                alt={config.agentName || 'Agent'}
                className="sw-w-8 sw-h-8 sw-rounded-full sw-object-cover"
              />
            ) : (
              <div
                className="sw-w-8 sw-h-8 sw-rounded-full sw-flex sw-items-center sw-justify-center sw-text-white sw-font-semibold sw-text-sm"
                style={{ backgroundColor: config.primaryColor || '#3B82F6' }}
              >
                {(config.agentName || 'SA').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Contenido del mensaje */}
        <div
          className={`sw-flex sw-flex-col sw-gap-1 ${isUser ? 'sw-items-end' : 'sw-items-start'
            } sw-max-w-[75%]`}
        >
          {/* Burbuja del mensaje */}
          <div
            className={`sw-rounded-2xl sw-px-4 sw-py-2 sw-break-words ${isUser
              ? 'sw-text-white sw-rounded-tr-none'
              : 'sw-bg-gray-100 sw-text-gray-900 sw-rounded-tl-none'
              }`}
            style={{
              backgroundColor: isUser ? config.primaryColor || '#3B82F6' : undefined,
            }}
          >
            {/* Contenido multimedia o texto */}
            {message.type === 'image' ? (
              <img
                src={message.content}
                alt="Imagen adjunta"
                className="sw-max-w-full sw-rounded-lg sw-cursor-pointer hover:sw-opacity-90"
                onClick={() => window.open(message.content, '_blank')}
                style={{ maxHeight: '200px' }}
              />
            ) : message.type === 'video' ? (
              <video
                src={message.content}
                controls
                className="sw-max-w-full sw-rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            ) : message.type === 'audio' ? (
              <audio src={message.content} controls className="sw-w-full sw-min-w-[200px]" />
            ) : (
              <div
                className="sw-text-sm sw-whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: formatMessageContent(message.content),
                }}
              />
            )}
          </div>

          {/* Timestamp y estado */}
          <div
            className={`sw-flex sw-items-center sw-gap-1 sw-text-xs sw-text-gray-500 sw-px-2 ${isUser ? 'sw-flex-row-reverse' : 'sw-flex-row'
              }`}
          >
            <span>{formatTime(message.timestamp)}</span>

            {/* Indicador de estado (solo para mensajes del usuario) */}
            {isUser && message.status && (
              <>
                {message.status === 'sending' && (
                  <svg
                    className="sw-w-3 sw-h-3 sw-animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="sw-opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="sw-opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {message.status === 'sent' && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="sw-w-3 sw-h-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {message.status === 'error' && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="sw-w-3 sw-h-3 sw-text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="sw-flex-1 sw-overflow-y-auto sw-bg-white"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E0 #F7FAFC',
      }}
    >
      {/* Lista de mensajes */}
      <div className="sw-py-4">
        {messages.length === 0 ? (
          // Estado vacío (no debería ocurrir, siempre hay mensaje de bienvenida)
          <div className="sw-flex sw-items-center sw-justify-center sw-h-full sw-text-gray-400 sw-text-sm">
            No hay mensajes
          </div>
        ) : (
          messages.map(renderMessage)
        )}

        {/* Indicador de "agente escribiendo" */}
        {isAgentTyping && <TypingIndicator />}

        {/* Elemento invisible para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

/**
 * Formatear contenido del mensaje con soporte básico para markdown
 */
function formatMessageContent(content: string): string {
  let formatted = content;

  // Escapar HTML para prevenir XSS
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold: **texto** o __texto__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *texto* o _texto_
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links: [texto](url)
  formatted = formatted.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="sw-underline sw-text-blue-600 hover:sw-text-blue-800">$1</a>'
  );

  // Auto-linkify URLs
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="sw-underline sw-text-blue-600 hover:sw-text-blue-800">$1</a>'
  );

  return formatted;
}

