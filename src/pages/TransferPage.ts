import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { TransferData } from '../factories/TransferFactory';

export class TransferPage extends BasePage {
  private readonly amountField = this.page.locator('#amount');
  private readonly fromAccount = this.page.locator('#fromAccountId');
  private readonly toAccount = this.page.locator('#toAccountId');
  private readonly submitButton = this.page.locator('input[value="Transfer"]');

  async navigate(): Promise<void> {
    await this.page.goto('/parabank/transfer.htm');
  }

  async transfer(data: TransferData): Promise<void> {
    await this.fillField(this.amountField, String(data.amount), 'amount');
    await this.fromAccount.selectOption(data.fromAccount);
    await this.toAccount.selectOption(data.toAccount);
    await this.clickWithRetry(this.submitButton, 'Transfer');
  }
}