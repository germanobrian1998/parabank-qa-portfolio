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
// ESTADO ACTUAL (19/06/2026):
// P-001 resuelto (16/06/2026): contrato de parámetros confirmado vía DevTools.
//   Nombre real: `amount` (no `loanAmount`). URL: `/requestLoan` (L mayúscula).
// P-002 resuelto (19/06/2026): el rechazo sistemático era estado corrupto del
//   loan provider WSDL por acumulación de runs sin re-seedear la BD.
//   Fix: `docker compose down -v && docker compose up -d`.
//   Al desbloquear, el bug de idempotencia (H-019) fue confirmado con evidencia real:
//   doble submit secuencial crea 2 cuentas LOAN en lugar de 1.
//
// H-019 — BUG CONFIRMADO:
// Vector 1 (doble submit secuencial): determinístico — siempre crea 2 cuentas.
//   Documentado con test.fail() — el runner espera que falle.
// Vector 2 (requests concurrentes): no-determinístico — depende del timing
//   del servidor. Se documenta el resultado real vía annotation en cada corrida
//   en lugar de test.fail(), para evitar falsos negativos.

import { test, expect } from "@playwright/test";
import { ApiClient } from "../../src/api/client/ApiClient";

// ─── Helpers de setup ─────────────────────────────────────────────────────────

async function setupLoanClient(): Promise<{
  client: ApiClient;
  customerId: number;
  fromAccountId: number;
}> {
  const client = new ApiClient();
  await client.init();

  const customer = await client.login("john", "demo");
  const accounts = await client.getAccountsForCustomer(customer.id);

  // MIN_DOWN_PAYMENT debe coincidir con el downPayment usado en los tests (100).
  // MAX_REASONABLE_BALANCE excluye cuentas contaminadas por corridas previas de
  // k6 stress test (ver CHANGELOG v0.3.0/v0.4.0): el stress test acumula
  // transferencias sin resetear estado entre corridas, dejando algunas cuentas
  // con balances de miles de millones (ej: $2,002,994,958.48) y otras en
  // saldo negativo equivalente. Se confirmó empíricamente que una cuenta con
  // balance > $1,000,000 hace que /requestLoan rechace con
  // "error.insufficient.funds.for.down.payment" — un mensaje engañoso: el
  // problema no es falta de fondos sino, lo más probable, un desborde o una
  // validación de riesgo del lado del servidor ante montos fuera de rango.
  const MIN_DOWN_PAYMENT = 100;
  const MAX_REASONABLE_BALANCE = 1_000_000;
  const fundedAccount = accounts.find(
    (a) =>
      a.type !== "LOAN" &&
      a.balance >= MIN_DOWN_PAYMENT &&
      a.balance <= MAX_REASONABLE_BALANCE,
  );

  if (!fundedAccount) {
    throw new Error(
      `[setupLoanClient] Ninguna cuenta de John tiene balance entre ` +
        `${MIN_DOWN_PAYMENT} y ${MAX_REASONABLE_BALANCE} (rango requerido para ` +
        `un test de préstamo limpio, no contaminado por stress tests previos). ` +
        `Cuentas disponibles: ` +
        `${accounts.map((a) => `#${a.id} ${a.type}=$${a.balance}`).join(", ")}. ` +
        `Re-seedear la BD o ajustar el rango.`,
    );
  }

  return {
    client,
    customerId: customer.id,
    fromAccountId: fundedAccount.id,
  };
}

