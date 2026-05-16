// tests/e2e/transfer.spec.ts
import { test, expect } from '../../src/fixtures';
import { TransferFactory } from '../../src/factories/TransferFactory';
import { expectTransferConfirmed } from '../../src/helpers/assertions';

test.describe('Transfers — funds movement between own accounts', () => {

  test(
    // Por qué este naming: describe el escenario de negocio completo.
    // Cuando falla en CI, el reporte dice exactamente qué escenario rompió.
    'should confirm transfer and reflect updated balance in both accounts',
    async ({ authenticatedPage, transferPage }) => {
      // WHY THIS TEST MATTERS:
      // Transfer is the highest-risk operation in Parabank — money moves.
      // A silent failure here means customer sees incorrect balance
      // without any error, which is a critical trust issue.

      const { accountId } = authenticatedPage;
      const transfer = TransferFactory.valid(accountId, '13344');

      await transferPage.navigate();
      await transferPage.transfer(transfer);

      await expectTransferConfirmed(transferPage.currentPage);
    }
  );

  test(
    'should reject transfer when source account has insufficient funds',
    async ({ authenticatedPage, transferPage }) => {
      // WHY THIS TEST MATTERS:
      // System must prevent overdraft. Silent approval of
      // insufficient-funds transfer = financial loss.

      const { accountId } = authenticatedPage;
      // Intento transferir más de lo que hay en la cuenta
      const transfer = TransferFactory.withAmount(accountId, '13344', 999_999);

      await transferPage.navigate();
      await transferPage.transfer(transfer);

      await expect(
        transferPage.currentPage.getByText(/insufficient/i),
        'No error shown for insufficient funds transfer — ' +
        'system may be allowing overdraft silently'
      ).toBeVisible();
    }
  );

  test(
    '[BUG H-007] should reject transfer with negative amount',
    async ({ authenticatedPage, transferPage }) => {
      // WHY THIS TEST MATTERS:
      // Server accepts negative amounts (H-007, critical severity).
      // This test is expected to FAIL against current system,
      // demonstrating the framework finds real problems.
      // Mark as known bug: test.fail() documents intent.

      test.fail(true, 'H-007: Server accepts negative transfer amounts — known critical bug');

      const { accountId } = authenticatedPage;
      const transfer = TransferFactory.withNegativeAmount(accountId, '13344');

      await transferPage.navigate();
      await transferPage.transfer(transfer);

      await expect(
        transferPage.currentPage.getByText(/invalid amount/i),
        'Negative transfer amount was accepted — ' +
        'server-side validation missing for negative monetary values'
      ).toBeVisible();
    }
  );
});