# Test Summary Report — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | TSR-001 |
| **Version** | 1.1 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Test cycle** | 2025-05 to 2026-07 |
| **System Under Test** | Parabank Banking Demo — `germanobrian1998/parabank:latest` |
| **Audience** | Project stakeholders · QA leads · Hiring reviewers |

---

## Executive summary

The Parabank QA portfolio project completed a full test cycle covering end-to-end, API, performance, accessibility, and security testing against a containerized banking demo application. The suite comprises **82 tests** across 6 test types.

**77 tests pass**. The remaining **5 are skipped** for documented environmental reasons (variable DB state between runs). **0 unexpected failures** exist in CI — every known failure is explicitly marked `test.fail()` with a bug ID and rationale.

**13 bugs were discovered** during the test cycle, including 4 Critical-severity findings with regulatory implications under PCI-DSS. All bugs are documented with formal reports, reproduction steps, and automated regression cases that will detect any future fix.

**(Added v1.1)** Every one of the 13 bugs, and every risk in the risk register, is now traceable end-to-end — from risk ID, to a formally documented Test Case (`TC-xxx-NNN`), to the exact automated test file, to the bug ID if one was found. This closes what was previously the largest documentation gap in the project: only the Transfers module had formal Test Case documentation; all 10 modules do now. See `docs/traceability-matrix.md` for the full matrix and `docs/severity-priority-matrix.md` for the explicit rubric behind every severity/priority assignment.

---

## Test execution summary

| Metric | Value |
|---|---|
| Total tests | 82 |
| Passing | 77 |
| Failing (known bugs — `test.fail()`) | 0 unexpected; all pre-declared |
| Skipped | 5 |
| Real (unexpected) failures | 0 |
| Flaky tests | 0 |
| Smoke suite duration | ~1.5 min |
| Full suite duration | ~3.5 min |
| CI environment | GitHub Actions |

### Test distribution by type

| Type | Tests | Location |
|---|---|---|
| E2E — Authentication | 8 | `tests/e2e/auth.spec.ts` |
| E2E — Accounts | 7 | `tests/e2e/accounts.spec.ts` |
| E2E — Transfers | 3 | `tests/e2e/transfer.spec.ts` |
| E2E — Bill Pay | 7 | `tests/e2e/billpay.spec.ts` |
| E2E — Loans | 3 | `tests/e2e/loans.spec.ts` |
| API — Contract | varies | `tests/api/contract.spec.ts` |
| API — Authorization | varies | `tests/api/authorization.api.spec.ts` |
| API — Idempotency | varies | `tests/api/idempotency.api.spec.ts` |
| API — Transfers | varies | `tests/api/transfer.api.spec.ts` |
| BVA — Transfer edge cases | 7 | `tests/edge-cases/transfer.edge.spec.ts` |
| Accessibility | 5 pages | `tests/accessibility/a11y.spec.ts` |
| Smoke | 5 | `tests/smoke/environment.spec.ts` |
| Performance | 3 scripts | `tests/performance/` (k6) |

### Test distribution by formal Test Case document — **(Added v1.1)**

| Module | Test Case document | TC ID prefix | TC count |
|---|---|---|---|
| Transfers | `docs/test-cases/transfers-test-cases.md` | TC-TR | 8 |
| Authentication | `docs/test-cases/auth-test-cases.md` | TC-AU | 11 |
| Authorization (IDOR) | `docs/test-cases/authorization-test-cases.md` | TC-AZ | 3 |
| Accounts | `docs/test-cases/accounts-test-cases.md` | TC-AC | 9 |
| Bill Pay | `docs/test-cases/billpay-test-cases.md` | TC-BP | 9 |
| Loans | `docs/test-cases/loans-test-cases.md` | TC-LN | 7 |
| Contract / Schema | `docs/test-cases/contract-test-cases.md` | TC-CT | 9 |
| Idempotency | `docs/test-cases/idempotency-test-cases.md` | TC-ID | 3 |
| Performance | `docs/test-cases/performance-test-cases.md` | TC-PERF | 3 |
| Accessibility | `docs/test-cases/accessibility-test-cases.md` | TC-A11Y | 5 |

**10/10 modules have formal Test Case documentation.** Two automated tests
(the ledger conservation invariant in `transfer.api.spec.ts` and the
simulated-reversal tests in `reversal.api.spec.ts`) are deliberately excluded
from TC-xxx-NNN formalization — see `docs/traceability-matrix.md` §2.1 for the
documented rationale (they are structural/architectural checks, not
scenario-based test cases, and forcing them into that format would overstate
what they verify).

