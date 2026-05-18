import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AccountInfo {
  defaultAccountId: string;
}

export class LoginPage extends BasePage {
  private readonly usernameField = this.page.locator('input[name="username"]');
  private readonly passwordField = this.page.locator('input[name="password"]');
  private readonly submitButton = this.page.locator('input[value="Log In"]');

  async navigate(): Promise<void> {
    await this.page.goto("http://localhost:9090/parabank/index.htm");
  }

  async login(credentials: LoginCredentials): Promise<AccountInfo> {
    // Esperamos que el formulario esté visible antes de interactuar
    await this.usernameField.waitFor({ state: "visible" });

    await this.usernameField.fill(credentials.username);
    await this.passwordField.fill(credentials.password);

    // Esperamos la navegación ANTES de hacer click
    await Promise.all([
      this.page.waitForURL("**/parabank/overview*", { timeout: 15_000 }),
      this.submitButton.click(),
    ]);

    return { defaultAccountId: "" };
  }

  async logout(): Promise<void> {
    await this.page.locator('a[href*="logout"]').click();
  }
}
