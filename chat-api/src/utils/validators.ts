/**
 * Validators
 * Zod schemas para validación de datos
 */

import { z } from 'zod';

// ============================================
// USER MESSAGE VALIDATION
// ============================================

export const userMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      pageUrl: z.string().url().optional(),
      timestamp: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type UserMessageInput = z.infer<typeof userMessageSchema>;

// ============================================
// N8N WEBHOOK VALIDATION
// ============================================

export const n8nWebhookSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  response: z.string().min(1, 'Response is required'),
  metadata: z
    .object({
      subAgent: z.string().optional(),
      processingTime: z.number().optional(),
      contactId: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type N8NWebhookInput = z.infer<typeof n8nWebhookSchema>;

// ============================================
// GHL CONTACT VALIDATION
// ============================================

export const ghlContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customField: z.record(z.any()).optional(),
});

export type GHLContactInput = z.infer<typeof ghlContactSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validar datos con schema de Zod
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validar datos con schema de Zod (safe)
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

