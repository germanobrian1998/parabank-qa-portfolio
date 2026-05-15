// src/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // Por qué este método existe: Playwright lanza errores técnicos.
  // Este método los convierte en errores de negocio.
  protected async clickWithRetry(
    locator: Locator,
    businessContext: string,
    options?: { timeout?: number }
  ): Promise<void> {
    try {
      await locator.click({ timeout: options?.timeout ?? 10_000 });
    } catch (error) {
      throw new Error(
        `[${businessContext}] No se pudo completar la acción. ` +
        `Elemento no interactuable. Causa técnica: ${(error as Error).message}`
      );
    }
  }

  protected async fillField(
    locator: Locator,
    value: string,
    fieldName: string
  ): Promise<void> {
    try {
      await locator.clear();
      await locator.fill(value);
    } catch (error) {
      throw new Error(
        `[Form] No se pudo completar el campo "${fieldName}". ` +
        `Causa: ${(error as Error).message}`
      );
    }
  }

  protected async waitForNavigation(
    expectedUrlPattern: string | RegExp,
    businessContext: string
  ): Promise<void> {
    try {
      await this.page.waitForURL(expectedUrlPattern, { timeout: 15_000 });
    } catch {
      throw new Error(
        `[${businessContext}] La navegación no completó hacia el destino esperado. ` +
        `URL actual: ${this.page.url()}`
      );
    }
  }
}