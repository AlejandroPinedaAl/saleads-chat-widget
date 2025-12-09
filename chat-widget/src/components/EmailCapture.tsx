/**
 * Componente para capturar el email del usuario antes de iniciar el chat
 */

import React, { useState } from 'react';
import { useChatStore } from '@/store/chatStore';

export const EmailCapture: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const setUserEmail = useChatStore((state) => state.setUserEmail);
  const primaryColor = useChatStore((state) => state.config.primaryColor);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setUserEmail(email);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white">
      <div className="w-full max-w-sm">
        {/* Logo o icono */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: primaryColor || '#3B82F6' }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Título */}
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
          ¡Bienvenido!
        </h3>
        
        {/* Descripción */}
        <p className="text-sm text-gray-600 text-center mb-6">
          Para comenzar, por favor ingresa tu email
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            Iniciar chat
          </button>
        </form>

        {/* Nota de privacidad */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Tu información está segura y no será compartida con terceros
        </p>
      </div>
    </div>
  );
};

