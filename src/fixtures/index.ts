// src/fixtures/index.ts
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TransferPage } from '../pages/TransferPage';
import { ApiClient } from '../api/client/ApiClient';

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

  // Fixture compuesto: ya llega autenticado con cuenta lista.
  // accountId se resuelve via API para garantizar un ID válido
  // independientemente del estado del Docker — evita depender del DOM
  // del overview y del valor retornado por LoginPage.login().
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({
      username: process.env.PARABANK_USER || 'john',
      password: process.env.PARABANK_PASS || 'demo',
    });

    // Resolver accountId via API — más robusto que leer el DOM
    const client = new ApiClient();
    await client.init();
    const customer = await client.login(
      process.env.PARABANK_USER || 'john',
      process.env.PARABANK_PASS || 'demo'
    );
    const accounts = await client.getAccountsForCustomer(customer.id);
    const firstAccount = accounts.find(a => a.type === 'CHECKING');
    await client.dispose();

    if (!firstAccount) {
      throw new Error('No CHECKING account found for authenticated user — re-seed Docker image');
    }

    await use({ page, accountId: String(firstAccount.id) });
  },

  // Fixture simple: login sin accountId
  // Usado por tests que solo necesitan sesión activa (loans, billpay)
  authenticatedAsJohn: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({
      username: process.env.PARABANK_USER || 'john',
      password: process.env.PARABANK_PASS || 'demo',
    });
    await use({ page });
  },
});

export { expect } from '@playwright/test';