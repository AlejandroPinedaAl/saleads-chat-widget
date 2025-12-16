/**
 * MessageInput Component
 * Input para escribir y enviar mensajes (texto, imágenes, audio)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, selectConfig, selectIsConnected } from '@/store/chatStore';
import { translations } from '@/types';
import { socketService } from '@/services/socketService';

export const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        72 // Max 3 líneas
      )}px`;
    }
  }, [inputValue]);

  // Focus en el textarea cuando se monta el componente
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Subir archivo al backend
   */
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = config.apiUrl || 'http://localhost:3000'; // Fallback a localhost si no está en config

    const response = await fetch(`${apiUrl}/api/chat/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data; // { success: true, url: '...', mimetype: '...' }
  };

  /**
   * Enviar mensaje (texto o multimedia)
   */
  const handleSend = async (content?: string, type: 'user' | 'image' | 'audio' | 'video' = 'user') => {
    const messageContent = content || inputValue.trim();

    if (!messageContent || isSending || !isConnected) {
      return;
    }

    setIsSending(true);

    // Agregar mensaje del usuario al estado (optimistic update)
    const userMessage = {
      type: type === 'user' ? 'user' : type as any, // TypeScript workaround si types difieren
      content: messageContent,
      status: 'sending' as const,
    };

    addMessage(userMessage);
    setInputValue('');

    try {
      // Enviar por socket. Si es multimedia, el contenido es la URL
      socketService.sendMessage(messageContent, {
        phone: userPhone,
        type: type, // Enviamos el tipo para que n8n o backend lo sepan
      });

      // Simular éxito (el socket no retorna ack inmediato en este setup, dependemos de evento)
      // Pero actualizamos estado local
      const messages = useChatStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessageStatus(lastMessage.id, 'sent');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const messages = useChatStore.getState().messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessageStatus(lastMessage.id, 'error');
      }
      addMessage({ type: 'system', content: t.errorSending });
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Manejar selección de archivo
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      const result = await uploadFile(file);

      let type: 'image' | 'video' | 'audio' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';

      await handleSend(result.url, type);
    } catch (error) {
      console.error('Upload error:', error);
      addMessage({ type: 'system', content: 'Error al subir archivo' });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Grabación de Audio
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        setIsSending(true);
        try {
          const result = await uploadFile(audioFile);
          await handleSend(result.url, 'audio');
        } catch (error) {
          console.error('Audio upload error:', error);
          addMessage({ type: 'system', content: 'Error al enviar audio' });
        } finally {
          setIsSending(false);
        }

        // Detener tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      addMessage({ type: 'system', content: 'No se pudo acceder al micrófono' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sw-border-t sw-border-gray-200 sw-bg-white sw-p-4">
      <input
        type="file"
        ref={fileInputRef}
        className="sw-hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />

      <div className="sw-flex sw-items-end sw-gap-2">
        {/* Botón Adjuntar */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isRecording || !isConnected}
          className="sw-flex-shrink-0 sw-w-10 sw-h-10 sw-rounded-full sw-flex sw-items-center sw-justify-center sw-text-gray-500 hover:sw-bg-gray-100 sw-transition-colors"
          title="Adjuntar archivo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="sw-w-5 sw-h-5">
            <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Textarea */}
        <div className="sw-flex-1 sw-relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Grabando audio...' : t.placeholder}
            disabled={isSending || isRecording || !isConnected}
            rows={1}
            className="sw-w-full sw-px-4 sw-py-2 sw-border sw-border-gray-300 sw-rounded-lg sw-resize-none sw-outline-none focus:sw-border-primary-500 focus:sw-ring-1 focus:sw-ring-primary-500 disabled:sw-bg-gray-100 disabled:sw-cursor-not-allowed sw-text-sm sw-text-gray-900 placeholder:sw-text-gray-400"
            style={{
              minHeight: '40px',
              maxHeight: '72px',
            }}
          />
        </div>

        {/* Botón Micrófono / Enviar */}
        {inputValue.trim() ? (
          <button
            onClick={() => handleSend()}
            disabled={isSending || !isConnected}
            className="sw-flex-shrink-0 sw-w-10 sw-h-10 sw-rounded-lg sw-flex sw-items-center sw-justify-center sw-text-white sw-transition-all sw-duration-200 hover:sw-opacity-90 disabled:sw-opacity-50"
            style={{ backgroundColor: config.primaryColor || '#3B82F6' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="sw-w-5 sw-h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || !isConnected}
            className={`sw-flex-shrink-0 sw-w-10 sw-h-10 sw-rounded-lg sw-flex sw-items-center sw-justify-center sw-transition-all sw-duration-200 ${isRecording ? 'sw-bg-red-500 sw-text-white sw-animate-pulse' : 'sw-text-gray-500 hover:sw-bg-gray-100'
              }`}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="sw-w-5 sw-h-5">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="sw-w-5 sw-h-5">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Indicador de desconexión - Mantenido igual */}
      {!isConnected && (
        <div className="sw-mt-2 sw-text-xs sw-text-red-500 sw-flex sw-items-center sw-gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="sw-w-4 sw-h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {t.errorConnection}
        </div>
      )}
    </div>
  );
};

