// src/pages/LoanPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoanRequest } from '../factories/LoanFactory';

export interface LoanResult {
  approved: boolean;
  newAccountId?: string;
  message: string;
}

export class LoanPage extends BasePage {
  // ── Formulario ────────────────────────────────────────────────────
  private readonly loanAmountInput   = this.currentPage.locator('input#amount');
  private readonly downPaymentInput  = this.currentPage.locator('input#downPayment');
  private readonly fromAccountSelect = this.currentPage.locator('select#fromAccountId');
  private readonly applyButton       = this.currentPage.locator('input[value="Apply Now"]');

  // ── Resultado ─────────────────────────────────────────────────────
  // El panel de resultado usa el mismo #rightPanel que BillPay
  private readonly resultTitle   = this.currentPage.locator('#rightPanel h1.title');
  private readonly approvedPanel = this.currentPage.locator('#loanRequestApproved');
  private readonly deniedPanel   = this.currentPage.locator('#loanRequestDenied');
  private readonly newAccountId  = this.currentPage.locator('td#newAccountId');
  private readonly errorPanel    = this.currentPage.locator('#rightPanel .error');

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.waitForUrl('requestloan.htm', 'navegación a solicitud de préstamo');
  }

  /** Obtiene el primer account ID disponible en el select del formulario */
  async getFirstAccountId(): Promise<string> {
    await this.currentPage.waitForSelector('select#fromAccountId option', {
      state: 'attached',
    });
    const value = await this.currentPage
      .locator('select#fromAccountId option')
      .first()
      .getAttribute('value');
    if (!value) {
      throw new Error(
        '[Solicitud de préstamo] No se encontraron cuentas disponibles en el formulario.',
      );
    }
    return value;
  }

  /** Obtiene todos los account IDs disponibles en el select */
  async getAvailableAccountIds(): Promise<string[]> {
    await this.currentPage.waitForSelector('select#fromAccountId option', {
      state: 'attached',
    });
    return this.currentPage
      .locator('select#fromAccountId option')
      .evaluateAll((opts: HTMLOptionElement[]) => opts.map((o) => o.value));
  }

  /**
   * Completa y envía el formulario de solicitud de préstamo.
   * Espera el resultado (aprobado o rechazado) antes de retornar.
   *
   * @param loan       - datos del préstamo (amount + downPayment)
   * @param fromAccountId - cuenta de donde se debitará el down payment
   */
  async requestLoan(loan: LoanRequest, fromAccountId: string): Promise<LoanResult> {
    await this.fillField(
      this.loanAmountInput,
      String(loan.amount),
      'monto del préstamo',
    );
    await this.fillField(
      this.downPaymentInput,
      String(loan.downPayment),
      'pago inicial',
    );
    await this.fromAccountSelect.selectOption(fromAccountId);

    await this.clickElement(this.applyButton, 'envío de solicitud de préstamo');

    // El servidor procesa el préstamo vía AJAX — puede tardar varios segundos
    await this.currentPage.waitForSelector(
      '#loanRequestApproved, #loanRequestDenied, #rightPanel .error',
      { timeout: 30_000 },
    );

    return this.readResult();
  }

  /** Lee el estado del panel de resultado y retorna un objeto tipado */
  async readResult(): Promise<LoanResult> {
    const isApproved = await this.approvedPanel.isVisible();
    const isDenied   = await this.deniedPanel.isVisible();
    const isError    = await this.errorPanel.isVisible();

    if (isApproved) {
      let accountId: string | undefined;
      try {
        accountId = (await this.newAccountId.textContent()) ?? undefined;
        accountId = accountId?.trim();
      } catch {
        // el campo podría no estar presente si el flujo difiere
      }
      return {
        approved: true,
        newAccountId: accountId,
        message: await this.getTextContent(this.resultTitle, 'título de resultado'),
      };
    }

    if (isDenied) {
      const message = await this.getTextContent(
        this.deniedPanel.locator('p').first(),
        'mensaje de rechazo',
      );
      return { approved: false, message };
    }

    if (isError) {
      const message = await this.getTextContent(this.errorPanel, 'panel de error');
      return { approved: false, message };
    }

    throw new Error(
      '[Solicitud de préstamo] No se pudo determinar el resultado: ningún panel fue visible tras la solicitud.',
    );
  }
}