// src/helpers/assertions.ts
import { expect, Page } from '@playwright/test';

// Por qué custom assertions: el mensaje de fallo por defecto dice
// "expected 'X' to contain 'Y'". El custom dice
// "Transfer confirmation not shown after funds movement".
// Una persona de negocio puede leer ese mensaje y entender qué falló.

export async function expectTransferConfirmed(page: Page): Promise<void> {
  await expect(
    page.getByText('Transfer Complete!'),
    'Transfer confirmation not shown after funds movement — ' +
    'user has no feedback that money moved between accounts'
  ).toBeVisible();
}

export async function expectAccountBalance(
  page: Page,
  accountId: string,
  expectedAmount: number
): Promise<void> {
  const balanceLocator = page.locator(`[data-account-id="${accountId}"] .balance`);
  const balanceText = await balanceLocator.textContent();
  const actualBalance = parseFloat(balanceText?.replace(/[$,]/g, '') ?? '0');

  expect(
    actualBalance,
    `Account ${accountId} balance mismatch — ` +
    `expected $${expectedAmount} but found $${actualBalance}. ` +
    `Possible ledger inconsistency after transaction.`
  ).toBeCloseTo(expectedAmount, 2);
}

export async function expectLoanDecisionPresent(page: Page): Promise<void> {
  await expect(
    page.locator('.loan-provider-result'),
    'Loan decision result not displayed — ' +
    'customer cannot proceed without knowing approval status'
  ).toBeVisible({ timeout: 20_000 });
}