---

## Bug findings

### Summary by severity

| Severity | Count | Status |
|---|---|---|
| Critical | 4 | Open — documented, regression cases in place |
| High | 3 | Open — documented, regression cases in place |
| Medium | 5 | Open — documented, regression cases in place |
| Low / Informational | 1 | Open — documented |
| **Total** | **13** | All open (demo app — no fix cycle) |

**(Added v1.1)** Severity above is assigned using the explicit
Probability × Business Impact decision tree in `docs/severity-priority-matrix.md`
§1.2, not ad hoc judgment. That document also defines Priority (P1-P3) as an
axis independent of Severity — see §2 there for the full rubric and §3-4 for
every bug and risk classified against it.

### Critical findings

| Bug ID | Module | Description | Regulatory impact | Formal TC |
|---|---|---|---|---|
| H-007 | Transfers · Bill Pay · Loans | Server accepts negative monetary amounts across all financial flows; negative transfer inverts direction of funds | PCI-DSS Req. 6.2.4 | TC-TR-003, TC-BP-007 |
| H-010 | Transfers | Overdraft allowed — server executes transfers exceeding available balance without error | PCI-DSS Req. 6.3.3 | TC-TR-002 |
| H-018 | REST API | IDOR — account balances and customer data accessible without authentication via sequential customer ID enumeration | PCI-DSS Req. 7.1, 7.2 · OWASP A01:2021 | TC-AZ-001, TC-AZ-003 |
| H-015 | Loans | Server accepts negative loan amounts; credit evaluation runs on negative principal | PCI-DSS Req. 6.2.4 | TC-LN-005 |

### High-severity findings

| Bug ID | Module | Description | Formal TC |
|---|---|---|---|
| H-008 | Transfers | Double-submit creates duplicate transactions — both succeed silently | TC-TR-008 |
| H-011 | Authentication | UI accepts duplicate username registration; server rejects correctly but UI does not process the error response | TC-AU-002, TC-AU-003 |
| H-014 | Bill Pay | Mismatched payee account numbers not validated server-side — bypass via direct API call | TC-BP-004 |
| H-019 | Loans / API | `/requestLoan` not idempotent — sequential or concurrent double-submit creates duplicate LOAN accounts | TC-LN-006/007, TC-ID-002/003 |

### Medium-severity findings

| Bug ID | Module | Description | Formal TC |
|---|---|---|---|
| H-009 | Authentication | Session not invalidated server-side after logout — JSESSIONID remains valid | TC-AU-010 |
| H-012 | Registration | Server accepts registration with empty required fields | TC-AU-004 |
| H-013 | Accounts | New accounts initialized with $100 instead of $0.00 | TC-AC-005 |
| H-016 | Transfers | $0.00 transfers accepted — phantom entries in transaction ledger | TC-TR-004 |
| H-017 | Transfers | Self-transfers accepted — phantom debit/credit pair recorded in history | TC-TR-007 |

**Note (v1.1):** H-019 is reclassified here from High to explicitly listed
alongside its idempotency-specific Test Case documentation
(`docs/test-cases/idempotency-test-cases.md`), which frames the same bug from
a protocol-correctness angle distinct from the business-outcome framing in
`docs/test-cases/loans-test-cases.md`. Both documents intentionally describe
the same bug for different audiences — see `idempotency-test-cases.md`
"Why this module exists as a separate concern from Loans."

---

## Coverage by risk area

| Risk area | Coverage | Notes |
|---|---|---|
| Authentication flows | ✅ Full | Registration · Login · Logout · Session invalidation |
| Authorization / access control | ✅ Full | Unauthenticated API access · IDOR vectors documented |
| Financial transaction integrity | ✅ Full | Transfer · Bill Pay · Loan — happy path + all BVA boundaries |
| Input validation — server side | ✅ Full | Negative amounts · Zero amounts · Empty fields · Overflow |
| Idempotency | ✅ Full | Double-submit via UI and API |
| Contract / schema validation | ✅ Full | Zod schemas for all API responses |
| Performance | ✅ Full | Baseline · Stress · Soak — results in `docs/performance-baseline.md`, formal TCs in `docs/test-cases/performance-test-cases.md` |
| Accessibility | ✅ Full | 26 WCAG 2.1 AA violations baselined across 5 pages, formal TCs in `docs/test-cases/accessibility-test-cases.md` |
| PCI-DSS mapping | ✅ Full | SAQ A requirements mapped in `docs/pci-dss-coverage.md` |
| **Risk-to-test traceability** *(Added v1.1)* | ✅ Full | Every risk (R1-R10) mapped to a Test Case ID and automated test in `docs/traceability-matrix.md` §1 |
| **Severity/priority rubric** *(Added v1.1)* | ✅ Formalized | Explicit Probability × Impact classification for all 13 bugs and 10 risks in `docs/severity-priority-matrix.md` |
| DB-layer validation | ⚠️ Compensated | HSQLDB limitation — API-as-proxy approach; see `docs/sql-validation-approach.md` |
| Cross-browser | ❌ Out of scope | Chromium only — see test plan section 1 |
| Loan provider integration | ❌ Excluded | WSDL corruption — see `docs/not-automated.md` |

