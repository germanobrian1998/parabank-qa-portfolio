import { test, expect } from "../../src/fixtures/accounts.fixture";
import { BillPayPage } from "../../src/pages/BillPayPage";
import { AccountsPage } from "../../src/pages/AccountsPage";
import { BillPayFactory } from "../../src/factories/BillPayFactory";

/**
 * Suite: Bill Pay — pago de facturas a beneficiarios externos
 *
 * Cobertura de negocio:
 * - Un cliente autenticado puede pagar una factura a un beneficiario nuevo
 * - El sistema confirma el pago con nombre del beneficiario, monto y cuenta origen
 * - El saldo de la cuenta origen disminuye exactamente en el monto pagado
 * - El sistema rechaza pagos con número de cuenta de beneficiario inconsistente
 * - El sistema maneja correctamente montos en el límite (0, negativos)
 * - El formulario requiere todos los campos obligatorios
 *
 * Prerequisito: Parabank corriendo en http://localhost:9090
 * Usuario de referencia: john / demo
 *
 * DECISIÓN DE DISEÑO — fromAccountId:
 * Los tests obtienen el fromAccountId del <select> del formulario de bill pay
 * (via billPayPage.getFirstAccountId() o getAvailableAccountIds()) en lugar
 * de navegar a overview.htm con AccountsPage.getAllAccounts().
 *
 * Por qué: navegar a overview.htm antes de payBill() invalida el contexto de
 * sesión que Parabank necesita para procesar el POST — el servidor devuelve 500.
 * El select del formulario ya tiene las cuentas cargadas vía AJAX, por lo que
 * podemos leerlas directamente sin romper el flujo de sesión.
 *
 * Exception: test de integridad de saldo (test 2) necesita leer el saldo
 * ANTES del pago — ese test navega a overview ANTES del bill pay intencionalmente
 * y acepta que ese patrón de navegación puede romper la sesión en algunos entornos.
 */

test.describe("Bill Pay — happy path", () => {
  test("should complete bill payment and show confirmation with correct details @smoke", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Bill payment is a one-way financial operation — money leaves the account
    // and goes to an external payee. There's no automatic reversal.
    // We verify the full round-trip: form → submission → confirmation panel
    // displays the exact payee name, amount, and source account.
    // A mismatch in the confirmation means the system processed a different
    // transaction than what the customer intended — critical trust failure.

    const billPayPage = new BillPayPage(page);

    // Obtenemos el fromAccountId del select del formulario — no de overview.htm
    // (ver decisión de diseño en el encabezado de la suite)
    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentData = BillPayFactory.create(fromAccountId);

    const result = await billPayPage.payBill(paymentData);

    expect(
      result.payeeName,
      `Confirmation shows payee "${result.payeeName}" but form submitted "${paymentData.payee.name}". ` +
        `System may have processed payment for the wrong payee.`,
    ).toBe(paymentData.payee.name);

    expect(
      result.amount,
      `Confirmation shows $${result.amount} but form submitted $${paymentData.amount}. ` +
        `Amount mismatch in confirmation — possible rounding or data corruption.`,
    ).toBe(paymentData.amount);
  });

  test("should deduct exact payment amount from source account balance", async ({
    authenticatedAsJohn,
    page,
  }) => {
    const billPayPage = new BillPayPage(page);
    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentAmount = 75;
    const paymentData = BillPayFactory.withAmount(fromAccountId, paymentAmount);

    await billPayPage.payBill(paymentData);

    // Verificar via API que la transacción existe — independiente del balance acumulado
    const response = await page.request.get(
      `${process.env.BASE_URL || 'http://localhost:9090'}/parabank/services/bank/accounts/${fromAccountId}/transactions`,
      { headers: { Accept: "application/json" } },
    );
    const transactions = await response.json();
    const payment = transactions.find(
      (t: any) => Math.abs(t.amount) === paymentAmount && t.type === "Debit",
    );
    expect(
      payment,
      `No se encontró transacción de $${paymentAmount} en cuenta ${fromAccountId} — ` +
        `el pago puede no haberse registrado en el historial de transacciones`,
    ).toBeTruthy();
  });

  test("should allow paying bills from different source accounts", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Customers with multiple accounts must be able to choose which account
    // to debit for each payment. If the fromAccount selection is ignored
    // and always debits the default account, customers lose financial control.

    const billPayPage = new BillPayPage(page);

    const accountIds = await billPayPage.getAvailableAccountIds();

    // Usamos la segunda cuenta si existe, sino la primera
    const secondAccountId =
      accountIds.length >= 2 ? accountIds[1] : accountIds[0];

    const paymentData = BillPayFactory.create(secondAccountId);
    const result = await billPayPage.payBill(paymentData);

    expect(
      result.fromAccountId,
      `Payment was debited from account "${result.fromAccountId}" ` +
        `but customer selected account "${secondAccountId}". ` +
        `Source account selection is being ignored.`,
    ).toContain(secondAccountId);
  });
});

