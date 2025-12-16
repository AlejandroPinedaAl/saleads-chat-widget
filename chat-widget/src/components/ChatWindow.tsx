/**
 * ChatWindow Component
 * Ventana principal del chat
 */

import React from 'react';
import {
  useChatStore,
  selectIsOpen,
  selectIsConnected,
  selectConfig,
} from '@/store/chatStore';
import { translations } from '@/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow: React.FC = () => {
  const isOpen = useChatStore(selectIsOpen);
  const isConnected = useChatStore(selectIsConnected);
  const config = useChatStore(selectConfig);
  const setIsOpen = useChatStore((state) => state.setIsOpen);

  const t = translations[config.language || 'es'];

  if (!isOpen) return null;

  return (
    <div
      className="sw-fixed sw-z-[999999] sw-flex sw-flex-col sw-bg-white sw-rounded-lg sw-shadow-widget sw-overflow-hidden sw-animate-slide-up"
      style={{
        width: '400px',
        height: '600px',
        bottom: '90px',
        right: config.position === 'bottom-right' ? '20px' : 'auto',
        left: config.position === 'bottom-left' ? '20px' : 'auto',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 110px)',
      }}
    >
      {/* Header */}
      <div
        className="sw-flex sw-items-center sw-justify-between sw-px-4 sw-py-3 sw-text-white"
        style={{ backgroundColor: config.primaryColor || '#3B82F6' }}
      >
        {/* Info del agente */}
        <div className="sw-flex sw-items-center sw-gap-3">
          {/* Avatar */}
          {config.agentAvatar ? (
            <img
              src={config.agentAvatar}
              alt={config.agentName || 'Agent'}
              className="sw-w-10 sw-h-10 sw-rounded-full sw-object-cover sw-border-2 sw-border-white"
            />
          ) : (
            <div className="sw-w-10 sw-h-10 sw-rounded-full sw-bg-white sw-bg-opacity-20 sw-flex sw-items-center sw-justify-center sw-font-bold sw-text-lg">
              {(config.agentName || 'SA').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Nombre y estado */}
          <div className="sw-flex sw-flex-col">
            <span className="sw-font-semibold sw-text-sm">
              {config.agentName || 'SaleAds'}
            </span>
            <div className="sw-flex sw-items-center sw-gap-1 sw-text-xs sw-opacity-90">
              <div
                className={`sw-w-2 sw-h-2 sw-rounded-full ${isConnected ? 'sw-bg-green-400' : 'sw-bg-red-400'
                  }`}
              />
              <span>{isConnected ? t.online : t.offline}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="sw-flex sw-items-center sw-gap-2">
          {/* Botón de cerrar */}
          <button
            onClick={() => setIsOpen(false)}
            className="sw-w-8 sw-h-8 sw-rounded-full sw-flex sw-items-center sw-justify-center sw-transition-colors hover:sw-bg-white hover:sw-bg-opacity-20"
            aria-label={t.close}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="sw-w-5 sw-h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body - Chat Instantáneo (PhoneCapture eliminado/movido) */}
      <MessageList />
      <MessageInput />

      {/* GDPR Notice (si está habilitado) */}
      {config.gdprNotice && (
        <div className="sw-border-t sw-border-gray-200 sw-bg-gray-50 sw-px-4 sw-py-2 sw-text-xs sw-text-gray-600">
          {config.gdprText || t.gdprNotice}
          {config.gdprLink && (
            <>
              {' '}
              <a
                href={config.gdprLink}
                target="_blank"
                rel="noopener noreferrer"
                className="sw-underline sw-text-blue-600 hover:sw-text-blue-800"
              >
                Leer más
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
};

