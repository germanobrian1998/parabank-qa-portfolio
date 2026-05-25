import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { type BillPayData, type BillPayResult } from '../factories/BillPayFactory';

/**
 * BillPayPage — flujo completo de pago de facturas.
 *
 * URL: /parabank/billpay.htm
 *
 * ARQUITECTURA REAL DE LA PÁGINA (confirmada inspeccionando el HTML):
 * jQuery puro con tres divs que se muestran/ocultan:
 *
 *   #billpayForm   — el formulario         (visible por defecto)
 *   #billpayResult — confirmación de éxito (display:'' → visible via CSS tras éxito)
 *   #billpayError  — panel de error        (display:'none' inline → visible tras error)
 *
 * IMPORTANTE — detección de visibilidad:
 * jQuery usa .show()/.hide() que en algunos casos NO setea style.display inline.
 * La forma correcta de detectar visibilidad es getComputedStyle(el).display,
 * no el.style.display (que puede estar vacío aunque el elemento sea visible).
 *
 * IMPORTANTE — por qué NO navegamos a overview.htm antes de payBill():
 * Navegar a overview.htm antes de payBill() invalida el contexto de sesión
 * que Parabank necesita para procesar el POST — el servidor devuelve 500.
 * Usamos getFirstAccountId() / getAvailableAccountIds() que leen el <select>
 * del formulario directamente, sin romper el flujo de sesión.
 *
 * HALLAZGO H-014: el servidor NO valida el mismatch de cuentas si se bypasea
 * la validación client-side.
 */
export class BillPayPage extends BasePage {

  // ── Locators: Payee form ──────────────────────────────────────────────

  private get payeeNameInput(): Locator {
    return this.page.locator("input[name='payee.name']");
  }
  private get payeeStreetInput(): Locator {
    return this.page.locator("input[name='payee.address.street']");
  }
  private get payeeCityInput(): Locator {
    return this.page.locator("input[name='payee.address.city']");
  }
  private get payeeStateInput(): Locator {
    return this.page.locator("input[name='payee.address.state']");
  }
  private get payeeZipCodeInput(): Locator {
    return this.page.locator("input[name='payee.address.zipCode']");
  }
  private get payeePhoneInput(): Locator {
    return this.page.locator("input[name='payee.phoneNumber']");
  }
  private get payeeAccountInput(): Locator {
    return this.page.locator("input[name='payee.accountNumber']");
  }
  private get verifyAccountInput(): Locator {
    return this.page.locator("input[name='verifyAccount']");
  }
  private get amountInput(): Locator {
    return this.page.locator("input[name='amount']");
  }
  private get fromAccountSelect(): Locator {
    return this.page.locator("select[name='fromAccountId']");
  }
  private get sendPaymentButton(): Locator {
    return this.page.locator("input[value='Send Payment']");
  }

  // ── Locators: Resultado ───────────────────────────────────────────────

  private get payeeNameConfirmation(): Locator {
    // jQuery llena #payeeName con response.payeeName tras éxito
    return this.page.locator('#payeeName');
  }
  private get amountConfirmation(): Locator {
    // jQuery llena #amount con currencyFormat(response.amount) → "$50.00"
    return this.page.locator('#amount');
  }
  private get fromAccountConfirmation(): Locator {
    // jQuery llena #fromAccountId con response.accountId
    return this.page.locator('#fromAccountId');
  }
  private get errorPanel(): Locator {
    return this.page.locator('#billpayError p.error');
  }

