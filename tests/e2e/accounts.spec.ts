import { expect } from "@playwright/test";
import {
  test,
  AccountsPage,
  AuthPage,
} from "../../src/fixtures/accounts.fixture";

/**
 * Suite: Accounts — apertura de cuenta y consulta de saldo
 *
 * Cobertura de negocio:
 * - Un cliente autenticado puede abrir una cuenta CHECKING
 * - Un cliente autenticado puede abrir una cuenta SAVINGS
 * - La cuenta nueva aparece inmediatamente en el overview
 * - El saldo inicial de una cuenta nueva es $0.00
 * - El sistema asigna un ID único y numérico a cada cuenta nueva
 * - Abrir múltiples cuentas incrementa el conteo en el overview
 *
 * Prerequisito: Parabank corriendo en http://localhost:9090
 * Usuario de referencia: john / demo (tiene cuentas existentes para fondear)
 *
 * Nota sobre paralelismo: estos tests modifican estado en la DB compartida
 * de Parabank. Correr en secuencia (workers: 1 en playwright.config.ts)
 * evita condiciones de carrera entre tests de overview.
 */

test.describe("Open Account — new account creation", () => {
  test("should open a CHECKING account and display confirmation with new account ID @smoke", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Account creation is the second most critical flow after authentication.
    // Every other financial operation (transfer, bill pay, loans) requires
    // an existing account. A silent failure here blocks the entire customer journey.
    // We verify: form submission → AJAX confirmation → valid numeric account ID.

    const accountsPage = new AccountsPage(page);

    const result = await accountsPage.openNewAccount("CHECKING");

    expect(
      result.newAccountId,
      "No account ID returned after CHECKING account creation — " +
        "AJAX confirmation may have failed or account was not persisted",
    ).toBeTruthy();

    // El ID de cuenta de Parabank es siempre numérico (5 dígitos aprox.)
    expect(
      Number(result.newAccountId),
      `Account ID "${result.newAccountId}" is not numeric — ` +
        "system may have returned an error message instead of an account ID",
    ).not.toBeNaN();
  });

  test("should open a SAVINGS account and display confirmation with new account ID", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // SAVINGS accounts have different business rules than CHECKING
    // (interest rates, withdrawal limits). We verify that both account types
    // can be created independently and receive distinct IDs.

    const accountsPage = new AccountsPage(page);

    const result = await accountsPage.openNewAccount("SAVINGS");

    expect(
      result.newAccountId,
      "No account ID returned after SAVINGS account creation — " +
        "AJAX confirmation may have failed",
    ).toBeTruthy();

    expect(
      Number(result.newAccountId),
      `SAVINGS account ID "${result.newAccountId}" is not numeric`,
    ).not.toBeNaN();
  });

  test("should generate unique IDs for two accounts opened in the same session", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Two accounts created in the same session must have different IDs.
    // Duplicate IDs would cause ledger collisions — all transactions
    // on one account would appear on both. Critical data integrity issue.

    const accountsPage = new AccountsPage(page);

    const first = await accountsPage.openNewAccount("CHECKING");
    const second = await accountsPage.openNewAccount("SAVINGS");

    expect(
      first.newAccountId,
      "First and second account received the same ID — " +
        "account ID generation may not be incrementing correctly",
    ).not.toBe(second.newAccountId);
  });
});

