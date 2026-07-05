# Traceability Matrix — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | TM-001 |
| **Version** | 1.0 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/risk-based-strategy.md` · `docs/severity-priority-matrix.md` · `docs/test-cases/` · `docs/tech-discovery-report.md` |

---

## Purpose

This matrix answers a single question that no other document in this project
answers directly: **for a given business risk, which test case covers it, which
automated test implements that test case, and did it find a real bug?**

Without this matrix, that answer requires cross-referencing three separate
documents (`risk-based-strategy.md` for risks, `docs/test-cases/*.md` for test
cases, and `tech-discovery-report.md` for bugs) by hand. This document does
that cross-referencing once, so a reviewer — or an auditor — can verify
coverage in a single table instead of three.

**Coverage completeness note (updated 2026-07):** every module now has a
dedicated `docs/test-cases/*.md` file — Transfers, Auth, Authorization,
Accounts, Bill Pay, Loans, Contract, Idempotency, Performance, and
Accessibility. The **TC Status** column below reflects this; rows previously
marked "⚠️ Gap" have been updated to point at their corresponding formal
TC-xxx-xxx document. §2 and §3 retain the original gap analysis with a
closure note, so the history of *why* those documents were written is not
lost — only their current status changes.

---

## 1. Full traceability — Risk → Test Case → Automated Test → Bug

| Risk ID | Risk Description | Module | TC ID | TC Status | Automated Test (file) | Bug Found | Severity |
|---|---|---|---|---|---|---|---|
| R1 | Duplicate transfer via double-submit/retry | Transfers | TC-TR-008 | ✅ Formal | `tests/e2e/transfer.spec.ts` (insufficient funds overdraft path) · `tests/api/idempotency.api.spec.ts` | H-008 | High |
| R2 | Stale balance in UI post-transfer | Transfers | TC-TR-001 | ✅ Formal | `tests/e2e/transfer.spec.ts` — `should confirm transfer and reflect updated balance` | None (passing) | — |
| R3 | Client-only amount validation, API bypass | Transfers / Bill Pay / Loans | TC-TR-003 | ✅ Formal | `tests/api/transfer.api.spec.ts` · `tests/e2e/billpay.spec.ts` · `tests/e2e/loans.spec.ts` | H-007, H-015 | Critical |
| R3 (overdraft variant) | Insufficient balance not validated | Transfers | TC-TR-002 | ✅ Formal | `tests/e2e/transfer.spec.ts` · `tests/api/transfer.api.spec.ts` | H-010 | Critical |
| — (BVA lower boundary) | $0.00 transfer accepted | Transfers | TC-TR-004 | ✅ Formal | `tests/edge-cases/transfer.edge.spec.ts` | H-016 | Medium |
| — (BVA lower boundary, valid) | $0.01 minimum transfer accepted | Transfers | TC-TR-005 | ✅ Formal | `tests/edge-cases/transfer.edge.spec.ts` | None (passing) | — |
| — (destination validity) | Transfer to nonexistent account | Transfers | TC-TR-006 | ✅ Formal | `tests/edge-cases/transfer.edge.spec.ts` | None (passing) | — |
| — (identity boundary) | Self-transfer accepted | Transfers | TC-TR-007 | ✅ Formal | `tests/edge-cases/transfer.edge.spec.ts` | H-017 | Medium |
| R9 | UI/DB balance inconsistency post-transfer | Transfers | *(covered structurally, no dedicated TC)* | ⚠️ Gap (accepted — see note below) | `tests/api/transfer.api.spec.ts` — `total balance across all accounts should be conserved` | None (passing — invariant holds) | — |
| R4 | Session not invalidated on logout | Auth | TC-AU-010 | ✅ Formal | `tests/e2e/auth.spec.ts` — `[BUG H-009] should not allow access to protected pages after logout` | H-009 | Medium |
| R6 | Duplicate username accepted without clear error | Auth | TC-AU-003 | ✅ Formal | `tests/e2e/auth.spec.ts` — `[BUG] should reject registration with duplicate username` | H-011 (UI layer only) | High (UI) |
| — (registration validation) | Empty required fields accepted | Auth | TC-AU-004 | ✅ Formal | `tests/e2e/auth.spec.ts` — `[BUG] should show validation error when required fields are empty` | H-012 | Medium |
| — (registration → login) | Newly registered user cannot log in immediately | Auth | TC-AU-002 | ✅ Formal | `tests/e2e/auth.spec.ts` — `[BUG] should allow login with newly registered credentials` | H-011 (extended) | High |
| R10 | Wrong account type assigned on opening | Accounts | TC-AC-006 | ✅ Formal | `tests/e2e/accounts.spec.ts` — `should display correct account type label` | None (passing) | — |
| — (initial balance) | New account funded with $100 instead of $0 | Accounts | TC-AC-005 | ✅ Formal | `tests/e2e/accounts.spec.ts` — `[BUG] should display $0.00 initial balance` | H-013 | Medium |
| — (auth enforcement) | Overview accessible without authentication | Accounts | TC-AC-008 | ✅ Formal | `tests/e2e/accounts.spec.ts` — `should not show account overview to unauthenticated user` | H-009 (extended) | Medium |
| R8 | Bill Pay to nonexistent/mismatched destination account | Bill Pay | TC-BP-004 | ✅ Formal | `tests/e2e/billpay.spec.ts` — `[BUG H-014] should reject payment when account number and verify account do not match` | H-014 | High |
| — (financial validation) | Negative bill payment amount accepted | Bill Pay | TC-BP-007 | ✅ Formal | `tests/e2e/billpay.spec.ts` — `[BUG H-007] should reject payment with negative amount` | H-007 (extended) | Critical |
| — (auth enforcement) | Bill Pay accessible without authentication | Bill Pay | TC-BP-009 | ✅ Formal | `tests/e2e/billpay.spec.ts` — `[BUG H-009] should not allow bill pay to unauthenticated user` | H-009 (extended) | Medium |
| R5 | Loan created with inconsistent amount/down-payment data | Loans | TC-LN-003, TC-LN-004 | ✅ Formal | `tests/e2e/loans.spec.ts` — `should deny a loan with zero down payment` · `should deny a loan when requested amount is too high` | None (passing — server denies correctly) | — |
| — (financial validation) | Negative loan amount accepted | Loans | TC-LN-005 | ✅ Formal | `tests/e2e/loans.spec.ts` — `[BUG H-015] should reject a loan request with a negative amount` | H-015 | Critical |
| — (idempotency) | Duplicate loan request creates duplicate LOAN accounts | Loans / API | TC-LN-006, TC-LN-007 / TC-ID-002, TC-ID-003 | ✅ Formal | `tests/api/idempotency.api.spec.ts` — Vector 1 (sequential) and Vector 2 (concurrent) | H-019 | High |
| — (access control) | Unauthenticated access to account data via REST API | API — Authorization | TC-AZ-001, TC-AZ-003 | ✅ Formal | `tests/api/authorization.api.spec.ts` — Vector 1, Vector 3 | H-018 | Critical |
| — (access control, cross-user) | User B accesses accounts belonging to user A | API — Authorization | TC-AZ-002 | ✅ Formal (blocked) | `tests/api/authorization.api.spec.ts` — Vector 2 | Blocked (P-004) — `test.skip()` | N/A |
| — (contract) | API response schema drift (breaking changes undetected) | API — Contract | TC-CT-001 to TC-CT-009 | ✅ Formal | `tests/api/contract.api.spec.ts` — 9 schema validation tests | None (passing — schemas hold) | — |
| — (reconciliation) | Transfer→reversal cycle loses or creates funds | API — Reversal | *(none — see note below)* | ⚠️ Gap (accepted) | `tests/api/reversal.api.spec.ts` | None (passing — invariant holds) | — |

---

## 2. Coverage gap summary — CLOSED (2026-07)

At the time this matrix was first written, only Transfers had a formal
`docs/test-cases/*.md` file. The table below is kept as a historical record of
what was identified as missing and has since been closed — deleting this
section would erase the evidence of the gap-analysis process itself, which is
part of what this matrix is meant to demonstrate.

| Module | Automated coverage | Test Case doc | Status |
|---|---|---|---|
| Authentication | 11 tests (`auth.spec.ts`) | `docs/test-cases/auth-test-cases.md` | ✅ Written |
| Authorization (IDOR) | 3 vectors (`authorization.api.spec.ts`) | `docs/test-cases/authorization-test-cases.md` | ✅ Written |
| Accounts | 9 tests (`accounts.spec.ts`) | `docs/test-cases/accounts-test-cases.md` | ✅ Written |
| Bill Pay | 9 tests (`billpay.spec.ts`) | `docs/test-cases/billpay-test-cases.md` | ✅ Written |
| Loans | 5 tests (`loans.spec.ts`) | `docs/test-cases/loans-test-cases.md` | ✅ Written |
| Contract / Schema | 9 tests (`contract.api.spec.ts`) | `docs/test-cases/contract-test-cases.md` | ✅ Written |
| Idempotency | 3 tests (`idempotency.api.spec.ts`) | `docs/test-cases/idempotency-test-cases.md` | ✅ Written |
| Performance (k6) | 3 scripts | `docs/test-cases/performance-test-cases.md` | ✅ Written |
| Accessibility (axe-core) | 5 pages | `docs/test-cases/accessibility-test-cases.md` | ✅ Written |

### 2.1 Remaining accepted gaps (deliberate, not oversight)

Two automated tests remain without a dedicated TC-xxx-xxx entry, by decision
rather than by omission:

| Test | Why no dedicated TC was written |
|---|---|
| `transfer.api.spec.ts` — total balance conservation invariant (R9) | This is a structural/architectural invariant check (the ledger's total balance is conserved), not a scenario-based test case in the TC-xxx-xxx sense — it doesn't have "steps a human tester would follow," it's an assertion over aggregate state. It's documented inline in `traceability-matrix.md` §1 instead. |
| `reversal.api.spec.ts` (3 tests) | These tests explicitly simulate a reversal via an inverse transfer — documented in the file's own header as **not** equivalent to a real reversal endpoint (no idempotency guarantee, no reference to the original transaction). Writing a formal TC-xxx-xxx for a simulated capability risks implying more confidence in reversal behavior than the tests actually provide. The limitation is better preserved as prose in the test file itself than formalized into a TC ID that looks equivalent to the others. |

This distinction — between "not yet written" (closed in this update) and
"deliberately not written" (documented here) — is intentional. A gap closed by
adding paperwork and a gap closed by deciding the paperwork wouldn't add value
are different outcomes, and collapsing them into the same checkmark would
misrepresent the project's actual state.

---

## 3. Reverse traceability — every bug, where it's covered

This second view starts from the bug and works backward, confirming no known
bug is undocumented in test form. Useful for a "show me evidence for bug X"
conversation in an interview.

| Bug ID | Severity | Covered by (automated test) | Covered by (formal TC)? |
|---|---|---|---|
| H-007 | Critical | `transfer.api.spec.ts`, `transfers.spec.ts`, `billpay.spec.ts` | ✅ TC-TR-003, TC-BP-007 |
| H-008 | High | `transfer.spec.ts`, `idempotency.api.spec.ts` | ✅ TC-TR-008 |
| H-009 | Medium | `auth.spec.ts`, `accounts.spec.ts`, `billpay.spec.ts` | ✅ TC-AU-010, TC-AC-008, TC-BP-009 |
| H-010 | Critical | `transfer.spec.ts`, `transfer.api.spec.ts` | ✅ TC-TR-002 |
| H-011 | High (UI) | `auth.spec.ts` (2 tests) | ✅ TC-AU-002, TC-AU-003 |
| H-012 | Medium | `auth.spec.ts` | ✅ TC-AU-004 |
| H-013 | Medium | `accounts.spec.ts` | ✅ TC-AC-005 |
| H-014 | High | `billpay.spec.ts` | ✅ TC-BP-004 |
| H-015 | Critical | `loans.spec.ts` | ✅ TC-LN-005 |
| H-016 | Medium | `transfer.edge.spec.ts` | ✅ TC-TR-004 |
| H-017 | Medium | `transfer.edge.spec.ts` | ✅ TC-TR-007 |
| H-018 | Critical | `authorization.api.spec.ts` (Vectors 1, 3) | ✅ TC-AZ-001, TC-AZ-003 |
| H-019 | High | `idempotency.api.spec.ts` (Vectors 1, 2) | ✅ TC-LN-006/007, TC-ID-002/003 |

**Result: 13/13 bugs have automated regression coverage. 13/13 now have
formal Test Case documentation (100%/100%).** The two accepted gaps noted in
§2.1 (R9's ledger invariant and the simulated-reversal tests) are not bugs —
they're passing structural checks with no defect attached, which is why they
sit outside this bug-anchored table entirely.

---

## 4. How to maintain this matrix

- Any new risk added to `risk-based-strategy.md` gets a row here before its
  test is considered "done" — a test without a traced risk is untethered from
  business justification.
- Any new bug found gets added to §3 immediately, even before its formal Test
  Case document exists (mark TC as ❌ Gap rather than delaying the bug entry).
- When a `docs/test-cases/*.md` file is written for a gap module, update the
  TC Status column in §1 and §2 in the same PR — the matrix and the test case
  docs must never drift out of sync.

---

*Cross-referenced by: `docs/severity-priority-matrix.md` · `docs/test-plan.md` · `docs/test-summary-report.md`*