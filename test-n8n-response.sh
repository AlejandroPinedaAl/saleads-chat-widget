#!/bin/bash
# Script para probar respuesta del agente IA desde n8n

curl -X POST http://localhost:3000/api/webhook/n8n-response \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: be725c7fa31729a4a498ee54d75d5751ba041cc9d32ee2260945bf004fea895c" \
  -d '{
    "sessionId": "test-session-001",
    "response": "¡Hola! Soy el agente IA. ¿En qué puedo ayudarte?",
    "metadata": {
      "subAgent": "Agente_Orquestador",
      "processingTime": 1234,
      "conversationId": "12",
      "timestamp": "2025-12-11T16:30:00.000Z"
    }
  }'

echo ""
echo ""
echo "✅ Verifica en Chatwoot que la respuesta del agente IA apareció en la conversación 12"