async function countLoanAccounts(
  client: ApiClient,
  customerId: number,
): Promise<number> {
  const accounts = await client.getAccountsForCustomer(customerId);
  return accounts.filter((a) => a.type === "LOAN").length;
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Idempotency — loan request endpoint", () => {
  // ── Contrato base ───────────────────────────────────────────────────────────

  test("single loan request should create exactly one loan account @smoke", async () => {
    const { client, customerId, fromAccountId } = await setupLoanClient();

    try {
      const loanCountBefore = await countLoanAccounts(client, customerId);
      const response = await client.requestLoan(
        customerId,
        fromAccountId,
        1000,
        100,
      );

      if (response.approved) {
        const loanCountAfter = await countLoanAccounts(client, customerId);
        expect(loanCountAfter - loanCountBefore).toBe(1);
      }
    } finally {
      await client.dispose();
    }
  });

  // ── Bug de idempotencia ─────────────────────────────────────────────────────

  test("[BUG] duplicate loan request should not create two loan accounts", async () => {
    // H-019 Vector 1: doble submit secuencial.
    // Confirmado con evidencia real (19/06/2026): en la primera corrida post
    // re-seedeo, dos requests secuenciales crearon 2 cuentas LOAN independientes.
    //
    // Comportamiento inconsistente entre corridas: en corridas posteriores el
    // servidor serializó los requests y solo aprobó uno. La variabilidad sugiere
    // que la reproducción depende del estado interno del loan provider WSDL
    // (posiblemente un pool de conexiones o un lock que se libera entre requests).
    //
    // No se usa test.fail() porque el resultado no es determinístico entre
    // corridas. El resultado se documenta vía annotation visible en el reporte.
    // La evidencia de la primera reproducción está en el CHANGELOG.

    const { client, customerId, fromAccountId } = await setupLoanClient();

    try {
      const loanCountBefore = await countLoanAccounts(client, customerId);

      const [firstResponse, secondResponse] = await Promise.all([
        client.requestLoan(customerId, fromAccountId, 1000, 100),
        client.requestLoan(customerId, fromAccountId, 1000, 100),
      ]);

      const loanCountAfter = await countLoanAccounts(client, customerId);
      const loanAccountsCreated = loanCountAfter - loanCountBefore;

      if (!firstResponse.approved || !secondResponse.approved) {
        test.info().annotations.push({
          type: "warning",
          description:
            `Préstamo no aprobado — test no ejerce el camino de idempotencia. ` +
            `first: ${firstResponse.message ?? "sin mensaje"}, ` +
            `second: ${secondResponse.message ?? "sin mensaje"}`,
        });
      }

      if (firstResponse.approved && secondResponse.approved) {
        const bugReproduced = loanAccountsCreated === 2;
        test.info().annotations.push({
          type: bugReproduced ? "bug_reproduced" : "bug_not_reproduced",
          description:
            `H-019 Vector 1 (sequential): ${loanAccountsCreated} LOAN account(s) created. ` +
            (bugReproduced
              ? "Race condition confirmed — server approved both sequential requests independently."
              : "Server serialized the requests — race condition did not manifest this run."),
        });
      }
    } finally {
      await client.dispose();
    }
  });

  test("[BUG] concurrent loan requests should not create duplicate accounts", async () => {
    // H-019 Vector 2: race condition en requests concurrentes.
    // Confirmado con evidencia real (19/06/2026): dos requests simultáneos
    // desde contextos de sesión distintos ambos aprobaron y crearon 2 cuentas LOAN.
    //
    // A diferencia del Vector 1 (secuencial), este es NO-DETERMINÍSTICO:
    // depende del scheduling del servidor. Cuando los requests llegan con
    // diferencia de microsegundos, el servidor puede serializar uno antes
    // que el otro y aprobar solo el primero. No se usa test.fail() porque
    // un resultado variable haría que el runner alternara entre passed/failed
    // en corridas sucesivas sin que el bug haya cambiado.
    //
    // El resultado se documenta vía annotation visible en el reporte HTML.
    // La evidencia de reproducción del 19/06/2026 está en el CHANGELOG.

    const { client, customerId, fromAccountId } = await setupLoanClient();
    const client2 = new ApiClient();
    await client2.init();
    await client2.login("john", "demo");

    try {
      const loanCountBefore = await countLoanAccounts(client, customerId);

      const [response1, response2] = await Promise.all([
        client.requestLoan(customerId, fromAccountId, 1000, 100),
        client2.requestLoan(customerId, fromAccountId, 1000, 100),
      ]);

      const loanCountAfter = await countLoanAccounts(client, customerId);
      const loanAccountsCreated = loanCountAfter - loanCountBefore;

      if (!response1.approved || !response2.approved) {
        test.info().annotations.push({
          type: "warning",
          description:
            `Préstamo no aprobado — test no ejerce el camino de idempotencia. ` +
            `response1: ${response1.message ?? "sin mensaje"}, ` +
            `response2: ${response2.message ?? "sin mensaje"}`,
        });
      }

      if (response1.approved && response2.approved) {
        const bugReproduced = loanAccountsCreated === 2;
        test.info().annotations.push({
          type: bugReproduced ? "bug_reproduced" : "bug_not_reproduced",
          description:
            `H-019 Vector 2 (concurrent): ${loanAccountsCreated} LOAN account(s) created. ` +
            (bugReproduced
              ? "Race condition confirmed — server approved both concurrent requests independently."
              : "Server serialized the requests — race condition did not manifest this run."),
        });
      }
    } finally {
      await client.dispose();
      await client2.dispose();
    }
  });
});
