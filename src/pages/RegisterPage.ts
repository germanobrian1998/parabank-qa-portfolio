import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { type CustomerData } from "../factories/UserFactory";

export interface RegisterResult {
  username: string;
  // El ID de cuenta se muestra en la página de confirmación de registro.
  // Parabank lo genera automáticamente y lo necesitamos para tests posteriores.
  welcomeMessage: string;
}

/**
 * RegisterPage — flujo de alta de cliente nuevo.
 *
 * Selectores: Parabank usa input[name='customer.fieldName']
 * como convención consistente en todo el formulario de registro.
 * Fuente: inspección del HTML fuente del repo parasoft/parabank.
 */
export class RegisterPage extends BasePage {
  // — Locators —
  private get firstNameInput(): Locator {
    return this.page.locator("input[name='customer.firstName']");
  }
  private get lastNameInput(): Locator {
    return this.page.locator("input[name='customer.lastName']");
  }
  private get addressInput(): Locator {
    return this.page.locator("input[name='customer.address.street']");
  }
  private get cityInput(): Locator {
    return this.page.locator("input[name='customer.address.city']");
  }
  private get stateInput(): Locator {
    return this.page.locator("input[name='customer.address.state']");
  }
  private get zipCodeInput(): Locator {
    return this.page.locator("input[name='customer.address.zipCode']");
  }
  private get phoneInput(): Locator {
    return this.page.locator("input[name='customer.phoneNumber']");
  }
  private get ssnInput(): Locator {
    return this.page.locator("input[name='customer.ssn']");
  }
  private get usernameInput(): Locator {
    return this.page.locator("input[name='customer.username']");
  }
  private get passwordInput(): Locator {
    return this.page.locator("input[name='customer.password']");
  }
  private get confirmPasswordInput(): Locator {
    return this.page.locator("input[name='repeatedPassword']");
  }
  private get registerButton(): Locator {
    return this.page.locator("input[value='Register']");
  }
  private get welcomeHeading(): Locator {
    // Parabank muestra "Welcome {firstName} {lastName}" tras registro exitoso
    return this.page.locator("#rightPanel h1.title");
  }
  private get errorMessage(): Locator {
    return this.page.locator("#rightPanel .error");
  }

  // — Actions —

  async navigate(): Promise<void> {
    await this.page.goto("/parabank/register.htm");
    await this.waitForUrl(/register\.htm/, "Navigate to Register");
  }

  /**
   * Completa y envía el formulario de registro.
   *
   * Por qué retornamos RegisterResult: los tests que vienen después
   * (login, transfers) necesitan el username generado dinámicamente.
   * Si no lo retornamos acá, el test tiene que volver a buscarlo.
   */
  async register(data: CustomerData): Promise<RegisterResult> {
    await this.fillField(this.firstNameInput, data.firstName, "First Name");
    await this.fillField(this.lastNameInput, data.lastName, "Last Name");
    await this.fillField(this.addressInput, data.address, "Address");
    await this.fillField(this.cityInput, data.city, "City");
    await this.fillField(this.stateInput, data.state, "State");
    await this.fillField(this.zipCodeInput, data.zipCode, "Zip Code");
    await this.fillField(this.phoneInput, data.phone, "Phone");
    await this.fillField(this.ssnInput, data.ssn, "SSN");
    await this.fillField(this.usernameInput, data.username, "Username");
    await this.fillField(this.passwordInput, data.password, "Password");
    await this.fillField(
      this.confirmPasswordInput,
      data.password,
      "Confirm Password",
    );

    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("register.htm") &&
          resp.request().method() === "POST",
        { timeout: 15_000 },
      ),
      this.clickElement(this.registerButton, "Submit Registration"),
    ]);
    await this.page.waitForFunction(
      () => {
        const h1 = document.querySelector("#rightPanel h1.title");
        return (
          h1 &&
          (h1.textContent?.includes("Welcome") ||
            !!document.querySelector("#rightPanel .error"))
        );
      },
      { timeout: 15_000 },
    );

    const welcomeText = await this.welcomeHeading
      .textContent()
      .catch(() => null);

    if (!welcomeText) {
      const error = await this.getTextContent(
        this.errorMessage,
        "Registration error",
      );
      throw new Error(
        `[Registration] Registro rechazado para username "${data.username}". ` +
          `Mensaje del sistema: ${error}`,
      );
    }

    return {
      username: data.username,
      welcomeMessage: welcomeText.trim(),
    };
  }

  /**
   * Verifica si un mensaje de error específico está visible.
   * Útil para tests de validación de campos.
   */
  async getFieldError(fieldName: string): Promise<string | null> {
    const errorLocator = this.page.locator(`#customer\\.${fieldName}\\.errors`);
    const isVisible = await errorLocator.isVisible().catch(() => false);
    if (!isVisible) return null;
    return errorLocator.textContent();
  }
}
