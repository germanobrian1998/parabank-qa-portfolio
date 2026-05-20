# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Registration — new customer onboarding >> [BUG] should allow login with newly registered credentials
- Location: tests/e2e/auth.spec.ts:48:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[name=\'username\']') to be visible

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
        - paragraph [ref=e29]: Welcome Brendan Stark
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
      - generic [ref=e48]:
        - list [ref=e50]:
          - listitem [ref=e51]: ATM Services
          - listitem [ref=e52]:
            - link "Withdraw Funds" [ref=e53] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e54]:
            - link "Transfer Funds" [ref=e55] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e56]:
            - link "Check Balances" [ref=e57] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e58]:
            - link "Make Deposits" [ref=e59] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
        - list [ref=e60]:
          - listitem [ref=e61]: Online Services
          - listitem [ref=e62]:
            - link "Bill Pay" [ref=e63] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
          - listitem [ref=e64]:
            - link "Account History" [ref=e65] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
          - listitem [ref=e66]:
            - link "Transfer Funds" [ref=e67] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
        - paragraph [ref=e68]:
          - link "Read More" [ref=e69] [cursor=pointer]:
            - /url: services.htm
        - heading "Latest News" [level=4] [ref=e70]
        - list [ref=e71]:
          - listitem [ref=e72]: 05/16/2026
          - listitem [ref=e73]:
            - link "ParaBank Is Now Re-Opened" [ref=e74] [cursor=pointer]:
              - /url: news.htm#6
          - listitem [ref=e75]:
            - link "New! Online Bill Pay" [ref=e76] [cursor=pointer]:
              - /url: news.htm#5
          - listitem [ref=e77]:
            - link "New! Online Account Transfers" [ref=e78] [cursor=pointer]:
              - /url: news.htm#4
        - paragraph [ref=e79]:
          - link "Read More" [ref=e80] [cursor=pointer]:
            - /url: news.htm
  - generic [ref=e82]:
    - list [ref=e83]:
      - listitem [ref=e84]:
        - link "Home" [ref=e85] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e86]:
        - link "About Us" [ref=e87] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e88]:
        - link "Services" [ref=e89] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e90]:
        - link "Products" [ref=e91] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e92]:
        - link "Locations" [ref=e93] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e94]:
        - link "Forum" [ref=e95] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e96]:
        - link "Site Map" [ref=e97] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e98]:
        - link "Contact Us" [ref=e99] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e100]: © Parasoft. All rights reserved.
    - list [ref=e101]:
      - listitem [ref=e102]: "Visit us at:"
      - listitem [ref=e103]:
        - link "www.parasoft.com" [ref=e104] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
  1   | // src/pages/AuthPage.ts
  2   | import { type Page, type Locator } from '@playwright/test';
  3   | import { BasePage } from './BasePage';
  4   | 
  5   | export interface LoginCredentials {
  6   |   username: string;
  7   |   password: string;
  8   | }
  9   | 
  10  | export interface LoginResult {
  11  |   customerName: string;
  12  |   isAuthenticated: boolean;
  13  | }
  14  | 
  15  | /**
  16  |  * AuthPage — cubre login y logout.
  17  |  *
  18  |  * Decisión de naming: "AuthPage" en lugar de "LoginPage" porque
  19  |  * agrupa AMBAS acciones del ciclo de autenticación. Un Page Object
  20  |  * por responsabilidad de negocio, no por URL.
  21  |  */
  22  | export class AuthPage extends BasePage {
  23  |   // — Locators: Login form —
  24  |   private get usernameInput(): Locator {
  25  |     return this.page.locator("input[name='username']");
  26  |   }
  27  |   private get passwordInput(): Locator {
  28  |     return this.page.locator("input[name='password']");
  29  |   }
  30  |   private get loginButton(): Locator {
  31  |     return this.page.locator("input[value='Log In']");
  32  |   }
  33  | 
  34  |   // — Locators: Estado autenticado —
  35  |   private get logoutLink(): Locator {
  36  |     return this.page.locator("a[href*='logout']");
  37  |   }
  38  | 
  39  |   // — Actions —
  40  | 
  41  |   async navigate(): Promise<void> {
  42  |     await this.page.goto('/parabank/index.htm');
  43  |   }
  44  | 
  45  |   /**
  46  |    * Realiza login y retorna información del estado autenticado.
  47  |    *
  48  |    * Por qué usamos waitForSelector antes de fillField:
  49  |    * Después de ciertas navegaciones (ej: post-registro), el formulario
  50  |    * de login puede tardar en renderizarse aunque la URL sea correcta.
  51  |    * El waitForSelector garantiza que el campo esté disponible antes
  52  |    * de intentar interactuar con él.
  53  |    */
  54  |   async login(credentials: LoginCredentials): Promise<LoginResult> {
  55  |     await this.navigate();
  56  | 
  57  |     // Esperamos que el formulario de login esté disponible
> 58  |     await this.page.waitForSelector("input[name='username']", {
      |                     ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  59  |       timeout: 10_000,
  60  |     });
  61  | 
  62  |     await this.fillField(this.usernameInput, credentials.username, 'Username');
  63  |     await this.fillField(this.passwordInput, credentials.password, 'Password');
  64  | 
  65  |     await Promise.all([
  66  |       this.page.waitForURL(/overview\.htm|login\.htm/, { timeout: 15_000 }),
  67  |       this.clickElement(this.loginButton, 'Login'),
  68  |     ]);
  69  | 
  70  |     // Si quedamos en login.htm, las credenciales fueron rechazadas
  71  |     if (this.page.url().includes('login.htm')) {
  72  |       throw new Error(
  73  |         `[Login] Autenticación fallida para usuario "${credentials.username}". ` +
  74  |         `El sistema rechazó las credenciales.`
  75  |       );
  76  |     }
  77  | 
  78  |     const customerName = await this.page
  79  |       .locator('#rightPanel h1.title')
  80  |       .textContent()
  81  |       .catch(() => '');
  82  | 
  83  |     return {
  84  |       customerName: customerName?.trim() ?? '',
  85  |       isAuthenticated: true,
  86  |     };
  87  |   }
  88  | 
  89  |   /**
  90  |    * Realiza logout y verifica retorno a la página principal.
  91  |    */
  92  |   async logout(): Promise<void> {
  93  |     await this.clickElement(this.logoutLink, 'Logout');
  94  |     await this.waitForUrl(
  95  |       /index\.htm|login\.htm/,
  96  |       'Post-logout redirect to public page'
  97  |     );
  98  |   }
  99  | 
  100 |   /**
  101 |    * Verifica si hay una sesión activa sin realizar ninguna acción.
  102 |    */
  103 |   async isLoggedIn(): Promise<boolean> {
  104 |     return this.logoutLink.isVisible().catch(() => false);
  105 |   }
  106 | }
```