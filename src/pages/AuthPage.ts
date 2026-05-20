// src/pages/AuthPage.ts
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  customerName: string;
  isAuthenticated: boolean;
}

/**
 * AuthPage — cubre login y logout.
 *
 * Decisión de naming: "AuthPage" en lugar de "LoginPage" porque
 * agrupa AMBAS acciones del ciclo de autenticación. Un Page Object
 * por responsabilidad de negocio, no por URL.
 */
export class AuthPage extends BasePage {
  // — Locators: Login form —
  private get usernameInput(): Locator {
    return this.page.locator("input[name='username']");
  }
  private get passwordInput(): Locator {
    return this.page.locator("input[name='password']");
  }
  private get loginButton(): Locator {
    return this.page.locator("input[value='Log In']");
  }

  // — Locators: Estado autenticado —
  private get logoutLink(): Locator {
    return this.page.locator("a[href*='logout']");
  }

  // — Actions —

  async navigate(): Promise<void> {
    await this.page.goto('/parabank/index.htm');
  }

  /**
   * Realiza login y retorna información del estado autenticado.
   *
   * Por qué usamos waitForSelector antes de fillField:
   * Después de ciertas navegaciones (ej: post-registro), el formulario
   * de login puede tardar en renderizarse aunque la URL sea correcta.
   * El waitForSelector garantiza que el campo esté disponible antes
   * de intentar interactuar con él.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await this.navigate();

    // Esperamos que el formulario de login esté disponible
    await this.page.waitForSelector("input[name='username']", {
      timeout: 10_000,
    });

    await this.fillField(this.usernameInput, credentials.username, 'Username');
    await this.fillField(this.passwordInput, credentials.password, 'Password');

    await Promise.all([
      this.page.waitForURL(/overview\.htm|login\.htm/, { timeout: 15_000 }),
      this.clickElement(this.loginButton, 'Login'),
    ]);

    // Si quedamos en login.htm, las credenciales fueron rechazadas
    if (this.page.url().includes('login.htm')) {
      throw new Error(
        `[Login] Autenticación fallida para usuario "${credentials.username}". ` +
        `El sistema rechazó las credenciales.`
      );
    }

    const customerName = await this.page
      .locator('#rightPanel h1.title')
      .textContent()
      .catch(() => '');

    return {
      customerName: customerName?.trim() ?? '',
      isAuthenticated: true,
    };
  }

  /**
   * Realiza logout y verifica retorno a la página principal.
   */
  async logout(): Promise<void> {
    await this.clickElement(this.logoutLink, 'Logout');
    await this.waitForUrl(
      /index\.htm|login\.htm/,
      'Post-logout redirect to public page'
    );
  }

  /**
   * Verifica si hay una sesión activa sin realizar ninguna acción.
   */
  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible().catch(() => false);
  }
}