test.describe("Account Overview — balance display", () => {
  test("should show new account in overview immediately after creation @smoke", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // A customer who opens an account and navigates to overview
    // must see their new account immediately. A delay here means
    // the customer believes the operation failed and may retry,
    // potentially creating duplicate accounts.

    const accountsPage = new AccountsPage(page);

    // Snapshot del estado antes: contar cuentas existentes
    const accountsBefore = await accountsPage.getAllAccounts();
    const countBefore = accountsBefore.length;

    // Abrir una cuenta nueva
    const { newAccountId } = await accountsPage.openNewAccount("CHECKING");

    // Verificar que el conteo aumentó en exactamente 1
    const accountsAfter = await accountsPage.getAllAccounts();

    expect(
      accountsAfter.length,
      `Overview shows ${accountsAfter.length} accounts but expected ${countBefore + 1}. ` +
        `New account ${newAccountId} may not have been committed to the DB ` +
        `or the overview is showing cached data.`,
    ).toBe(countBefore + 1);
  });

  test(
  '[BUG] should display $0.00 initial balance for a newly opened account',
  async ({ authenticatedAsJohn, page }) => {
    // WHY THIS TEST MATTERS:
    // New accounts should start with $0.00 unless customer deposits funds.
    // Parabank pre-loads $100 into every new account — confirmed bug.

    test.fail(true, 'Parabank pre-loads $100 into new accounts instead of starting at $0.00');

    const accountsPage = new AccountsPage(page);
    const { newAccountId } = await accountsPage.openNewAccount('CHECKING');
    const { balance } = await accountsPage.getAccountBalance(newAccountId);

    expect(
      balance,
      `New account ${newAccountId} has initial balance of $${balance} instead of $0.00`
    ).toBe(0);
  }
);

  test("should display correct account type label in overview", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Account type must match what was selected during creation.
    // Verified from account detail page since overview table
    // does not include a type column in this Parabank version.

    const accountsPage = new AccountsPage(page);
    const { newAccountId } = await accountsPage.openNewAccount("SAVINGS");

    // Navegar al detalle de la cuenta para verificar el tipo
    await accountsPage.navigateToAccountDetail(newAccountId);

    await expect(
      page.locator("#rightPanel"),
      `Account ${newAccountId} was opened as SAVINGS but detail page shows different type`,
    ).toContainText("SAVINGS");
  });

  test("should list all existing accounts for authenticated user", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // The overview must show ALL accounts belonging to the customer.
    // A missing account means the customer cannot see or manage their funds,
    // which is a critical trust and usability failure.
    // john/demo always has at least one pre-existing account.

    const accountsPage = new AccountsPage(page);

    const accounts = await accountsPage.getAllAccounts();

    expect(
      accounts.length,
      'Overview shows 0 accounts for user "john" — ' +
        "either the overview is broken or the demo account has no accounts. " +
        "john/demo should always have at least 1 pre-existing account.",
    ).toBeGreaterThanOrEqual(1);

    // Cada cuenta debe tener un ID válido y un balance numérico
    for (const account of accounts) {
      expect(
        Number(account.accountId),
        `Account with ID "${account.accountId}" is not numeric — ` +
          "overview table may contain malformed data rows",
      ).not.toBeNaN();

      expect(
        typeof account.balance,
        `Balance for account ${account.accountId} is not a number`,
      ).toBe("number");
    }
  });

  test("should not show account overview to unauthenticated user", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Account balance data is PII and must not be accessible without authentication.
    // This test does NOT use the authenticatedAsJohn fixture intentionally —
    // we're verifying the unauthenticated path.
    // Related to H-009: if sessions are not properly invalidated, a direct
    // URL navigation after logout could expose this page.

    test.fail(
      true,
      "H-009: overview.htm accessible without authentication — session enforcement missing",
    );
    // Sin login, navegamos directo al overview
    await page.goto("/parabank/overview.htm");

    // El sistema debe redirigir a login, no mostrar datos de cuentas
    expect(
      page.url(),
      "Account overview is accessible without authentication — " +
        "unauthenticated users can see account balance data. Critical security issue.",
    ).not.toContain("overview.htm");
  });
});

test.describe("Account Detail — individual account view", () => {
  test("should navigate to account detail page from overview", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // The account detail page shows transaction history — the primary
    // audit trail for the customer. Navigation from overview must work
    // for every account listed.

    const accountsPage = new AccountsPage(page);

    // Usamos la primera cuenta existente de john (no necesitamos crear una)
    const accounts = await accountsPage.getAllAccounts();

    expect(
      accounts.length,
      "No accounts found for john — cannot test account detail navigation",
    ).toBeGreaterThan(0);

    const firstAccountId = accounts[0].accountId;
    await accountsPage.navigateToAccountDetail(firstAccountId);

    expect(
      page.url(),
      `After clicking account ${firstAccountId}, URL should contain activity.htm`,
    ).toContain("activity.htm");
  });
});
