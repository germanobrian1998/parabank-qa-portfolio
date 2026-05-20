# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Registration — new customer onboarding >> [BUG] should show validation error when required fields are empty
- Location: tests/e2e/auth.spec.ts:100:7

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
            - 'row "First Name: First name is required." [ref=e50]':
              - cell "First Name:" [ref=e51]
              - cell [ref=e52]:
                - textbox [ref=e53]
              - cell "First name is required." [ref=e54]
            - 'row "Last Name: Last name is required." [ref=e55]':
              - cell "Last Name:" [ref=e56]
              - cell [ref=e57]:
                - textbox [ref=e58]
              - cell "Last name is required." [ref=e59]
            - 'row "Address: 78038 State Street" [ref=e60]':
              - cell "Address:" [ref=e61]
              - cell "78038 State Street" [ref=e62]:
                - textbox [ref=e63]: 78038 State Street
              - cell [ref=e64]
            - 'row "City: West Kiel" [ref=e65]':
              - cell "City:" [ref=e66]
              - cell "West Kiel" [ref=e67]:
                - textbox [ref=e68]: West Kiel
              - cell [ref=e69]
            - 'row "State: AK" [ref=e70]':
              - cell "State:" [ref=e71]
              - cell "AK" [ref=e72]:
                - textbox [ref=e73]: AK
              - cell [ref=e74]
            - 'row "Zip Code: 62966" [ref=e75]':
              - cell "Zip Code:" [ref=e76]
              - cell "62966" [ref=e77]:
                - textbox [ref=e78]: "62966"
              - cell [ref=e79]
            - 'row "Phone #: 1-749-807-8759 x9878" [ref=e80]':
              - 'cell "Phone #:" [ref=e81]'
              - cell "1-749-807-8759 x9878" [ref=e82]:
                - textbox [ref=e83]: 1-749-807-8759 x9878
              - cell [ref=e84]
            - 'row "SSN: 235883814" [ref=e85]':
              - cell "SSN:" [ref=e86]
              - cell "235883814" [ref=e87]:
                - textbox [ref=e88]: "235883814"
              - cell [ref=e89]
            - row [ref=e90]:
              - cell [ref=e91]
            - 'row "Username: Username is required." [ref=e92]':
              - cell "Username:" [ref=e93]
              - cell [ref=e94]:
                - textbox [ref=e95]
              - cell "Username is required." [ref=e96]
            - 'row "Password: Password is required." [ref=e97]':
              - cell "Password:" [ref=e98]
              - cell [ref=e99]:
                - textbox [ref=e100]
              - cell "Password is required." [ref=e101]
            - 'row "Confirm: Password confirmation is required." [ref=e102]':
              - cell "Confirm:" [ref=e103]
              - cell [ref=e104]:
                - textbox [ref=e105]
              - cell "Password confirmation is required." [ref=e106]
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
  48  |   test(
  49  |   '[BUG] should allow login with newly registered credentials',
  50  |   async ({ page }) => {
  51  |     // WHY THIS TEST MATTERS:
  52  |     // Registration and login must be consistent — a newly registered
  53  |     // user must be able to log in immediately after registration.
  54  |     // Parabank registers successfully but rejects login with same
  55  |     // credentials — confirmed bug.
  56  | 
  57  |     test.fail(true, 'Parabank registers user successfully but rejects immediate login with same credentials');
  58  | 
  59  |     const registerPage = new RegisterPage(page);
  60  |     const authPage = new AuthPage(page);
  61  |     const newCustomer = UserFactory.create();
  62  | 
  63  |     await registerPage.navigate();
  64  |     await registerPage.register(newCustomer);
  65  | 
  66  |     const loginResult = await authPage.login({
  67  |       username: newCustomer.username,
  68  |       password: newCustomer.password,
  69  |     });
  70  | 
  71  |     expect(loginResult.isAuthenticated).toBe(true);
  72  |   }
  73  | );
  74  | 
  75  |   test("[BUG] should reject registration with duplicate username", async ({
  76  |     page,
  77  |   }) => {
  78  |     // WHY THIS TEST MATTERS:
  79  |     // Duplicate usernames allow account confusion or takeover scenarios.
  80  |     // A bank system must enforce unique identifiers at registration time.
  81  |     // Parabank accepts duplicate usernames — confirmed security bug.
  82  | 
  83  |     test.fail(true, "Parabank accepts duplicate usernames — security bug");
  84  | 
  85  |     const registerPage = new RegisterPage(page);
  86  |     const sharedUsername = `dup_user_${Date.now()}`;
  87  | 
  88  |     // Primer registro: debe tener éxito
  89  |     await registerPage.navigate();
  90  |     await registerPage.register(UserFactory.withUsername(sharedUsername));
  91  | 
  92  |     // Segundo registro con el mismo username: debe ser rechazado
  93  |     await registerPage.navigate();
  94  | 
  95  |     await expect(async () => {
  96  |       await registerPage.register(UserFactory.withUsername(sharedUsername));
  97  |     }).rejects.toThrow(/Registro rechazado/);
  98  |   });
  99  | 
  100 |   test("[BUG] should show validation error when required fields are empty", async ({
  101 |     page,
  102 |   }) => {
  103 |     // WHY THIS TEST MATTERS:
  104 |     // Empty field submission tests client-side AND server-side validation.
  105 |     // If only client-side validation exists, API calls bypass it entirely.
  106 |     // Parabank only validates client-side — confirmed validation gap.
  107 | 
  108 |     test.fail(
  109 |       true,
  110 |       "Parabank accepts registration with empty fields — server-side validation gap",
  111 |     );
  112 | 
  113 |     const registerPage = new RegisterPage(page);
  114 |     await registerPage.navigate();
  115 | 
  116 |     await expect(async () => {
  117 |       await registerPage.register(
  118 |         UserFactory.create({
  119 |           firstName: "",
  120 |           lastName: "",
  121 |           username: "",
  122 |           password: "",
  123 |         }),
  124 |       );
> 125 |     }).rejects.toThrow(/Registro rechazado/);
      |                ^ Error: expect(received).rejects.toThrow()
  126 |   });
  127 | });
  128 | 
  129 | test.describe("Login — customer authentication", () => {
  130 |   test("should authenticate with valid credentials and show account overview @smoke", async ({
  131 |     page,
  132 |   }) => {
  133 |     // WHY THIS TEST MATTERS:
  134 |     // Login is the gateway to every financial operation.
  135 |     // Failure here means zero operations can be performed.
  136 |     // We use the demo account (john/demo) as stable fixture
  137 |     // to avoid dependency on dynamic registration in smoke tests.
  138 | 
  139 |     const authPage = new AuthPage(page);
  140 | 
  141 |     const result = await authPage.login({
  142 |       username: "john",
  143 |       password: "demo",
  144 |     });
  145 | 
  146 |     expect(
  147 |       result.isAuthenticated,
  148 |       'Demo user "john" could not authenticate — ' +
  149 |         "system may be down or demo credentials changed",
  150 |     ).toBe(true);
  151 | 
  152 |     expect(
  153 |       page.url(),
  154 |       "After login, user was not redirected to account overview — " +
  155 |         "authenticated session may not have been established",
  156 |     ).toContain("overview.htm");
  157 |   });
  158 | 
  159 |   test("should reject login with incorrect password", async ({ page }) => {
  160 |     // WHY THIS TEST MATTERS:
  161 |     // Authentication must reject wrong passwords to prevent unauthorized access.
  162 |     // A banking app that accepts any password is a critical security failure.
  163 | 
  164 |     const authPage = new AuthPage(page);
  165 | 
  166 |     await expect(async () => {
  167 |       await authPage.login({
  168 |         username: "john",
  169 |         password: "WRONG_PASSWORD_123",
  170 |       });
  171 |     }).rejects.toThrow(/Autenticación fallida/);
  172 |   });
  173 | 
  174 |   test("should reject login with non-existent username", async ({ page }) => {
  175 |     // WHY THIS TEST MATTERS:
  176 |     // The system must not leak information about which usernames exist.
  177 |     // Ideally the error message is generic — same for wrong user and wrong password.
  178 |     // This test verifies rejection; error message consistency is a separate concern.
  179 | 
  180 |     const authPage = new AuthPage(page);
  181 | 
  182 |     await expect(async () => {
  183 |       await authPage.login({
  184 |         username: `ghost_user_${Date.now()}`,
  185 |         password: "SomePassword1!",
  186 |       });
  187 |     }).rejects.toThrow(/Autenticación fallida/);
  188 |   });
  189 | 
  190 |   test("should reject login with empty credentials", async ({ page }) => {
  191 |     // WHY THIS TEST MATTERS:
  192 |     // Empty credential submission should never succeed.
  193 |     // Verifies that the form doesn't bypass validation on empty submit.
  194 | 
  195 |     const authPage = new AuthPage(page);
  196 | 
  197 |     await expect(async () => {
  198 |       await authPage.login({ username: "", password: "" });
  199 |     }).rejects.toThrow();
  200 |   });
  201 | });
  202 | 
  203 | test.describe("Logout — session termination", () => {
  204 |   test("should log out and redirect to public page @smoke", async ({
  205 |     page,
  206 |   }) => {
  207 |     // WHY THIS TEST MATTERS:
  208 |     // Logout must terminate the session and return the user to a public page.
  209 |     // Failure here means sessions persist after user intent to end them,
  210 |     // which is a security risk on shared devices.
  211 | 
  212 |     const authPage = new AuthPage(page);
  213 | 
  214 |     await authPage.login({ username: "john", password: "demo" });
  215 |     await authPage.logout();
  216 | 
  217 |     expect(
  218 |       page.url(),
  219 |       "After logout, URL is not a public page — " +
  220 |         "session may not have been terminated correctly",
  221 |     ).toMatch(/index\.htm|login\.htm/);
  222 |   });
  223 | 
  224 |   test("[BUG H-009] should not allow access to protected pages after logout", async ({
  225 |     page,
```