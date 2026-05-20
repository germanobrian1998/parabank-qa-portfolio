# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Logout — session termination >> [BUG H-009] should not allow access to protected pages after logout
- Location: tests/e2e/auth.spec.ts:224:7

# Error details

```
Error: Protected page accessible after logout — server-side session invalidation may not be working (H-009)

expect(received).not.toContain(expected) // indexOf

Expected substring: not "overview.htm"
Received string:        "http://localhost:9090/parabank/overview.htm"
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
        - paragraph [ref=e46]: An internal error has occurred and has been logged.
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
  226 |   }) => {
  227 |     // WHY THIS TEST MATTERS:
  228 |     // Post-logout access to /overview.htm confirms H-009 from discovery:
  229 |     // server-side session invalidation is not working.
  230 |     // This test is expected to FAIL, documenting the security bug.
  231 | 
  232 |     test.fail(
  233 |       true,
  234 |       "H-009: Session not invalidated server-side after logout — protected pages remain accessible",
  235 |     );
  236 | 
  237 |     const authPage = new AuthPage(page);
  238 | 
  239 |     await authPage.login({ username: "john", password: "demo" });
  240 |     await authPage.logout();
  241 | 
  242 |     await page.goto("/parabank/overview.htm");
  243 | 
  244 |     expect(
  245 |       page.url(),
  246 |       "Protected page accessible after logout — " +
  247 |         "server-side session invalidation may not be working (H-009)",
> 248 |     ).not.toContain("overview.htm");
      |           ^ Error: Protected page accessible after logout — server-side session invalidation may not be working (H-009)
  249 |   });
  250 | 
  251 |   test("should not show logout link on public pages", async ({ page }) => {
  252 |     // WHY THIS TEST MATTERS:
  253 |     // Visual consistency: a logged-out user should not see
  254 |     // authenticated navigation elements. Indicates clean session state.
  255 | 
  256 |     const authPage = new AuthPage(page);
  257 | 
  258 |     await authPage.login({ username: "john", password: "demo" });
  259 |     await authPage.logout();
  260 | 
  261 |     const stillLoggedIn = await authPage.isLoggedIn();
  262 | 
  263 |     expect(
  264 |       stillLoggedIn,
  265 |       "Logout link still visible after logout — " +
  266 |         "UI state not updated to reflect unauthenticated session",
  267 |     ).toBe(false);
  268 |   });
  269 | });
  270 | 
```