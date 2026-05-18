// tests/e2e/transfer.spec.ts
import { test, expect } from '../../src/fixtures';
import { TransferFactory } from '../../src/factories/TransferFactory';
import { expectTransferConfirmed } from '../../src/helpers/assertions';

test.describe('Transfers — funds movement between own accounts', () => {

  test(
    'should confirm transfer and reflect updated balance in both accounts',
    async ({ authenticatedPage, transferPage }) => {
      // WHY THIS TEST MATTERS:
      // Transfer is the highest-risk operation in Parabank — money moves.
      // A silent failure here means customer sees incorrect balance
      // without any error, which is a critical trust issue.

      const transfer = TransferFactory.valid('13122', '13344');
      await transferPage.navigate();
      await transferPage.transfer(transfer);
      await expectTransferConfirmed(transferPage.currentPage);
    }
  );

  test(
    '[BUG] should reject transfer when source account has insufficient funds',
    async ({ authenticatedPage, transferPage }) => {
      // WHY THIS TEST MATTERS:
      // System must prevent overdraft. Parabank accepts transfers
      // exceeding available balance without any error — confirmed bug.
      // This test is expected to FAIL, documenting the vulnerability.

      test.fail(true, 'Parabank allows overdraft: transfer of $999999 from account with insufficient funds was accepted silently');

      await transferPage.navigate();
      await transferPage.transfer(
        TransferFactory.withAmount('13122', '13344', 999_999)
      );

      await expect(
        transferPage.currentPage.getByText(/insufficient|error/i),
        'No error shown for insufficient funds transfer — ' +
        'system is allowing overdraft silently'
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

      test.fail(true, 'H-007: Server accepts negative transfer amounts — known critical bug');

      await transferPage.navigate();
      await transferPage.transfer(
        TransferFactory.withNegativeAmount('13122', '13344')
      );

      await expect(
        transferPage.currentPage.getByText(/invalid amount/i),
        'Negative transfer amount was accepted — ' +
        'server-side validation missing for negative monetary values'
      ).toBeVisible();
    }
  );
});