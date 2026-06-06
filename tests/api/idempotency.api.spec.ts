// tests/api/idempotency.api.spec.ts
//
// Tests de idempotencia para el endpoint de solicitud de préstamo.
//
// WHY THIS FILE EXISTS:
//
// En sistemas de pagos y crédito, idempotencia no es una buena práctica —
// es un requisito. Una solicitud de préstamo que se envía dos veces (por un
// retry de red, un doble click, o un cliente que no recibió la respuesta)
// no debería crear dos préstamos. Si lo hace, el cliente tiene una deuda
// duplicada que nunca solicitó conscientemente.
//
// El endpoint POST /requestLoan es particularmente riesgoso: usa verbo GET
// con efecto lateral (crea una cuenta de préstamo si es aprobado). GET es
// idempotente por definición REST — cualquier proxy, CDN o cliente HTTP
// puede retransmitirlo automáticamente ante un timeout. Ver tech-discovery-report
// sección 2.1 para el análisis del verbo incorrecto.
//
// ESTADO ACTUAL (06/06/2026):
// El endpoint /requestLoan tiene un contrato de parámetros no documentado.
// La firma del bytecode es (int customerId, BigDecimal, BigDecimal, int) pero
// los nombres de los QueryParams no están expuestos en la interfaz pública ni
// en Swagger. El ApiClient actual usa 'fromAccountId' pero el servidor devuelve
// HTTP 400 con error de conversión BigDecimal ("parameter1 is null").
//
// Los tests de idempotencia están marcados test.skip() hasta resolver el
// contrato del endpoint. Ver PENDING.md para el plan de resolución.

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/client/ApiClient';

// ─── Helpers de setup ─────────────────────────────────────────────────────────

async function setupLoanClient(): Promise<{
  client: ApiClient;
  customerId: number;
  fromAccountId: number;
}> {
  const client = new ApiClient();
  await client.init();

  const customer = await client.login('john', 'demo');
  const accounts = await client.getAccountsForCustomer(customer.id);
  const fundedAccount = accounts.find(a => a.balance > 0) ?? accounts[0];

  return {
    client,
    customerId: customer.id,
    fromAccountId: fundedAccount.id,
  };
}

async function countLoanAccounts(client: ApiClient, customerId: number): Promise<number> {
  const accounts = await client.getAccountsForCustomer(customerId);
  return accounts.filter(a => a.type === 'LOAN').length;
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Idempotency — loan request endpoint', () => {

  // ── Contrato base ───────────────────────────────────────────────────────────

  test(
    'single loan request should create exactly one loan account @smoke',
    async () => {
      // BLOCKED: el endpoint POST /requestLoan devuelve HTTP 400 con error de
      // conversión BigDecimal ("Cannot read field intCompact because parameter1
      // is null"). Los nombres de QueryParam no están documentados y difieren
      // del contrato asumido en ApiClient (fromAccountId).
      //
      // Investigación realizada:
      // - Firma del bytecode: (int, BigDecimal, BigDecimal, int)
      // - URL confirmada via strings en ParaBankService.class: /requestLoan
      // - Parámetros probados: fromAccountId, accountId — ambos producen el mismo error
      // - Valores probados: 1000 y 1000.00 — mismo resultado
      //
      // Próximo paso: decompilación completa del .class o comparación contra
      // la instancia pública de Parabank para inferir los nombres correctos.
      // Ver sección de pendientes en PENDING.md.

      test.skip(true,
        'BLOCKED: POST /requestLoan returns HTTP 400 — QueryParam names differ from ' +
        'ApiClient contract. Bytecode signature: (int, BigDecimal, BigDecimal, int). ' +
        'fromAccountId and accountId both fail with BigDecimal conversion error. ' +
        'Pending: resolve correct param names before implementing idempotency tests.'
      );

      const { client, customerId, fromAccountId } = await setupLoanClient();

      try {
        const loanCountBefore = await countLoanAccounts(client, customerId);
        const response = await client.requestLoan(customerId, fromAccountId, 1000, 100);

        if (response.approved) {
          const loanCountAfter = await countLoanAccounts(client, customerId);
          expect(loanCountAfter - loanCountBefore).toBe(1);
        }
      } finally {
        await client.dispose();
      }
    },
  );

  // ── Bug de idempotencia ─────────────────────────────────────────────────────

  test(
    '[BUG] duplicate loan request should not create two loan accounts',
    async () => {
      // BLOCKED: mismo issue que el test anterior — endpoint no responde
      // correctamente hasta resolver el contrato de parámetros.
      //
      // WHY THIS TEST WILL MATTER once unblocked:
      // Un cliente hace click en "Solicitar préstamo", la respuesta tarda,
      // hace click de nuevo. O la conexión se interrumpe y el SDK reintenta
      // automáticamente el GET (que por definición REST es retransmisible).
      // El resultado esperado del bug: dos préstamos aprobados, dos deudas.
      //
      // En un sistema real esto se previene con idempotency keys (un UUID
      // generado en el cliente que el servidor usa para deduplicar).

      test.skip(true,
        'BLOCKED: depends on resolving POST /requestLoan param contract. ' +
        'Once unblocked, this test will verify that duplicate submissions ' +
        'do not create multiple LOAN accounts (idempotency key pattern).'
      );

      const { client, customerId, fromAccountId } = await setupLoanClient();

      try {
        const loanCountBefore = await countLoanAccounts(client, customerId);

        const [firstResponse, secondResponse] = await Promise.all([
          client.requestLoan(customerId, fromAccountId, 1000, 100),
          client.requestLoan(customerId, fromAccountId, 1000, 100),
        ]);

        const loanCountAfter = await countLoanAccounts(client, customerId);
        const loanAccountsCreated = loanCountAfter - loanCountBefore;

        if (firstResponse.approved && secondResponse.approved) {
          expect(
            loanAccountsCreated,
            `Doble submit creó ${loanAccountsCreated} cuentas LOAN. ` +
            `Un sistema idempotente debe crear exactamente 1.`
          ).toBe(1);
        }
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    '[BUG] concurrent loan requests should not create duplicate accounts',
    async () => {
      test.skip(true,
        'BLOCKED: depends on resolving POST /requestLoan param contract. ' +
        'Once unblocked, this test will verify that concurrent identical requests ' +
        'do not create multiple LOAN accounts (double-spend race condition).'
      );

      const { client, customerId, fromAccountId } = await setupLoanClient();
      const client2 = new ApiClient();
      await client2.init();
      await client2.login('john', 'demo');

      try {
        const loanCountBefore = await countLoanAccounts(client, customerId);

        const [response1, response2] = await Promise.all([
          client.requestLoan(customerId, fromAccountId, 1000, 100),
          client2.requestLoan(customerId, fromAccountId, 1000, 100),
        ]);

        const loanCountAfter = await countLoanAccounts(client, customerId);

        if (response1.approved && response2.approved) {
          expect(loanCountAfter - loanCountBefore).toBe(1);
        }
      } finally {
        await client.dispose();
        await client2.dispose();
      }
    },
  );

});