# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/loans.spec.ts >> Loan Request >> should approve a loan with valid amount and sufficient down payment @smoke
- Location: tests/e2e/loans.spec.ts:27:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('#rightPanel .error') resolved to 2 elements:
    1) <p class="error">You do not have sufficient funds for the given do…</p> aka getByText('You do not have sufficient')
    2) <p class="error">↵⇆⇆⇆An internal error has occurred and has been l…</p> aka getByText('An internal error has')

Call log:
    - checking visibility of locator('#rightPanel .error')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - link:
        - /url: admin.htm
        - img [ref=e4] [cursor=pointer]
      - link "ParaBank":
        - /url: index.htm
        - img "ParaBank" [ref=e5] [cursor=pointer]
      - paragraph [ref=e6]: Experience the difference
    - generic [ref=e7]:
      - list [ref=e8]:
        - listitem [ref=e9]: Solutions
        - listitem [ref=e10]:
          - link "About Us" [ref=e11] [cursor=pointer]:
            - /url: about.htm
        - listitem [ref=e12]:
          - link "Services" [ref=e13] [cursor=pointer]:
            - /url: services.htm
        - listitem [ref=e14]:
          - link "Products" [ref=e15] [cursor=pointer]:
            - /url: http://www.parasoft.com/jsp/products.jsp
        - listitem [ref=e16]:
          - link "Locations" [ref=e17] [cursor=pointer]:
            - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - listitem [ref=e18]:
          - link "Admin Page" [ref=e19] [cursor=pointer]:
            - /url: admin.htm
      - list [ref=e20]:
        - listitem [ref=e21]:
          - link "home" [ref=e22] [cursor=pointer]:
            - /url: index.htm
        - listitem [ref=e23]:
          - link "about" [ref=e24] [cursor=pointer]:
            - /url: about.htm
        - listitem [ref=e25]:
          - link "contact" [ref=e26] [cursor=pointer]:
            - /url: contact.htm
    - generic [ref=e27]:
      - generic [ref=e28]:
        - paragraph [ref=e29]: Welcome John Smith
        - heading "Account Services" [level=2] [ref=e30]
        - list [ref=e31]:
          - listitem [ref=e32]:
            - link "Open New Account" [ref=e33] [cursor=pointer]:
              - /url: openaccount.htm
          - listitem [ref=e34]:
            - link "Accounts Overview" [ref=e35] [cursor=pointer]:
              - /url: overview.htm
          - listitem [ref=e36]:
            - link "Transfer Funds" [ref=e37] [cursor=pointer]:
              - /url: transfer.htm
          - listitem [ref=e38]:
            - link "Bill Pay" [ref=e39] [cursor=pointer]:
              - /url: billpay.htm
          - listitem [ref=e40]:
            - link "Find Transactions" [ref=e41] [cursor=pointer]:
              - /url: findtrans.htm
          - listitem [ref=e42]:
            - link "Update Contact Info" [ref=e43] [cursor=pointer]:
              - /url: updateprofile.htm
          - listitem [ref=e44]:
            - link "Request Loan" [ref=e45] [cursor=pointer]:
              - /url: requestloan.htm
          - listitem [ref=e46]:
            - link "Log Out" [ref=e47] [cursor=pointer]:
              - /url: logout.htm
      - generic [ref=e50]:
        - heading "Loan Request Processed" [level=1] [ref=e51]
        - table [ref=e52]:
          - rowgroup [ref=e53]:
            - 'row "Loan Provider: Wealth Securities Dynamic Loans (WSDL)" [ref=e54]':
              - cell "Loan Provider:" [ref=e55]
              - cell "Wealth Securities Dynamic Loans (WSDL)" [ref=e56]
            - 'row "Date: 05-26-2026" [ref=e57]':
              - cell "Date:" [ref=e58]
              - cell "05-26-2026" [ref=e59]
            - 'row "Status: Denied" [ref=e60]':
              - cell "Status:" [ref=e61]
              - cell "Denied" [ref=e62]
        - paragraph [ref=e64]: You do not have sufficient funds for the given down payment.
  - generic [ref=e66]:
    - list [ref=e67]:
      - listitem [ref=e68]:
        - link "Home" [ref=e69] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e70]:
        - link "About Us" [ref=e71] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e72]:
        - link "Services" [ref=e73] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e74]:
        - link "Products" [ref=e75] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e76]:
        - link "Locations" [ref=e77] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e78]:
        - link "Forum" [ref=e79] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e80]:
        - link "Site Map" [ref=e81] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e82]:
        - link "Contact Us" [ref=e83] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e84]: © Parasoft. All rights reserved.
    - list [ref=e85]:
      - listitem [ref=e86]: "Visit us at:"
      - listitem [ref=e87]:
        - link "www.parasoft.com" [ref=e88] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
  1   | // src/pages/LoanPage.ts
  2   | import { Page } from '@playwright/test';
  3   | import { BasePage } from './BasePage';
  4   | import { LoanRequest } from '../factories/LoanFactory';
  5   | 
  6   | export interface LoanResult {
  7   |   approved: boolean;
  8   |   newAccountId?: string;
  9   |   message: string;
  10  | }
  11  | 
  12  | export class LoanPage extends BasePage {
  13  |   // ── Formulario ────────────────────────────────────────────────────
  14  |   private readonly loanAmountInput   = this.currentPage.locator('input#amount');
  15  |   private readonly downPaymentInput  = this.currentPage.locator('input#downPayment');
  16  |   private readonly fromAccountSelect = this.currentPage.locator('select#fromAccountId');
  17  |   private readonly applyButton       = this.currentPage.locator('input[value="Apply Now"]');
  18  | 
  19  |   // ── Resultado ─────────────────────────────────────────────────────
  20  |   // El panel de resultado usa el mismo #rightPanel que BillPay
  21  |   private readonly resultTitle   = this.currentPage.locator('#rightPanel h1.title');
  22  |   private readonly approvedPanel = this.currentPage.locator('#loanRequestApproved');
  23  |   private readonly deniedPanel   = this.currentPage.locator('#loanRequestDenied');
  24  |   private readonly newAccountId  = this.currentPage.locator('td#newAccountId');
  25  |   private readonly errorPanel    = this.currentPage.locator('#rightPanel .error');
  26  | 
  27  |   constructor(page: Page) {
  28  |     super(page);
  29  |   }
  30  | 
  31  |   async navigate(): Promise<void> {
  32  |     await this.waitForUrl('requestloan.htm', 'navegación a solicitud de préstamo');
  33  |   }
  34  | 
  35  |   /** Obtiene el primer account ID disponible en el select del formulario */
  36  |   async getFirstAccountId(): Promise<string> {
  37  |     await this.currentPage.waitForSelector('select#fromAccountId option', {
  38  |       state: 'attached',
  39  |     });
  40  |     const value = await this.currentPage
  41  |       .locator('select#fromAccountId option')
  42  |       .first()
  43  |       .getAttribute('value');
  44  |     if (!value) {
  45  |       throw new Error(
  46  |         '[Solicitud de préstamo] No se encontraron cuentas disponibles en el formulario.',
  47  |       );
  48  |     }
  49  |     return value;
  50  |   }
  51  | 
  52  |   /** Obtiene todos los account IDs disponibles en el select */
  53  |   async getAvailableAccountIds(): Promise<string[]> {
  54  |     await this.currentPage.waitForSelector('select#fromAccountId option', {
  55  |       state: 'attached',
  56  |     });
  57  |     return this.currentPage
  58  |       .locator('select#fromAccountId option')
  59  |       .evaluateAll((opts: HTMLOptionElement[]) => opts.map((o) => o.value));
  60  |   }
  61  | 
  62  |   /**
  63  |    * Completa y envía el formulario de solicitud de préstamo.
  64  |    * Espera el resultado (aprobado o rechazado) antes de retornar.
  65  |    *
  66  |    * @param loan       - datos del préstamo (amount + downPayment)
  67  |    * @param fromAccountId - cuenta de donde se debitará el down payment
  68  |    */
  69  |   async requestLoan(loan: LoanRequest, fromAccountId: string): Promise<LoanResult> {
  70  |     await this.fillField(
  71  |       this.loanAmountInput,
  72  |       String(loan.amount),
  73  |       'monto del préstamo',
  74  |     );
  75  |     await this.fillField(
  76  |       this.downPaymentInput,
  77  |       String(loan.downPayment),
  78  |       'pago inicial',
  79  |     );
  80  |     await this.fromAccountSelect.selectOption(fromAccountId);
  81  | 
  82  |     await this.clickElement(this.applyButton, 'envío de solicitud de préstamo');
  83  | 
  84  |     // El servidor procesa el préstamo vía AJAX — puede tardar varios segundos
  85  |     await this.currentPage.waitForSelector(
  86  |       '#loanRequestApproved, #loanRequestDenied, #rightPanel .error',
  87  |       { timeout: 30_000 },
  88  |     );
  89  | 
  90  |     return this.readResult();
  91  |   }
  92  | 
  93  |   /** Lee el estado del panel de resultado y retorna un objeto tipado */
  94  |   async readResult(): Promise<LoanResult> {
  95  |     const isApproved = await this.approvedPanel.isVisible();
  96  |     const isDenied   = await this.deniedPanel.isVisible();
> 97  |     const isError    = await this.errorPanel.isVisible();
      |                                              ^ Error: locator.isVisible: Error: strict mode violation: locator('#rightPanel .error') resolved to 2 elements:
  98  | 
  99  |     if (isApproved) {
  100 |       let accountId: string | undefined;
  101 |       try {
  102 |         accountId = (await this.newAccountId.textContent()) ?? undefined;
  103 |         accountId = accountId?.trim();
  104 |       } catch {
  105 |         // el campo podría no estar presente si el flujo difiere
  106 |       }
  107 |       return {
  108 |         approved: true,
  109 |         newAccountId: accountId,
  110 |         message: await this.getTextContent(this.resultTitle, 'título de resultado'),
  111 |       };
  112 |     }
  113 | 
  114 |     if (isDenied) {
  115 |       const message = await this.getTextContent(
  116 |         this.deniedPanel.locator('p').first(),
  117 |         'mensaje de rechazo',
  118 |       );
  119 |       return { approved: false, message };
  120 |     }
  121 | 
  122 |     if (isError) {
  123 |       const message = await this.getTextContent(this.errorPanel, 'panel de error');
  124 |       return { approved: false, message };
  125 |     }
  126 | 
  127 |     throw new Error(
  128 |       '[Solicitud de préstamo] No se pudo determinar el resultado: ningún panel fue visible tras la solicitud.',
  129 |     );
  130 |   }
  131 | }
```