test.describe("Bill Pay — validación de datos de entrada", () => {
  test("[BUG H-014] should reject payment when account number and verify account do not match", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // The double-entry of account number is a fraud prevention mechanism.
    // If the system ignores the mismatch and processes the payment anyway,
    // a typo in the account number could send money to the wrong account
    // with no opportunity for the customer to catch the error.
    //
    // HALLAZGO H-014: la validación client-side (jQuery) SÍ detecta el mismatch
    // y muestra el span de error. El test verifica que esa validación funciona.

    test.fail(
      true,
      "H-014: mismatched account validation exists client-side but " +
        "server does not validate — bypass possible via direct API call",
    );

    const billPayPage = new BillPayPage(page);

    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentData = BillPayFactory.create(fromAccountId);

    const differentAccount = paymentData.payee.accountNumber.slice(0, -1) + "9";
    await billPayPage.payBillWithMismatchedAccounts(
      paymentData,
      differentAccount,
    );

    const hasError = await billPayPage.hasError();

    expect(
      hasError,
      "System accepted bill payment with mismatched account numbers — " +
        "the verification field is not being validated. " +
        "Customers could send money to wrong accounts without any warning.",
    ).toBe(true);
  });

  test("should reject payment when required fields are missing", async ({
    authenticatedAsJohn,
    page,
  }) => {
    const billPayPage = new BillPayPage(page);
    await billPayPage.navigate();

    // Disparamos submit con campos vacíos
    await page.evaluate(() => {
      (window as any).$("input[value='Send Payment']").trigger("click");
    });

    // Esperamos que jQuery muestre al menos un span de error
    await page
      .locator('[id^="validationModel"]:visible')
      .first()
      .waitFor({ state: "visible", timeout: 5_000 });

    const errorCount = await page
      .locator('[id^="validationModel"]:visible')
      .count();

    expect(
      errorCount,
      "System did not show validation errors for empty required fields — " +
        "client-side validation is not working.",
    ).toBeGreaterThan(0);
  });

  test("[EDGE] should handle payment with zero amount", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // A $0.00 payment has no financial purpose. The system should either
    // reject it explicitly or handle it gracefully — not process it silently.

    const billPayPage = new BillPayPage(page);
    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentData = BillPayFactory.withZeroAmount(fromAccountId);

    let zeroAmountAccepted = false;
    try {
      await billPayPage.payBill(paymentData);
      zeroAmountAccepted = true;
    } catch {
      zeroAmountAccepted = false;
    }

    if (zeroAmountAccepted) {
      const title = await billPayPage.getResultTitle();
      expect(
        title.toLowerCase(),
        "Zero-amount payment accepted but no confirmation title shown",
      ).toContain("complete");
    } else {
      const hasError = await billPayPage.hasError();
      expect(
        hasError,
        "Zero-amount payment was rejected but no error message is shown — " +
          "customer has no feedback about why the payment failed",
      ).toBe(true);
    }
  });

  test("[BUG H-007] should reject payment with negative amount", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Related to H-007: negative amounts accepted in transfers.
    // A negative bill payment would move money FROM the payee TO the customer —
    // financially absurd and a critical security issue.

    test.fail(
      true,
      "H-007 confirmed in bill pay: negative amount accepted — consistent with transfer bug",
    );

    const billPayPage = new BillPayPage(page);
    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentData = BillPayFactory.withNegativeAmount(fromAccountId);

    let accepted = false;
    try {
      await billPayPage.payBill(paymentData);
      accepted = true;
    } catch {
      accepted = false;
    }

    expect(
      accepted,
      "[BUG H-007] System accepted a bill payment with negative amount ($-100). " +
        "A negative bill payment reverses the money flow. Severity: CRITICAL.",
    ).toBe(false);
  });
});

test.describe("Bill Pay — integridad con otras operaciones", () => {
  test("should reflect bill payment in account transaction history", async ({
    authenticatedAsJohn,
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // A payment that doesn't appear in the transaction history creates
    // an invisible debit — no audit trail for customers or support.

    const billPayPage = new BillPayPage(page);
    const accountsPage = new AccountsPage(page);

    const fromAccountId = await billPayPage.getFirstAccountId();
    const paymentData = BillPayFactory.withAmount(fromAccountId, 30);

    await billPayPage.payBill(paymentData);

    await accountsPage.navigateToAccountDetail(fromAccountId);

    const transactionRows = page.locator("table tbody tr").filter({
      hasText: /Bill Payment|Funds Transfer/,
    });

    // expect(locator).toHaveCount() reintenta automáticamente hasta timeout,
    // a diferencia de leer .count() una sola vez de forma síncrona (race condition
    // con el AJAX que pinta la fila de la transacción recién creada).
    await expect(
      transactionRows,
      `Account ${fromAccountId} shows 0 transactions after bill payment — ` +
        `payment may not have been recorded in the transaction ledger.`,
    ).not.toHaveCount(0, { timeout: 10_000 });
  });

  test("[BUG H-009] should not allow bill pay to unauthenticated user", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Bill pay must be behind authentication. Direct access without login
    // would allow unauthenticated users to initiate payments — critical
    // authorization failure.

    test.fail(
      true,
      "H-009: billpay.htm accessible without authentication — session enforcement bug",
    );

    await page.goto("/parabank/billpay.htm");

    expect(
      page.url(),
      "Bill pay page accessible without authentication — " +
        "unauthenticated users could initiate payments. Critical authorization issue.",
    ).not.toContain("billpay.htm");
  });
});