  // ── Actions ───────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    // Solo navegamos si no estamos ya en billpay.htm — evita recargar la página
    // después de getFirstAccountId() y perder el resultado del pago
    if (!this.page.url().includes('billpay.htm')) {
      await this.page.goto('/parabank/billpay.htm');
    }
    // El select de cuenta origen carga vía AJAX — esperamos antes de interactuar
    await this.fromAccountSelect.waitFor({ state: 'visible', timeout: 10_000 });
    // Esperamos que jQuery bindee el handler del botón Send Payment
    await this.page.waitForFunction(
      () => {
        const btn = document.querySelector("input[value='Send Payment']");
        return btn !== null && (window as any).jQuery?._data(btn, 'events')?.click?.length > 0;
      },
      { timeout: 10_000 }
    );
  }

  /**
   * Obtiene el ID de la primera cuenta disponible en el select del formulario.
   *
   * Por qué leemos el select y no navegamos a overview.htm:
   * Navegar a overview.htm antes de payBill() invalida el contexto de sesión
   * que Parabank necesita para procesar bill pay — el servidor devuelve 500.
   */
  async getFirstAccountId(): Promise<string> {
    await this.navigate();
    const firstOption = await this.fromAccountSelect
      .locator('option')
      .first()
      .getAttribute('value');
    if (!firstOption) {
      throw new Error('[BillPayPage] No hay cuentas disponibles en el selector de cuenta origen.');
    }
    return firstOption.trim();
  }

  /**
   * Obtiene todos los IDs de cuenta disponibles en el select del formulario.
   */
  async getAvailableAccountIds(): Promise<string[]> {
    await this.navigate();
    const options = await this.fromAccountSelect.locator('option').all();
    const ids: string[] = [];
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value) ids.push(value.trim());
    }
    return ids;
  }

  /**
   * Espera a que jQuery muestre el panel de confirmación o de error.
   *
   * Por qué usamos getComputedStyle en lugar de style.display:
   * jQuery's .show()/.hide() no siempre setea style.display inline.
   * getComputedStyle refleja el valor real calculado por el browser,
   * independientemente de si viene de un atributo inline o de CSS.
   *
   * Tres estados posibles tras el submit:
   * 1. Éxito: #billpayResult visible (computedStyle !== 'none') + #payeeName con texto
   * 2. Error servidor: #billpayError visible (computedStyle !== 'none')
   * 3. Error JSP: página nueva sin #billpayResult ni #billpayError
   */
  private async waitForPaymentResult(timeout = 15_000): Promise<'success' | 'error'> {
    await this.page.waitForFunction(
      () => {
        const result    = document.getElementById('billpayResult');
        const error     = document.getElementById('billpayError');
        const payeeName = document.getElementById('payeeName');

        const successOk = result !== null &&
                          getComputedStyle(result).display !== 'none' &&
                          (payeeName?.textContent?.trim().length ?? 0) > 0;

        const errorOk = error !== null &&
                        getComputedStyle(error).display !== 'none';

        // Página JSP de error: no existen los divs de bill pay
        const isJspError = result === null && error === null;

        return successOk || errorOk || isJspError;
      },
      { timeout }
    );

    const resultDisplay = await this.page
      .$eval('#billpayResult', el => getComputedStyle(el).display)
      .catch(() => 'none');

    return resultDisplay !== 'none' ? 'success' : 'error';
  }

  /**
   * Completa y envía el formulario de pago de factura.
   * Retorna BillPayResult con los datos confirmados por el sistema.
   */
  async payBill(data: BillPayData): Promise<BillPayResult> {
    await this.navigate();

    await this.fillField(this.payeeNameInput,     data.payee.name,          'Payee Name');
    await this.fillField(this.payeeStreetInput,   data.payee.street,        'Street');
    await this.fillField(this.payeeCityInput,     data.payee.city,          'City');
    await this.fillField(this.payeeStateInput,    data.payee.state,         'State');
    await this.fillField(this.payeeZipCodeInput,  data.payee.zipCode,       'Zip Code');
    await this.fillField(this.payeePhoneInput,    data.payee.phone,         'Phone');
    await this.fillField(this.payeeAccountInput,  data.payee.accountNumber, 'Account Number');
    await this.fillField(this.verifyAccountInput, data.payee.accountNumber, 'Verify Account');
    await this.fillField(this.amountInput,        String(data.amount),      'Amount');

    await this.fromAccountSelect.selectOption(data.fromAccountId);

    // Disparamos el click vía jQuery para garantizar que el handler se ejecuta
    // clickElement() nativo de Playwright a veces no dispara handlers jQuery
    await this.page.evaluate(() => {
      (window as any).$("input[value='Send Payment']").trigger('click');
    });

    const result = await this.waitForPaymentResult();

    if (result === 'error') {
      const errorText = await this.errorPanel.textContent().catch(() => 'unknown error');
      throw new Error(
        `[Bill Pay] Pago rechazado para beneficiario "${data.payee.name}". ` +
        `Monto: $${data.amount}. Cuenta origen: ${data.fromAccountId}. ` +
        `Mensaje del sistema: ${errorText?.trim()}`
      );
    }

    const confirmedPayee  = await this.payeeNameConfirmation
      .textContent().catch(() => data.payee.name);
    const confirmedAmount = await this.amountConfirmation
      .textContent().catch(() => String(data.amount));
    const confirmedFrom   = await this.fromAccountConfirmation
      .textContent().catch(() => data.fromAccountId);

    return {
      payeeName:     (confirmedPayee  ?? data.payee.name).trim(),
      amount:        parseFloat((confirmedAmount ?? '0').replace(/[$,]/g, '')),
      fromAccountId: (confirmedFrom   ?? data.fromAccountId).trim(),
    };
  }

  /**
   * Envía el formulario con números de cuenta del beneficiario que no coinciden.
   * La validación de mismatch ocurre client-side (jQuery) — muestra span de error
   * inline y NO hace el POST al servidor.
   */
  async payBillWithMismatchedAccounts(
    data: BillPayData,
    differentVerifyAccount: string
  ): Promise<void> {
    await this.navigate();

    await this.fillField(this.payeeNameInput,     data.payee.name,           'Payee Name');
    await this.fillField(this.payeeStreetInput,   data.payee.street,         'Street');
    await this.fillField(this.payeeCityInput,     data.payee.city,           'City');
    await this.fillField(this.payeeStateInput,    data.payee.state,          'State');
    await this.fillField(this.payeeZipCodeInput,  data.payee.zipCode,        'Zip Code');
    await this.fillField(this.payeePhoneInput,    data.payee.phone,          'Phone');
    await this.fillField(this.payeeAccountInput,  data.payee.accountNumber,  'Account Number');
    await this.fillField(this.verifyAccountInput, differentVerifyAccount,    'Verify Account');
    await this.fillField(this.amountInput,        String(data.amount),       'Amount');

    await this.fromAccountSelect.selectOption(data.fromAccountId);

    await this.page.evaluate(() => {
      (window as any).$("input[value='Send Payment']").trigger('click');
    });

    // Validación client-side es síncrona — damos un tick para que jQuery procese
    await this.page.waitForTimeout(500);
  }

  /**
   * Verifica si hay errores visibles tras el submit.
   *
   * Cubre dos casos:
   * 1. Error de servidor: #billpayError visible via getComputedStyle
   * 2. Errores client-side: spans con id="validationModel-*" con style.display != 'none'
   *    (estos SÍ usan style inline porque jQuery los muestra con .show() explícito
   *    en el código de validación)
   */
  async hasError(): Promise<boolean> {
    // Caso 1: error de servidor
    const serverError = await this.page
      .$eval('#billpayError', el => getComputedStyle(el).display)
      .catch(() => 'none');
    if (serverError !== 'none') return true;

    // Caso 2: errores de validación client-side
    const clientErrorCount = await this.page
      .locator('[id^="validationModel"]')
      .evaluateAll(els =>
        els.filter(el =>
          (el as HTMLElement).style.display !== 'none' &&
          (el as HTMLElement).style.display !== ''
        ).length
      )
      .catch(() => 0);

    return clientErrorCount > 0;
  }

  /**
   * Lee el texto del error de servidor actual (si existe).
   */
  async getErrorText(): Promise<string> {
    return this.getTextContent(this.errorPanel, 'Error message');
  }

  /**
   * Lee el título del panel de resultado actual.
   * Usa getComputedStyle para detectar visibilidad correctamente.
   */
  async getResultTitle(): Promise<string> {
    const resultDisplay = await this.page
      .$eval('#billpayResult', el => getComputedStyle(el).display)
      .catch(() => 'none');
    if (resultDisplay !== 'none') return 'Bill Payment Complete';

    const errorDisplay = await this.page
      .$eval('#billpayError', el => getComputedStyle(el).display)
      .catch(() => 'none');
    if (errorDisplay !== 'none') return 'Error!';

    return '';
  }
}