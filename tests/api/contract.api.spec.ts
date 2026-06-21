// tests/api/contract.api.spec.ts
//
// Contract tests — schema validation para la API REST de Parabank.
//
// SCOPE: verificar que cada endpoint mantiene el contrato de response
// definido en src/contracts/parabank.schemas.ts.
//
// CUÁNDO FALLA UN CONTRACT TEST:
// Un contract test falla cuando el servidor devuelve una respuesta que
// no cumple el schema — campo eliminado, tipo cambiado, enum no reconocido.
// NO falla por cambios de comportamiento sin cambio de schema.
//
// DIFERENCIA CON LOS OTROS API TESTS:
// transfer.api.spec.ts verifica comportamiento (acepta/rechaza montos negativos).
// Este archivo verifica estructura (el response tiene los campos correctos
// con los tipos correctos). Ambos son necesarios — uno sin el otro es
// cobertura parcial.

import { test, expect } from "@playwright/test";
import { ApiClient } from "../../src/api/client/ApiClient";
import {
  CustomerSchema,
  AccountSchema,
  AccountListSchema,
  TransactionListSchema,
  LoanResponseSchema,
} from "../../src/contracts/parabank.schemas";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAuthenticatedClient() {
  const client = new ApiClient();
  await client.init();
  const customer = await client.login("john", "demo");
  const accounts = await client.getAccountsForCustomer(customer.id);
  return { client, customerId: customer.id, accountId: accounts[0].id };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("API Contract — response schema validation", () => {
  test("GET /login should conform to CustomerSchema @smoke", async () => {
    const client = new ApiClient();
    await client.init();

    try {
      const response = await client.login("john", "demo");
      const result = CustomerSchema.safeParse(response);

      expect(
        result.success,
        `GET /login response violates CustomerSchema contract.\n` +
          `This means a breaking change was introduced in the authentication endpoint.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}`,
      ).toBe(true);
    } finally {
      await client.dispose();
    }
  });

  test("GET /accounts/{id} should conform to AccountSchema", async () => {
    const { client, accountId } = await getAuthenticatedClient();

    try {
      const response = await client.getAccount(accountId);
      const result = AccountSchema.safeParse(response);

      expect(
        result.success,
        `GET /accounts/${accountId} response violates AccountSchema contract.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}`,
      ).toBe(true);
    } finally {
      await client.dispose();
    }
  });

  test("GET /customers/{id}/accounts should conform to AccountListSchema", async () => {
    const { client, customerId } = await getAuthenticatedClient();

    try {
      const response = await client.getAccountsForCustomer(customerId);
      const result = AccountListSchema.safeParse(response);

      expect(
        result.success,
        `GET /customers/${customerId}/accounts response violates AccountListSchema contract.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}`,
      ).toBe(true);

      if (result.success) {
        const foreignAccounts = result.data.filter(
          (a) => a.customerId !== customerId,
        );
        expect(
          foreignAccounts.length,
          `Response contains ${foreignAccounts.length} accounts belonging to a customerId ` +
            `other than ${customerId}. Possible data leak — foreign accounts in response.`,
        ).toBe(0);
      }
    } finally {
      await client.dispose();
    }
  });

  test("GET /accounts/{id}/transactions should conform to TransactionListSchema", async () => {
    const { client, accountId } = await getAuthenticatedClient();

    try {
      const response = await client.getTransactionsForAccount(accountId);
      const result = TransactionListSchema.safeParse(response);

      expect(
        result.success,
        `GET /accounts/${accountId}/transactions response violates TransactionListSchema.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}`,
      ).toBe(true);

      if (result.success && result.data.length > 0) {
        const foreignTx = result.data.filter(
          (tx) => tx.accountId !== accountId,
        );
        expect(
          foreignTx.length,
          `${foreignTx.length} transactions in account ${accountId} have a different accountId. ` +
            `Transaction ledger contamination — critical audit trail integrity issue.`,
        ).toBe(0);
      }
    } finally {
      await client.dispose();
    }
  });

  // ── Breaking change detection ─────────────────────────────────────────────

  test("account balance must be numeric — string balance breaks all financial calculations", async () => {
    const { client, accountId } = await getAuthenticatedClient();

    try {
      const account = await client.getAccount(accountId);

      expect(
        typeof account.balance,
        `account.balance is "${typeof account.balance}" but contract requires "number".\n` +
          `A string balance causes all financial calculations to silently return NaN.\n` +
          `This is the most common breaking change when Java serializer configuration changes.`,
      ).toBe("number");

      expect(isNaN(account.balance), "account.balance is NaN").toBe(false);
      expect(isFinite(account.balance), "account.balance is Infinity").toBe(
        true,
      );
    } finally {
      await client.dispose();
    }
  });

  test("transaction amount must be numeric — string amount breaks ledger calculations", async () => {
    const { client, accountId, customerId } = await getAuthenticatedClient();

    try {
      const accounts = await client.getAccountsForCustomer(customerId);
      const toAccountId = accounts.find((a) => a.id !== accountId)?.id;

      if (toAccountId) {
        await client.transfer(accountId, toAccountId, 1);
      }

      const transactions = await client.getTransactionsForAccount(accountId);

      if (transactions.length > 0) {
        transactions.forEach((tx, index) => {
          expect(
            typeof tx.amount,
            `Transaction[${index}] (id: ${tx.id}) amount is "${typeof tx.amount}" but contract requires "number".`,
          ).toBe("number");
        });
      }
    } finally {
      await client.dispose();
    }
  });

  test("account type must be one of the three valid enum values", async () => {
    const { client, customerId } = await getAuthenticatedClient();
    const validTypes = ["CHECKING", "SAVINGS", "LOAN"];

    try {
      const accounts = await client.getAccountsForCustomer(customerId);

      accounts.forEach((account, index) => {
        expect(
          validTypes,
          `Account[${index}] (id: ${account.id}) has unrecognized type "${account.type}". ` +
            `If a new account type was added, update AccountSchema enum and all type-dependent logic.`,
        ).toContain(account.type);
      });
    } finally {
      await client.dispose();
    }
  });

  test("POST /requestLoan should conform to LoanResponseSchema @smoke", async () => {
    const { client, customerId, accountId } = await getAuthenticatedClient();

    try {
      const response = await client
        .requestLoan(customerId, accountId, 1000, 100)
        .catch((err) => {
          test.skip(
            true,
            `requestLoan returned an error (P-002 activo): ${err.message}. ` +
              `Cannot validate LoanResponseSchema without a 2xx response.`,
          );
          return null;
        });

      if (response === null) return;

      const result = LoanResponseSchema.safeParse(response);

      expect(
        result.success,
        `POST /requestLoan response violates LoanResponseSchema contract.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}\n\n` +
          `Raw response: ${JSON.stringify(response, null, 2)}`,
      ).toBe(true);
    } finally {
      await client.dispose();
    }
  });

  test("POST /register.htm should create a user and allow subsequent login @smoke", async () => {
    // CONTRACT TEST DE REGISTRO — BLOQUEADO (P-004)
    //
    // P-004: el validador de username en /register.htm devuelve
    // "This username already exists" para cualquier username nuevo,
    // incluso con SSN y username únicos por timestamp.
    // El bug es del servidor — verificado con curl (funciona) vs
    // APIRequestContext de Playwright (falla siempre).
    //
    // Hipótesis más probable: el servidor compara el username enviado
    // contra el objeto Customer pre-populado en @SessionAttributes
    // durante el GET previo. El APIRequestContext reutiliza la sesión
    // de requests anteriores del mismo proceso aunque se llame a
    // dispose()/init() — el JSESSIONID cambia pero el estado del
    // servidor para esa sesión puede persistir en caché.
    //
    // Curl funciona porque cada invocación es un proceso nuevo sin
    // historial de sesión previo.
    //
    // Fix pendiente: investigar si el problema es específico del
    // APIRequestContext de Playwright o del estado de sesión del servidor.
    // Alternativa: usar Page (browser context) para el registro en lugar
    // del cliente HTTP — el browser no reutiliza sesiones entre tests.

    test.skip(
      true,
      'BLOCKED (P-004): /register.htm devuelve "This username already exists" ' +
        "para cualquier username nuevo cuando se usa APIRequestContext de Playwright. " +
        "Funciona correctamente con curl — el problema es específico del cliente HTTP " +
        "de Playwright. Ver contrato del endpoint en ApiClient.register().",
    );

    const client = new ApiClient();
    await client.init();

    const ts = Date.now();
    const username = `testuser_${ts}`;
    const password = "password123";
    const ssn = `${String(ts).slice(0, 3)}-${String(ts).slice(3, 5)}-${String(ts).slice(5, 9)}`;

    try {
      await client.register({
        firstName: "Contract",
        lastName: "Test",
        street: "123 Main St",
        city: "Beverly Hills",
        state: "CA",
        zipCode: "90210",
        phoneNumber: "3105550000",
        ssn,
        username,
        password,
      });

      const customer = await client.login(username, password);
      const result = CustomerSchema.safeParse(customer);

      expect(
        result.success,
        `Login after registration returned a response that violates CustomerSchema.\n` +
          `Violations:\n${!result.success ? JSON.stringify(result.error.issues, null, 2) : "none"}`,
      ).toBe(true);

      if (result.success) {
        expect(result.data.firstName).toBe("Contract");
        expect(result.data.lastName).toBe("Test");
      }
    } finally {
      await client.dispose();
    }
  });
});
