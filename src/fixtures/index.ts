// src/fixtures/index.ts
import { test as base,Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TransferPage } from '../pages/TransferPage';
// ... imports

type Fixtures = {
  loginPage: LoginPage;
  transferPage: TransferPage;
  authenticatedPage: { page: Page; accountId: string };
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  transferPage: async ({ page }, use) => {
    await use(new TransferPage(page));
  },

  // Fixture compuesto: ya llega autenticado con cuenta lista
  // Por qué: los tests de transferencia no deben testear login.
  // Separar setup de assertion es crítico para mensajes de fallo claros.
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    const accountInfo = await loginPage.login({
      username: 'john',
      password: 'demo'
    });
    await use({ page, accountId: accountInfo.defaultAccountId });
  },
});

export { expect } from '@playwright/test';