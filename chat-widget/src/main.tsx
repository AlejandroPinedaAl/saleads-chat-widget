/**
 * Entry Point - Main
 * Punto de entrada del widget
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Crear contenedor si no existe
let container = document.getElementById('saleads-chat-root');
if (!container) {
  container = document.createElement('div');
  container.id = 'saleads-chat-root';
  document.body.appendChild(container);
}

// Renderizar app
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[SaleAds Widget] Initialized v1.0.0');

