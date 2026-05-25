# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Registration — new customer onboarding >> [BUG] should reject registration with duplicate username
- Location: tests/e2e/auth.spec.ts:77:7

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
            - 'row "First Name: Ralph" [ref=e50]':
              - cell "First Name:" [ref=e51]
              - cell "Ralph" [ref=e52]:
                - textbox [ref=e53]: Ralph
              - cell [ref=e54]
            - 'row "Last Name: Kuphal" [ref=e55]':
              - cell "Last Name:" [ref=e56]
              - cell "Kuphal" [ref=e57]:
                - textbox [ref=e58]: Kuphal
              - cell [ref=e59]
            - 'row "Address: 2857 Boehm Run" [ref=e60]':
              - cell "Address:" [ref=e61]
              - cell "2857 Boehm Run" [ref=e62]:
                - textbox [ref=e63]: 2857 Boehm Run
              - cell [ref=e64]
            - 'row "City: Susanstead" [ref=e65]':
              - cell "City:" [ref=e66]
              - cell "Susanstead" [ref=e67]:
                - textbox [ref=e68]: Susanstead
              - cell [ref=e69]
            - 'row "State: ND" [ref=e70]':
              - cell "State:" [ref=e71]
              - cell "ND" [ref=e72]:
                - textbox [ref=e73]: ND
              - cell [ref=e74]
            - 'row "Zip Code: 59170" [ref=e75]':
              - cell "Zip Code:" [ref=e76]
              - cell "59170" [ref=e77]:
                - textbox [ref=e78]: "59170"
              - cell [ref=e79]
            - 'row "Phone #: 1-246-424-3371 x328" [ref=e80]':
              - 'cell "Phone #:" [ref=e81]'
              - cell "1-246-424-3371 x328" [ref=e82]:
                - textbox [ref=e83]: 1-246-424-3371 x328
              - cell [ref=e84]
            - 'row "SSN: 296462020" [ref=e85]':
              - cell "SSN:" [ref=e86]
              - cell "296462020" [ref=e87]:
                - textbox [ref=e88]: "296462020"
              - cell [ref=e89]
            - row [ref=e90]:
              - cell [ref=e91]
            - 'row "Username: dup_user_1779665597319 This username already exists." [ref=e92]':
              - cell "Username:" [ref=e93]
              - cell "dup_user_1779665597319" [ref=e94]:
                - textbox [ref=e95]: dup_user_1779665597319
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
  1   | // tests/e2e/auth.spec.ts
  2   | import { test, expect } from "@playwright/test";
  3   | import { RegisterPage } from "../../src/pages/RegisterPage";
  4   | import { AuthPage } from "../../src/pages/AuthPage";
  5   | import { UserFactory } from "../../src/factories/UserFactory";
  6   | 
  7   | /**
  8   |  * Suite: Authentication — registro, login y logout
  9   |  *
  10  |  * Cobertura de negocio:
  11  |  * - Un cliente nuevo puede crear una cuenta y acceder al sistema
  12  |  * - Un cliente existente puede autenticarse y cerrar sesión de forma segura
  13  |  * - El sistema rechaza credenciales inválidas con mensaje claro
  14  |  * - El sistema rechaza usernames duplicados en el registro
  15  |  *
  16  |  * Prerequisito: Parabank corriendo en http://localhost:9090
  17  |  * Credenciales demo para tests de login directo: john / demo
  18  |  */
  19  | 
  20  | test.describe("Registration — new customer onboarding", () => {
  21  |   test("should register a new customer and redirect to welcome page @smoke", async ({
  22  |     page,
  23  |   }) => {
  24  |     // WHY THIS TEST MATTERS:
  25  |     // Registration is the entry point for all new customers.
  26  |     // A silent failure here means zero revenue from new signups.
  27  |     // We verify the full happy path: form submission → welcome confirmation.
  28  | 
  29  |     const registerPage = new RegisterPage(page);
  30  |     const newCustomer = UserFactory.create();
  31  | 
  32  |     await registerPage.navigate();
  33  |     const result = await registerPage.register(newCustomer);
  34  | 
  35  |     expect(
  36  |       result.welcomeMessage,
  37  |       "Welcome message not shown after registration — " +
  38  |         "customer has no confirmation that their account was created",
  39  |     ).toContain("Welcome");
  40  | 
  41  |     expect(
  42  |       result.username,
  43  |       "Username in result does not match submitted username — " +
  44  |         "possible data corruption during registration",
  45  |     ).toBe(newCustomer.username);
  46  |   });
  47  | 
  48  |   test("[BUG] should allow login with newly registered credentials", async ({
  49  |     page,
  50  |   }) => {
  51  |     // WHY THIS TEST MATTERS:
  52  |     // Registration and login must be consistent — a newly registered
  53  |     // user must be able to log in immediately after registration.
  54  |     // Parabank registers successfully but rejects login with same
  55  |     // credentials — confirmed bug.
  56  | 
  57  |     test.fail(
  58  |       true,
  59  |       "Parabank registers user successfully but rejects immediate login with same credentials",
  60  |     );
  61  | 
  62  |     const registerPage = new RegisterPage(page);
  63  |     const authPage = new AuthPage(page);
  64  |     const newCustomer = UserFactory.create();
  65  | 
  66  |     await registerPage.navigate();
  67  |     await registerPage.register(newCustomer);
  68  | 
  69  |     const loginResult = await authPage.login({
  70  |       username: newCustomer.username,
  71  |       password: newCustomer.password,
  72  |     });
  73  | 
  74  |     expect(loginResult.isAuthenticated).toBe(true);
  75  |   });
  76  | 
  77  |   test("[BUG] should reject registration with duplicate username", async ({
  78  |     page,
  79  |   }) => {
  80  |     // WHY THIS TEST MATTERS:
  81  |     // Duplicate usernames allow account confusion or takeover scenarios.
  82  |     // A bank system must enforce unique identifiers at registration time.
  83  |     // Parabank accepts duplicate usernames — confirmed security bug.
  84  | 
  85  |     test.fail(true, "Parabank accepts duplicate usernames — security bug");
  86  | 
  87  |     const registerPage = new RegisterPage(page);
  88  |     const sharedUsername = `dup_user_${Date.now()}`;
  89  | 
  90  |     // Primer registro: debe tener éxito
  91  |     await registerPage.navigate();
  92  |     await registerPage.register(UserFactory.withUsername(sharedUsername));
  93  | 
  94  |     // Segundo registro con el mismo username: debe ser rechazado
  95  |     await registerPage.navigate();
  96  | 
  97  |     await expect(async () => {
  98  |       await registerPage.register(UserFactory.withUsername(sharedUsername));
> 99  |     }).rejects.toThrow(/Registro rechazado/);
      |                ^ Error: expect(received).rejects.toThrow()
  100 |   });
  101 | 
  102 |   test("[BUG] should show validation error when required fields are empty", async ({
  103 |     page,
  104 |   }) => {
  105 |     // WHY THIS TEST MATTERS:
  106 |     // Empty field submission tests client-side AND server-side validation.
  107 |     // If only client-side validation exists, API calls bypass it entirely.
  108 |     // Parabank only validates client-side — confirmed validation gap.
  109 | 
  110 |     test.fail(
  111 |       true,
  112 |       "Parabank accepts registration with empty fields — server-side validation gap",
  113 |     );
  114 | 
  115 |     const registerPage = new RegisterPage(page);
  116 |     await registerPage.navigate();
  117 | 
  118 |     await expect(async () => {
  119 |       await registerPage.register(
  120 |         UserFactory.create({
  121 |           firstName: "",
  122 |           lastName: "",
  123 |           username: "",
  124 |           password: "",
  125 |         }),
  126 |       );
  127 |     }).rejects.toThrow(/Registro rechazado/);
  128 |   });
  129 | });
  130 | 
  131 | test.describe("Login — customer authentication", () => {
  132 |   test("should authenticate with valid credentials and show account overview @smoke", async ({
  133 |     page,
  134 |   }) => {
  135 |     // WHY THIS TEST MATTERS:
  136 |     // Login is the gateway to every financial operation.
  137 |     // Failure here means zero operations can be performed.
  138 |     // We use the demo account (john/demo) as stable fixture
  139 |     // to avoid dependency on dynamic registration in smoke tests.
  140 | 
  141 |     const authPage = new AuthPage(page);
  142 | 
  143 |     const result = await authPage.login({
  144 |       username: "john",
  145 |       password: "demo",
  146 |     });
  147 | 
  148 |     expect(
  149 |       result.isAuthenticated,
  150 |       'Demo user "john" could not authenticate — ' +
  151 |         "system may be down or demo credentials changed",
  152 |     ).toBe(true);
  153 | 
  154 |     expect(
  155 |       page.url(),
  156 |       "After login, user was not redirected to account overview — " +
  157 |         "authenticated session may not have been established",
  158 |     ).toContain("overview.htm");
  159 |   });
  160 | 
  161 |   test("should reject login with incorrect password", async ({ page }) => {
  162 |     // WHY THIS TEST MATTERS:
  163 |     // Authentication must reject wrong passwords to prevent unauthorized access.
  164 |     // A banking app that accepts any password is a critical security failure.
  165 | 
  166 |     const authPage = new AuthPage(page);
  167 | 
  168 |     await expect(async () => {
  169 |       await authPage.login({
  170 |         username: "john",
  171 |         password: "WRONG_PASSWORD_123",
  172 |       });
  173 |     }).rejects.toThrow(/Autenticación fallida/);
  174 |   });
  175 | 
  176 |   test("should reject login with non-existent username", async ({ page }) => {
  177 |     // WHY THIS TEST MATTERS:
  178 |     // The system must not leak information about which usernames exist.
  179 |     // Ideally the error message is generic — same for wrong user and wrong password.
  180 |     // This test verifies rejection; error message consistency is a separate concern.
  181 | 
  182 |     const authPage = new AuthPage(page);
  183 | 
  184 |     await expect(async () => {
  185 |       await authPage.login({
  186 |         username: `ghost_user_${Date.now()}`,
  187 |         password: "SomePassword1!",
  188 |       });
  189 |     }).rejects.toThrow(/Autenticación fallida/);
  190 |   });
  191 | 
  192 |   test("should reject login with empty credentials", async ({ page }) => {
  193 |     // WHY THIS TEST MATTERS:
  194 |     // Empty credential submission should never succeed.
  195 |     // Verifies that the form doesn't bypass validation on empty submit.
  196 | 
  197 |     const authPage = new AuthPage(page);
  198 | 
  199 |     await expect(async () => {
```