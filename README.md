# Parabank QA Automation Portfolio

Automation framework for Parabank — a demo fintech banking application.
Built to demonstrate QA engineering depth: architectural decisions, real bug discovery, and production-grade practices.

**Stack:** Playwright + TypeScript | GitHub Actions | Docker  
**System under test:** [Parabank](https://parabank.parasoft.com) — transfers, loans, bill pay, accounts  
**Repo:** https://github.com/germanobrian1998/parabank-qa-portfolio

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

## Project status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Architecture & strategy | ✅ Complete |
| Phase 2 | Implementation | ✅ Complete |
| Phase 3 | Hard cases | ✅ Complete |
| Phase 4 | Operational maturity | ✅ Complete |
| Phase 5 | Technical narrative | ⏳ Pending |

**Suite:** 57/58 passed — 1 skipped (expected) — 0 real failures  
See [METRICS.md](METRICS.md) for full breakdown.

---

## What this framework found

11 bugs discovered across all phases:

| ID | Description | Severity |
|----|-------------|----------|
| H-007 | Server accepts negative amounts in transfers, bill pay, and loans | Critical |
| H-008 | Double submit generates duplicate transactions | High |
| H-009 | Session not invalidated after logout | Medium |
| H-010 | Overdraft allowed without validation | Critical |
| H-011 | UI accepts duplicate username registration — server rejects it | High |
| H-012 | Empty fields accepted on registration | Medium |
| H-013 | New accounts created with $100 instead of $0 | Medium |
| H-014 | Beneficiary account mismatch not validated server-side in Bill Pay | High |
| H-015 | Server accepts negative loan amounts | Critical |
| H-016 | Server accepts $0.00 transfers | Medium |
| H-017 | Server accepts self-transfers | Medium |

Full details: [docs/tech-discovery-report.md](docs/tech-discovery-report.md)

---

## Architectural decisions

| ADR | Decision | Why |
|-----|----------|-----|
| ADR-001 | POM over Screenplay Pattern | Hiring managers read this code — POM is immediately legible without context |
| ADR-002 | Playwright native over BDD/Cucumber | No non-technical stakeholders — BDD adds ceremony without value |
| ADR-003 | Hybrid test data strategy | Static fixtures for config, dynamic factories for users, API setup for state |
| ADR-004 | No DB tests | Docker container doesn't expose HSQL port — covered by API tests |
| ADR-005 | Custom Docker image | Official `parasoft/parabank:latest` starts with empty DB (no john/demo) |
| ADR-006 | API verification over UI balance | Balance accumulates across runs — API transactions endpoint is idempotent |

---

## Running the suite

```bash
# Full suite (local)
npx playwright test

# Smoke only
npx playwright test --grep "@smoke"

# Single spec
npx playwright test tests/e2e/auth.spec.ts

# Performance (requires k6)
k6 run tests/performance/login.baseline.k6.js
k6 run tests/performance/transfer.stress.k6.js
k6 run tests/performance/accounts.soak.k6.js

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
- [CHANGELOG](CHANGELOG.md) — technical history of the project

---

## Known issues & troubleshooting

### 1. `transfer_error_rate: 100%` in k6 stress test
**Cause:** Docker image has dirty DB — source account has negative balance from previous stress test runs.  
**Fix:** Re-seed the image following the process in [CHANGELOG.md](CHANGELOG.md) (v0.3.0 Technical Notes).

### 2. `Target page, context or browser has been closed`
**Cause:** Explicit logout in fixture teardown closes the context before Playwright can clean it up.  
**Fix:** The `authenticatedAsJohn` fixture teardown intentionally skips logout — this is by design (ADR-006).

### 3. `#loanRequestApproved` never appears (timeout in loans.spec.ts)
**Cause:** `waitForSelector` with `state: 'visible'` doesn't work with jQuery — it doesn't set `display` inline.  
**Fix:** Use `waitForFunction` with `getComputedStyle(el).display !== 'none'` and timeout 60_000ms. The loan processor can take up to 31 seconds to respond.

### 4. Suite fails with `ECONNREFUSED` inside Docker
**Cause:** URLs hardcoded to `localhost:9090` — inside Docker, `localhost` doesn't resolve to Parabank.  
**Fix:** All URLs now read from `process.env.BASE_URL`. The compose file sets `BASE_URL=http://parabank:8080` automatically.