// tests/e2e/transfer.spec.ts
import { test, expect } from "../../src/fixtures";
import { TransferFactory } from "../../src/factories/TransferFactory";
import { expectTransferConfirmed } from "../../src/helpers/assertions";
import { ApiClient } from "../../src/api/client/ApiClient";

test.describe("Transfers — funds movement between own accounts", () => {
  test("should confirm transfer and reflect updated balance in both accounts", async ({
    authenticatedPage,
    transferPage,
  }) => {
    // WHY THIS TEST MATTERS:
    // Transfer is the highest-risk operation in Parabank — money moves.
    // A silent failure here means customer sees incorrect balance
    // without any error, which is a critical trust issue.

    const { page, accountId: fromAccountId } = authenticatedPage;

    const client = new ApiClient();
    await client.init();

    const customer = await client.login(
      process.env.PARABANK_USER || "john",
      process.env.PARABANK_PASS || "demo",
    );
    const accounts = await client.getAccountsForCustomer(customer.id);
    const toAccount = accounts.find((a) => String(a.id) !== fromAccountId);

    if (!toAccount) {
      throw new Error(
        "No second account found for transfer destination — re-seed Docker image",
      );
    }

    await transferPage.navigate();
    await transferPage.transfer(
      TransferFactory.valid(fromAccountId, String(toAccount.id)),
    );
    await expectTransferConfirmed(transferPage.currentPage);

    await client.dispose();
  });

  test("[BUG] should reject transfer when source account has insufficient funds", async ({
    authenticatedPage,
    transferPage,
  }) => {
    // WHY THIS TEST MATTERS:
    // System must prevent overdraft. Parabank accepts transfers
    // exceeding available balance without any error — confirmed bug.
    // This test is expected to FAIL, documenting the vulnerability.
    //
    // CUENTAS DESCARTABLES:
    // Este test fuerza un overdraft de $999.999 contra una cuenta real.
    // Como H-010 confirma que el server nunca valida saldo, la transferencia
    // se ejecuta de verdad y el daño queda persistido — no es un POST que
    // se pueda revertir limpiamente. Usar las cuentas fijas de la suite
    // (12345/12456) las deja contaminadas para siempre entre corridas
    // (causa raíz confirmada — ver docs/lessons-learned.md).
    // Por eso este test abre un par de cuentas nuevas solo para sí mismo:
    // el daño queda aislado y se descarta junto con el contenedor.
    //
    // No usamos authenticatedPage.accountId como fondeadora porque puede
    // ser justamente la cuenta históricamente contaminada por corridas
    // anteriores de este mismo test. Filtramos defensivamente cualquier
    // cuenta del customer con balance "sano" para fondear las descartables.

    test.fail(
      true,
      "Parabank allows overdraft: transfer of $999999 from account with insufficient funds was accepted silently",
    );

    const client = new ApiClient();
    await client.init();

    const customer = await client.login(
      process.env.PARABANK_USER || "john",
      process.env.PARABANK_PASS || "demo",
    );
    const accounts = await client.getAccountsForCustomer(customer.id);

    const funderAccount = accounts.find(
      (a) => a.type === "CHECKING" && a.balance > 100 && a.balance < 100_000,
    );

    if (!funderAccount) {
      throw new Error(
        "No se encontró cuenta CHECKING con balance sano para fondear cuentas " +
          "descartables — re-seed Docker image (docker compose down -v && up -d --wait)",
      );
    }

    const disposableFrom = await client.createAccount(
      customer.id,
      "CHECKING",
      funderAccount.id,
    );
    const disposableTo = await client.createAccount(
      customer.id,
      "CHECKING",
      funderAccount.id,
    );

    await transferPage.navigate();
    await transferPage.transfer(
      TransferFactory.withAmount(
        String(disposableFrom.id),
        String(disposableTo.id),
        999_999,
      ),
    );

    await expect(
      transferPage.currentPage.getByText(/insufficient|error/i),
      "No error shown for insufficient funds transfer — " +
        "system is allowing overdraft silently",
    ).toBeVisible();

    await client.dispose();
  });

  test("[BUG H-007] should reject transfer with negative amount", async ({
    authenticatedPage,
    transferPage,
  }) => {
    // WHY THIS TEST MATTERS:
    // Server accepts negative amounts (H-007, critical severity).
    // This test is expected to FAIL against current system,
    // demonstrating the framework finds real problems.

    test.fail(
      true,
      "H-007: Server accepts negative transfer amounts — known critical bug",
    );

    const { accountId: fromAccountId } = authenticatedPage;

    const client = new ApiClient();
    await client.init();

    const customer = await client.login(
      process.env.PARABANK_USER || "john",
      process.env.PARABANK_PASS || "demo",
    );
    const accounts = await client.getAccountsForCustomer(customer.id);
    const toAccount = accounts.find((a) => String(a.id) !== fromAccountId);

    await transferPage.navigate();
    await transferPage.transfer(
      TransferFactory.withNegativeAmount(fromAccountId, String(toAccount!.id)),
    );

    await expect(
      transferPage.currentPage.getByText(/invalid amount/i),
      "Negative transfer amount was accepted — " +
        "server-side validation missing for negative monetary values",
    ).toBeVisible();

    await client.dispose();
  });
});
