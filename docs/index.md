# Documentation Index — Parabank QA Portfolio

This repo has grown to 20+ documents across `docs/` and `docs/test-cases/`.
This index exists so a reviewer doesn't have to open each one to find out if
it's relevant to what they're looking for. Two reading paths are below,
followed by a full categorized reference.

---

## If you have 5 minutes

Read these three, in order:

1. **[`../README.md`](../README.md)** — what problem this framework solves,
   suite results (78/82 passed, 13 confirmed bugs), and the architectural
   decisions at a glance.
2. **[`traceability-matrix.md`](traceability-matrix.md)** — the single table
   that proves every risk maps to a test case, every test case maps to an
   automated test, and every bug is traceable back to the risk that predicted
   it. Section 3 (reverse lookup) is the fastest way to see the full bug list
   with evidence.
3. **[`bugs/H-018-idor-cross-account-access.md`](bugs/H-018-idor-cross-account-access.md)**
   — the single most serious finding (unauthenticated access to financial
   data), as a formal bug report. Representative of the quality bar applied
   to all 13 bugs.

**That's enough to answer "does this person know how to find and document
real defects, with evidence."**

---

## If you have 20 minutes

Add these, in order:

4. **[`risk-based-strategy.md`](risk-based-strategy.md)** — why Transfers got
   the highest test density, and what was deliberately *not* automated (and
   why that's a defensible decision, not a gap).
5. **[`severity-priority-matrix.md`](severity-priority-matrix.md)** — the
   explicit rubric behind every severity/priority call. Answers "why is
   H-007 Critical and H-013 only Medium" with a rule, not a feeling.
6. **[`decisions/ADR-001-page-objects.md`](decisions/ADR-001-page-objects.md)**
   (and skim ADR-002, ADR-003) — how architectural decisions are made and
   documented with real trade-offs, not just "I chose X."
7. **[`testing-methodology.md`](testing-methodology.md)** — read the
   "Verification discipline" section specifically. This is where the H-019
   withdrawal-and-reconfirmation story lives — the clearest evidence in the
   repo that findings are verified before being reported, not just declared.
8. **[`estimation-timeline.md`](estimation-timeline.md)** — the real project
   chronology (38 elapsed days, with the 16-day P-001/P-002 blocker gap
   broken into effort vs. elapsed). Useful if the conversation turns to "how
   do you estimate testing work."

**That's enough to answer "does this person's process hold up under
follow-up questions."**

---

## Full reference — every document, one line each

### Entry points

| Document | What it's for |
|---|---|
| [`../README.md`](../README.md) | Project overview, quick start, suite results, ADR summaries, known issues |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Version-by-version technical history — the raw material `estimation-timeline.md` was reconstructed from |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Branch naming, commit conventions, PR structure |
| [`../PENDING.md`](../PENDING.md) | Open and resolved environment blockers (P-001 to P-004), with full root-cause narratives |
| [`../METRICS.md`](../METRICS.md) | Auto-generated suite metrics with run-to-run delta |

### Strategy and planning

| Document | What it's for |
|---|---|
| [`test-plan.md`](test-plan.md) | Scope, objectives, entry/exit criteria, environment, roles, full deliverables list |
| [`risk-based-strategy.md`](risk-based-strategy.md) | Risk register (R1-R10), test density justification, deliberate exclusions, framework KPIs |
| [`severity-priority-matrix.md`](severity-priority-matrix.md) | Formal Probability × Impact rubric for classifying every bug and risk |
| [`traceability-matrix.md`](traceability-matrix.md) | Risk → Test Case → Automated Test → Bug, full matrix + reverse lookup |
| [`estimation-timeline.md`](estimation-timeline.md) | Real chronology reconstructed from dated artifacts; effort-vs-elapsed analysis |
| [`test-summary-report.md`](test-summary-report.md) | Executive summary — results, bug findings by severity, coverage by risk area |

### Architecture and design decisions

| Document | What it's for |
|---|---|
| [`architecture-diagram.md`](architecture-diagram.md) | Four-layer architecture, data flow, API-Client/Page-Object separation rationale |
| [`decisions/ADR-001-page-objects.md`](decisions/ADR-001-page-objects.md) | Why Page Object Model over Screenplay Pattern |
| [`decisions/ADR-002-bdd-approach.md`](decisions/ADR-002-bdd-approach.md) | Why native Playwright over Cucumber/BDD |
| [`decisions/ADR-003-test-data.md`](decisions/ADR-003-test-data.md) | Hybrid test data strategy — static fixtures, factories, API setup |
| [`decisions/ADR-004-credential-management.md`](decisions/ADR-004-credential-management.md) | Environment-variable-based credentials, no hardcoded secrets |
| `decisions/ADR-004` (referenced) · `decisions/ADR-005` · `decisions/ADR-006` | DB validation via API proxy; custom seeded Docker image; API verification over UI balance diff (see `README.md` for full ADR-005/006 text) |

### Test design technique documents

| Document | What it's for |
|---|---|
| [`bva-transfers-module.md`](bva-transfers-module.md) | Boundary Value Analysis decision table for the Transfers module — found H-016, H-017 before the tests existed |
| [`state-transition-auth.md`](state-transition-auth.md) | State transition diagram for Auth — the technique that made the H-009 finding explicit as a broken state transition |
| [`sql-validation-approach.md`](sql-validation-approach.md) | Why direct DB validation isn't possible (HSQLDB constraint) and how API-as-proxy compensates, with the SQL queries a production system would run |
| [`not-automated.md`](not-automated.md) | 5 deliberately excluded test cases, each with cost/risk justification |
| [`postman-usage.md`](postman-usage.md) | Postman collection's role as a manual exploration/bug-reproduction tool, distinct from the automated suite |

### Findings — bugs, coverage, compliance

| Document | What it's for |
|---|---|
| [`tech-discovery-report.md`](tech-discovery-report.md) | The full exploration narrative — API inconsistencies, UI/DB sync behavior, all 13 bugs (H-007 to H-019) with evidence |
| [`bugs/H-007-negative-transfer-amount.md`](bugs/H-007-negative-transfer-amount.md) | Formal bug report — negative amounts accepted across all financial flows |
| [`bugs/H-018-idor-cross-account-access.md`](bugs/H-018-idor-cross-account-access.md) | Formal bug report — unauthenticated access to account data (IDOR) |
| [`pci-dss-coverage.md`](pci-dss-coverage.md) | Every bug and control mapped to PCI-DSS SAQ A requirements |
| [`accessibility-report.md`](accessibility-report.md) | 26 WCAG 2.1 AA violations across 5 pages, with business-impact narrative per violation |
| [`performance-baseline.md`](performance-baseline.md) | Measured k6 baselines, with the critical caveat that low latency partially reflects H-010 (skipped validation) |

### Test cases (formal, `TC-xxx-NNN`)

| Document | Module | Count |
|---|---|---|
| [`test-cases/transfers-test-cases.md`](test-cases/transfers-test-cases.md) | Transfers | 8 |
| [`test-cases/auth-test-cases.md`](test-cases/auth-test-cases.md) | Authentication | 11 |
| [`test-cases/authorization-test-cases.md`](test-cases/authorization-test-cases.md) | Authorization / IDOR | 3 |
| [`test-cases/accounts-test-cases.md`](test-cases/accounts-test-cases.md) | Accounts | 9 |
| [`test-cases/billpay-test-cases.md`](test-cases/billpay-test-cases.md) | Bill Pay | 9 |
| [`test-cases/loans-test-cases.md`](test-cases/loans-test-cases.md) | Loans | 7 |
| [`test-cases/contract-test-cases.md`](test-cases/contract-test-cases.md) | API Contract | 9 |
| [`test-cases/idempotency-test-cases.md`](test-cases/idempotency-test-cases.md) | Idempotency | 3 |
| [`test-cases/performance-test-cases.md`](test-cases/performance-test-cases.md) | Performance | 3 |
| [`test-cases/accessibility-test-cases.md`](test-cases/accessibility-test-cases.md) | Accessibility | 5 |

---

## How to use this index in an interview

If asked "walk me through your testing process for a module," the fastest
path is: risk (`risk-based-strategy.md`) → test case
(`test-cases/<module>-test-cases.md`) → automated test (the `tests/` file
referenced in that TC) → bug if one was found (`docs/bugs/` or
`tech-discovery-report.md`) → traced back in `traceability-matrix.md`. Every
module in this repo can be walked this exact way, in this exact order,
without needing to improvise an explanation.