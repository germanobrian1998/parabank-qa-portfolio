# Test Cases — Authentication Module

| Field | Value |
|---|---|
| **Module** | Authentication (Registration · Login · Logout) |
| **Risk level** | High — gateway to every other financial operation |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/state-transition-auth.md` · `docs/tech-discovery-report.md` · `docs/severity-priority-matrix.md` |
| **Automated suite** | `tests/e2e/auth.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running: `docker run -d -p 8080:8080 germanobrian1998/parabank:latest`
- No active session unless explicitly stated in the test case
- Seed user `john / demo` available for login-only test cases

---

## TC-AU-001 — Successful registration of a new customer

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-001 |
| **Title** | New customer registers with valid, unique data and reaches welcome page |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should register a new customer and redirect to welcome page @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Register page | Registration form displayed with all required fields |
| 2 | Fill all fields with valid, unique data (dynamic username via factory) | Fields accept input |
| 3 | Click "Register" | Form submits |
| 4 | Observe confirmation | Welcome message displayed containing submitted username |

**Expected result:** Registration completes; welcome message shown; username in confirmation matches submitted username.
**Actual result:** ✅ Pass

---

## TC-AU-002 — Login with newly registered credentials (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-002 |
| **Title** | Customer who just registered can log in immediately with the same credentials |
| **Type** | Functional — Negative (state transition T8) |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `[BUG] should allow login with newly registered credentials` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Register a new customer with dynamic credentials | Registration succeeds; welcome page shown |
| 2 | Immediately attempt login with the same username/password | Login succeeds; redirected to account overview |

**Expected result:** Login succeeds immediately after registration.
**Actual result:** 🐛 **FAIL — H-011 (extended):** Registration succeeds and shows a welcome message, but the immediate login attempt with the same credentials fails. The customer is left in a state where they believe their account exists but cannot access it.
**Bug reference:** H-011 — `docs/tech-discovery-report.md`

---

## TC-AU-003 — Registration with duplicate username is rejected (BUG — UI layer)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-003 |
| **Title** | Registration form rejects a username that is already taken |
| **Type** | Functional — Negative · Security |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `[BUG] should reject registration with duplicate username` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Register a customer with username `dup_user_<timestamp>` | Registration succeeds |
| 2 | Navigate to Register page again | Fresh form displayed |
| 3 | Register a second customer using the exact same username | Server rejects with a clear error message |

**Expected result:** Second registration attempt rejected with error indicating the username is taken.
**Actual result:** 🐛 **FAIL — H-011 (UI layer):** the UI accepts the duplicate registration and shows a success state. Verified separately via direct API call (see `login.api.spec.ts`) that **the server correctly rejects** the duplicate — the defect is isolated to the frontend not processing the server's error response correctly.
**Bug reference:** H-011 — `docs/tech-discovery-report.md` §6, "Aclaración importante 26/05/2026"

---

## TC-AU-004 — Registration with empty required fields is rejected (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-004 |
| **Title** | Registration form rejects submission with empty required fields |
| **Type** | Functional — Negative |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `[BUG] should show validation error when required fields are empty` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Register page | Form displayed |
| 2 | Submit with `firstName`, `lastName`, `username`, `password` all empty | Server rejects with validation error |

**Expected result:** Registration rejected; validation error message shown.
**Actual result:** 🐛 **FAIL — H-012:** Parabank accepts registration with empty required fields — no server-side validation gap is enforced beyond what the browser's own HTML validation blocks.
**Bug reference:** H-012 — `docs/tech-discovery-report.md`

---

## TC-AU-005 — Login with valid credentials succeeds

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-005 |
| **Title** | Seed user authenticates successfully and reaches account overview |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should authenticate with valid credentials and show account overview @smoke @sanity` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to login page | Login form displayed |
| 2 | Enter `john` / `demo` | Fields accept input |
| 3 | Click "Log In" | Redirect to `overview.htm` |

**Expected result:** Login succeeds; URL contains `overview.htm`; session established.
**Actual result:** ✅ Pass

---

## TC-AU-006 — Login rejected with incorrect password

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-006 |
| **Title** | Login attempt with wrong password for an existing username is rejected |
| **Type** | Functional — Negative |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should reject login with incorrect password` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Enter username `john`, password `WRONG_PASSWORD_123` | Server rejects |
| 2 | Observe error | Message indicates authentication failure |

