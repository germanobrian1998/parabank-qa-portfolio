import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AccountInfo {
  defaultAccountId: string;
}

export class LoginPage extends BasePage {
  private readonly usernameField = this.page.locator('#username');
  private readonly passwordField = this.page.locator('#password');
  private readonly submitButton = this.page.locator('input[value="Log In"]');

  async navigate(): Promise<void> {
    await this.page.goto('/parabank/login.htm');
  }

  async login(credentials: LoginCredentials): Promise<AccountInfo> {
    await this.fillField(this.usernameField, credentials.username, 'username');
    await this.fillField(this.passwordField, credentials.password, 'password');
    await this.clickWithRetry(this.submitButton, 'Login');
    await this.waitForNavigation('/parabank/overview.htm', 'Login');
    return { defaultAccountId: '' };
  }

  async logout(): Promise<void> {
    await this.page.locator('a[href*="logout"]').click();
  }
}