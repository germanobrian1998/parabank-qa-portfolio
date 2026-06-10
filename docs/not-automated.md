# Cases excluded from automation

This document explains what this framework deliberately does not automate and why.
Exclusion is a decision, not an oversight. Each case below was evaluated against two dimensions:
**cost of automation** (implementation + maintenance) and **risk coverage** (what we lose by not automating it).

---

## 1 — Concurrent session conflicts

**What it is:** Two authenticated sessions for the same user running simultaneously — verifying that the server correctly handles or rejects concurrent access.

**Why it was excluded:**
Reliable concurrency testing requires multi-browser orchestration with precise timing control. Playwright supports parallel workers, but coordinating two independent authenticated contexts to hit the same endpoint within a controlled time window produces structurally flaky tests — the race condition depends on thread scheduling, not on application behavior alone.

**Risk accepted:**
H-009 (session not invalidated post-logout) covers the most critical session vulnerability. The concurrent session scenario is a secondary risk and is covered more reliably through exploratory testing with two browser windows.

**What would change this decision:**
A dedicated concurrency testing tool (e.g. Gatling with user injection scenarios) or a test environment with deterministic latency would make this automatable without flakiness.

---

## 2 — Visual regression on rendered account statements

**What it is:** Pixel-level or layout comparison of dynamically rendered financial statements — account history pages, transaction tables, balance summaries.

**Why it was excluded:**
Golden image comparison breaks on every data change. Parabank account balances accumulate across test runs — the same page renders different numbers on every execution. Maintaining golden images would require resetting the database before each visual regression run, which adds infrastructure complexity that outweighs the benefit.

**Risk accepted:**
Functional assertions on transaction tables (row count, amount values, account IDs) are already covered in `accounts.spec.ts` and `transfers.spec.ts`. Layout correctness is lower risk than functional correctness for a banking application.

**What would change this decision:**
A dedicated visual testing tool (e.g. Percy, Applitools) with smart diffing that ignores dynamic content regions would make this practical.

---

## 3 — Password strength validation

**What it is:** Automated verification that the registration form enforces password complexity rules (minimum length, special characters, mixed case).

**Why it was excluded:**
No documented password policy exists in the Parabank UI or API specification. Automating against an assumed behavior produces tests that encode assumptions as requirements — if the assumption is wrong, the test is wrong. A test that passes because the system has no policy is not a passing test; it's a missing requirement.

**Risk accepted:**
H-012 (empty fields accepted on registration) covers the lower bound of this risk. The absence of password policy is noted as a gap in `tech-discovery-report.md`.

**What would change this decision:**
A documented password policy in the application spec or API contract would make this automatable with clear pass/fail criteria.

---

## 4 — Full WCAG 2.1 AA certification

**What it is:** Automated accessibility audit covering the complete WCAG 2.1 AA ruleset across all application pages.

**Why it was excluded:**
axe-core integration found 26 violations across 5 pages. Full certification requires the application to be fixed first — running a full WCAG suite against a broken baseline produces noise, not signal. The violations are documented with business impact in `docs/accessibility-report.md` and flagged as warnings in the CI pipeline, not as suite failures.

**Risk accepted:**
The 26 violations are documented and visible. Treating them as suite failures would block CI on every run for issues outside the QA team's control in a demo application context.

**What would change this decision:**
In a production system where the development team owns accessibility fixes, WCAG assertions would be graduated into the suite incrementally as violations are resolved — starting with critical (level A) violations and expanding to AA.

---

## 5 — Loan processor under sustained load

**What it is:** k6 stress or soak test targeting the loan request endpoint (`GET /requestloan`) under concurrent virtual users.

**Why it was excluded:**
The loan endpoint takes up to 31 seconds to respond under normal conditions — not under load, under a single sequential request. This is a known characteristic of the Parabank loan processor (documented in `tech-discovery-report.md`). A k6 stress test with 20 VUs and a 31-second response time per iteration would require infrastructure that accurately simulates the DB bottleneck to produce meaningful results. Without that, the test would time out at k6's default thresholds and produce false failures.

**Risk accepted:**
Performance testing was applied to the transfer endpoint (highest financial risk, consistent sub-50ms response times) and the accounts read endpoint (highest read volume). The loan processor bottleneck is documented as a known architectural limitation of the demo, not a regression risk.

**What would change this decision:**
A load test environment with a tuned HSQLDB configuration and adjusted k6 thresholds (`http_req_duration: ['p(95)<35000']`) would make this meaningful. In a production system, the loan processor would run asynchronously with a callback — making it load-testable with standard patterns.

---

## Summary

| Case | Cost | Risk coverage without automation | Decision |
|------|------|----------------------------------|----------|
| Concurrent session conflicts | High (flakiness risk) | H-009 covers primary session risk | Excluded |
| Visual regression on statements | High (maintenance) | Functional assertions cover data integrity | Excluded |
| Password strength validation | Low | No policy to validate against | Excluded |
| Full WCAG 2.1 AA | Medium | 26 violations documented as warnings | Excluded |
| Loan processor under load | High (infra dependency) | Transfer stress test covers performance risk | Excluded |

---

*Last updated: June 2026*