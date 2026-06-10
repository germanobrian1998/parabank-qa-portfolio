# Parabank QA Automation Portfolio

Automation framework for Parabank — a demo fintech banking application.
Built to demonstrate QA engineering depth: architectural decisions, real bug discovery, and production-grade practices.

**Stack:** Playwright + TypeScript | GitHub Actions | Docker | k6  
**System under test:** [Parabank](https://parabank.parasoft.com) — transfers, loans, bill pay, accounts  
**Repo:** https://github.com/germanobrian1998/parabank-qa-portfolio  
**Suite result:** 57/58 passed · 0 real failures · 1 skipped (expected) · 11 confirmed bugs

---

## Quick start

```bash
git clone https://github.com/germanobrian1998/parabank-qa-portfolio
cd parabank-qa-portfolio
docker compose up
```

One command. Parabank starts, suite runs, results appear in console.  
Requires Docker. k6 performance tests run separately (see below).

---

## Problem Statement

Parabank is a banking demo application with real-world complexity: session management, financial transactions, API/UI consistency gaps, and a jQuery-rendered frontend that breaks standard Playwright selectors. The QA problem it poses is not "write tests for happy paths" — it's:

- How do you design a framework for a system you don't fully understand yet?
- How do you make test assertions reliable when the UI doesn't follow DOM conventions?
- How do you structure tests so that failures communicate business impact, not just technical errors?
- How do you decide what's worth automating when time and maintainability have a cost?

This framework is my answer to those questions, implemented and validated.

---

## Project status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Architecture & strategy | ✅ Complete |
| Phase 2 | Implementation | ✅ Complete |
| Phase 3 | Hard cases | ✅ Complete |
| Phase 4 | Operational maturity | ✅ Complete |
| Phase 5 | Technical narrative | ✅ Complete |

See [METRICS.md](METRICS.md) for full suite breakdown.

---

## Architectural decisions

### ADR-001 — Page Object Model over Screenplay Pattern

Screenplay Pattern's actor/task abstraction is powerful in teams where non-technical stakeholders write or read scenarios. Here, the audience is a hiring manager or senior engineer doing a code review — POM is immediately legible without context. Adding Screenplay would introduce indirection with no concrete benefit.

**Trade-off:** Screenplay scales better in large teams with business analysts who own scenarios. POM can drift toward god objects if boundaries aren't enforced — mitigated here by keeping each page object strictly scoped to its own page.

### ADR-002 — Playwright native over BDD/Cucumber

Gherkin only pays off when there are non-technical stakeholders reading or writing scenarios. Adding Cucumber here means writing the same logic twice — once in natural language, once in step definitions — with no consumer for the Gherkin layer.

**Trade-off:** If the team later brings in manual QA analysts who want to own scenarios, migrating to Cucumber would require significant refactoring.

### ADR-003 — Hybrid test data strategy

| Data type | Strategy | Why |
|-----------|----------|-----|
| App configuration (credentials) | Static fixtures | Never changes, readable |
| New users for registration tests | Dynamic factories (faker) | Avoids username collision across runs |
| Pre-existing financial state | API setup | DB access proved unreliable; API is the contract |

### ADR-004 — No direct DB validation

The Docker container doesn't expose the HSQL port by default and has no `javac` or SqlTool available. Data integrity is validated via API instead — which is the actual contract the application exposes to consumers.

### ADR-005 — Custom Docker image for CI

`parasoft/parabank:latest` starts with an empty database (no `john/demo` credentials). The solution was to commit a seeded container as `germanobrian1998/parabank:latest` using the official `create.sql` + `insert.sql` from inside the container itself.

### ADR-006 — API verification for Bill Pay over UI balance diff

The `john` account balance accumulates across test runs. A UI balance diff becomes unreliable after the second run. Verifying payments via `GET /accounts/{id}/transactions` with `Accept: application/json` is idempotent and tests the actual audit trail.

---

## What I found

11 bugs discovered across all phases. Severity defined by business impact, not technical complexity.

| ID | Description | Severity | Discovery method |
|----|-------------|----------|-----------------|
| H-007 | Server accepts negative amounts in transfers, bill pay, and loans | Critical | Automated — happy path variant |
| H-008 | Double submit generates duplicate transactions | High | Automated — race condition test |
| H-009 | Session not invalidated after logout | Medium | Automated — auth flow |
| H-010 | Overdraft permitted without validation | Critical | Automated — BVA boundary |
| H-011 | UI accepts duplicate username — server correctly rejects it | High | Automated — UI/API gap |
| H-012 | Empty fields accepted on registration form | Medium | Automated |
| H-013 | New accounts created with $100 instead of $0 | Medium | Automated |
| H-014 | Beneficiary account mismatch not validated server-side in Bill Pay | High | Automated |
| H-015 | Server accepts negative loan amounts | Critical | Automated |
| H-016 | Server accepts $0.00 transfers | Medium | BVA boundary analysis |
| H-017 | Server accepts self-transfers | Medium | BVA boundary analysis |

H-007, H-010, and H-015 share the same root cause: no server-side numeric validation on financial input fields. H-011 reveals an API/UI contract inconsistency invisible to manual testers — the UI shows success, the server returns an error.

Full details: [docs/tech-discovery-report.md](docs/tech-discovery-report.md)

---

## What I excluded

Automated testing has a cost. These are the cases I decided not to automate and why.

**Concurrent session conflicts** — Requires multi-browser orchestration with precise timing. The test would be structurally flaky; exploratory testing covers this scenario more reliably.

**Visual regression on rendered statements** — Dynamic financial data makes golden image maintenance expensive. The business risk is real but the cost/benefit ratio doesn't favor automation.

**Password strength validation** — No documented policy exists in the UI. Automating against an assumed behavior, not a specified one.

**Full WCAG 2.1 AA certification** — axe-core found 26 violations. Full certification requires the application to be fixed first; the violations are documented with business impact in [docs/accessibility-report.md](docs/accessibility-report.md).

**Loan processor under load** — The endpoint takes up to 31 seconds under normal conditions. Load testing requires infrastructure that accurately simulates the DB bottleneck; k6 stress testing was applied to transfers (highest-volume path) instead.

---

## Metrics

KPIs defined in Phase 1, measured at Phase 4 close.

| KPI | Target | Actual |
|-----|--------|--------|
| Suite execution time (Docker) | < 5 min | ~3.5 min |
| Real failures in CI | 0 | 0 |
| Bugs found through automation | ≥ 5 | 11 |
| Reproducibility (zero-to-results) | < 10 min | ~8 min |

Performance baseline (k6):

| Scenario | Metric | Result | Threshold |
|----------|--------|--------|-----------|
| Login baseline | p95 | 24ms | 2000ms ✅ |
| Transfer stress (20 VUs) | p95 | 20ms | 500ms ✅ |
| Accounts soak (2 min) | p99 | 27ms | 3000ms ✅ |

Accessibility: 26 WCAG 2.1 AA violations across 5 pages — documented as warnings, not suite failures.

---

## Performance dashboard

Test results streamed to Grafana Cloud during each run.

[View dashboard →](https://prudentfinch2125.grafana.net/a/k6-app/projects/7789507)

Baseline measured on 2026-06-10, Docker local execution:

| Scenario | p95 | Threshold | Run |
|----------|-----|-----------|-----|
| Login baseline | 24ms | 2000ms ✅ | [10 Jun 19:15](https://prudentfinch2125.grafana.net/a/k6-app/runs/7739942) |
| Transfer stress | 20ms | 500ms ✅ | [10 Jun 19:20](https://prudentfinch2125.grafana.net/a/k6-app/runs/7739986) |
| Accounts soak | 17ms | 3000ms ✅ | [10 Jun 19:23](https://prudentfinch2125.grafana.net/a/k6-app/runs/7740004) |

---

## What I'd do differently

**Explore the API before writing page objects.** I built `BillPayPage.ts` assuming Angular behavior. It's jQuery. Twenty minutes in DevTools would have saved hours of debugging `waitForSelector`.

**Design test data cleanup from day one.** The current setup requires manual re-seeding after k6 stress runs. A proper solution would reset state via API before each run — no Docker image commits required.

**Define accessibility as a first-class concern, not a retrofit.** Adding axe-core after the fact produces 26 violations at once with no clear ownership. Writing accessibility assertions alongside functional tests from the start would make findings easier to triage.

---

## Running the suite

```bash
# Full suite (local)
npx playwright test

# Smoke only
npx playwright test --grep "@smoke"

# Single spec
npx playwright test tests/e2e/auth.spec.ts

# Performance (requires k6 + Grafana Cloud auth)
k6 cloud run --local-execution tests/performance/login.baseline.k6.js
k6 cloud run --local-execution tests/performance/transfer.stress.k6.js
k6 cloud run --local-execution tests/performance/accounts.soak.k6.js

# Generate metrics report
npx ts-node scripts/generate-report.ts
```

---

## Documentation

- [Tech Discovery Report](docs/tech-discovery-report.md) — H-007 to H-017, architectural findings
- [BVA — Transfers Module](docs/bva-transfers-module.md) — decision table with real server states
- [Performance Baseline](docs/performance-baseline.md) — measured numbers for 3 k6 scenarios
- [Accessibility Report](docs/accessibility-report.md) — 26 WCAG 2.1 AA violations with business impact
- [Not Automated](docs/not-automated.md) — 5 cases excluded with cost/risk justification
- [Lessons Learned](docs/lessons-learned.md) — honest retrospective on the process
- [PCI-DSS Coverage](docs/pci-dss-coverage.md) — SAQ A control mapping to test suite and documented bugs
- [CHANGELOG](CHANGELOG.md) — technical history v0.1.0 → v0.5.0

---

## Known issues & troubleshooting

### `transfer_error_rate: 100%` in k6 stress test
**Cause:** Docker image has dirty DB — source account has negative balance from previous stress test runs.  
**Fix:** Re-seed the image following the process in [CHANGELOG.md](CHANGELOG.md) (v0.3.0 Technical Notes).

### `Target page, context or browser has been closed`
**Cause:** Explicit logout in fixture teardown closes the context before Playwright can clean it up.  
**Fix:** The `authenticatedAsJohn` fixture teardown intentionally skips logout — this is by design (ADR-006).

### `#loanRequestApproved` never appears (timeout in loans.spec.ts)
**Cause:** `waitForSelector` with `state: 'visible'` doesn't work with jQuery — it doesn't set `display` inline.  
**Fix:** Use `waitForFunction` with `getComputedStyle(el).display !== 'none'` and timeout 60_000ms. The loan processor can take up to 31 seconds to respond.

### Suite fails with `ECONNREFUSED` inside Docker
**Cause:** URLs hardcoded to `localhost:9090` — inside Docker, `localhost` doesn't resolve to Parabank.  
**Fix:** All URLs read from `process.env.BASE_URL`. The compose file sets `BASE_URL=http://parabank:8080` automatically.