**Expected result:** Login rejected; generic authentication failure message (no hint on which field was wrong — expected security behavior).
**Actual result:** ✅ Pass

---

## TC-AU-007 — Login rejected with non-existent username

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-007 |
| **Title** | Login attempt with a username that does not exist is rejected |
| **Type** | Functional — Negative |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should reject login with non-existent username` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Enter a dynamically generated username that was never registered | Server rejects |
| 2 | Observe error | Message indicates authentication failure — same generic message as TC-AU-006 |

**Expected result:** Login rejected with the same generic message used for wrong-password — prevents username enumeration.
**Actual result:** ✅ Pass

---

## TC-AU-008 — Login rejected with empty credentials

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-008 |
| **Title** | Login attempt with empty username and password fields is rejected |
| **Type** | Functional — Negative · Boundary |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should reject login with empty credentials` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit login form with both fields empty | Server or client rejects |

**Expected result:** Login rejected — either via client-side required validation or server-side rejection.
**Actual result:** ✅ Pass

---

## TC-AU-009 — Logout terminates session and redirects to public page

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-009 |
| **Title** | Authenticated user logs out and is redirected to a public page |
| **Type** | Functional — Happy Path · Security |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should log out and redirect to public page @smoke @sanity` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `john / demo` | Session established |
| 2 | Click logout link | Session terminates |
| 3 | Observe resulting URL | Redirected to `index.htm` or `login.htm` |

**Expected result:** Logout redirects to a public page.
**Actual result:** ✅ Pass

---

## TC-AU-010 — Protected pages inaccessible after logout (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-010 |
| **Title** | Direct navigation to a protected page after logout is blocked |
| **Type** | Functional — Negative · Security (state transition T11) |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `[BUG H-009] should not allow access to protected pages after logout` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `john / demo` | Session established |
| 2 | Log out | Session should be invalidated server-side |
| 3 | Navigate directly to `/parabank/overview.htm` via URL | Redirect to login page |

**Expected result:** Server rejects the stale session; user redirected to login.
**Actual result:** 🐛 **FAIL — H-009:** the `JSESSIONID` remains valid server-side after logout. The protected page loads normally using the stale session cookie. Confirmed at both UI and direct API level (see `login.api.spec.ts`).
**Bug reference:** H-009 — `docs/tech-discovery-report.md` · `docs/state-transition-auth.md` (transition T11)

---

## TC-AU-011 — Logout link not shown on public pages

| Field | Value |
|---|---|
| **Test Case ID** | TC-AU-011 |
| **Title** | After logout, the UI does not display a logout link on public pages |
| **Type** | Functional — UI state consistency |
| **Priority** | P3 |
| **Automated** | ✅ Yes — `auth.spec.ts`: `should not show logout link on public pages` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in, then log out | Redirected to public page |
| 2 | Check for logout link visibility | Not visible |

**Expected result:** Logout link is absent from the DOM/hidden on public pages post-logout.
**Actual result:** ✅ Pass — the client-side UI state correctly reflects unauthenticated status even though the server-side session bug (H-009) exists independently.

---

## Bug summary — Authentication module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-011 | TC-AU-002, TC-AU-003 | High (UI layer) | Duplicate username accepted by UI; immediate post-registration login fails |
| H-012 | TC-AU-004 | Medium | Empty required fields accepted on registration |
| H-009 | TC-AU-010 | Medium | Session not invalidated server-side after logout |

3 out of 11 test cases expose bugs — all previously confirmed and cross-referenced
in `tech-discovery-report.md`. No new defects were identified while formalizing
this module's test cases; this document's purpose is closing the traceability gap
flagged in `docs/traceability-matrix.md` §2, not re-discovery.