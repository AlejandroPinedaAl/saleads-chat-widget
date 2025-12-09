/**
 * Componente para capturar el teléfono del usuario antes de iniciar el chat
 */

import React, { useState } from 'react';
import { useChatStore } from '@/store/chatStore';

export const PhoneCapture: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const setUserPhone = useChatStore((state) => state.setUserPhone);
  const primaryColor = useChatStore((state) => state.config.primaryColor);

  const validatePhone = (phone: string): boolean => {
    // Validar formato internacional: +57 3001234567 o solo números
    const phoneRegex = /^(\+\d{1,3}[-.\s]?)?\d{10,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhone = (phone: string): string => {
    // Remover espacios y guiones
    let cleaned = phone.replace(/[\s-]/g, '');
    
    // Si no tiene +, agregar +57 (Colombia) por defecto
    if (!cleaned.startsWith('+')) {
      cleaned = '+57' + cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('Por favor ingresa tu número de WhatsApp');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Por favor ingresa un número válido (ej: +57 300 123 4567)');
      return;
    }

    const formattedPhone = formatPhone(phone);
    setUserPhone(formattedPhone);
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
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>

        {/* Título */}
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
          ¡Bienvenido!
        </h3>
        
        {/* Descripción */}
        <p className="text-sm text-gray-600 text-center mb-6">
          Para comenzar, ingresa tu número de WhatsApp
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder="+57 300 123 4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Incluye el código de país (ej: +57 para Colombia)
            </p>
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
          Tu número solo se usará para esta conversación y no será compartido
        </p>
      </div>
    </div>
  );
};

