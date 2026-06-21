# Testing Methodology — Parabank QA Framework

**Approach:** Shift-left with continuous testing integrated at every phase of the cycle  
**Last updated:** June 2026

---

## Why this methodology matters in fintech

In banking and payments, a production bug is not a support ticket —
it's an incorrect transaction, an overdrawn account, or exposed data.
The cost of late detection is an order of magnitude higher than in generic software.

This methodology is designed to detect problems as close as possible
to the moment they are introduced, not after they reach production.

---

## Phase 1 — Before writing code (Discovery)

### Tech Discovery Report
Before any test, the system is explored to understand:
- Which endpoints exist and what their real behavior is (not the documented one)
- Where validations live: client, server, or client-only?
- What race conditions are possible given the technical stack
- What data changes between executions and what remains stable

Output: `docs/tech-discovery-report.md` with findings H-007 to H-019.

### Risk-Based Strategy
Risks are prioritized by probability × business impact before
defining what gets automated. Not everything is automated — only what
has the highest return on investment in terms of risk coverage.

Output: `docs/risk-based-strategy.md` with risk register and KPIs.

### Architectural Decision Records
Every framework design decision is documented with context, options
considered, trade-offs, and review conditions. ADRs are the project's memory —
they explain why the code is the way it is, not just how it works.

Output: `docs/decisions/ADR-001` to `ADR-006`.

---

## Phase 2 — During implementation (Test-First thinking)

### Boundary Value Analysis before implementing
Edge cases are analyzed in a decision table before writing the test.
The table identifies the expected server behavior for each boundary,
which in turn reveals whether the server validates correctly or not.

Output: `docs/bva-transfers-module.md` — revealed H-016 and H-017 before
the tests existed.

### API contracts defined before E2E tests
Contract schemas (Zod) are defined before writing E2E tests.
This ensures that E2E tests and contract tests are consistent
and that the source of truth for data types is singular.

Output: `src/contracts/parabank.schemas.ts`

### Fixtures designed for independence
Each test obtains its state from scratch via API setup. There is no dependency
on execution order or accumulated state between tests.

Rule: if a test needs another to have run first, it is a poorly designed test.

---

## Phase 3 — Continuous validation (Continuous Testing)

### On every push
git push → smoke suite (< 3 min) → immediate result
The smoke suite covers the three highest-risk flows: authentication,
transfer, and account reading. If something critical is broken, it is known
in 3 minutes, not 15.

### On every PR
PR opened → smoke → full suite + performance (parallel)
The full suite runs all tests including edge cases, API contracts,
and accessibility. Performance runs in parallel with `continue-on-error: true`
because a threshold failure should not block a functional merge.

### Nightly (3am UTC)
schedule → full suite → metrics delta → artifact with report
The nightly detects changes in the system under test that did not come
from a code change. In fintech, third-party APIs can change their contract
without notice — the nightly detects it in hours, not days.

---

## Verification discipline

A test that passes green did not always verify what it appeared to.
Before declaring a result, confirm that the relevant test path actually executed.

Cases documented in this project:

**H-019 withdrawn and rediscovered:** the first run showing 2 LOAN accounts
was failing due to a contaminated account ($2B+ balance), not a real approval.
After re-seeding the DB and unblocking the tests, the bug was confirmed with
clean evidence.

**P-002:** the `/requestLoan` endpoint rejected with "insufficient funds" for
every account, including accounts with $2B+ balance. The error message did not
reflect the real cause — it was corrupted WSDL loan provider state, not a funds
problem. Diagnosis by error message is insufficient when the underlying state
is corrupt.

**Real contract vs assumed contract:** two Parabank endpoints have contracts
different from what was expected:
- `/services/bank/requestLoan` — parameter `amount` not `loanAmount`,
  casing `/requestLoan` not `/requestloan`
- `/register.htm` — classic Spring MVC, requires prior GET to establish session
  + POST with form-encoded body, not query string

**400 vs 404:** HTTP 400 with a null binding error points to an incorrect
parameter name. HTTP 404 points to an incorrect URL or casing. The status code
is the fastest diagnostic for endpoints with undocumented contracts.

---

## DB state as a test variable

The Docker image `germanobrian1998/parabank:latest` accumulates state between
testing sessions. Symptoms of a contaminated DB are:

- Accounts with $2B+ or extreme negative balances (from k6 stress tests)
- `/requestLoan` endpoint rejects with "insufficient funds" for any account
- Username validator returns "already exists" for new usernames

The environment smoke test (`tests/smoke/environment.spec.ts`) detects these
symptoms automatically before they affect the functional suite.

Confirmed fix: `docker compose down -v && docker compose up -d`

---

## What is not automated and why

Exclusions are decisions, not omissions. Each excluded case has a
cost/risk analysis documented in `docs/not-automated.md`.

The principle: automation has an implementation and maintenance cost.
If the risk covered does not justify that cost, manual or exploratory
coverage is the correct decision.

---

## Framework quality metrics

| KPI | Target | Actual | Measured in |
|-----|--------|--------|-------------|
| Smoke suite duration | < 3 min | ~1.5 min | GitHub Actions |
| Full suite duration | < 15 min | ~3.5 min | GitHub Actions |
| Real failures in CI | 0 | 0 | METRICS.md |
| Flaky tests | < 5% | 0% | Run history |
| Bugs found | ≥ 5 | 13 | tech-discovery-report.md |

KPIs were defined in Phase 1 before writing any code.
The methodology fails if KPIs are not measured — they are not aspirational.

---

## Tools and stack decisions

| Tool | Role | Alternative considered | Reason for choice |
|------|------|----------------------|-------------------|
| Playwright | E2E + API testing | Cypress, Selenium | Native API, multi-browser, native TypeScript |
| Zod | Contract testing | Pact | Pact requires reproducible provider; Parabank has shared HSQLDB |
| k6 | Performance | JMeter, Gatling | JS scripting, native CI integration |
| axe-core | Accessibility | Lighthouse | Direct Playwright integration via `@axe-core/playwright` |
| Docker | Reproducible environment | Cloud sandbox | Full control over DB state between runs |

Each decision is documented in greater detail in `docs/decisions/`.