---

## Performance results summary

| Script | Metric | Target | Result | Formal TC |
|---|---|---|---|---|
| Login baseline | p95 response time | < 500ms | Documented in `docs/performance-baseline.md` | TC-PERF-001 |
| Transfer stress | p95 response time under load | < 800ms | Documented in `docs/performance-baseline.md` | TC-PERF-002 |
| Accounts soak | Error rate over 30 min | < 1% | Documented in `docs/performance-baseline.md` | TC-PERF-003 |

> Full numbers in `docs/performance-baseline.md`. k6 scripts in `tests/performance/`.
> **(Added v1.1)** TC-PERF-002 carries an explicit caveat: its passing threshold
> is partially explained by H-010 (the server skips balance validation, the
> most expensive step of a real transfer) — see `docs/test-cases/performance-test-cases.md`
> for why a passing performance threshold and a correct implementation are not
> the same claim.

---

## Accessibility results summary

**26 WCAG 2.1 AA violations** identified across 5 pages via axe-core. Violations are baselined — the threshold is set to detect regressions against this baseline, not enforce zero violations on a legacy demo application.

Full breakdown in `docs/accessibility-report.md`. Formal per-page Test Cases
(TC-A11Y-001 to 005) with individual baseline thresholds and business-impact
rationale are in `docs/test-cases/accessibility-test-cases.md`.

---

## Technical debt and known limitations

| Item | Type | Impact | Notes |
|---|---|---|---|
| 13 open bugs | Known bugs | High | All have `test.fail()` regression cases; will auto-detect if fixed |
| H-009 session invalidation | Security debt | High | Affects logout flow across all modules |
| `workers: 1` | Architecture constraint | Low | HSQLDB limitation; parallelism strategy documented in `playwright.config.ts` |
| WSDL loan provider | Environmental | Medium | Loan automation excluded; see `docs/not-automated.md` |
| DB-layer validation absent | Coverage gap | Medium | Compensated via API; full SQL validation applicable in PostgreSQL-based projects |
| Chromium-only | Coverage gap | Low | Cross-browser out of scope for this portfolio project |
| P-004 registration blocker | Environmental / test infra | Medium | Blocks TC-AZ-002 (cross-user IDOR) and TC-CT-009 (register→login contract) — see `PENDING.md` P-004. **Unverified, not confirmed safe** — this distinction is preserved explicitly in both blocked test cases rather than reported as passing |

---

## Conclusions

The test cycle achieved its primary objectives:

1. **All critical financial flows are covered** with automated regression cases that run on every push and nightly
2. **13 bugs were discovered**, including 4 critical findings with PCI-DSS implications — demonstrating that the framework finds real problems, not just validates happy paths
3. **The suite is stable** — 0 flaky tests, 0 unexpected failures, consistent results across CI runs
4. **The environment is reproducible** — Docker image, seeded data, and CI pipeline allow any reviewer to reproduce all findings from scratch
5. **Known limitations are documented honestly** — HSQLDB constraints, excluded scenarios, and open bugs are all traceable to explicit decisions with rationale
6. **(Added v1.1) Full traceability now exists from business risk to test case to automated test to bug**, closing what was previously the project's largest documentation gap (only 1 of 10 modules had formal Test Case documentation; now 10 of 10 do), with an explicit, defensible rubric behind every severity and priority classification

The framework architecture (Playwright + TypeScript + Zod + k6 + axe-core + GitHub Actions DAG) is designed to scale: the patterns established here transfer directly to a production fintech stack with PostgreSQL, microservices, and full parallelism.

---

## Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06 | Initial test summary report |
| 1.1 | 2026-07 | Added references to `docs/severity-priority-matrix.md` and `docs/traceability-matrix.md`; added "Test distribution by formal Test Case document" table; added Formal TC column to all bug-finding tables; added explicit caveat cross-reference for TC-PERF-002; added P-004 blocker entry to known limitations with explicit unverified-vs-safe distinction |