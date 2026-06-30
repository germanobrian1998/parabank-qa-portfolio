# Test Summary Report — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | TSR-001 |
| **Version** | 1.0 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Test cycle** | 2025-05 to 2026-06 |
| **System Under Test** | Parabank Banking Demo — `germanobrian1998/parabank:latest` |
| **Audience** | Project stakeholders · QA leads · Hiring reviewers |

---

## Executive summary

The Parabank QA portfolio project completed a full test cycle covering end-to-end, API, performance, accessibility, and security testing against a containerized banking demo application. The suite comprises **82 tests** across 6 test types.

**77 tests pass**. The remaining **5 are skipped** for documented environmental reasons (variable DB state between runs). **0 unexpected failures** exist in CI — every known failure is explicitly marked `test.fail()` with a bug ID and rationale.

**13 bugs were discovered** during the test cycle, including 4 Critical-severity findings with regulatory implications under PCI-DSS. All bugs are documented with formal reports, reproduction steps, and automated regression cases that will detect any future fix.

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

### Critical findings

| Bug ID | Module | Description | Regulatory impact |
|---|---|---|---|
| H-007 | Transfers · Bill Pay · Loans | Server accepts negative monetary amounts across all financial flows; negative transfer inverts direction of funds | PCI-DSS Req. 6.2.4 |
| H-010 | Transfers | Overdraft allowed — server executes transfers exceeding available balance without error | PCI-DSS Req. 6.3.3 |
| H-018 | REST API | IDOR — account balances and customer data accessible without authentication via sequential customer ID enumeration | PCI-DSS Req. 7.1, 7.2 · OWASP A01:2021 |
| H-015 | Loans | Server accepts negative loan amounts; credit evaluation runs on negative principal | PCI-DSS Req. 6.2.4 |

### High-severity findings

| Bug ID | Module | Description |
|---|---|---|
| H-008 | Transfers | Double-submit creates duplicate transactions — both succeed silently |
| H-011 | Authentication | UI accepts duplicate username registration; server rejects correctly but UI does not process the error response |
| H-014 | Bill Pay | Mismatched payee account numbers not validated server-side — bypass via direct API call |

### Medium-severity findings

| Bug ID | Module | Description |
|---|---|---|
| H-009 | Authentication | Session not invalidated server-side after logout — JSESSIONID remains valid |
| H-012 | Registration | Server accepts registration with empty required fields |
| H-013 | Accounts | New accounts initialized with $100 instead of $0.00 |
| H-016 | Transfers | $0.00 transfers accepted — phantom entries in transaction ledger |
| H-017 | Transfers | Self-transfers accepted — phantom debit/credit pair recorded in history |

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
| Performance | ✅ Full | Baseline · Stress · Soak — results in `docs/performance-baseline.md` |
| Accessibility | ✅ Full | 26 WCAG 2.1 AA violations baselined across 5 pages |
| PCI-DSS mapping | ✅ Full | SAQ A requirements mapped in `docs/pci-dss-coverage.md` |
| DB-layer validation | ⚠️ Compensated | HSQLDB limitation — API-as-proxy approach; see `docs/sql-validation-approach.md` |
| Cross-browser | ❌ Out of scope | Chromium only — see test plan section 1 |
| Loan provider integration | ❌ Excluded | WSDL corruption — see `docs/not-automated.md` |

---

## Performance results summary

| Script | Metric | Target | Result |
|---|---|---|---|
| Login baseline | p95 response time | < 500ms | Documented in `docs/performance-baseline.md` |
| Transfer stress | p95 response time under load | < 800ms | Documented in `docs/performance-baseline.md` |
| Accounts soak | Error rate over 30 min | < 1% | Documented in `docs/performance-baseline.md` |

> Full numbers in `docs/performance-baseline.md`. k6 scripts in `tests/performance/`.

---

## Accessibility results summary

**26 WCAG 2.1 AA violations** identified across 5 pages via axe-core. Violations are baselined — the threshold is set to detect regressions against this baseline, not enforce zero violations on a legacy demo application.

Full breakdown in `docs/accessibility-report.md`.

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

---

## Conclusions

The test cycle achieved its primary objectives:

1. **All critical financial flows are covered** with automated regression cases that run on every push and nightly
2. **13 bugs were discovered**, including 4 critical findings with PCI-DSS implications — demonstrating that the framework finds real problems, not just validates happy paths
3. **The suite is stable** — 0 flaky tests, 0 unexpected failures, consistent results across CI runs
4. **The environment is reproducible** — Docker image, seeded data, and CI pipeline allow any reviewer to reproduce all findings from scratch
5. **Known limitations are documented honestly** — HSQLDB constraints, excluded scenarios, and open bugs are all traceable to explicit decisions with rationale

The framework architecture (Playwright + TypeScript + Zod + k6 + axe-core + GitHub Actions DAG) is designed to scale: the patterns established here transfer directly to a production fintech stack with PostgreSQL, microservices, and full parallelism.