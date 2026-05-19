# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Logout — session termination >> should not show logout link on public pages
- Location: tests/e2e/auth.spec.ts:273:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('#rightPanel .smallText, #rightPanel .error') to be visible
    33 × locator resolved to hidden <p class="error">↵⇆⇆⇆An internal error has occurred and has been l…</p>

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
        - heading "Accounts Overview" [level=1] [ref=e51]
        - table [ref=e52]:
          - rowgroup [ref=e53]:
            - row "Account Balance* Available Amount" [ref=e54]:
              - columnheader "Account" [ref=e55]
              - columnheader "Balance*" [ref=e56]
              - columnheader "Available Amount" [ref=e57]
          - rowgroup [ref=e58]:
            - row "12345 $997699.00 $997699.00" [ref=e59]:
              - cell "12345" [ref=e60]:
                - link "12345" [ref=e61] [cursor=pointer]:
                  - /url: activity.htm?id=12345
              - cell "$997699.00" [ref=e62]
              - cell "$997699.00" [ref=e63]
            - row "12456 $10.45 $10.45" [ref=e64]:
              - cell "12456" [ref=e65]:
                - link "12456" [ref=e66] [cursor=pointer]:
                  - /url: activity.htm?id=12456
              - cell "$10.45" [ref=e67]
              - cell "$10.45" [ref=e68]
            - row "12567 $100.00 $100.00" [ref=e69]:
              - cell "12567" [ref=e70]:
                - link "12567" [ref=e71] [cursor=pointer]:
                  - /url: activity.htm?id=12567
              - cell "$100.00" [ref=e72]
              - cell "$100.00" [ref=e73]
            - row "12678 -$100.00 $0.00" [ref=e74]:
              - cell "12678" [ref=e75]:
                - link "12678" [ref=e76] [cursor=pointer]:
                  - /url: activity.htm?id=12678
              - cell "-$100.00" [ref=e77]
              - cell "$0.00" [ref=e78]
            - row "12789 $100.00 $100.00" [ref=e79]:
              - cell "12789" [ref=e80]:
                - link "12789" [ref=e81] [cursor=pointer]:
                  - /url: activity.htm?id=12789
              - cell "$100.00" [ref=e82]
              - cell "$100.00" [ref=e83]
            - row "12900 $0.00 $0.00" [ref=e84]:
              - cell "12900" [ref=e85]:
                - link "12900" [ref=e86] [cursor=pointer]:
                  - /url: activity.htm?id=12900
              - cell "$0.00" [ref=e87]
              - cell "$0.00" [ref=e88]
            - row "13011 $100.00 $100.00" [ref=e89]:
              - cell "13011" [ref=e90]:
                - link "13011" [ref=e91] [cursor=pointer]:
                  - /url: activity.htm?id=13011
              - cell "$100.00" [ref=e92]
              - cell "$100.00" [ref=e93]
            - row "13122 -$3999146.00 $0.00" [ref=e94]:
              - cell "13122" [ref=e95]:
                - link "13122" [ref=e96] [cursor=pointer]:
                  - /url: activity.htm?id=13122
              - cell "-$3999146.00" [ref=e97]
              - cell "$0.00" [ref=e98]
            - row "13233 $100.00 $100.00" [ref=e99]:
              - cell "13233" [ref=e100]:
                - link "13233" [ref=e101] [cursor=pointer]:
                  - /url: activity.htm?id=13233
              - cell "$100.00" [ref=e102]
              - cell "$100.00" [ref=e103]
            - row "13344 $3001478.10 $3001478.10" [ref=e104]:
              - cell "13344" [ref=e105]:
                - link "13344" [ref=e106] [cursor=pointer]:
                  - /url: activity.htm?id=13344
              - cell "$3001478.10" [ref=e107]
              - cell "$3001478.10" [ref=e108]
            - row "54321 $1351.12 $1351.12" [ref=e109]:
              - cell "54321" [ref=e110]:
                - link "54321" [ref=e111] [cursor=pointer]:
                  - /url: activity.htm?id=54321
              - cell "$1351.12" [ref=e112]
              - cell "$1351.12" [ref=e113]
            - row "Total $1692.67" [ref=e114]:
              - cell "Total" [ref=e115]
              - cell "$1692.67" [ref=e116]
              - cell [ref=e117]
          - rowgroup [ref=e118]:
            - row "*Balance includes deposits that may be subject to holds" [ref=e119]:
              - cell "*Balance includes deposits that may be subject to holds" [ref=e120]
  - generic [ref=e122]:
    - list [ref=e123]:
      - listitem [ref=e124]:
        - link "Home" [ref=e125] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e126]:
        - link "About Us" [ref=e127] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e128]:
        - link "Services" [ref=e129] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e130]:
        - link "Products" [ref=e131] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e132]:
        - link "Locations" [ref=e133] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e134]:
        - link "Forum" [ref=e135] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e136]:
        - link "Site Map" [ref=e137] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e138]:
        - link "Contact Us" [ref=e139] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e140]: © Parasoft. All rights reserved.
    - list [ref=e141]:
      - listitem [ref=e142]: "Visit us at:"
      - listitem [ref=e143]:
        - link "www.parasoft.com" [ref=e144] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
  1   | import { type Page, type Locator } from '@playwright/test';
  2   | import { BasePage } from './BasePage';
  3   | 
  4   | export interface LoginCredentials {
  5   |   username: string;
  6   |   password: string;
  7   | }
  8   | 
  9   | export interface LoginResult {
  10  |   // Parabank redirige a overview.htm y muestra el nombre del cliente.
  11  |   // Capturamos estos datos para que las assertions de los tests
  12  |   // puedan verificar identidad sin hacer un segundo request.
  13  |   customerName: string;
  14  |   isAuthenticated: boolean;
  15  | }
  16  | 
  17  | /**
  18  |  * AuthPage — cubre login y logout.
  19  |  *
  20  |  * Decisión de naming: "AuthPage" en lugar de "LoginPage" porque
  21  |  * agrupa AMBAS acciones del ciclo de autenticación. Un Page Object
  22  |  * por responsabilidad de negocio, no por URL.
  23  |  *
  24  |  * Selectores: el formulario de login está en el panel izquierdo (#leftPanel).
  25  |  * Usamos input[name] en lugar de IDs porque Parabank no asigna IDs
  26  |  * consistentes al form de login (a diferencia del form de registro).
  27  |  */
  28  | export class AuthPage extends BasePage {
  29  |   // — Locators: Login form —
  30  |   private get usernameInput(): Locator {
  31  |     // El form de login vive en el panel izquierdo
  32  |     return this.page.locator("input[name='username']");
  33  |   }
  34  |   private get passwordInput(): Locator {
  35  |     return this.page.locator("input[name='password']");
  36  |   }
  37  |   private get loginButton(): Locator {
  38  |     return this.page.locator("input[value='Log In']");
  39  |   }
  40  | 
  41  |   // — Locators: Estado autenticado —
  42  |   private get customerNameHeading(): Locator {
  43  |     // Parabank muestra "Welcome {Name}" en el panel derecho tras login exitoso
  44  |     return this.page.locator('#rightPanel .smallText b');
  45  |   }
  46  |   private get logoutLink(): Locator {
  47  |     return this.page.locator("a[href*='logout']");
  48  |   }
  49  |   private get loginErrorMessage(): Locator {
  50  |     return this.page.locator('#rightPanel .error p');
  51  |   }
  52  | 
  53  |   // — Actions —
  54  | 
  55  |   async navigate(): Promise<void> {
  56  |     await this.page.goto('/parabank/index.htm');
  57  |   }
  58  | 
  59  |   /**
  60  |    * Realiza login y retorna información del estado autenticado.
  61  |    *
  62  |    * Por qué no retornamos solo boolean: el test necesita saber
  63  |    * con qué identidad está autenticado, especialmente si usa
  64  |    * usuarios generados dinámicamente. Retornar el nombre del cliente
  65  |    * permite assertions más específicas.
  66  |    */
  67  |   async login(credentials: LoginCredentials): Promise<LoginResult> {
  68  |     await this.navigate();
  69  | 
  70  |     await this.fillField(this.usernameInput, credentials.username, 'Username');
  71  |     await this.fillField(this.passwordInput, credentials.password, 'Password');
  72  |     await this.clickElement(this.loginButton, 'Login');
  73  | 
  74  |     // Esperamos redirección a overview o mensaje de error
> 75  |     await this.page.waitForSelector(
      |                     ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  76  |       '#rightPanel .smallText, #rightPanel .error',
  77  |       { timeout: 15_000 }
  78  |     );
  79  | 
  80  |     // Si hay error de login, lo surfaceamos con contexto de negocio
  81  |     const loginError = await this.loginErrorMessage.isVisible().catch(() => false);
  82  |     if (loginError) {
  83  |       const errorText = await this.getTextContent(
  84  |         this.loginErrorMessage,
  85  |         'Login error message'
  86  |       );
  87  |       throw new Error(
  88  |         `[Login] Autenticación fallida para usuario "${credentials.username}". ` +
  89  |         `Mensaje del sistema: ${errorText}. ` +
  90  |         `Verificar que el usuario exista y las credenciales sean correctas.`
  91  |       );
  92  |     }
  93  | 
  94  |     await this.waitForUrl(/overview\.htm/, 'Post-login redirect to account overview');
  95  | 
  96  |     const customerName = await this.getTextContent(
  97  |       this.customerNameHeading,
  98  |       'Customer name after login'
  99  |     );
  100 | 
  101 |     return {
  102 |       customerName: customerName.trim(),
  103 |       isAuthenticated: true,
  104 |     };
  105 |   }
  106 | 
  107 |   /**
  108 |    * Realiza logout y verifica retorno a la página principal.
  109 |    *
  110 |    * Por qué verificamos la URL post-logout: un logout silencioso que
  111 |    * no invalida la sesión es un bug de seguridad (H-009 del discovery).
  112 |    * La verificación de URL es la mínima evidencia de que la sesión terminó.
  113 |    */
  114 |   async logout(): Promise<void> {
  115 |     await this.clickElement(this.logoutLink, 'Logout');
  116 |     await this.waitForUrl(
  117 |       /index\.htm|login\.htm/,
  118 |       'Post-logout redirect to public page'
  119 |     );
  120 |   }
  121 | 
  122 |   /**
  123 |    * Verifica si hay una sesión activa sin realizar ninguna acción.
  124 |    * Útil para tests que verifican persistencia o invalidación de sesión.
  125 |    */
  126 |   async isLoggedIn(): Promise<boolean> {
  127 |     return this.logoutLink.isVisible().catch(() => false);
  128 |   }
  129 | }
```