# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Login — customer authentication >> should reject login with non-existent username
- Location: tests/e2e/auth.spec.ts:186:7

# Error details

```
Error: expect(received).rejects.toThrow(expected)

Expected pattern: /Autenticación fallida/
Received message: "[Post-login redirect to account overview] La navegación no completó hacia el destino esperado. URL actual: http://localhost:9090/parabank/login.htm;jsessionid=767898E23A1A0ACBF034CB58F38A2A9F"

      70 |       await this.page.waitForURL(expectedUrlPattern, { timeout: 15_000 });
      71 |     } catch {
    > 72 |       throw new Error(
         |             ^
      73 |         `[${businessContext}] La navegación no completó hacia el destino esperado. ` +
      74 |         `URL actual: ${this.page.url()}`
      75 |       );

      at AuthPage.waitForNavigation (src/pages/BasePage.ts:72:13)
      at AuthPage.login (src/pages/AuthPage.ts:94:5)
      at tests/e2e/auth.spec.ts:197:9
      at tests/e2e/auth.spec.ts:196:7
      at node_modules/playwright/lib/worker/workerProcessEntry.js:3045:9
      at node_modules/playwright/lib/worker/workerProcessEntry.js:2537:11
      at TimeoutManager.withRunnable (node_modules/playwright/lib/worker/workerProcessEntry.js:1816:14)
      at TestInfoImpl._runWithTimeout (node_modules/playwright/lib/worker/workerProcessEntry.js:2535:7)
      at node_modules/playwright/lib/worker/workerProcessEntry.js:3043:7
      at WorkerMain._runTest (node_modules/playwright/lib/worker/workerProcessEntry.js:3016:5)
      at WorkerMain.runTestGroup (node_modules/playwright/lib/worker/workerProcessEntry.js:2911:9)
      at process.<anonymous> (node_modules/playwright/lib/common/index.js:1955:25)
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
        - heading "Error!" [level=1] [ref=e45]
        - paragraph [ref=e46]: The username and password could not be verified.
  - generic [ref=e48]:
    - list [ref=e49]:
      - listitem [ref=e50]:
        - link "Home" [ref=e51] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e52]:
        - link "About Us" [ref=e53] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e54]:
        - link "Services" [ref=e55] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e56]:
        - link "Products" [ref=e57] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e58]:
        - link "Locations" [ref=e59] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e60]:
        - link "Forum" [ref=e61] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e62]:
        - link "Site Map" [ref=e63] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e64]:
        - link "Contact Us" [ref=e65] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e66]: © Parasoft. All rights reserved.
    - list [ref=e67]:
      - listitem [ref=e68]: "Visit us at:"
      - listitem [ref=e69]:
        - link "www.parasoft.com" [ref=e70] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
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
  199 |           password: 'SomePassword1!',
  200 |         });
> 201 |       }).rejects.toThrow(
      |                  ^ Error: expect(received).rejects.toThrow(expected)
  202 |         /Autenticación fallida/
  203 |       );
  204 |     }
  205 |   );
  206 | 
  207 |   test(
  208 |     'should reject login with empty credentials',
  209 |     async ({ page }) => {
  210 |       // WHY THIS TEST MATTERS:
  211 |       // Empty credential submission should never succeed.
  212 |       // Verifies that the form doesn't bypass validation on empty submit.
  213 | 
  214 |       const authPage = new AuthPage(page);
  215 | 
  216 |       await expect(async () => {
  217 |         await authPage.login({ username: '', password: '' });
  218 |       }).rejects.toThrow();
  219 |     }
  220 |   );
  221 | });
  222 | 
  223 | 
  224 | test.describe('Logout — session termination', () => {
  225 | 
  226 |   test(
  227 |     'should log out and redirect to public page @smoke',
  228 |     async ({ page }) => {
  229 |       // WHY THIS TEST MATTERS:
  230 |       // Logout must terminate the session and return the user to a public page.
  231 |       // Failure here means sessions persist after user intent to end them,
  232 |       // which is a security risk on shared devices.
  233 | 
  234 |       const authPage = new AuthPage(page);
  235 | 
  236 |       await authPage.login({ username: 'john', password: 'demo' });
  237 |       await authPage.logout();
  238 | 
  239 |       expect(
  240 |         page.url(),
  241 |         'After logout, URL is not a public page — ' +
  242 |         'session may not have been terminated correctly'
  243 |       ).toMatch(/index\.htm|login\.htm/);
  244 |     }
  245 |   );
  246 | 
  247 |   test(
  248 |     'should not allow access to protected pages after logout',
  249 |     async ({ page }) => {
  250 |       // WHY THIS TEST MATTERS:
  251 |       // Post-logout access to /overview.htm would indicate the session
  252 |       // was not properly invalidated server-side (related to H-009).
  253 |       // This is a medium-severity security finding from discovery.
  254 | 
  255 |       const authPage = new AuthPage(page);
  256 | 
  257 |       // Login y logout
  258 |       await authPage.login({ username: 'john', password: 'demo' });
  259 |       await authPage.logout();
  260 | 
  261 |       // Intento de acceso directo a página protegida
  262 |       await page.goto('/parabank/overview.htm');
  263 | 
  264 |       // El sistema debe redirigir a login, no mostrar datos de cuenta
  265 |       expect(
  266 |         page.url(),
  267 |         'Protected page accessible after logout — ' +
  268 |         'server-side session invalidation may not be working (H-009)'
  269 |       ).not.toContain('overview.htm');
  270 |     }
  271 |   );
  272 | 
  273 |   test(
  274 |     'should not show logout link on public pages',
  275 |     async ({ page }) => {
  276 |       // WHY THIS TEST MATTERS:
  277 |       // Visual consistency: a logged-out user should not see
  278 |       // authenticated navigation elements. Indicates clean session state.
  279 | 
  280 |       const authPage = new AuthPage(page);
  281 | 
  282 |       await authPage.login({ username: 'john', password: 'demo' });
  283 |       await authPage.logout();
  284 | 
  285 |       const stillLoggedIn = await authPage.isLoggedIn();
  286 | 
  287 |       expect(
  288 |         stillLoggedIn,
  289 |         'Logout link still visible after logout — ' +
  290 |         'UI state not updated to reflect unauthenticated session'
  291 |       ).toBe(false);
  292 |     }
  293 |   );
  294 | });
```