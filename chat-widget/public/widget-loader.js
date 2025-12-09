/**
 * SaleAds Chat Widget Loader
 * Script de inyección para embedar el widget en cualquier sitio web
 * 
 * Uso:
 * <script src="https://cdn.saleads.com/widget-loader.js"></script>
 */

(function() {
  'use strict';

  // Prevenir carga múltiple
  if (window.SaleAdsWidgetLoaded) {
    console.warn('[SaleAds Widget] Widget already loaded');
    return;
  }
  window.SaleAdsWidgetLoaded = true;

  // Configuración por defecto
  const DEFAULT_CONFIG = {
    apiUrl: 'https://api-chat.saleads.com', // Cambiar a tu dominio de Railway
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    language: 'es',
  };

  // URLs de los assets (cambiar a tu CDN)
  const WIDGET_JS_URL = 'https://cdn.saleads.com/widget.js';
  const WIDGET_CSS_URL = 'https://cdn.saleads.com/widget.css';

  // Merge configuración del usuario con defaults
  window.saleadsConfig = Object.assign({}, DEFAULT_CONFIG, window.saleadsConfig || {});

  console.log('[SaleAds Widget Loader] Loading widget...');
  console.log('[SaleAds Widget Loader] Config:', window.saleadsConfig);

  // 1. Crear contenedor para el widget
  const container = document.createElement('div');
  container.id = 'saleads-chat-root';
  document.body.appendChild(container);

  // 2. Cargar CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = WIDGET_CSS_URL;
  cssLink.onerror = function() {
    console.error('[SaleAds Widget Loader] Failed to load CSS');
  };
  document.head.appendChild(cssLink);

  // 3. Cargar JavaScript
  const script = document.createElement('script');
  script.src = WIDGET_JS_URL;
  script.async = true;
  script.defer = true;

  script.onload = function() {
    console.log('[SaleAds Widget Loader] Widget loaded successfully');
    
    // Emitir evento de carga completa
    window.dispatchEvent(new CustomEvent('saleads:loaded'));
  };

  script.onerror = function() {
    console.error('[SaleAds Widget Loader] Failed to load widget script');
    
    // Emitir evento de error
    window.dispatchEvent(new CustomEvent('saleads:error', {
      detail: { message: 'Failed to load widget script' }
    }));
  };

  document.body.appendChild(script);

  // 4. Exponer API temporal hasta que el widget cargue
  window.SaleAdsWidget = window.SaleAdsWidget || {
    init: function(config) {
      window.saleadsConfig = Object.assign({}, window.saleadsConfig, config);
    },
    open: function() {
      console.warn('[SaleAds Widget] Widget not loaded yet');
    },
    close: function() {
      console.warn('[SaleAds Widget] Widget not loaded yet');
    },
    sendMessage: function() {
      console.warn('[SaleAds Widget] Widget not loaded yet');
    },
    on: function() {
      console.warn('[SaleAds Widget] Widget not loaded yet');
    },
    off: function() {
      console.warn('[SaleAds Widget] Widget not loaded yet');
    },
  };
})();

