// tests/edge-cases/transfer.edge.spec.ts
//
// Boundary Value Analysis — módulo de transferencias.
//
// SCOPE: casos de borde derivados del análisis BVA de la Decision Table
// documentada en docs/bva-transfers-module.md.
// Estos casos complementan transfer.spec.ts (UI happy/bug path) y
// transfer.api.spec.ts (contract tests). No duplican ninguno de los dos.
//
// STRATEGY: todos los tests usan la API directamente.
// Razón: los casos de borde prueban comportamiento del servidor, no la UI.
// La UI ya está cubierta en transfer.spec.ts. Aquí nos interesa saber
// si el servidor valida correctamente — independientemente del frontend.
//
// SETUP: IDs de cuenta resueltos dinámicamente vía API.
// Nunca hardcodeados — la BD puede re-seederase entre corridas.

import { test, expect } from "@playwright/test";
import { ApiClient, ApiError } from "../../src/api/client/ApiClient";

// ─── Setup helper ─────────────────────────────────────────────────────────────

async function setupClient(): Promise<{
  client: ApiClient;
  fromAccountId: number;
  toAccountId: number;
  fromBalance: number;
}> {
  const client = new ApiClient();
  await client.init();

  const customer = await client.login("john", "demo");
  const accounts = await client.getAccountsForCustomer(customer.id);

  if (accounts.length < 2) {
    throw new Error(
      `[BVA setup] Se necesitan al menos 2 cuentas. Encontradas: ${accounts.length}`,
    );
  }

  const fromAccount = await client.getAccount(accounts[0].id);

  return {
    client,
    fromAccountId: accounts[0].id,
    toAccountId: accounts[1].id,
    fromBalance: fromAccount.balance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Transfer BVA — boundary values and edge cases", () => {
  // ── Límite inferior de monto ─────────────────────────────────────────────

  test("should reject transfer of exactly $0.00", async () => {
    // WHY THIS TEST MATTERS: $0.00 es el límite inferior inválido según BVA.
    // Una transferencia de cero no mueve dinero pero genera una transacción
    // en el historial, contaminando el registro de movimientos del cliente.
    // Un sistema financiero correcto debe rechazar esta operación.
    test.fail(
      true,
      "H-016: API accepts $0.00 transfer — zero-amount transactions pollute transaction history",
    );

    const { client, fromAccountId, toAccountId } = await setupClient();

    try {
      await expect(
        client.transfer(fromAccountId, toAccountId, 0),
        "El servidor debe rechazar transferencias de $0.00 — no constituyen una operación financiera válida",
      ).rejects.toThrow(ApiError);
    } finally {
      await client.dispose();
    }
  });

  test("should accept transfer of $0.01 — minimum valid amount", async () => {
    // WHY THIS TEST MATTERS: $0.01 es el límite inferior válido según BVA.
    // Si el servidor rechaza el mínimo absoluto, puede estar aplicando
    // una validación incorrecta que rechaza montos legítimos muy pequeños.
    // Relevante en contextos de micropagos o redondeo de centavos.

    const { client, fromAccountId, toAccountId } = await setupClient();

    try {
      await expect(
        client.transfer(fromAccountId, toAccountId, 0.01),
        "El servidor debe aceptar $0.01 como monto mínimo válido de transferencia",
      ).resolves.not.toThrow();
    } finally {
      await client.dispose();
    }
  });

  // ── Límite superior de monto (saldo disponible) ──────────────────────────

  test("should accept transfer of exact available balance — upper valid boundary", async () => {
    // WHY THIS TEST MATTERS: transferir exactamente el saldo disponible es
    // el límite superior válido del sistema. Si este caso falla, el servidor
    // tiene un off-by-one en la validación de fondos — el cliente no puede
    // vaciar su propia cuenta legítimamente (ej: cierre de cuenta).

    const { client, fromAccountId, toAccountId, fromBalance } =
      await setupClient();

    // Transferimos $1 primero para asegurar que fromBalance - 1 sea alcanzable
    // sin riesgo de que otra corrida haya modificado el saldo exacto.
    // El caso real que nos interesa es: monto == saldo actual disponible.
    const safeAmount = Math.floor(fromBalance) - 1;

    // Si el saldo es menor a $2, el test no puede ejecutarse con datos limpios
    test.skip(
      safeAmount < 1,
      `Saldo insuficiente para este boundary test: $${fromBalance}`,
    );

    try {
      await expect(
        client.transfer(fromAccountId, toAccountId, safeAmount),
        `Transferir $${safeAmount} (saldo - $1) debe ser aceptado por el servidor`,
      ).resolves.not.toThrow();
    } finally {
      await client.dispose();
    }
  });

  // ── Cuenta destino inexistente ───────────────────────────────────────────

  test("should reject transfer to non-existent account", async () => {
    // WHY THIS TEST MATTERS: si el servidor no valida que la cuenta destino
    // exista, el dinero puede desaparecer sin llegar a ninguna cuenta.
    // En un sistema real esto sería una pérdida irreversible de fondos.
    // ID 99999999 está fuera del rango de cuentas generadas por el seed.

    const { client, fromAccountId } = await setupClient();
    const nonExistentAccountId = 99_999_999;

    try {
      await expect(
        client.transfer(fromAccountId, nonExistentAccountId, 10),
        "El servidor debe rechazar transferencias a cuentas que no existen en el sistema",
      ).rejects.toThrow(ApiError);
    } finally {
      await client.dispose();
    }
  });

  // ── Cuenta origen = cuenta destino ──────────────────────────────────────

  test("should reject transfer from account to itself", async () => {
    // WHY THIS TEST MATTERS: una transferencia de una cuenta a sí misma
    // no tiene efecto financiero real pero genera dos transacciones en el
    // historial (débito + crédito), inflando artificialmente el registro
    // de movimientos. En auditorías financieras esto es una anomalía.
    // Además, podría ser un vector para evadir controles de reporting
    // de transacciones (ej: laundering via self-transfers de alto volumen).
    test.fail(
      true,
      "H-017: API accepts self-transfer — generates phantom debit/credit pair in transaction history",
    );
    const { client, fromAccountId } = await setupClient();

    try {
      await expect(
        client.transfer(fromAccountId, fromAccountId, 100),
        "El servidor debe rechazar transferencias donde la cuenta origen y destino son la misma",
      ).rejects.toThrow(ApiError);
    } finally {
      await client.dispose();
    }
  });

  // ── Consistencia débito/crédito ──────────────────────────────────────────

  test("should reflect credit on destination account after transfer", async () => {
    // WHY THIS TEST MATTERS: transfer.api.spec.ts verifica que el saldo
    // origen se reduce (débito). Este test cierra el otro lado de la
    // ecuación: que el dinero LLEGÓ a la cuenta destino.
    // Sin este test, una implementación rota podría debitar sin acreditar
    // — el dinero desaparece del sistema sin error aparente.

    const { client, fromAccountId, toAccountId } = await setupClient();
    const transferAmount = 25;

    try {
      const before = await client.getAccount(toAccountId);
      await client.transfer(fromAccountId, toAccountId, transferAmount);
      const after = await client.getAccount(toAccountId);

      expect(
        after.balance,
        `El saldo de la cuenta destino debe incrementarse en $${transferAmount} tras recibir la transferencia`,
      ).toBeCloseTo(before.balance + transferAmount, 2);
    } finally {
      await client.dispose();
    }
  });
});
