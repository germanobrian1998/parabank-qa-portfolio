// tests/smoke/environment.spec.ts
//
// Smoke tests de validación de ambiente.
//
// POR QUÉ EXISTE ESTE ARCHIVO:
// Un fallo de ambiente (Docker no levantó, BD corrupta, servicio WSDL caído)
// produce síntomas indistinguibles de bugs reales en los tests funcionales:
// timeouts, HTTP 500, assertions que fallan por datos inesperados.
// Estos tests corren primero y fallan rápido con un mensaje descriptivo
// cuando el problema es el ambiente, no el código bajo prueba.
//
// CUÁNDO CORRER:
// - Antes de cualquier corrida de la suite completa
// - Después de `docker compose up` para verificar que Parabank inicializó
// - En CI como primer job antes de smoke funcional y full suite
//
// QUÉ VERIFICA:
// 1. Parabank responde HTTP 200 en la página principal
// 2. La API REST responde y acepta autenticación válida
// 3. John tiene al menos una cuenta — sin cuentas, todos los fixtures fallan
// 4. El loan provider WSDL está operativo — sin él, los tests de idempotencia
//    no pueden ejercer el camino de aprobación (síntoma de P-002)
// 5. El balance de las cuentas está en rango razonable — balances de $2B+
//    o negativos extremos indican BD contaminada por stress tests previos
//    (síntoma que causó P-002 y falsos positivos en setupLoanClient)

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/client/ApiClient';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9090';

test.describe('Environment smoke — Parabank readiness', () => {

  test('Parabank UI should respond with HTTP 200 @smoke', async ({ request }) => {
    // Verifica que Tomcat levantó y el WAR de Parabank está desplegado.
    // Si falla: Docker no terminó de inicializar (esperar ~45s) o el
    // contenedor no está corriendo. Fix: `docker compose up -d` y esperar.

    const response = await request.get(`${BASE_URL}/parabank/index.htm`);

    expect(
      response.status(),
      `Parabank UI returned HTTP ${response.status()} instead of 200.\n` +
      `The container may still be initializing or may not be running.\n` +
      `Fix: docker compose up -d && wait ~45s for Tomcat to start.`,
    ).toBe(200);
  });

  test('REST API should authenticate john/demo successfully @smoke', async () => {
    // Verifica que la API REST responde y que las credenciales seed están activas.
    // Si falla con 401: la BD fue re-seeded con datos distintos o está corrupta.
    // Si falla con connection refused: el contenedor no está corriendo.

    const client = new ApiClient();
    await client.init();

    try {
      const customer = await client.login('john', 'demo');

      expect(
        customer.id,
        `Login returned a customer without id. Response: ${JSON.stringify(customer)}`,
      ).toBeGreaterThan(0);

      expect(
        customer.firstName,
        'Login returned a customer without firstName — seed data may be corrupted.',
      ).toBeTruthy();

    } finally {
      await client.dispose();
    }
  });

  test('john should have at least one account — required for all fixtures @smoke', async () => {
    // Sin cuentas, setupAuthenticatedClient() y setupLoanClient() fallan con
    // errores crípticos en lugar de un mensaje descriptivo de ambiente.
    // Esta verificación hace explícito el prerequisito de todos los fixtures.

    const client = new ApiClient();
    await client.init();

    try {
      const customer = await client.login('john', 'demo');
      const accounts = await client.getAccountsForCustomer(customer.id);

      expect(
        accounts.length,
        `John has no accounts. All API fixtures will fail.\n` +
        `This indicates a fresh or corrupted DB seed.\n` +
        `Fix: docker compose down -v && docker compose up -d`,
      ).toBeGreaterThan(0);

    } finally {
      await client.dispose();
    }
  });

  test('loan provider WSDL should approve at least one loan request @smoke', async () => {
    // Verifica que el loan provider simulado está operativo y en estado limpio.
    // Si rechaza con "insufficient.funds": la BD puede estar contaminada (P-002).
    // Fix confirmado: docker compose down -v && docker compose up -d
    //
    // Este test usa una cuenta con balance razonable (100–1_000_000) para
    // descartar que el rechazo sea por fondos reales insuficientes.

    const client = new ApiClient();
    await client.init();

    try {
      const customer = await client.login('john', 'demo');
      const accounts = await client.getAccountsForCustomer(customer.id);

      const MIN_BALANCE = 100;
      const MAX_BALANCE = 1_000_000;
      const fundedAccount = accounts.find(
        a => a.type !== 'LOAN' && a.balance >= MIN_BALANCE && a.balance <= MAX_BALANCE,
      );

      if (!fundedAccount) {
        throw new Error(
          `No account found with balance between $${MIN_BALANCE} and $${MAX_BALANCE}.\n` +
          `Accounts: ${accounts.map(a => `#${a.id} ${a.type}=$${a.balance}`).join(', ')}\n` +
          `DB is likely contaminated by previous stress test runs.\n` +
          `Fix: docker compose down -v && docker compose up -d`,
        );
      }

      const response = await client.requestLoan(customer.id, fundedAccount.id, 1000, 100);

      expect(
        response.approved,
        `Loan provider rejected the request: "${response.message}".\n` +
        `Account used: #${fundedAccount.id} balance=$${fundedAccount.balance}\n` +
        `This is the P-002 symptom — WSDL state is corrupted.\n` +
        `Fix: docker compose down -v && docker compose up -d`,
      ).toBe(true);

    } finally {
      await client.dispose();
    }
  });

  test('account balances should be within reasonable range — no DB contamination @smoke', async () => {
    // Detecta BD contaminada por stress tests de k6 antes de que los tests
    // funcionales fallen con síntomas engañosos.
    // Un balance de $2B+ o $-1B es físicamente imposible en Parabank seed —
    // indica acumulación de transferencias de corridas anteriores sin re-seed.

    const client = new ApiClient();
    await client.init();

    try {
      const customer = await client.login('john', 'demo');
      const accounts = await client.getAccountsForCustomer(customer.id);

      const CONTAMINATION_THRESHOLD = 10_000_000; // $10M — imposible en seed limpio
      const contaminatedAccounts = accounts.filter(
        a => Math.abs(a.balance) > CONTAMINATION_THRESHOLD,
      );

      expect(
        contaminatedAccounts.length,
        `${contaminatedAccounts.length} account(s) have balances above $${CONTAMINATION_THRESHOLD.toLocaleString()} ` +
        `(absolute value) — DB is contaminated by previous stress test runs:\n` +
        `${contaminatedAccounts.map(a => `  #${a.id} ${a.type}=$${a.balance}`).join('\n')}\n` +
        `Tests that depend on account balance (setupLoanClient, transfer tests) may ` +
        `produce false positives or misleading failures.\n` +
        `Fix: docker compose down -v && docker compose up -d`,
      ).toBe(0);

    } finally {
      await client.dispose();
    }
  });

});