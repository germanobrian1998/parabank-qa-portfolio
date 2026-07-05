# Test Plan — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | TP-001 |
| **Version** | 1.2 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Date** | 2026-06 (originally) · updated 2026-07 |
| **System Under Test** | Parabank Banking Demo — `germanobrian1998/parabank:latest` |

---

## 1. Scope

### In scope

| Module | Coverage type |
|---|---|
| Authentication (registration, login, logout) | E2E · API · Security |
| Account management (open account, overview, detail) | E2E |
| Fund transfers | E2E · API · BVA edge cases · Performance |
| Bill Pay | E2E |
| Loan requests | E2E |
| REST API layer (all modules) | Contract · Authorization · Idempotency |
| Accessibility | WCAG 2.1 AA audit (5 pages) |
| Performance | Baseline · Stress · Soak |
| Environment integrity | Smoke checks pre-suite |

### Out of scope

| Area | Reason |
|---|---|
| Cross-browser testing | Chromium-only scope for portfolio project; cross-browser requires additional CI infrastructure |
| Mobile / responsive layout | Parabank is a desktop banking UI; no mobile breakpoints declared |
| Load balancing / multi-instance | Single Docker container; distributed deployment not part of SUT |
| Loan provider WSDL integration | WSDL loan provider in this image returns corrupted responses — see `docs/not-automated.md` |
| Direct DB validation | HSQLDB embedded mode does not expose external port — see ADR-004 and `docs/sql-validation-approach.md` |
| Penetration testing | OWASP findings documented as bugs; full pentest outside portfolio scope |

---

## 2. Test objectives

1. Verify that all critical financial flows (transfer, bill pay, account creation) execute correctly under normal conditions
2. Verify that the system rejects invalid inputs at the server layer, not only at the client layer
3. Document server-side validation gaps with formal bug reports and automated regression cases
4. Verify that authenticated endpoints enforce access control (authentication + authorization)
5. Establish performance baselines for login, transfer, and account endpoints under load
6. Verify WCAG 2.1 AA compliance on the five highest-traffic pages
7. Provide a reproducible, containerized test environment that produces consistent results across runs
8. **(Added v1.1)** Provide full risk-to-test-to-bug traceability for every module, with an explicit, documented rubric for severity and priority classification — not ad hoc judgment calls

---

## 3. Test types and approach

### 3.1 End-to-end (E2E)

**Tool:** Playwright 1.60 + TypeScript
**Pattern:** Page Object Model — one class per page, fixtures for session setup
**Data strategy:** hybrid — static fixtures for stable reference data (`john/demo`), factories for dynamic test data (registration, transfers, bill pay), API setup for preconditions

### 3.2 API testing

**Tool:** Playwright `APIRequestContext` + Zod contract validation
**Approach:** direct HTTP calls bypassing UI layer to verify server-side behavior independently of client-side validation
**Key scenarios:** contract shape validation, authorization vectors (unauthenticated access, cross-user IDOR), idempotency, negative amount acceptance

### 3.3 Performance testing

**Tool:** k6
**Scripts:** `login.baseline.k6.js` · `transfer.stress.k6.js` · `accounts.soak.k6.js`
**Metrics target:** p95 < 500ms for login; p95 < 800ms for transfer under stress; error rate < 1% during soak
**Formal test cases:** `docs/test-cases/performance-test-cases.md` (TC-PERF-001 to 003)

### 3.4 Accessibility testing

**Tool:** axe-core via `@axe-core/playwright`
**Standard:** WCAG 2.1 AA
**Pages covered:** login · registration · account overview · transfer · bill pay
**Baseline:** 26 violations documented in `docs/accessibility-report.md`; threshold set to detect regressions, not enforce zero violations on a legacy demo app
**Formal test cases:** `docs/test-cases/accessibility-test-cases.md` (TC-A11Y-001 to 005)

### 3.5 Exploratory testing

**Approach:** structured exploration documented in `docs/tech-discovery-report.md`
**Output:** 13 bugs (H-007 to H-019), architectural decisions (ADR-001 to ADR-006), risk register

### 3.6 Test case documentation approach — **(Added v1.1)**

Every module has a dedicated, formally structured Test Case document under
`docs/test-cases/`, each entry using a consistent `TC-xxx-NNN` ID scheme so
any test case can be referenced unambiguously in code review, bug reports, or
interview conversation without needing to describe it in prose:

