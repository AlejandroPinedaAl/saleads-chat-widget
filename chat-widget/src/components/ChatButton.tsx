/**
 * ChatButton Component
 * Botón flotante para abrir/cerrar el chat
 */

import React from 'react';
import {
  useChatStore,
  selectIsOpen,
  selectUnreadCount,
  selectConfig,
} from '@/store/chatStore';

export const ChatButton: React.FC = () => {
  const isOpen = useChatStore(selectIsOpen);
  const unreadCount = useChatStore(selectUnreadCount);
  const config = useChatStore(selectConfig);
  const setIsOpen = useChatStore((state) => state.setIsOpen);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <button
      onClick={handleClick}
      className="sw-fixed sw-z-[999999] sw-w-[60px] sw-h-[60px] sw-rounded-full sw-shadow-button sw-flex sw-items-center sw-justify-center sw-transition-all sw-duration-300 hover:sw-scale-110 sw-animate-fade-in"
      style={{
        backgroundColor: config.primaryColor || '#3B82F6',
        bottom: '20px',
        right: config.position === 'bottom-right' ? '20px' : 'auto',
        left: config.position === 'bottom-left' ? '20px' : 'auto',
      }}
      aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
    >
      {/* Icono del botón */}
      {isOpen ? (
        // Icono de cerrar (X)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="sw-w-7 sw-h-7 sw-text-white"
        >
          <path
            fillRule="evenodd"
            d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Icono de mensaje
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="sw-w-7 sw-h-7 sw-text-white"
        >
          <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {/* Badge de mensajes no leídos */}
      {!isOpen && unreadCount > 0 && (
        <div className="sw-absolute sw-top-0 sw-right-0 sw-w-6 sw-h-6 sw-bg-red-500 sw-rounded-full sw-flex sw-items-center sw-justify-center sw-text-white sw-text-xs sw-font-bold sw-border-2 sw-border-white sw-animate-bounce-subtle">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
};

