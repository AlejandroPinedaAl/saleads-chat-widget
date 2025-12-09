/**
 * App Component
 * Componente principal del widget
 */

import React, { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { socketService } from '@/services/socketService';
import { ChatButton } from '@/components/ChatButton';
import { ChatWindow } from '@/components/ChatWindow';
import type { WindowWithWidget, WidgetConfig, WidgetPosition, WidgetLanguage } from '@/types';

// Extender window
declare const window: WindowWithWidget;

export const App: React.FC = () => {
  const sessionId = useChatStore((state) => state.sessionId);
  const setConfig = useChatStore((state) => state.setConfig);
  const setIsConnected = useChatStore((state) => state.setIsConnected);
  const setAgentTyping = useChatStore((state) => state.setAgentTyping);
  const addMessage = useChatStore((state) => state.addMessage);
  const initSession = useChatStore((state) => state.initSession);
  const setIsOpen = useChatStore((state) => state.setIsOpen);

  useEffect(() => {
    // Inicializar sesión (cargar mensajes del localStorage)
    initSession();

    // Obtener configuración del window
    const windowConfig = window.saleadsConfig || {};

    // Merge con configuración por defecto (no usar import.meta.env en build IIFE)
    const finalConfig: WidgetConfig = {
      apiUrl: windowConfig.apiUrl || 'http://localhost:3000',
      position: (windowConfig.position || 'bottom-right') as WidgetPosition,
      primaryColor: windowConfig.primaryColor || '#3B82F6',
      language: (windowConfig.language || 'es') as WidgetLanguage,
      theme: windowConfig.theme || 'light',
      agentName: windowConfig.agentName || 'SaleAds',
      greeting: windowConfig.greeting,
      agentAvatar: windowConfig.agentAvatar,
      autoOpen: windowConfig.autoOpen || false,
      autoOpenDelay: windowConfig.autoOpenDelay || 0,
      includePages: windowConfig.includePages,
      excludePages: windowConfig.excludePages,
      user: windowConfig.user,
      gdprNotice: windowConfig.gdprNotice || false,
      gdprText: windowConfig.gdprText,
      gdprLink: windowConfig.gdprLink,
    };

    setConfig(finalConfig);

    // Verificar si debe mostrarse en esta página
    const currentPath = window.location.pathname;

    if (finalConfig.excludePages?.some((page) => currentPath.includes(page))) {
      console.log('[SaleAds Widget] Widget hidden on this page (excludePages)');
      return;
    }

    if (
      finalConfig.includePages &&
      finalConfig.includePages.length > 0 &&
      !finalConfig.includePages.some((page) => currentPath.includes(page))
    ) {
      console.log('[SaleAds Widget] Widget hidden on this page (includePages)');
      return;
    }

    // Conectar al servidor Socket.io
    const apiUrl = finalConfig.apiUrl || 'http://localhost:3000';
    console.log('[SaleAds Widget] Connecting to:', apiUrl);

    socketService.connect(apiUrl, sessionId);

    // Configurar listeners de Socket.io
    socketService.onConnectionStatus((connected) => {
      setIsConnected(connected);
    });

    socketService.onAgentResponse((data) => {
      // Ocultar indicador de "escribiendo"
      setAgentTyping(false);

      // Agregar mensaje del agente
      addMessage({
        type: 'agent',
        content: data.message,
        metadata: data.metadata,
      });

      // Emitir evento personalizado
      window.dispatchEvent(
        new CustomEvent('saleads:message-received', { detail: data })
      );
    });

    socketService.onAgentTyping(() => {
      setAgentTyping(true);

      // Auto-ocultar después de 10 segundos (por si no llega respuesta)
      setTimeout(() => {
        setAgentTyping(false);
      }, 10000);
    });

    socketService.onError((error) => {
      console.error('[SaleAds Widget] Server error:', error);

      // Mostrar mensaje de error al usuario
      addMessage({
        type: 'system',
        content: error.message || 'Error de conexión',
      });
    });

    // Auto-abrir widget si está configurado
    if (finalConfig.autoOpen) {
      setTimeout(() => {
        setIsOpen(true);
      }, finalConfig.autoOpenDelay || 0);
    }

    // Cleanup al desmontar
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Exponer API pública en window
  useEffect(() => {
    window.SaleAdsWidget = {
      init: (config: WidgetConfig) => {
        setConfig(config);
      },
      open: () => {
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
      },
      minimize: () => {
        setIsOpen(false);
      },
      sendMessage: (message: string) => {
        if (socketService.isConnected()) {
          socketService.sendMessage(message);
          addMessage({
            type: 'user',
            content: message,
            status: 'sent',
          });
        } else {
          console.error('[SaleAds Widget] Cannot send message: not connected');
        }
      },
      on: (event: string, callback: (...args: any[]) => void) => {
        window.addEventListener(`saleads:${event}`, callback as EventListener);
      },
      off: (event: string, callback: (...args: any[]) => void) => {
        window.removeEventListener(`saleads:${event}`, callback as EventListener);
      },
    };
  }, [setConfig, setIsOpen, addMessage]);

  return (
    <>
      <ChatButton />
      <ChatWindow />
    </>
  );
};

