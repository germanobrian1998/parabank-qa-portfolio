# Test Cases — API Contract Module

| Field | Value |
|---|---|
| **Module** | API Contract / Schema Validation (Zod) |
| **Risk level** | Medium-High — undetected breaking changes silently corrupt every downstream consumer |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `src/contracts/parabank.schemas.ts` · `docs/decisions/ADR-004-credential-management.md` |
| **Automated suite** | `tests/api/contract.api.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy
- User `john / demo` authenticated with an active session
- Schemas defined in `src/contracts/parabank.schemas.ts` are the single source
  of truth for both validation and TypeScript types (`ApiClient.ts` infers
  types from these schemas, not the other way around)

---

## Distinction from behavior tests

Contract tests verify **structure** (does the response have the right fields
with the right types?), not **behavior** (does the server accept/reject the
right inputs?). `tests/api/transfer.api.spec.ts` covers behavior (e.g. rejects
negative amounts — it doesn't, see H-007); this module covers structure only.
A schema-breaking change can go undetected by behavior tests if the changed
field doesn't affect that test's specific assertion — this is why both test
types are necessary and neither substitutes for the other.

---

## TC-CT-001 — Login response conforms to CustomerSchema

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-001 |
| **Title** | GET /login response matches the documented Customer contract |
| **Type** | Contract / Schema |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `GET /login should conform to CustomerSchema @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Call `login('john', 'demo')` | Response received |
| 2 | Validate response against `CustomerSchema` with `.safeParse()` | `success: true` |

**Expected result:** Response structure matches the schema exactly; no missing/extra/mistyped fields.
**Actual result:** ✅ Pass

---

## TC-CT-002 — Account response conforms to AccountSchema

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-002 |
| **Title** | GET /accounts/{id} response matches the documented Account contract |
| **Type** | Contract / Schema |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `GET /accounts/{id} should conform to AccountSchema` |

**Expected result:** Response validates against `AccountSchema` (id, customerId, type, balance with correct types).
**Actual result:** ✅ Pass

---

## TC-CT-003 — Account list response conforms to AccountListSchema, with ownership invariant

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-003 |
| **Title** | GET /customers/{id}/accounts returns only accounts owned by the requested customer |
| **Type** | Contract / Schema + Data integrity |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `GET /customers/{id}/accounts should conform to AccountListSchema` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Call `getAccountsForCustomer(customerId)` | Response received |
| 2 | Validate against `AccountListSchema` | `success: true` |
| 3 | Filter accounts where `customerId` field ≠ requested `customerId` | 0 foreign accounts |

**Expected result:** All accounts in the response structurally match the schema **and** belong to the requesting customer — a second, business-level invariant layered on top of pure schema validation.
**Actual result:** ✅ Pass

---

## TC-CT-004 — Transaction list conforms to TransactionListSchema, with ledger integrity invariant

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-004 |
| **Title** | GET /accounts/{id}/transactions returns only transactions belonging to that account |
| **Type** | Contract / Schema + Data integrity |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `GET /accounts/{id}/transactions should conform to TransactionListSchema` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Retrieve transactions for a known account | Response received |
| 2 | Validate against `TransactionListSchema` | `success: true` |
| 3 | Filter transactions where `accountId` ≠ requested account | 0 foreign transactions |

**Expected result:** No cross-account contamination in the transaction ledger response.
**Actual result:** ✅ Pass

---

## TC-CT-005 — Account balance field must remain numeric

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-005 |
| **Title** | account.balance is always a finite number, never a string or NaN |
| **Type** | Contract / Breaking-change detection |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `account balance must be numeric — string balance breaks all financial calculations` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Retrieve an account | balance field present |
| 2 | Assert `typeof balance === 'number'` | true |
| 3 | Assert `!isNaN(balance)` and `isFinite(balance)` | both true |

**Expected result:** Balance is always a well-formed number. This is the single most common breaking change in Java serializer configuration changes — a string balance silently breaks every downstream arithmetic operation.
**Actual result:** ✅ Pass

---

## TC-CT-006 — Transaction amount field must remain numeric

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-006 |
| **Title** | transaction.amount is always numeric across the full transaction list |
| **Type** | Contract / Breaking-change detection |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `transaction amount must be numeric — string amount breaks ledger calculations` |

**Expected result:** Every transaction in the returned list has a numeric `amount` field.
**Actual result:** ✅ Pass

---

## TC-CT-007 — Account type is restricted to the documented enum

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-007 |
| **Title** | account.type is always one of CHECKING, SAVINGS, or LOAN |
| **Type** | Contract / Breaking-change detection |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `account type must be one of the three valid enum values` |

**Expected result:** No account is returned with a type outside the three documented values — a new type appearing here without warning would indicate an undocumented backend change.
**Actual result:** ✅ Pass

---

## TC-CT-008 — Loan response conforms to LoanResponseSchema

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-008 |
| **Title** | POST /requestLoan response matches the documented LoanResponse contract |
| **Type** | Contract / Schema |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `contract.api.spec.ts`: `POST /requestLoan should conform to LoanResponseSchema @smoke` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit a loan request | Response received, or error if P-002 (corrupted WSDL state) is active |
| 2 | If error: `test.skip()` with explanation | Test does not fail on an unrelated precondition failure |
| 3 | If success: validate against `LoanResponseSchema` | `success: true` |

**Expected result:** When the loan provider returns a successful response, its shape matches the contract — including the corrected types discovered during development (`responseDate` as epoch `number` not `string`; `accountId` as `number | null | undefined` to account for explicit `null` on rejection).
**Actual result:** ✅ Pass (or skipped when WSDL precondition fails — see note below)

**Design note:** this test uses `.catch()` with an internal `test.skip()` rather
than `test.fail()`. A 4xx response from a corrupted WSDL state (P-002) is a
precondition failure, not a schema violation — asserting schema conformance
against an error response would produce a misleading, unrelated failure.

---

## TC-CT-009 — Registration and immediate login conform to CustomerSchema (BLOCKED)

| Field | Value |
|---|---|
| **Test Case ID** | TC-CT-009 |
| **Title** | A newly registered user's subsequent login response conforms to CustomerSchema |
| **Type** | Contract / Schema |
| **Priority** | P2 |
| **Automated** | ⏭️ Blocked — `contract.api.spec.ts`: `POST /register.htm should create a user and allow subsequent login @smoke` (`test.skip()`) |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Register a new user with a dynamic, timestamped username | Registration succeeds |
| 2 | Log in with those same credentials | Login succeeds |
| 3 | Validate login response against `CustomerSchema` | `success: true` |

**Expected result:** N/A — blocked before assertion.
**Actual result:** ⏭️ **BLOCKED (P-004):** identical root cause to TC-AZ-002. The registration endpoint rejects any new username as a duplicate when called via Playwright's `APIRequestContext`, even though the exact same request pattern succeeds via curl. See `PENDING.md` P-004 for the full investigation.

---

## Bug/blocker summary — Contract module

| ID | TC | Type | Description |
|---|---|---|---|
| P-004 | TC-CT-009 | Environment blocker (not an app bug) | Registration via `APIRequestContext` produces false "username already exists" — blocks contract verification of the register→login path |

**8 out of 9 test cases pass**, confirming the API contract is stable and no
schema-breaking change is currently present. This is a meaningfully different
statement from "no bugs exist" — contract tests validate structure, and the
absence of structural drift here coexists with the 13 behavioral bugs (H-007
to H-019) documented elsewhere. Structure being correct does not imply
behavior is correct.