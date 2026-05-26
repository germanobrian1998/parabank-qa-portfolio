// tests/api/login.api.spec.ts
//
// Tests de contrato para autenticación y gestión de sesión en Parabank.
//
// SCOPE: verifica el comportamiento del servidor ante credenciales inválidas,
// usuarios duplicados (H-011) y acceso post-logout (H-009).
// Complementa auth.spec.ts (UI) — si el servidor falla aquí, el problema
// es explotable directamente sin browser.

import { test, expect } from '@playwright/test';
import { ApiClient, ApiError } from '../../src/api/client/ApiClient';

test.describe('Login API — contract tests', () => {

  // ── Happy path ──────────────────────────────────────────────────────────────

  test(
    'should return customer data for valid credentials @smoke',
    async () => {
      // WHY THIS TEST MATTERS: contrato base del endpoint de login.
      // Si john/demo no puede autenticarse vía API, ningún otro test de API
      // tiene sentido — todos dependen de una sesión activa.

      const client = new ApiClient();
      await client.init();

      try {
        const customer = await client.login('john', 'demo');

        expect(customer, 'El login debe retornar el objeto Customer').toMatchObject({
          id: expect.any(Number),
          firstName: expect.any(String),
          lastName: expect.any(String),
        });
        expect(
          customer.id,
          'El customerId de john/demo debe ser un número positivo',
        ).toBeGreaterThan(0);
      } finally {
        await client.dispose();
      }
    },
  );

  // ── Validación de credenciales ──────────────────────────────────────────────

  test(
    'should return HTTP 401 for invalid credentials',
    async () => {
      // WHY THIS TEST MATTERS: si el servidor devuelve 200 con credenciales
      // incorrectas, cualquier atacante puede acceder a cuentas ajenas con
      // fuerza bruta sin que el sistema lo detecte. Esto es un fallo de
      // autenticación básico con implicaciones regulatorias (PCI-DSS).

      const client = new ApiClient();
      await client.init();

      try {
        await expect(
          client.login('john', 'wrong-password'),
          'Credenciales inválidas deben resultar en rechazo HTTP, no en acceso',
        ).rejects.toThrow(ApiError);

        // Verificamos el status code específico
        try {
          await client.login('john', 'wrong-password');
        } catch (err) {
          expect(
            (err as ApiError).status,
            'El servidor debe retornar 4xx para credenciales incorrectas, no 2xx',
          ).toBeGreaterThanOrEqual(400);
        }
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    'should return HTTP 401 for non-existent user',
    async () => {
      // WHY THIS TEST MATTERS: enumerar usuarios inexistentes no debe dar
      // información sobre qué usuarios existen en el sistema. Un 404 específico
      // vs un 401 genérico es una diferencia de information disclosure.

      const client = new ApiClient();
      await client.init();

      try {
        await expect(
          client.login('usuario-que-no-existe-xyz', 'cualquier-password'),
          'Un usuario inexistente debe ser rechazado con error HTTP',
        ).rejects.toThrow(ApiError);
      } finally {
        await client.dispose();
      }
    },
  );

  // ── Bugs documentados ───────────────────────────────────────────────────────

  test(
    '[BUG H-009] should reject authenticated requests after session logout',
    async () => {
      // WHY THIS TEST MATTERS: H-009 confirma que la sesión no se invalida
      // correctamente en el servidor tras el logout. Si un token/cookie robado
      // sigue siendo válido después de que el usuario cierra sesión, un atacante
      // con acceso a esa cookie puede seguir operando indefinidamente.
      // Esto viola el principio mínimo de gestión de sesiones (OWASP A07).

      test.fail(true, 'H-009: Session remains valid after logout — server does not invalidate JSESSIONID');

      const client = new ApiClient();
      await client.init();

      try {
        const customer = await client.login('john', 'demo');

        // Simular logout llamando al endpoint correspondiente
        // Parabank expone /parabank/logout.htm — no hay endpoint REST de logout,
        // el logout es navegación de UI. Lo simulamos con una GET directa.
        // Si el servidor invalida la sesión correctamente, el siguiente call
        // a una ruta protegida debe fallar con 401/403.
        await client.logout();

        // Este call debería fallar si la sesión fue invalidada correctamente
        await expect(
          client.getAccountsForCustomer(customer.id),
          'Tras el logout, requests autenticados deben ser rechazados — la sesión debe estar invalidada en el servidor',
        ).rejects.toThrow(ApiError);
      } finally {
        await client.dispose();
      }
    },
  );

  test(
    '[BUG H-011] should reject registration with a duplicate username',
    async () => {
      // WHY THIS TEST MATTERS: H-011 documenta que el servidor acepta crear
      // usuarios con usernames ya existentes. Dos usuarios con el mismo username
      // generan ambigüedad en autenticación — el sistema podría resolver al
      // usuario incorrecto, otorgando acceso a cuentas ajenas.

      const client = new ApiClient();
      await client.init();

      try {
        // Intentar registrar a john de nuevo (username ya existe en el sistema)
        await expect(
          client.registerDuplicateUser('john'),
          'El servidor debe rechazar el registro de un username que ya existe en el sistema',
        ).rejects.toThrow(ApiError);
      } finally {
        await client.dispose();
      }
    },
  );

});