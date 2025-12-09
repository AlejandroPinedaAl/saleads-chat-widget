/**
 * MessageInput Component
 * Input para escribir y enviar mensajes
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, selectConfig, selectIsConnected } from '@/store/chatStore';
import { translations } from '@/types';
import { socketService } from '@/services/socketService';

export const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = useChatStore(selectConfig);
  const isConnected = useChatStore(selectIsConnected);
  const userPhone = useChatStore((state) => state.userPhone);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);

  const t = translations[config.language || 'es'];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        72 // Max 3 líneas (24px * 3)
      )}px`;
    }
  }, [inputValue]);

  // Focus en el textarea cuando se monta el componente
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Enviar mensaje
   */
  const handleSend = async () => {
    const message = inputValue.trim();

    if (!message || isSending || !isConnected) {
      return;
    }

    setIsSending(true);

    // Agregar mensaje del usuario al estado
    const userMessage = {
      type: 'user' as const,
      content: message,
      status: 'sending' as const,
    };

    addMessage(userMessage);

    // Limpiar input
    setInputValue('');

    try {
      // Enviar mensaje vía Socket.io con metadata incluyendo teléfono
      socketService.sendMessage(message, {
        phone: userPhone,
      });

      // Actualizar estado a "sent"
      // Nota: El ID se genera en el store, necesitamos obtener el último mensaje
      const messages = useChatStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessageStatus(lastMessage.id, 'sent');
      }

      // Emitir evento personalizado
      window.dispatchEvent(
        new CustomEvent('saleads:message-sent', { detail: { message } })
      );
    } catch (error) {
      console.error('Error sending message:', error);

      // Actualizar estado a "error"
      const messages = useChatStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessageStatus(lastMessage.id, 'error');
      }

      // Mostrar mensaje de error
      addMessage({
        type: 'system',
        content: t.errorSending,
      });
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Manejar Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sw-border-t sw-border-gray-200 sw-bg-white sw-p-4">
      <div className="sw-flex sw-items-end sw-gap-2">
        {/* Textarea */}
        <div className="sw-flex-1 sw-relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            disabled={isSending || !isConnected}
            rows={1}
            className="sw-w-full sw-px-4 sw-py-2 sw-border sw-border-gray-300 sw-rounded-lg sw-resize-none sw-outline-none focus:sw-border-primary-500 focus:sw-ring-1 focus:sw-ring-primary-500 disabled:sw-bg-gray-100 disabled:sw-cursor-not-allowed sw-text-sm sw-text-gray-900 placeholder:sw-text-gray-400"
            style={{
              minHeight: '40px',
              maxHeight: '72px',
            }}
          />
        </div>

        {/* Botón de envío */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending || !isConnected}
          className="sw-flex-shrink-0 sw-w-10 sw-h-10 sw-rounded-lg sw-flex sw-items-center sw-justify-center sw-text-white sw-transition-all sw-duration-200 disabled:sw-opacity-50 disabled:sw-cursor-not-allowed hover:sw-opacity-90"
          style={{
            backgroundColor: config.primaryColor || '#3B82F6',
          }}
          aria-label={t.send}
        >
          {isSending ? (
            // Spinner
            <svg
              className="sw-animate-spin sw-h-5 sw-w-5"
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
          ) : (
            // Icono de envío (avión de papel)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="sw-w-5 sw-h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </div>

      {/* Indicador de desconexión */}
      {!isConnected && (
        <div className="sw-mt-2 sw-text-xs sw-text-red-500 sw-flex sw-items-center sw-gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="sw-w-4 sw-h-4"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          {t.errorConnection}
        </div>
      )}
    </div>
  );
};

