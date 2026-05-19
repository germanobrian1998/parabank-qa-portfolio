import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  // Parabank redirige a overview.htm y muestra el nombre del cliente.
  // Capturamos estos datos para que las assertions de los tests
  // puedan verificar identidad sin hacer un segundo request.
  customerName: string;
  isAuthenticated: boolean;
}

/**
 * AuthPage — cubre login y logout.
 *
 * Decisión de naming: "AuthPage" en lugar de "LoginPage" porque
 * agrupa AMBAS acciones del ciclo de autenticación. Un Page Object
 * por responsabilidad de negocio, no por URL.
 *
 * Selectores: el formulario de login está en el panel izquierdo (#leftPanel).
 * Usamos input[name] en lugar de IDs porque Parabank no asigna IDs
 * consistentes al form de login (a diferencia del form de registro).
 */
export class AuthPage extends BasePage {
  // — Locators: Login form —
  private get usernameInput(): Locator {
    // El form de login vive en el panel izquierdo
    return this.page.locator("input[name='username']");
  }
  private get passwordInput(): Locator {
    return this.page.locator("input[name='password']");
  }
  private get loginButton(): Locator {
    return this.page.locator("input[value='Log In']");
  }

  // — Locators: Estado autenticado —
  private get customerNameHeading(): Locator {
    // Parabank muestra "Welcome {Name}" en el panel derecho tras login exitoso
    return this.page.locator('#rightPanel .smallText b');
  }
  private get logoutLink(): Locator {
    return this.page.locator("a[href*='logout']");
  }
  private get loginErrorMessage(): Locator {
    return this.page.locator('#rightPanel .error p');
  }

  // — Actions —

  async navigate(): Promise<void> {
    await this.page.goto('/parabank/index.htm');
  }

  /**
   * Realiza login y retorna información del estado autenticado.
   *
   * Por qué no retornamos solo boolean: el test necesita saber
   * con qué identidad está autenticado, especialmente si usa
   * usuarios generados dinámicamente. Retornar el nombre del cliente
   * permite assertions más específicas.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await this.navigate();

    await this.fillField(this.usernameInput, credentials.username, 'Username');
    await this.fillField(this.passwordInput, credentials.password, 'Password');
    await this.clickElement(this.loginButton, 'Login');

    // Esperamos redirección a overview o mensaje de error
    await this.page.waitForSelector(
      '#rightPanel .smallText, #rightPanel .error',
      { timeout: 15_000 }
    );

    // Si hay error de login, lo surfaceamos con contexto de negocio
    const loginError = await this.loginErrorMessage.isVisible().catch(() => false);
    if (loginError) {
      const errorText = await this.getTextContent(
        this.loginErrorMessage,
        'Login error message'
      );
      throw new Error(
        `[Login] Autenticación fallida para usuario "${credentials.username}". ` +
        `Mensaje del sistema: ${errorText}. ` +
        `Verificar que el usuario exista y las credenciales sean correctas.`
      );
    }

    await this.waitForUrl(/overview\.htm/, 'Post-login redirect to account overview');

    const customerName = await this.getTextContent(
      this.customerNameHeading,
      'Customer name after login'
    );

    return {
      customerName: customerName.trim(),
      isAuthenticated: true,
    };
  }

  /**
   * Realiza logout y verifica retorno a la página principal.
   *
   * Por qué verificamos la URL post-logout: un logout silencioso que
   * no invalida la sesión es un bug de seguridad (H-009 del discovery).
   * La verificación de URL es la mínima evidencia de que la sesión terminó.
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
   * Útil para tests que verifican persistencia o invalidación de sesión.
   */
  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible().catch(() => false);
  }
}