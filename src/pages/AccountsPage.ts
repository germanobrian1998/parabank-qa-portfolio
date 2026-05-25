import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

// Parabank soporta exactamente estos dos tipos de cuenta.
// Los valores del select corresponden a los enteros que la API espera:
// 0 = CHECKING, 1 = SAVINGS
export type AccountType = "CHECKING" | "SAVINGS";

export interface OpenAccountResult {
  // El ID de cuenta nueva que Parabank asigna y muestra tras abrir la cuenta.
  // Lo necesitamos para verificar saldo, hacer transferencias, etc.
  newAccountId: string;
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  // Tipo de cuenta tal como lo muestra la UI en overview
  type: string;
}

/**
 * AccountsPage — cubre dos flujos de negocio diferenciados:
 *   1. Apertura de cuenta nueva (openaccount.htm)
 *   2. Consulta de saldo en el overview (overview.htm)
 *
 * Decisión de diseño: ambos flujos viven en un solo Page Object porque
 * comparten la responsabilidad de "gestión de cuentas". Separarlos
 * en OpenAccountPage + OverviewPage sería over-engineering para
 * la complejidad actual del sistema.
 *
 * Selectores confirmados del código fuente JSP de parasoft/parabank:
 * - openaccount.htm usa <select id="type"> para tipo de cuenta
 * - openaccount.htm usa <select id="fromAccountId"> para cuenta origen
 * - La confirmación muestra el nuevo ID en <a id="newAccountId">
 * - overview.htm usa <table id="accountTable"> para el listado
 */
export class AccountsPage extends BasePage {
  // ── Locators: Open Account form ──────────────────────────────────────

  private get accountTypeSelect(): Locator {
    return this.page.locator("select#type");
  }

  private get fromAccountSelect(): Locator {
    return this.page.locator("select#fromAccountId");
  }

  private get openAccountButton(): Locator {
    return this.page.locator("input[value='Open New Account']");
  }

  // El nuevo ID de cuenta aparece como link en el panel de confirmación
  private get newAccountIdLink(): Locator {
    return this.page.locator("a#newAccountId");
  }

  private get openAccountConfirmation(): Locator {
    return this.page.getByText("Account Opened!");
  }

  // ── Locators: Account Overview table ─────────────────────────────────

  private get accountTable(): Locator {
    return this.page.locator("table#accountTable");
  }

  // ── Actions ──────────────────────────────────────────────────────────

  async navigateToOpenAccount(): Promise<void> {
    await this.page.goto("/parabank/openaccount.htm");
    // Esperamos que los selects carguen dinámicamente (AJAX)
    await this.fromAccountSelect.waitFor({ state: "visible", timeout: 10_000 });
  }

  async navigateToOverview(): Promise<void> {
    await this.page.goto("/parabank/overview.htm");
    await this.accountTable.waitFor({ state: "visible", timeout: 10_000 });
  }

  /**
   * Abre una cuenta nueva del tipo especificado.
   *
   * Por qué esperamos el link #newAccountId con timeout extendido:
   * Parabank realiza la creación de cuenta vía AJAX. El panel de
   * confirmación puede tardar hasta 5s en aparecer dependiendo del
   * estado del servidor demo. Usamos 20s como techo razonable.
   */
  async openNewAccount(type: AccountType): Promise<OpenAccountResult> {
    await this.navigateToOpenAccount();

    // Seleccionar tipo: CHECKING = '0', SAVINGS = '1'
    const typeValue = type === "CHECKING" ? "0" : "1";
    await this.accountTypeSelect.selectOption(typeValue);

    // La cuenta origen se auto-selecciona con la primera cuenta disponible.
    // No la cambiamos: el test no necesita controlar de dónde sale el fondeo,
    // solo verificar que la nueva cuenta se crea correctamente.
    await this.clickElement(this.openAccountButton, `Open ${type} account`);

    // Esperamos confirmación AJAX
    await this.openAccountConfirmation.waitFor({
      state: "visible",
      timeout: 20_000,
    });

    // Extraemos el ID de la cuenta nueva del link de confirmación
    const newAccountId = await this.getTextContent(
      this.newAccountIdLink,
      "New account ID",
    );

    if (!newAccountId || newAccountId.trim() === "") {
      throw new Error(
        `[Open Account] Cuenta ${type} aparentemente creada pero ` +
          `el sistema no devolvió un ID de cuenta válido. ` +
          `Posible falla en el proceso de creación o en la respuesta AJAX.`,
      );
    }

    return { newAccountId: newAccountId.trim() };
  }

  /**
   * Obtiene el saldo de una cuenta específica desde el overview.
   *
   * Por qué parseamos el texto a number:
   * Los tests de integridad financiera necesitan comparar valores numéricos
   * (ej: verificar que tras abrir una cuenta el saldo inicial es $0.00).
   * Comparar strings como "$0.00" vs "0" es frágil.
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    await this.navigateToOverview();

    // Cada fila de la tabla tiene un link con el accountId como texto
    const accountRow = this.page
      .locator("table#accountTable tbody tr")
      .filter({ has: this.page.locator(`a[href*="${accountId}"]`) });

    await accountRow.waitFor({ state: "visible", timeout: 10_000 });

    const cells = accountRow.locator("td");
    const accountIdText = await this.getTextContent(cells.nth(0), "Account ID");
    const typeText = await this.getTextContent(cells.nth(1), "Account type");
    const balanceText = await this.getTextContent(
      cells.nth(2),
      "Account balance",
    );

    // Convertir "$1,234.56" → 1234.56
    const balance = parseFloat(balanceText.replace(/[$,]/g, "").trim());

    if (isNaN(balance)) {
      throw new Error(
        `[Account Balance] El saldo de la cuenta ${accountId} no es un número válido. ` +
          `Texto recibido: "${balanceText}". ` +
          `El sistema puede estar mostrando un estado de error en lugar del saldo.`,
      );
    }

    return {
      accountId: accountIdText.trim(),
      balance,
      type: typeText.trim(),
    };
  }

  /**
   * Retorna todas las cuentas visibles en el overview.
   * Útil para verificar que una cuenta nueva aparece en el listado
   * sin saber su ID de antemano.
   */
  async getAllAccounts(): Promise<AccountBalance[]> {
    await this.navigateToOverview();

    const rows = this.page.locator("table#accountTable tbody tr");
    const count = await rows.count();

    const accounts: AccountBalance[] = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator("td");
      const accountIdText = await this.getTextContent(
        cells.nth(0),
        `Account ID [${i}]`,
      );
      const typeText = await this.getTextContent(
        cells.nth(1),
        `Account type [${i}]`,
      );
      const balanceText = await this.getTextContent(
        cells.nth(2),
        `Balance [${i}]`,
      );

      const balance = parseFloat(balanceText.replace(/[$,]/g, "").trim());

      // Saltear filas que no son cuentas reales (ej: fila de totales)
      if (isNaN(balance)) continue;

      accounts.push({
        accountId: accountIdText.trim(),
        type: typeText.trim(),
        balance,
      });
    }

    return accounts;
  }

  /**
   * Navega al detalle de una cuenta específica.
   * Útil para verificar transacciones asociadas a esa cuenta.
   */
  async navigateToAccountDetail(accountId: string): Promise<void> {
    await this.navigateToOverview();

    const accountLink = this.page.locator(
      `a[href*="activity.htm?id=${accountId}"]`,
    );
    await this.clickElement(
      accountLink,
      `Navigate to account ${accountId} detail`,
    );
    await this.waitForUrl(/activity\.htm/, `Account ${accountId} detail page`);
  }
}
