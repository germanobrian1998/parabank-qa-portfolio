# Test Cases — Bill Pay Module

| Field | Value |
|---|---|
| **Module** | Bill Pay (payee registration and payment execution) |
| **Risk level** | High — one-way financial operation to an external payee, no automatic reversal |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/tech-discovery-report.md` §3.3, §4.3 · `docs/bugs/` · `docs/severity-priority-matrix.md` |
| **Automated suite** | `tests/e2e/billpay.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy
- User `john / demo` authenticated with an active session
- `fromAccountId` is obtained from the Bill Pay form's own `<select>`, **not**
  from `overview.htm` — navigating to overview before Bill Pay invalidates the
  session context Parabank needs for the POST (confirmed in
  `tech-discovery-report.md` §3.4)

---

## TC-BP-001 — Successful bill payment to a new payee

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-001 |
| **Title** | Customer pays a bill to a new payee and receives a matching confirmation |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `should complete bill payment and show confirmation with correct details @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Bill Pay form | Payee fields and fromAccount select displayed |
| 2 | Fill payee name, address, account number, verify account (matching), amount | Fields accept input |
| 3 | Submit payment | jQuery shows `#billpayResult` panel |
| 4 | Compare confirmation payee name and amount to submitted values | Values match exactly |

**Expected result:** Payment confirmed; payee name and amount in confirmation match what was submitted.
**Actual result:** ✅ Pass
**Why this matters:** a mismatch here means the system processed a different transaction than the customer intended — no automatic reversal exists for bill payments.

---

## TC-BP-002 — Source account balance is debited by the exact payment amount

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-002 |
| **Title** | Bill payment debits the source account by exactly the paid amount |
| **Type** | Functional — Data integrity |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `should deduct exact payment amount from source account balance` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Pay a bill of $75 from a known account | Payment confirmed |
| 2 | Query `GET /accounts/{fromAccountId}/transactions` via API | A Debit transaction of $75 is present |

**Expected result:** A debit transaction for the exact amount appears in the source account's ledger.
**Actual result:** ✅ Pass

---

## TC-BP-003 — Payment can be made from a non-default source account

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-003 |
| **Title** | Customer with multiple accounts can select which account to debit |
| **Type** | Functional — Happy Path |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `should allow paying bills from different source accounts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Read available account IDs from the form's select | 2+ options present |
| 2 | Select the second account as source | Selection registered |
| 3 | Submit payment | Confirmation shows the selected account, not the default |

**Expected result:** Confirmation's `fromAccountId` matches the explicitly selected account.
**Actual result:** ✅ Pass

---

## TC-BP-004 — Mismatched account/verify-account numbers rejected (BUG — server layer)

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-004 |
| **Title** | Payment is rejected when Account # and Verify Account # do not match |
| **Type** | Functional — Negative · Fraud prevention |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `[BUG H-014] should reject payment when account number and verify account do not match` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Fill payee account number `X` | Registered |
| 2 | Fill Verify Account # with a different number `Y` (bypassing client-side jQuery check via direct trigger) | Server-level validation should catch this |
| 3 | Submit | Server rejects the payment |

**Expected result:** Server rejects the payment when the two account numbers don't match, independent of whether client-side JS validation ran.
**Actual result:** 🐛 **FAIL — H-014:** the mismatch check exists only in client-side jQuery. When bypassed (e.g. programmatic form submission), the server processes the payment using the first account number with no server-side cross-check.
**Bug reference:** H-014 — `docs/tech-discovery-report.md`

---

## TC-BP-005 — Payment rejected when required fields are missing

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-005 |
| **Title** | Form submission with empty required fields shows validation errors |
| **Type** | Functional — Negative |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `should reject payment when required fields are missing` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit the Bill Pay form with all fields empty | jQuery validation triggers |
| 2 | Count visible `validationModel-*` error spans | At least 1 visible |

**Expected result:** Client-side validation blocks submission and shows inline errors.
**Actual result:** ✅ Pass

---

## TC-BP-006 — Zero-amount payment handling

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-006 |
| **Title** | Payment of $0.00 is either explicitly rejected or explicitly confirmed — never silent |
| **Type** | Functional — Edge case / BVA lower boundary |
| **Priority** | P3 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `[EDGE] should handle payment with zero amount` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a bill payment with amount $0.00 | System responds definitively (accept or reject) |

**Expected result:** Either an explicit success confirmation or an explicit error — no ambiguous/silent state.
**Actual result:** ✅ Pass (as an edge-case observation test — the system's actual behavior for this boundary is documented for information rather than asserted as pass/fail against a single expected outcome).

---

## TC-BP-007 — Negative amount payment rejected (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-007 |
| **Title** | Payment with a negative amount is rejected |
| **Type** | Functional — Negative · Security |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `[BUG H-007] should reject payment with negative amount` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit bill payment with amount `-100` | Server rejects |

**Expected result:** Server rejects negative amounts — a negative bill payment would reverse the money flow (payee pays the customer).
**Actual result:** 🐛 **FAIL — H-007 (extended to Bill Pay):** confirmed accepted, consistent with the same validation gap found in Transfers and Loans. Severity: Critical.
**Bug reference:** H-007 — `docs/bugs/H-007-negative-transfer-amount.md`

---

## TC-BP-008 — Payment appears in account transaction history

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-008 |
| **Title** | A completed bill payment is visible in the source account's transaction history |
| **Type** | Functional — Audit trail |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `should reflect bill payment in account transaction history` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Pay a bill of $30 | Payment confirmed |
| 2 | Navigate to account detail | Transaction history loads |
| 3 | Look for a row matching "Bill Payment" or "Funds Transfer" | At least 1 matching row present |

**Expected result:** Payment is recorded and visible in the transaction ledger.
**Actual result:** ✅ Pass

---

## TC-BP-009 — Bill Pay not accessible without authentication (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-BP-009 |
| **Title** | Bill Pay page requires an active session |
| **Type** | Security — Negative |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `billpay.spec.ts`: `[BUG H-009] should not allow bill pay to unauthenticated user` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Without logging in, navigate directly to `/parabank/billpay.htm` | Redirect to login |

**Expected result:** Unauthenticated users cannot reach the Bill Pay form.
**Actual result:** 🐛 **FAIL — H-009 (extended):** same session enforcement gap identified across Auth, Accounts, and Bill Pay.
**Bug reference:** H-009 — `docs/tech-discovery-report.md`

---

## Bug summary — Bill Pay module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-014 | TC-BP-004 | High | Beneficiary account mismatch not validated server-side |
| H-007 | TC-BP-007 | Critical | Negative payment amounts accepted |
| H-009 | TC-BP-009 | Medium | Bill Pay accessible without full session enforcement |

3 out of 9 test cases expose bugs. All three are extensions of systemic
patterns already confirmed in other modules (H-007's numeric validation gap,
H-009's session handling gap) — reinforcing that these are architectural
issues, not isolated defects.