| Module | Document | ID prefix |
|---|---|---|
| Transfers | `docs/test-cases/transfers-test-cases.md` | TC-TR |
| Authentication | `docs/test-cases/auth-test-cases.md` | TC-AU |
| Authorization (IDOR) | `docs/test-cases/authorization-test-cases.md` | TC-AZ |
| Accounts | `docs/test-cases/accounts-test-cases.md` | TC-AC |
| Bill Pay | `docs/test-cases/billpay-test-cases.md` | TC-BP |
| Loans | `docs/test-cases/loans-test-cases.md` | TC-LN |
| Contract / Schema | `docs/test-cases/contract-test-cases.md` | TC-CT |
| Idempotency | `docs/test-cases/idempotency-test-cases.md` | TC-ID |
| Performance | `docs/test-cases/performance-test-cases.md` | TC-PERF |
| Accessibility | `docs/test-cases/accessibility-test-cases.md` | TC-A11Y |

Two automated tests are deliberately excluded from formal TC documentation —
the ledger conservation invariant and the simulated-reversal tests — because
formalizing them as scenario-based test cases would misrepresent what they
actually verify. The rationale is documented in
`docs/traceability-matrix.md` §2.1, not silently omitted.

### 3.7 Severity and priority classification — **(Added v1.1)**

Every bug and every risk in this project is classified using a documented
Probability × Business Impact rubric, formalized in
`docs/severity-priority-matrix.md`. This replaces what was previously a
consistent-but-implicit judgment call with an explicit decision tree, so any
severity assignment can be defended by pointing to a rule rather than
re-litigating the specific bug.

---

## 4. Entry criteria

Before the test suite runs, the following conditions must be met:

| Criterion | Verified by |
|---|---|
| Parabank Docker container is running and healthy | `tests/smoke/environment.spec.ts` |
| Default seeded accounts exist for user `john/demo` | Smoke test — login assertion |
| Account balances are within expected ranges (not contaminated by prior stress tests) | Smoke test — balance range check |
| `BASE_URL` environment variable is set or defaults to `http://localhost:9090` | `playwright.config.ts` |
| No pending DB state from previous failed runs | `docker compose down -v && docker compose up -d` if smoke fails |

---

## 5. Exit criteria

The test cycle is considered complete when:

| Criterion | Target |
|---|---|
| All non-`test.fail()` tests pass | 100% |
| Known bugs covered by `test.fail()` are documented with bug ID | 100% |
| Real failures (unexpected failures not marked `test.fail()`) | 0 |
| Performance baselines recorded in `docs/performance-baseline.md` | ✅ |
| Accessibility violations baselined in `docs/accessibility-report.md` | ✅ |
| All findings documented in `docs/tech-discovery-report.md` | ✅ |
| **(Added v1.1)** Every bug traceable from risk register to test case to automated test | ✅ — see `docs/traceability-matrix.md` |
| **(Added v1.1)** Every module has a formal Test Case document under `docs/test-cases/` | ✅ — 10/10 modules |

---

## 6. Test environment

| Component | Value |
|---|---|
| SUT image | `germanobrian1998/parabank:latest` |
| Container port | 8080 (mapped to 9090 locally) |
| DB | HSQLDB embedded — in-memory, resets on container restart |
| OS | Ubuntu 24 (CI) / macOS or Windows (local) |
| Browser | Chromium (Playwright managed) |
| CI | GitHub Actions — see `.github/workflows/ci.yml` and `nightly.yml` |
| Parallelism | `workers: 1` — stateful SUT requires sequential execution (see `playwright.config.ts`) |

---

## 7. Risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| DB state contamination from prior k6 stress runs | High | High | Environment smoke test detects contamination; `docker compose down -v` resets |
| JSESSIONID persists after logout (H-009) | Confirmed | High | Tests that require clean session state use fresh browser context via fixture |
| Negative amounts accepted server-side (H-007) | Confirmed | Critical | Documented as `test.fail()`; regression will catch if ever fixed |
| IDOR on account endpoints (H-018) | Confirmed | Critical | Documented as `test.fail()` in `authorization.api.spec.ts`; PCI-DSS mapped |
| WSDL loan provider corruption | Confirmed | Medium | Loan endpoint excluded from automated suite — see `docs/not-automated.md` |
| Flaky tests due to AJAX timing in Bill Pay jQuery | Low (mitigated) | Medium | `getComputedStyle` detection pattern implemented in `BillPayPage` |

