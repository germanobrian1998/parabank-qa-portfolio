// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { RegisterPage } from "../../src/pages/RegisterPage";
import { AuthPage } from "../../src/pages/AuthPage";
import { UserFactory } from "../../src/factories/UserFactory";

/**
 * Suite: Authentication — registro, login y logout
 *
 * Cobertura de negocio:
 * - Un cliente nuevo puede crear una cuenta y acceder al sistema
 * - Un cliente existente puede autenticarse y cerrar sesión de forma segura
 * - El sistema rechaza credenciales inválidas con mensaje claro
 * - El sistema rechaza usernames duplicados en el registro
 *
 * Prerequisito: Parabank corriendo en http://localhost:9090
 * Credenciales demo para tests de login directo: john / demo
 */

test.describe("Registration — new customer onboarding", () => {
  test("should register a new customer and redirect to welcome page @smoke", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Registration is the entry point for all new customers.
    // A silent failure here means zero revenue from new signups.
    // We verify the full happy path: form submission → welcome confirmation.

    const registerPage = new RegisterPage(page);
    const newCustomer = UserFactory.create();

    await registerPage.navigate();
    const result = await registerPage.register(newCustomer);

    expect(
      result.welcomeMessage,
      "Welcome message not shown after registration — " +
        "customer has no confirmation that their account was created",
    ).toContain("Welcome");

    expect(
      result.username,
      "Username in result does not match submitted username — " +
        "possible data corruption during registration",
    ).toBe(newCustomer.username);
  });

  test(
  '[BUG] should allow login with newly registered credentials',
  async ({ page }) => {
    // WHY THIS TEST MATTERS:
    // Registration and login must be consistent — a newly registered
    // user must be able to log in immediately after registration.
    // Parabank registers successfully but rejects login with same
    // credentials — confirmed bug.

    test.fail(true, 'Parabank registers user successfully but rejects immediate login with same credentials');

    const registerPage = new RegisterPage(page);
    const authPage = new AuthPage(page);
    const newCustomer = UserFactory.create();

    await registerPage.navigate();
    await registerPage.register(newCustomer);

    const loginResult = await authPage.login({
      username: newCustomer.username,
      password: newCustomer.password,
    });

    expect(loginResult.isAuthenticated).toBe(true);
  }
);

  test("[BUG] should reject registration with duplicate username", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Duplicate usernames allow account confusion or takeover scenarios.
    // A bank system must enforce unique identifiers at registration time.
    // Parabank accepts duplicate usernames — confirmed security bug.

    test.fail(true, "Parabank accepts duplicate usernames — security bug");

    const registerPage = new RegisterPage(page);
    const sharedUsername = `dup_user_${Date.now()}`;

    // Primer registro: debe tener éxito
    await registerPage.navigate();
    await registerPage.register(UserFactory.withUsername(sharedUsername));

    // Segundo registro con el mismo username: debe ser rechazado
    await registerPage.navigate();

    await expect(async () => {
      await registerPage.register(UserFactory.withUsername(sharedUsername));
    }).rejects.toThrow(/Registro rechazado/);
  });

  test("[BUG] should show validation error when required fields are empty", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Empty field submission tests client-side AND server-side validation.
    // If only client-side validation exists, API calls bypass it entirely.
    // Parabank only validates client-side — confirmed validation gap.

    test.fail(
      true,
      "Parabank accepts registration with empty fields — server-side validation gap",
    );

    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    await expect(async () => {
      await registerPage.register(
        UserFactory.create({
          firstName: "",
          lastName: "",
          username: "",
          password: "",
        }),
      );
    }).rejects.toThrow(/Registro rechazado/);
  });
});

test.describe("Login — customer authentication", () => {
  test("should authenticate with valid credentials and show account overview @smoke", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Login is the gateway to every financial operation.
    // Failure here means zero operations can be performed.
    // We use the demo account (john/demo) as stable fixture
    // to avoid dependency on dynamic registration in smoke tests.

    const authPage = new AuthPage(page);

    const result = await authPage.login({
      username: "john",
      password: "demo",
    });

    expect(
      result.isAuthenticated,
      'Demo user "john" could not authenticate — ' +
        "system may be down or demo credentials changed",
    ).toBe(true);

    expect(
      page.url(),
      "After login, user was not redirected to account overview — " +
        "authenticated session may not have been established",
    ).toContain("overview.htm");
  });

  test("should reject login with incorrect password", async ({ page }) => {
    // WHY THIS TEST MATTERS:
    // Authentication must reject wrong passwords to prevent unauthorized access.
    // A banking app that accepts any password is a critical security failure.

    const authPage = new AuthPage(page);

    await expect(async () => {
      await authPage.login({
        username: "john",
        password: "WRONG_PASSWORD_123",
      });
    }).rejects.toThrow(/Autenticación fallida/);
  });

  test("should reject login with non-existent username", async ({ page }) => {
    // WHY THIS TEST MATTERS:
    // The system must not leak information about which usernames exist.
    // Ideally the error message is generic — same for wrong user and wrong password.
    // This test verifies rejection; error message consistency is a separate concern.

    const authPage = new AuthPage(page);

    await expect(async () => {
      await authPage.login({
        username: `ghost_user_${Date.now()}`,
        password: "SomePassword1!",
      });
    }).rejects.toThrow(/Autenticación fallida/);
  });

  test("should reject login with empty credentials", async ({ page }) => {
    // WHY THIS TEST MATTERS:
    // Empty credential submission should never succeed.
    // Verifies that the form doesn't bypass validation on empty submit.

    const authPage = new AuthPage(page);

    await expect(async () => {
      await authPage.login({ username: "", password: "" });
    }).rejects.toThrow();
  });
});

test.describe("Logout — session termination", () => {
  test("should log out and redirect to public page @smoke", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Logout must terminate the session and return the user to a public page.
    // Failure here means sessions persist after user intent to end them,
    // which is a security risk on shared devices.

    const authPage = new AuthPage(page);

    await authPage.login({ username: "john", password: "demo" });
    await authPage.logout();

    expect(
      page.url(),
      "After logout, URL is not a public page — " +
        "session may not have been terminated correctly",
    ).toMatch(/index\.htm|login\.htm/);
  });

  test("[BUG H-009] should not allow access to protected pages after logout", async ({
    page,
  }) => {
    // WHY THIS TEST MATTERS:
    // Post-logout access to /overview.htm confirms H-009 from discovery:
    // server-side session invalidation is not working.
    // This test is expected to FAIL, documenting the security bug.

    test.fail(
      true,
      "H-009: Session not invalidated server-side after logout — protected pages remain accessible",
    );

    const authPage = new AuthPage(page);

    await authPage.login({ username: "john", password: "demo" });
    await authPage.logout();

    await page.goto("/parabank/overview.htm");

    expect(
      page.url(),
      "Protected page accessible after logout — " +
        "server-side session invalidation may not be working (H-009)",
    ).not.toContain("overview.htm");
  });

  test("should not show logout link on public pages", async ({ page }) => {
    // WHY THIS TEST MATTERS:
    // Visual consistency: a logged-out user should not see
    // authenticated navigation elements. Indicates clean session state.

    const authPage = new AuthPage(page);

    await authPage.login({ username: "john", password: "demo" });
    await authPage.logout();

    const stillLoggedIn = await authPage.isLoggedIn();

    expect(
      stillLoggedIn,
      "Logout link still visible after logout — " +
        "UI state not updated to reflect unauthenticated session",
    ).toBe(false);
  });
});
