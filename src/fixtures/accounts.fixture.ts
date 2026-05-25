import { test as base, type Page } from "@playwright/test";
import { AuthPage } from "../pages/AuthPage";
import { AccountsPage } from "../pages/AccountsPage";
import { RegisterPage } from "../pages/RegisterPage";

/**
 * Fixture: authenticatedAsJohn
 *
 * Propósito: proveer una sesión activa con el usuario demo "john"
 * como precondición rápida para tests que no están testeando el login.
 *
 * Por qué "john" y no un usuario dinámico:
 * john/demo es un fixture estático de Parabank con cuentas preexistentes
 * (según ADR-003: fixtures estáticos para config, factories para usuarios nuevos).
 * Para tests de apertura de cuenta donde necesitamos fondos para el fromAccount,
 * john es la opción más estable.
 */
type AuthFixtures = {
  authenticatedAsJohn: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedAsJohn: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await authPage.login({ username: "john", password: "demo" });
    await use(page);
    // Teardown: logout explícito para limpiar la sesión entre tests
    // Evita que sesiones residuales interfieran con tests de concurrencia (H-009)
  },
});

export { expect } from "@playwright/test";
export { AccountsPage, AuthPage, RegisterPage };
