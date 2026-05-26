// tests/api/transfer.api.spec.ts
//
// Tests de contrato para el endpoint de transferencias de Parabank.
//
// SCOPE: estos tests validan el comportamiento HTTP del servidor directamente,
// sin browser. Complementan los tests E2E — donde E2E verifica la UI,
// estos verifican que el servidor rechaza entradas inválidas a nivel de API,
// independientemente de si el frontend las filtra o no.
//
// SETUP: cada test hace login vía API y resuelve accountIds dinámicamente.
// Nunca se hardcodean IDs de cuenta — el Docker puede resetearse.

import { test, expect } from '@playwright/test';
import { ApiClient, ApiError } from '../../src/api/client/ApiClient';

// ─── Helpers de setup ─────────────────────────────────────────────────────────

/**
 * Autentica a john/demo y retorna el cliente listo + sus dos primeras cuentas.
 * Extraído para no repetir el mismo bloque en cada test.
 */
async function setupAuthenticatedClient(): Promise<{
  client: ApiClient;
  fromAccountId: number;
  toAccountId: number;
}> {
  const client = new ApiClient();
  await client.init();

  const customer = await client.login('john', 'demo');
  const accounts = await client.getAccountsForCustomer(customer.id);

  if (accounts.length < 2) {
    throw new Error(
      `[Test setup] john/demo necesita al menos 2 cuentas para tests de transferencia. Encontradas: ${accounts.length}`,
    );
  }

  return {
    client,
    fromAccountId: accounts[0].id,
    toAccountId: accounts[1].id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Transfer API — contract tests', () => {

  // ── Happy path ──────────────────────────────────────────────────────────────

  test(
    'should return HTTP 200 for a valid transfer between own accounts @smoke',
    async () => {
      // WHY THIS TEST MATTERS: el contrato mínimo del endpoint es que acepta
      // transferencias válidas sin error. Si este test falla, todos los demás
      // tests de negocio carecen de fundamento — el canal API está roto.

      const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();

      try {
        await expect(
          client.transfer(fromAccountId, toAccountId, 10),
          'Una transferencia válida entre cuentas propias debe completarse sin error HTTP',
        ).resolves.not.toThrow();
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    'should reflect debit on source account after transfer',
    async () => {
      // WHY THIS TEST MATTERS: un HTTP 200 no garantiza que el dinero se movió.
      // Este test verifica el efecto en la base de datos — si el saldo no cambia,
      // el banco tiene dinero fantasma circulando en el sistema.

      const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
      const transferAmount = 50;

      try {
        const before = await client.getAccount(fromAccountId);
        await client.transfer(fromAccountId, toAccountId, transferAmount);
        const after = await client.getAccount(fromAccountId);

        expect(
          after.balance,
          `El saldo de la cuenta origen debe reducirse en $${transferAmount} tras la transferencia`,
        ).toBeCloseTo(before.balance - transferAmount, 2);
      } finally {
        await client.dispose();
      }
    },
  );

  // ── Bugs documentados ───────────────────────────────────────────────────────

  test(
    '[BUG H-007] should reject transfer with negative amount at API level',
    async () => {
      // WHY THIS TEST MATTERS: H-007 fue confirmado en la UI (transfer.spec.ts).
      // Este test verifica si el servidor también lo acepta vía API directa,
      // sin pasar por ningún control del frontend. Si pasa, el bug es explotable
      // por cualquier cliente HTTP — no solo por el navegador.
      // Un atacante podría transferir montos negativos para extraer fondos.

      test.fail(true, 'H-007: API accepts negative transfer amount — server-side validation missing');

      const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();

      try {
        await expect(
          client.transfer(fromAccountId, toAccountId, -500),
          'El servidor debe rechazar montos negativos con un error HTTP 4xx — actualmente los acepta',
        ).rejects.toThrow(ApiError);
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    '[BUG H-010] should reject transfer exceeding available balance',
    async () => {
      // WHY THIS TEST MATTERS: H-010 confirma que el servidor no valida el saldo
      // disponible antes de ejecutar la transferencia. Un cliente puede vaciar
      // una cuenta hasta saldo negativo ilimitado — exposición financiera directa
      // para el banco sin ningún límite de crédito implícito.

      test.fail(true, 'H-010: API allows overdraft — transfer exceeding balance is accepted without error');

      const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();

      try {
        // $999,999,999 garantiza que excede cualquier saldo de cuenta demo
        await expect(
          client.transfer(fromAccountId, toAccountId, 999_999_999),
          'El servidor debe rechazar transferencias que excedan el saldo disponible — actualmente permite overdraft ilimitado',
        ).rejects.toThrow(ApiError);
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    '[BUG H-007] transfer with negative amount should not increase source balance',
    async () => {
      // WHY THIS TEST MATTERS: si el servidor acepta montos negativos, la
      // transferencia de -$500 puede resultar en que la cuenta ORIGEN recibe
      // dinero en lugar de enviarlo — equivalente a una extracción no autorizada.
      // Este test cuantifica el impacto financiero concreto del bug H-007.

      test.fail(true, 'H-007: Negative transfer increases source balance — funds created from thin air');

      const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();

      try {
        const before = await client.getAccount(fromAccountId);
        await client.transfer(fromAccountId, toAccountId, -500);
        const after = await client.getAccount(fromAccountId);

        expect(
          after.balance,
          'Una transferencia con monto negativo no debe incrementar el saldo de la cuenta origen',
        ).toBeLessThanOrEqual(before.balance);
      } finally {
        await client.dispose();
      }
    },
  );

});