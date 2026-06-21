// tests/api/authorization.api.spec.ts
//
// WHY THIS FILE EXISTS:
//
// En un sistema bancario real, cada cuenta pertenece a un cliente específico.
// Un usuario autenticado como A nunca debería poder leer datos de cuentas
// que pertenecen a B — ni siquiera conociendo el accountId.
//
// PCI-DSS Requerimiento 7 exige que el acceso a datos del titular de la cuenta
// esté restringido estrictamente por identidad. Si un accountId válido es
// suficiente para obtener datos (sin verificar a quién pertenece), cualquier
// cliente HTTP puede enumerar cuentas ajenas.
//
// Este archivo verifica dos vectores:
//   1. Acceso sin autenticación — ¿puede un cliente anónimo leer una cuenta?
//   2. Acceso cross-user — ¿puede el usuario B leer cuentas del usuario A?
//
// Si cualquiera de estos tests pasa (devuelve HTTP 200 con datos), el hallazgo
// se documenta como H-018 con impacto de negocio y referencia a PCI-DSS req. 7.

import { test, expect } from '@playwright/test';
import { ApiClient, ApiError } from '../../src/api/client/ApiClient';

test.describe('Authorization — cross-user data access prevention', () => {

  // ── Vector 1: acceso sin autenticación ──────────────────────────────────────

  test('[SECURITY] unauthenticated client should not read account data', async () => {
    // H-018 (Vector 1): GET /services/bank/accounts/{id} devuelve HTTP 200
    // con balance y tipo de cuenta sin JSESSIONID válido.
    // Cualquier cliente HTTP con un accountId válido puede leer datos de
    // cualquier cliente del banco sin autenticarse.
    // Violación de PCI-DSS requerimiento 7.
    test.fail(
      true,
      'H-018 confirmed: GET /services/bank/accounts/{id} returns HTTP 200 with full ' +
      'account data (balance, type, customerId) without a valid session. ' +
      'Any HTTP client with a known accountId can read any customer\'s financial data ' +
      'without authentication. PCI-DSS requirement 7 violation.'
    );

    const authenticatedClient = new ApiClient();
    const unauthenticatedClient = new ApiClient();

    await authenticatedClient.init();
    await unauthenticatedClient.init(); // init sin login — sin JSESSIONID

    try {
      // Obtener un accountId real del usuario john
      const customer = await authenticatedClient.login('john', 'demo');
      const accounts = await authenticatedClient.getAccountsForCustomer(customer.id);
      const targetAccountId = accounts[0].id;

      // Intentar acceder sin sesión — debe lanzar ApiError
      await expect(
        unauthenticatedClient.getAccount(targetAccountId),
        `Un cliente sin autenticar no debe poder leer la cuenta ${targetAccountId}. ` +
        `Si este test falla, H-018 está presente: GET /services/bank/accounts/{id} ` +
        `devuelve HTTP 200 sin JSESSIONID válido. Violación de PCI-DSS req. 7.`
      ).rejects.toThrow(ApiError);

    } finally {
      await authenticatedClient.dispose();
      await unauthenticatedClient.dispose();
    }
  });

  // ── Vector 2: acceso cross-user ─────────────────────────────────────────────

  test('[SECURITY] user B should not access accounts belonging to user A', async () => {
    // WHY THIS TEST MATTERS: la autenticación correcta no implica autorización
    // correcta. Un usuario autenticado como B no debería poder leer cuentas
    // de A simplemente conociendo el accountId.
    //
    // Este es el vector más común de IDOR (Insecure Direct Object Reference)
    // en APIs bancarias. Si el servidor solo verifica "¿estás autenticado?"
    // pero no "¿esta cuenta te pertenece?", el acceso cross-user es posible.
    //
    // BLOCKED (P-004): el registro de un segundo usuario es necesario para
    // este test, y actualmente falla en esta instancia de Docker local.
    // IMPORTANTE: no es por un problema de contrato de API (eso ya se
    // resolvió, ver P-003 — ApiClient.register() implementa el GET previo
    // de sesión y POST con form data en el body, confirmado funcional con
    // curl puro). El bloqueo real es que el servidor rechaza CUALQUIER
    // username nuevo con "This username already exists" — un falso positivo
    // confirmado: el login posterior con esas credenciales falla con
    // "could not be verified", probando que el usuario nunca se creó.
    // Ver PENDING.md P-004 para el detalle completo de la investigación.
    test.skip(
      true,
      'BLOCKED (P-004): el servidor rechaza el registro de cualquier username ' +
      'nuevo con "already exists" (falso positivo confirmado — el usuario nunca ' +
      'se crea). No es un problema de contrato de API: confirmado roto incluso ' +
      'con curl puro, sin pasar por Playwright ni ApiClient. Ver PENDING.md P-004.'
    );

    const clientA = new ApiClient();
    const clientB = new ApiClient();

    await clientA.init();
    await clientB.init();

    try {
      // Usuario A: john (usuario seed con cuentas conocidas)
      const customerA = await clientA.login('john', 'demo');
      const accountsA = await clientA.getAccountsForCustomer(customerA.id);
      const accountIdFromA = accountsA[0].id;

      // Usuario B: registrar un usuario dinámico para garantizar aislamiento.
      // register() encapsula el contrato real del endpoint (GET previo para
      // sesión + POST con form data en el body) — ver ApiClient.register()
      // y PENDING.md P-003. El contrato es correcto; lo que falla es el
      // estado del servidor (P-004), no esta llamada.
      const uniqueSuffix = Date.now();
      const usernameB = `testuser_${uniqueSuffix}`;

      await clientB.register({
        firstName: 'Test',
        lastName: 'UserB',
        street: '456 Test Ave',
        city: 'TestCity',
        state: 'NY',
        zipCode: '10001',
        phoneNumber: '5559990000',
        ssn: '99999',
        username: usernameB,
        password: 'Password123',
      });

      const customerB = await clientB.login(usernameB, 'Password123');
      const customerBId = customerB.id;

      // Usuario B intenta acceder a una cuenta de A
      await expect(
        clientB.getAccount(accountIdFromA),
        `El usuario B (id: ${customerBId}) no debe poder acceder a la cuenta ` +
        `${accountIdFromA} que pertenece al usuario A (john). ` +
        `Si este test falla, H-018 está presente: IDOR en GET /services/bank/accounts/{id}. ` +
        `Violación de PCI-DSS req. 7 — acceso a datos del titular sin autorización.`
      ).rejects.toThrow(ApiError);

    } finally {
      await clientA.dispose();
      await clientB.dispose();
    }
  });

  // ── Vector 3: acceso a lista de cuentas de otro customer ───────────────────

  test('[SECURITY] user B should not enumerate accounts of customer A by customerId', async () => {
    // H-018 (Vector 3): GET /services/bank/customers/{id}/accounts devuelve
    // HTTP 200 con la lista completa de cuentas (balances, tipos, IDs) sin
    // JSESSIONID válido. Un atacante puede enumerar todas las cuentas de un
    // cliente conociendo solo su customerId (entero secuencial, enumerable
    // por fuerza bruta). Violación de PCI-DSS requerimiento 7.
    test.fail(
      true,
      'H-018 confirmed (Vector 3): GET /services/bank/customers/{id}/accounts returns ' +
      'HTTP 200 with full account list without authentication. ' +
      'CustomerId is a sequential integer — enumerable by brute force. ' +
      'Exposes balances and account types of all customers. PCI-DSS requirement 7 violation.'
    );

    const clientA = new ApiClient();
    const unauthenticatedClient = new ApiClient();

    await clientA.init();
    await unauthenticatedClient.init();

    try {
      const customerA = await clientA.login('john', 'demo');
      const customerAId = customerA.id;

      // Un cliente sin sesión intenta enumerar las cuentas de A por customerId
      await expect(
        unauthenticatedClient.getAccountsForCustomer(customerAId),
        `Un cliente sin autenticar no debe poder listar cuentas del customer ${customerAId}. ` +
        `Si este test falla, el endpoint GET /customers/{id}/accounts expone datos ` +
        `sin autenticación — extensión del vector H-018.`
      ).rejects.toThrow(ApiError);

    } finally {
      await clientA.dispose();
      await unauthenticatedClient.dispose();
    }
  });

});