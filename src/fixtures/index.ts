// src/fixtures/index.ts
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TransferPage } from '../pages/TransferPage';

type Fixtures = {
  loginPage: LoginPage;
  transferPage: TransferPage;
  authenticatedPage: { page: Page; accountId: string };
  authenticatedAsJohn: { page: Page };
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
      password: 'demo',
    });
    await use({ page, accountId: accountInfo.defaultAccountId });
  },

  // Fixture simple: login sin accountId
  // Usado por tests que solo necesitan sesión activa (loans, billpay)
  authenticatedAsJohn: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({ username: 'john', password: 'demo' });
    await use({ page });
  },
});

export { expect } from '@playwright/test';