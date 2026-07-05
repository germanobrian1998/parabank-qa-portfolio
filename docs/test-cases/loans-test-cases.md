# Test Cases — Loan Request Module

| Field | Value |
|---|---|
| **Module** | Loan Request (application, credit evaluation, approval) |
| **Risk level** | Medium-High — creates a financial liability (LOAN account) on approval |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/tech-discovery-report.md` §2.1, §4.4 · `docs/decisions/ADR-003-test-data.md` |
| **Automated suite** | `tests/e2e/loans.spec.ts` · `tests/api/idempotency.api.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy, freshly seeded (WSDL loan
  provider is sensitive to accumulated state from previous runs — see P-002
  in `PENDING.md`)
- User `john / demo` authenticated with an active session
- `fromAccountId` obtained dynamically from the loan form's select, never hardcoded

---

## TC-LN-001 — Loan approved with valid amount and sufficient down payment

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-001 |
| **Title** | A loan request with a reasonable amount and adequate down payment is approved |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `loans.spec.ts`: `should approve a loan with valid amount and sufficient down payment @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Request Loan form | Form displayed with account select |
| 2 | Enter amount $1000, down payment $100 | Fields accept input |
| 3 | Submit | AJAX response returns within 30s (known WSDL latency) |
| 4 | Read approval status | `approved: true` |

**Expected result:** Loan approved; a new loan account ID is returned.
**Actual result:** ✅ Pass

---

## TC-LN-002 — Approved loan creates a new LOAN account

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-002 |
| **Title** | Loan approval results in a persisted LOAN-type account, not just a UI message |
| **Type** | Functional — Data integrity |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `loans.spec.ts`: `should create a new loan account upon approval` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a loan request expected to be approved | `approved: true` |
| 2 | Read `newAccountId` from response | Present, numeric, non-empty |

**Expected result:** A valid numeric account ID is returned and can be used for subsequent operations (payments on the loan).
**Actual result:** ✅ Pass
**Why this matters:** if the registration of the new loan account failed silently, the customer would believe they have a loan but the bank would have no record to collect payments against.

---

## TC-LN-003 — Loan denied when amount exceeds credit profile

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-003 |
| **Title** | A loan request for an unreasonably high amount is denied |
| **Type** | Functional — Negative (expected denial) |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `loans.spec.ts`: `should deny a loan when requested amount is too high for credit profile` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a loan request for $100,000 with a $1,000 down payment | Credit engine evaluates |
| 2 | Read approval status | `approved: false` |

**Expected result:** Loan denied — the credit engine correctly rejects a request exceeding the customer's implied risk profile.
**Actual result:** ✅ Pass

---

## TC-LN-004 — Loan denied with zero down payment

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-004 |
| **Title** | A loan request with no down payment is denied |
| **Type** | Functional — Negative (expected denial) · BVA lower boundary |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `loans.spec.ts`: `should deny a loan with zero down payment` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a loan request with amount $1000 and down payment $0 | Credit engine evaluates |
| 2 | Read approval status | `approved: false` |

**Expected result:** Loan denied — a $0 down payment removes the primary risk-reduction mechanism and should not be approved.
**Actual result:** ✅ Pass

---

## TC-LN-005 — Loan rejected with negative amount (BUG)

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-005 |
| **Title** | A loan request with a negative amount is rejected before credit evaluation |
| **Type** | Functional — Negative · Security |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `loans.spec.ts`: `[BUG H-015] should reject a loan request with a negative amount` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a loan request with amount `-500` | Server rejects before running credit logic |

**Expected result:** Request rejected outright — a negative loan amount should never reach the credit evaluation engine.
**Actual result:** 🐛 **FAIL — H-015:** the server processes the request and returns an approval/denial decision based on credit logic, ignoring that the amount is negative. Consistent with the systemic H-007 pattern (no server-side numeric validation on financial fields).
**Bug reference:** H-015 — `docs/tech-discovery-report.md`

---

## TC-LN-006 — Duplicate loan request does not create two loan accounts (BUG — sequential)

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-006 |
| **Title** | Two sequential identical loan requests result in exactly one LOAN account |
| **Type** | Functional — Idempotency |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `idempotency.api.spec.ts`: `[BUG] duplicate loan request should not create two loan accounts` (Vector 1 — sequential) |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Count LOAN accounts for the customer | Baseline count N |
| 2 | Send two sequential identical `requestLoan` calls | Second request should be rejected as a duplicate, or serialized to a single approval |
| 3 | Re-count LOAN accounts | Count = N + 1, never N + 2 |

**Expected result:** Exactly one LOAN account created, regardless of the double submission.
**Actual result:** 🐛 **FAIL (non-deterministic) — H-019 (Vector 1):** first confirmed reproduction (2026-06-19, post re-seed) showed 2 independent LOAN accounts created from 2 sequential requests. Subsequent runs showed the server sometimes serializing the requests, denying the race condition a chance to manifest. This test does **not** use `test.fail()` — the non-deterministic nature would cause the runner to flip between pass/fail without the underlying bug having changed. Results are recorded via `test.info().annotations` on every run instead.
**Bug reference:** H-019 — `docs/tech-discovery-report.md` · `CHANGELOG.md` v0.7.0

---

## TC-LN-007 — Concurrent loan requests do not create duplicate accounts (BUG — concurrent)

| Field | Value |
|---|---|
| **Test Case ID** | TC-LN-007 |
| **Title** | Two concurrent identical loan requests from separate sessions result in exactly one LOAN account |
| **Type** | Functional — Idempotency · Race condition |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `idempotency.api.spec.ts`: `[BUG] concurrent loan requests should not create duplicate accounts` (Vector 2 — concurrent) |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Two separate authenticated clients (same customer) | Both sessions active |
| 2 | Both send `requestLoan` with identical parameters via `Promise.all` | Server should serialize or reject one |
| 3 | Count LOAN accounts after | Count increased by exactly 1 |

**Expected result:** Exactly one LOAN account, regardless of request concurrency.
**Actual result:** 🐛 **FAIL (non-deterministic) — H-019 (Vector 2):** confirmed reproduction (2026-06-19) where both concurrent requests were approved independently, creating 2 LOAN accounts. As with Vector 1, this depends on server-side scheduling and is documented via annotations rather than a fixed pass/fail expectation.
**Bug reference:** H-019 — `docs/tech-discovery-report.md` · `CHANGELOG.md` v0.7.0

---

## Bug summary — Loans module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-015 | TC-LN-005 | Critical | Negative loan amounts accepted, reaching the credit evaluation engine |
| H-019 | TC-LN-006, TC-LN-007 | High | `/requestLoan` not idempotent — duplicate LOAN accounts on sequential or concurrent double-submit |

**Note on non-determinism:** unlike every other bug in this project, H-019's
reproduction rate varies between runs (see `PENDING.md` P-001/P-002 investigation
history). TC-LN-006 and TC-LN-007 are deliberately documented without a fixed
`test.fail()` expectation — the annotation-based approach is the methodologically
correct way to report a race condition whose manifestation depends on server-side
timing, rather than forcing a binary pass/fail that would misrepresent the bug's
actual behavior.