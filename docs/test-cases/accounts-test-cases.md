# Test Cases — Accounts Module

| Field | Value |
|---|---|
| **Module** | Account Management (Open Account · Overview · Detail) |
| **Risk level** | Medium — foundational for all other financial operations |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/tech-discovery-report.md` · `docs/severity-priority-matrix.md` |
| **Automated suite** | `tests/e2e/accounts.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy
- User `john / demo` authenticated with an active session (via `authenticatedAsJohn` fixture)
- At least one pre-existing account for `john` (verified by `tests/smoke/environment.spec.ts`)

---

## TC-AC-001 — Open a new CHECKING account

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-001 |
| **Title** | Authenticated customer opens a new CHECKING account and receives a valid account ID |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should open a CHECKING account and display confirmation with new account ID @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Open Account form | Account type and funding-account selects populated |
| 2 | Select account type CHECKING | Selection registered |
| 3 | Submit form | AJAX confirmation panel appears |
| 4 | Read new account ID from confirmation | ID is present and numeric |

**Expected result:** Account created; confirmation shows a valid numeric account ID.
**Actual result:** ✅ Pass

---

## TC-AC-002 — Open a new SAVINGS account

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-002 |
| **Title** | Authenticated customer opens a new SAVINGS account and receives a valid account ID |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should open a SAVINGS account and display confirmation with new account ID` |

**Steps:** Same as TC-AC-001 with account type SAVINGS.

**Expected result:** Account created; confirmation shows a valid numeric account ID, independent of the CHECKING flow.
**Actual result:** ✅ Pass

---

## TC-AC-003 — Two accounts opened in the same session receive distinct IDs

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-003 |
| **Title** | Sequential account creation in the same session generates unique account IDs |
| **Type** | Functional — Data integrity |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should generate unique IDs for two accounts opened in the same session` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Open a CHECKING account | Returns ID A |
| 2 | Open a SAVINGS account (same session) | Returns ID B |
| 3 | Compare IDs | A ≠ B |

**Expected result:** IDs are distinct — no collision.
**Actual result:** ✅ Pass
**Why this matters:** duplicate IDs would cause ledger collisions — transactions on one account would appear on both.

---

## TC-AC-004 — New account appears in overview immediately after creation

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-004 |
| **Title** | Account overview reflects a newly created account without delay |
| **Type** | Functional — Happy Path · UI/DB sync |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should show new account in overview immediately after creation @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Snapshot account count in overview | Count = N |
| 2 | Open a new CHECKING account | New account ID returned |
| 3 | Re-check overview account count | Count = N + 1 |

**Expected result:** Overview count increases by exactly 1; new account is visible without a manual refresh delay.
**Actual result:** ✅ Pass

---

## TC-AC-005 — New account initial balance should be $0.00 (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-005 |
| **Title** | Newly opened account starts with a $0.00 balance |
| **Type** | Functional — Negative / Data integrity |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `[BUG] should display $0.00 initial balance for a newly opened account` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Open a new CHECKING account | Account created |
| 2 | Retrieve the account's balance from overview | Balance is $0.00 |

**Expected result:** New account starts with $0.00 — no funds until the customer deposits.
**Actual result:** 🐛 **FAIL — H-013:** Parabank pre-loads $100.00 into every new account. May be intentional demo behavior (to enable immediate testing of transfers) but differs from expected production behavior of a zero-balance new account.
**Bug reference:** H-013 — `docs/tech-discovery-report.md`

---

## TC-AC-006 — Account detail page shows the correct account type

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-006 |
| **Title** | Account detail page displays the account type selected at creation |
| **Type** | Functional — Data integrity |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should display correct account type label in overview` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Open a new SAVINGS account | Account created with type SAVINGS |
| 2 | Navigate to account detail page | Detail page loads |
| 3 | Verify type label on detail page | Label reads "SAVINGS" |

**Expected result:** Detail page type label matches the type selected during creation.
**Actual result:** ✅ Pass

---

## TC-AC-007 — Overview lists all existing accounts for the authenticated user

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-007 |
| **Title** | Account overview displays every account belonging to the authenticated customer |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should list all existing accounts for authenticated user` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `john` | Session established |
| 2 | Navigate to overview | At least 1 account listed (seed data) |
| 3 | Verify each row has a numeric account ID and numeric balance | All rows well-formed |

**Expected result:** All of `john`'s accounts are listed with valid IDs and numeric balances.
**Actual result:** ✅ Pass

---

## TC-AC-008 — Overview is not accessible without authentication (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-008 |
| **Title** | Account overview page requires an active session |
| **Type** | Security — Negative |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should not show account overview to unauthenticated user` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Without logging in, navigate directly to `/parabank/overview.htm` | Redirect to login |

**Expected result:** Unauthenticated navigation redirects to login; no account data (PII) exposed.
**Actual result:** 🐛 **FAIL — H-009 (extended):** related to the same root cause as the logout session bug — session enforcement gaps allow the overview page to be reached without going through the login flow in some session states.
**Bug reference:** H-009 — `docs/tech-discovery-report.md`

---

## TC-AC-009 — Navigation from overview to account detail works

| Field | Value |
|---|---|
| **Test Case ID** | TC-AC-009 |
| **Title** | Clicking an account in overview navigates to its detail/activity page |
| **Type** | Functional — Happy Path |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `accounts.spec.ts`: `should navigate to account detail page from overview` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to overview | At least 1 account listed |
| 2 | Click first account's link | Navigates to `activity.htm` for that account |

**Expected result:** URL contains `activity.htm`; correct account's transaction history is shown.
**Actual result:** ✅ Pass

---

## Bug summary — Accounts module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-013 | TC-AC-005 | Medium | New accounts pre-loaded with $100 instead of $0.00 |
| H-009 | TC-AC-008 | Medium | Overview accessible without full session enforcement in certain states |

2 out of 9 test cases expose bugs, both previously confirmed and consistent
with the systemic patterns documented in `tech-discovery-report.md`.