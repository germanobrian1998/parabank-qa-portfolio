# Test Cases — Authorization Module (Access Control / IDOR)

| Field | Value |
|---|---|
| **Module** | REST API Authorization — `/services/bank/accounts/*` · `/services/bank/customers/*` |
| **Risk level** | Critical — direct PCI-DSS Requirement 7 exposure |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/bugs/H-018-idor-cross-account-access.md` · `docs/pci-dss-coverage.md` · `docs/severity-priority-matrix.md` |
| **Automated suite** | `tests/api/authorization.api.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy
- No prior authentication required for Vector 1 and Vector 3 — that absence
  of a precondition is itself the point being tested
- `accountId` and `customerId` correspond to the seeded dataset in
  `germanobrian1998/parabank:latest`

---

## TC-AZ-001 — Unauthenticated client cannot read account data (Vector 1)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AZ-001 |
| **Title** | GET /services/bank/accounts/{id} requires a valid authenticated session |
| **Type** | Security — Broken Access Control (IDOR) |
| **Priority** | P1 |
| **OWASP mapping** | A01:2021 — Broken Access Control |
| **PCI-DSS mapping** | Requirement 7.1, 7.2 |
| **Automated** | ✅ Yes — `authorization.api.spec.ts`: `[SECURITY] unauthenticated client should not read account data` |

**Preconditions:**
- One authenticated client (to resolve a real `accountId` for `john`)
- One unauthenticated client (no `JSESSIONID` sent)

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Authenticated client logs in as `john/demo` and retrieves a real `accountId` | Account ID resolved |
| 2 | Unauthenticated client sends `GET /services/bank/accounts/{accountId}` with no session cookie | Server rejects with HTTP 401 |
| 3 | Observe response body | No account data (balance, type, customerId) present |

**Expected result:** HTTP 401 Unauthorized; no financial data returned.
**Actual result:** 🐛 **FAIL — H-018 (Vector 1):** server returns HTTP 200 with full account details (`id`, `customerId`, `type`, `balance`) with no session required. Any HTTP client with a known `accountId` can read any customer's financial data.
**Bug reference:** H-018 — `docs/bugs/H-018-idor-cross-account-access.md`

---

## TC-AZ-002 — User B cannot access accounts belonging to User A (Vector 2, cross-user)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AZ-002 |
| **Title** | Authenticated user cannot read account data belonging to a different customer |
| **Type** | Security — Broken Access Control (IDOR, cross-user) |
| **Priority** | P1 |
| **OWASP mapping** | A01:2021 — Broken Access Control |
| **PCI-DSS mapping** | Requirement 7.1, 7.2 |
| **Automated** | ⏭️ Blocked — `authorization.api.spec.ts`: `[SECURITY] user B should not access accounts belonging to user A` (`test.skip()`) |

**Preconditions:**
- User A: seed user `john/demo` with known accounts
- User B: a freshly registered user (dynamic username)

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Register User B with dynamic, unique credentials | Registration succeeds |
| 2 | Log in as User B | Session established for User B |
| 3 | User B sends `GET /services/bank/accounts/{accountIdFromA}` | Server rejects with HTTP 403 |

**Expected result:** HTTP 403 Forbidden — authenticated but not authorized for this resource.
**Actual result:** ⏭️ **BLOCKED (P-004):** cannot execute this test case. The registration endpoint rejects any new username with "This username already exists" when called through Playwright's `APIRequestContext`, even though the same request succeeds via raw curl. The username is confirmed never created (subsequent login with those credentials fails with "could not be verified"). This is a test-environment blocker, not a resolved absence of the bug — the vector remains unverified pending a fix to the registration flow used in setup.
**Reference:** `PENDING.md` P-004 · `docs/decisions/ADR-003-test-data.md`

---

## TC-AZ-003 — Unauthenticated client cannot enumerate a customer's accounts (Vector 3)

| Field | Value |
|---|---|
| **Test Case ID** | TC-AZ-003 |
| **Title** | GET /services/bank/customers/{id}/accounts requires a valid authenticated session |
| **Type** | Security — Broken Access Control (IDOR, enumeration) |
| **Priority** | P1 |
| **OWASP mapping** | A01:2021 — Broken Access Control |
| **PCI-DSS mapping** | Requirement 7.1, 7.2 |
| **Automated** | ✅ Yes — `authorization.api.spec.ts`: `[SECURITY] user B should not enumerate accounts of customer A by customerId` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Authenticated client logs in as `john/demo` and retrieves `customerId` | Customer ID resolved |
| 2 | Unauthenticated client sends `GET /services/bank/customers/{customerId}/accounts` with no session cookie | Server rejects with HTTP 401 |
| 3 | Observe response body | No account list returned |

**Expected result:** HTTP 401 Unauthorized; no account list returned.
**Actual result:** 🐛 **FAIL — H-018 (Vector 3):** server returns HTTP 200 with the full account list (10+ accounts with live balances) for the requested `customerId`, with no authentication. Since `customerId` is a sequential integer, this is enumerable by a simple brute-force script.
**Bug reference:** H-018 — `docs/bugs/H-018-idor-cross-account-access.md`

---

## Bug summary — Authorization module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-018 | TC-AZ-001, TC-AZ-003 | Critical | Unauthenticated access to account data and customer account enumeration — no session required at all |
| N/A | TC-AZ-002 | N/A — test blocked | Cross-user IDOR vector cannot be verified due to environment blocker (P-004); risk remains **unverified**, not confirmed absent |

**Important framing for interviews:** 2 out of 3 vectors are *confirmed* critical
findings. The third (cross-user IDOR while both parties are authenticated) is
explicitly **not the same as "passing"** — it is unverified due to a test
environment defect unrelated to the application under test. Reporting TC-AZ-002
as passing would misrepresent the actual security posture. This distinction —
blocked vs. verified-safe — is deliberately preserved here and in
`authorization.api.spec.ts` via `test.skip()` rather than a false green.