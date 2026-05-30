// src/helpers/assertions.ts
import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    'customer cannot decide to proceed without knowing approval status'
  ).toBeVisible({ timeout: 20_000 });
}

// ─── Accessibility ────────────────────────────────────────────────────────────

/**
 * Analiza la página actual con axe-core y retorna los violations encontrados.
 *
 * DECISIÓN DE DISEÑO: esta función NO lanza una excepción si hay violations.
 * Razón: Parabank es una app legacy — forzar los tests funcionales a fallar
 * por violations de a11y mezcla dos concerns distintos y enmascara fallos
 * funcionales reales. Los violations se reportan como advertencias separadas
 * en el accessibility report.
 *
 * Uso: llamar al final de un test funcional que ya verificó el estado correcto
 * de la página. El caller decide qué hacer con los violations retornados.
 *
 * @param page - La página de Playwright en su estado actual
 * @param context - Nombre descriptivo de la página/estado para el reporte
 * @returns Array de violations encontrados (vacío si ninguno)
 */
export async function auditAccessibility(
  page: Page,
  context: string,
): Promise<AccessibilityViolation[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa']) // WCAG 2.1 nivel AA — estándar para fintech
    .analyze();

  if (results.violations.length > 0) {
    console.warn(
      `\n[A11Y] ${context}: ${results.violations.length} violation(s) found`,
    );
    results.violations.forEach((v) => {
      console.warn(
        `  • [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`,
      );
      console.warn(`    Help: ${v.helpUrl}`);
      v.nodes.forEach((node) => {
        console.warn(`    Element: ${node.html.slice(0, 120)}`);
      });
    });
  }

  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? 'unknown',
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => n.html.slice(0, 200)),
  }));
}

export interface AccessibilityViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: string[];
}