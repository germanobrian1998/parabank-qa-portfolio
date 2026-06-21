// src/contracts/parabank.schemas.ts
//
// Schemas de contrato para la API REST de Parabank.
//
// POR QUÉ ZOD SOBRE PACT:
// Pact requiere un provider que pueda reproducir estados específicos
// bajo demanda. Parabank es un monolito con HSQLDB compartida — no puede
// garantizar reproducibilidad de estado entre verificaciones de contrato.
// Zod captura los mismos breaking changes (campos eliminados, tipos cambiados,
// enums modificados) sin requerir infraestructura de provider.
//
// QUÉ DETECTAN ESTOS SCHEMAS:
// - Campo eliminado del response (breaking change más común en APIs Java)
// - Tipo cambiado (number → string, que rompe cálculos financieros silenciosamente)
// - Campo obligatorio que pasa a optional
// - Valor de enum no reconocido
//
// FUENTE DE VERDAD:
// Estos schemas son el contrato documentado de la API de Parabank.
// Si el servidor devuelve algo que no cumple el schema, es un breaking change
// que debe investigarse antes de actualizar el schema.

import { z } from 'zod';

// ── Customer ──────────────────────────────────────────────────────────────────

export const CustomerSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }).optional(),
  phoneNumber: z.string().optional(),
  ssn: z.string().optional(),
});

// ── Account ───────────────────────────────────────────────────────────────────

export const AccountSchema = z.object({
  id: z.number().int().positive(),
  customerId: z.number().int().positive(),
  type: z.enum(['CHECKING', 'SAVINGS', 'LOAN']),
  // balance es number — crítico. Si cambia a string, todos los cálculos
  // financieros retornan NaN silenciosamente.
  balance: z.number(),
});

export const AccountListSchema = z.array(AccountSchema).min(1, {
  message: 'Account list must contain at least one account — empty list breaks all downstream fixtures',
});

// ── Transaction ───────────────────────────────────────────────────────────────

export const TransactionSchema = z.object({
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  type: z.string().min(1),
  // date es epoch ms (number), no ISO string — confirmado contra respuesta real
  date: z.number(),
  amount: z.number(),
  description: z.string(),
});

export const TransactionListSchema = z.array(TransactionSchema);

// ── Loan ──────────────────────────────────────────────────────────────────────

export const LoanResponseSchema = z.object({
  loanProviderName: z.string(),
  // responseDate: el servidor devuelve epoch ms (number), no ISO string.
  // Confirmado contra respuesta real — el guide original asumía z.string() incorrectamente.
  responseDate: z.number(),
  approved: z.boolean(),
  message: z.string().optional(),
  // accountId: el servidor envía null explícito cuando el préstamo es rechazado,
  // no omite el campo. nullable() + optional() cubre ambos casos.
  accountId: z.number().nullable().optional(),
});

// ── Register ──────────────────────────────────────────────────────────────────
// Nota: register.htm devuelve HTML, no JSON. Este schema es para el Customer
// retornado por GET /login después de un registro exitoso, no para el
// response del POST /register.htm en sí.

export const RegisterResponseSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string().min(1),
});

// ── Tipos inferidos ───────────────────────────────────────────────────────────
// Reemplazan los tipos manuales definidos en ApiClient.ts.
// Una sola fuente de verdad: el schema define tanto la validación como el tipo.

export type Customer = z.infer<typeof CustomerSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;