**Formal classification note (v1.1):** every risk above is also entered in
`docs/severity-priority-matrix.md` §4 with an explicit Probability × Impact
grid position, and cross-referenced by risk ID (R1-R10) in
`docs/traceability-matrix.md` §1 to its corresponding test case and automated
test.

---

## 8. Roles

| Role | Responsibility |
|---|---|
| QA Engineer (author) | Test design, automation implementation, bug reporting, documentation |
| Developer (consumer) | Bug triage, fix verification, ADR review |
| Stakeholder (consumer) | Test Summary Report, risk register, accessibility report |

---

## 9. Deliverables

| Artifact | Location | Audience |
|---|---|---|
| Automated test suite | `tests/` | QA · Dev |
| Tech discovery report | `docs/tech-discovery-report.md` | QA · Dev |
| Bug reports | `docs/bugs/` | Dev · PM |
| Risk-based strategy | `docs/risk-based-strategy.md` | QA · PM |
| **Severity & Priority Matrix** *(Added v1.1)* | `docs/severity-priority-matrix.md` | QA · Dev · PM |
| **Traceability Matrix** *(Added v1.1)* | `docs/traceability-matrix.md` | QA · Dev · PM · Audit |
| BVA decision table | `docs/bva-transfers-module.md` | QA · Dev |
| State transition diagram | `docs/state-transition-auth.md` | QA · Dev |
| SQL validation approach | `docs/sql-validation-approach.md` | QA · Dev |
| Accessibility report | `docs/accessibility-report.md` | Dev · Design · PM |
| Performance baseline | `docs/performance-baseline.md` | Dev · Ops |
| PCI-DSS coverage map | `docs/pci-dss-coverage.md` | QA · Security · PM |
| **Test cases — Transfers** | `docs/test-cases/transfers-test-cases.md` | QA · Dev · PM |
| **Test cases — Authentication** *(Added v1.1)* | `docs/test-cases/auth-test-cases.md` | QA · Dev · PM |
| **Test cases — Authorization (IDOR)** *(Added v1.1)* | `docs/test-cases/authorization-test-cases.md` | QA · Dev · Security |
| **Test cases — Accounts** *(Added v1.1)* | `docs/test-cases/accounts-test-cases.md` | QA · Dev · PM |
| **Test cases — Bill Pay** *(Added v1.1)* | `docs/test-cases/billpay-test-cases.md` | QA · Dev · PM |
| **Test cases — Loans** *(Added v1.1)* | `docs/test-cases/loans-test-cases.md` | QA · Dev · PM |
| **Test cases — Contract/Schema** *(Added v1.1)* | `docs/test-cases/contract-test-cases.md` | QA · Dev |
| **Test cases — Idempotency** *(Added v1.1)* | `docs/test-cases/idempotency-test-cases.md` | QA · Dev |
| **Test cases — Performance** *(Added v1.1)* | `docs/test-cases/performance-test-cases.md` | QA · Dev · Ops |
| **Test cases — Accessibility** *(Added v1.1)* | `docs/test-cases/accessibility-test-cases.md` | QA · Dev · Design |
| **Estimation & Timeline** *(Added v1.2)* | `docs/estimation-timeline.md` | QA · PM · Hiring reviewers |
| Test summary report | `docs/test-summary-report.md` | PM · Stakeholders |
| ADRs | `docs/decisions/` | Dev · QA |
| CI/CD pipeline | `.github/workflows/` | Dev · Ops |

---

## 10. Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06 | Initial test plan |
| 1.1 | 2026-07 | Added §3.6, §3.7 (test case documentation approach, severity/priority rubric); added Severity & Priority Matrix and Traceability Matrix as deliverables; added formal Test Case documents for the 9 modules that previously lacked one (Auth, Authorization, Accounts, Bill Pay, Loans, Contract, Idempotency, Performance, Accessibility); updated exit criteria to require full traceability |
| 1.2 | 2026-07 | Added `docs/estimation-timeline.md` as a deliverable — reconstructs real project chronology (38 elapsed days, first bug to complete framework) from `CHANGELOG.md`/`tech-discovery-report.md`/`PENDING.md` dates, with an explicit effort-vs-elapsed breakdown of the 16-day P-001/P-002 blocker gap |