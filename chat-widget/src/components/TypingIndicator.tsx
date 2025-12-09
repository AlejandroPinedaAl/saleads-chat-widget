/**
 * TypingIndicator Component
 * Muestra animación de "agente escribiendo..."
 */

import React from 'react';
import { useChatStore, selectConfig } from '@/store/chatStore';
import { translations } from '@/types';

export const TypingIndicator: React.FC = () => {
  const config = useChatStore(selectConfig);
  const t = translations[config.language || 'es'];

  return (
    <div className="sw-flex sw-items-start sw-gap-2 sw-px-4 sw-py-2 sw-animate-fade-in">
      {/* Avatar del agente */}
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

      {/* Indicador de escritura */}
      <div className="sw-flex sw-flex-col sw-gap-1">
        <div className="sw-bg-gray-100 sw-rounded-2xl sw-rounded-tl-none sw-px-4 sw-py-3 sw-max-w-xs">
          <div className="sw-flex sw-items-center sw-gap-1">
            <div
              className="sw-w-2 sw-h-2 sw-rounded-full sw-bg-gray-400 sw-animate-typing"
              style={{ animationDelay: '0s' }}
            />
            <div
              className="sw-w-2 sw-h-2 sw-rounded-full sw-bg-gray-400 sw-animate-typing"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="sw-w-2 sw-h-2 sw-rounded-full sw-bg-gray-400 sw-animate-typing"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
        <span className="sw-text-xs sw-text-gray-500 sw-px-2">
          {config.agentName || 'SaleAds'} {t.typing}
        </span>
      </div>
    </div>
  );
};

