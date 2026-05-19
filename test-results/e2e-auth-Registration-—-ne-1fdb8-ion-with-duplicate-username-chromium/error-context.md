# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Registration — new customer onboarding >> should reject registration with duplicate username
- Location: tests/e2e/auth.spec.ts:79:7

# Error details

```
Error: expect(received).rejects.toThrow()

Received promise resolved instead of rejected
Resolved to value: undefined
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - heading "Customer Login" [level=2] [ref=e29]
        - generic [ref=e30]:
          - generic [ref=e31]:
            - paragraph [ref=e32]: Username
            - textbox [active] [ref=e34]
            - paragraph [ref=e35]: Password
            - textbox [ref=e37]
            - button "Log In" [ref=e39] [cursor=pointer]
          - paragraph [ref=e40]:
            - link "Forgot login info?" [ref=e41] [cursor=pointer]:
              - /url: lookup.htm
          - paragraph [ref=e42]:
            - link "Register" [ref=e43] [cursor=pointer]:
              - /url: register.htm
      - generic [ref=e44]:
        - heading "Signing up is easy!" [level=1] [ref=e45]
        - paragraph [ref=e46]: If you have an account with us you can sign-up for free instant online access. You will have to provide some personal information.
        - table [ref=e48]:
          - rowgroup [ref=e49]:
            - 'row "First Name: Lily" [ref=e50]':
              - cell "First Name:" [ref=e51]
              - cell "Lily" [ref=e52]:
                - textbox [ref=e53]: Lily
              - cell [ref=e54]
            - 'row "Last Name: Emard" [ref=e55]':
              - cell "Last Name:" [ref=e56]
              - cell "Emard" [ref=e57]:
                - textbox [ref=e58]: Emard
              - cell [ref=e59]
            - 'row "Address: 67644 Johanna Gateway" [ref=e60]':
              - cell "Address:" [ref=e61]
              - cell "67644 Johanna Gateway" [ref=e62]:
                - textbox [ref=e63]: 67644 Johanna Gateway
              - cell [ref=e64]
            - 'row "City: Kreigerberg" [ref=e65]':
              - cell "City:" [ref=e66]
              - cell "Kreigerberg" [ref=e67]:
                - textbox [ref=e68]: Kreigerberg
              - cell [ref=e69]
            - 'row "State: HI" [ref=e70]':
              - cell "State:" [ref=e71]
              - cell "HI" [ref=e72]:
                - textbox [ref=e73]: HI
              - cell [ref=e74]
            - 'row "Zip Code: 39424" [ref=e75]':
              - cell "Zip Code:" [ref=e76]
              - cell "39424" [ref=e77]:
                - textbox [ref=e78]: "39424"
              - cell [ref=e79]
            - 'row "Phone #: 442-279-2621" [ref=e80]':
              - 'cell "Phone #:" [ref=e81]'
              - cell "442-279-2621" [ref=e82]:
                - textbox [ref=e83]: 442-279-2621
              - cell [ref=e84]
            - 'row "SSN: 902326274" [ref=e85]':
              - cell "SSN:" [ref=e86]
              - cell "902326274" [ref=e87]:
                - textbox [ref=e88]: "902326274"
              - cell [ref=e89]
            - row [ref=e90]:
              - cell [ref=e91]
            - 'row "Username: dup_user_1779231168605 This username already exists." [ref=e92]':
              - cell "Username:" [ref=e93]
              - cell "dup_user_1779231168605" [ref=e94]:
                - textbox [ref=e95]: dup_user_1779231168605
              - cell "This username already exists." [ref=e96]
            - row "Password:" [ref=e97]:
              - cell "Password:" [ref=e98]
              - cell [ref=e99]:
                - textbox [ref=e100]
              - cell [ref=e101]
            - row "Confirm:" [ref=e102]:
              - cell "Confirm:" [ref=e103]
              - cell [ref=e104]:
                - textbox [ref=e105]
              - cell [ref=e106]
            - row "Register" [ref=e107]:
              - cell [ref=e108]
              - cell "Register" [ref=e109]:
                - button "Register" [ref=e110] [cursor=pointer]
  - generic [ref=e112]:
    - list [ref=e113]:
      - listitem [ref=e114]:
        - link "Home" [ref=e115] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e116]:
        - link "About Us" [ref=e117] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e118]:
        - link "Services" [ref=e119] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e120]:
        - link "Products" [ref=e121] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e122]:
        - link "Locations" [ref=e123] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e124]:
        - link "Forum" [ref=e125] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e126]:
        - link "Site Map" [ref=e127] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e128]:
        - link "Contact Us" [ref=e129] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e130]: © Parasoft. All rights reserved.
    - list [ref=e131]:
      - listitem [ref=e132]: "Visit us at:"
      - listitem [ref=e133]:
        - link "www.parasoft.com" [ref=e134] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { RegisterPage } from '../../src/pages/RegisterPage';
  3   | import { AuthPage } from '../../src/pages/AuthPage';
  4   | import { UserFactory } from '../../src/factories/UserFactory';
  5   | 
  6   | /**
  7   |  * Suite: Authentication — registro, login y logout
  8   |  *
  9   |  * Cobertura de negocio:
  10  |  * - Un cliente nuevo puede crear una cuenta y acceder al sistema
  11  |  * - Un cliente existente puede autenticarse y cerrar sesión de forma segura
  12  |  * - El sistema rechaza credenciales inválidas con mensaje claro
  13  |  * - El sistema rechaza usernames duplicados en el registro
  14  |  *
  15  |  * Prerequisito: Parabank corriendo en http://localhost:9090
  16  |  * Credenciales demo para tests de login directo: john / demo
  17  |  */
  18  | 
  19  | test.describe('Registration — new customer onboarding', () => {
  20  | 
  21  |   test(
  22  |     'should register a new customer and redirect to welcome page @smoke',
  23  |     async ({ page }) => {
  24  |       // WHY THIS TEST MATTERS:
  25  |       // Registration is the entry point for all new customers.
  26  |       // A silent failure here means zero revenue from new signups.
  27  |       // We verify the full happy path: form submission → welcome confirmation.
  28  | 
  29  |       const registerPage = new RegisterPage(page);
  30  |       const newCustomer = UserFactory.create();
  31  | 
  32  |       await registerPage.navigate();
  33  |       const result = await registerPage.register(newCustomer);
  34  | 
  35  |       expect(
  36  |         result.welcomeMessage,
  37  |         'Welcome message not shown after registration — ' +
  38  |         'customer has no confirmation that their account was created'
  39  |       ).toContain('Welcome');
  40  | 
  41  |       expect(
  42  |         result.username,
  43  |         'Username in result does not match submitted username — ' +
  44  |         'possible data corruption during registration'
  45  |       ).toBe(newCustomer.username);
  46  |     }
  47  |   );
  48  | 
  49  |   test(
  50  |     'should allow login with newly registered credentials',
  51  |     async ({ page }) => {
  52  |       // WHY THIS TEST MATTERS:
  53  |       // Registration and login are different flows but must be consistent.
  54  |       // A customer who registers successfully must be able to log in immediately.
  55  |       // This test catches desync between registration persistence and auth lookup.
  56  | 
  57  |       const registerPage = new RegisterPage(page);
  58  |       const authPage = new AuthPage(page);
  59  |       const newCustomer = UserFactory.create();
  60  | 
  61  |       // Setup: registrar el usuario
  62  |       await registerPage.navigate();
  63  |       await registerPage.register(newCustomer);
  64  | 
  65  |       // Action: login con las mismas credenciales
  66  |       const loginResult = await authPage.login({
  67  |         username: newCustomer.username,
  68  |         password: newCustomer.password,
  69  |       });
  70  | 
  71  |       expect(
  72  |         loginResult.isAuthenticated,
  73  |         `Newly registered user "${newCustomer.username}" could not log in — ` +
  74  |         'registration may not have persisted credentials correctly'
  75  |       ).toBe(true);
  76  |     }
  77  |   );
  78  | 
  79  |   test(
  80  |     'should reject registration with duplicate username',
  81  |     async ({ page }) => {
  82  |       // WHY THIS TEST MATTERS:
  83  |       // Duplicate usernames would allow account takeover scenarios.
  84  |       // A bank system must enforce unique identifiers at registration time.
  85  | 
  86  |       const registerPage = new RegisterPage(page);
  87  |       const sharedUsername = `dup_user_${Date.now()}`;
  88  | 
  89  |       // Primer registro: debe tener éxito
  90  |       await registerPage.navigate();
  91  |       await registerPage.register(UserFactory.withUsername(sharedUsername));
  92  | 
  93  |       // Segundo registro con el mismo username: debe ser rechazado
  94  |       await registerPage.navigate();
  95  | 
  96  |       await expect(async () => {
  97  |         await registerPage.register(UserFactory.withUsername(sharedUsername));
> 98  |       }).rejects.toThrow(
      |                  ^ Error: expect(received).rejects.toThrow()
  99  |         /Registro rechazado/
  100 |         // Si no lanza, el sistema aceptó un username duplicado — bug de seguridad
  101 |       );
  102 |     }
  103 |   );
  104 | 
  105 |   test(
  106 |     'should show validation error when required fields are empty',
  107 |     async ({ page }) => {
  108 |       // WHY THIS TEST MATTERS:
  109 |       // Empty field submission tests client-side AND server-side validation.
  110 |       // If only client-side validation exists, API calls bypass it entirely.
  111 |       // Parabank is known to have gaps between client and server validation.
  112 | 
  113 |       const registerPage = new RegisterPage(page);
  114 |       await registerPage.navigate();
  115 | 
  116 |       // Intentamos registrar sin datos — solo enviamos el form vacío
  117 |       await expect(async () => {
  118 |         await registerPage.register(
  119 |           UserFactory.create({
  120 |             firstName: '',
  121 |             lastName: '',
  122 |             username: '',
  123 |             password: '',
  124 |           })
  125 |         );
  126 |       }).rejects.toThrow(
  127 |         /Registro rechazado/
  128 |       );
  129 |     }
  130 |   );
  131 | });
  132 | 
  133 | 
  134 | test.describe('Login — customer authentication', () => {
  135 | 
  136 |   test(
  137 |     'should authenticate with valid credentials and show account overview @smoke',
  138 |     async ({ page }) => {
  139 |       // WHY THIS TEST MATTERS:
  140 |       // Login is the gateway to every financial operation.
  141 |       // Failure here means zero operations can be performed.
  142 |       // We use the demo account (john/demo) as stable fixture
  143 |       // to avoid dependency on dynamic registration in smoke tests.
  144 | 
  145 |       const authPage = new AuthPage(page);
  146 | 
  147 |       const result = await authPage.login({
  148 |         username: 'john',
  149 |         password: 'demo',
  150 |       });
  151 | 
  152 |       expect(
  153 |         result.isAuthenticated,
  154 |         'Demo user "john" could not authenticate — ' +
  155 |         'system may be down or demo credentials changed'
  156 |       ).toBe(true);
  157 | 
  158 |       expect(
  159 |         page.url(),
  160 |         'After login, user was not redirected to account overview — ' +
  161 |         'authenticated session may not have been established'
  162 |       ).toContain('overview.htm');
  163 |     }
  164 |   );
  165 | 
  166 |   test(
  167 |     'should reject login with incorrect password',
  168 |     async ({ page }) => {
  169 |       // WHY THIS TEST MATTERS:
  170 |       // Authentication must reject wrong passwords to prevent unauthorized access.
  171 |       // A banking app that accepts any password is a critical security failure.
  172 | 
  173 |       const authPage = new AuthPage(page);
  174 | 
  175 |       await expect(async () => {
  176 |         await authPage.login({
  177 |           username: 'john',
  178 |           password: 'WRONG_PASSWORD_123',
  179 |         });
  180 |       }).rejects.toThrow(
  181 |         /Autenticación fallida/
  182 |       );
  183 |     }
  184 |   );
  185 | 
  186 |   test(
  187 |     'should reject login with non-existent username',
  188 |     async ({ page }) => {
  189 |       // WHY THIS TEST MATTERS:
  190 |       // The system must not leak information about which usernames exist.
  191 |       // Ideally the error message is generic — same for wrong user and wrong password.
  192 |       // This test verifies rejection; error message consistency is a separate concern.
  193 | 
  194 |       const authPage = new AuthPage(page);
  195 | 
  196 |       await expect(async () => {
  197 |         await authPage.login({
  198 |           username: `ghost_user_${Date.now()}`,
```