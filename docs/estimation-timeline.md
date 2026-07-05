# Estimation & Timeline — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | ET-001 |
| **Version** | 1.0 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `CHANGELOG.md` · `docs/tech-discovery-report.md` · `PENDING.md` · `docs/testing-methodology.md` |

---

## Purpose

Every other document in this project describes *what* was built and *why*.
This document describes *how long it actually took*, reconstructed from the
real, dated artifacts already in the repo — commit-equivalent version dates
in `CHANGELOG.md`, bug discovery dates in `tech-discovery-report.md`, and
blocker open/close dates in `PENDING.md`.

**Why this exists:** "how do you estimate testing effort?" is a standard
interview question, and the honest answer is almost always "it depends,
and here's a real example with the blockers included" rather than a formula.
This document is that real example — including the 16-day gap that a
sanitized timeline would hide.

**Methodology note:** dates below are **elapsed calendar time**, not effort
hours. This was solo work done alongside other commitments (see memory
context: contract work, interview prep, LinkedIn optimization running in
parallel) — elapsed time includes blocked time, context-switching, and
investigation dead-ends. Where effort and elapsed diverge meaningfully, both
are noted. This distinction is called out explicitly in §4 because collapsing
them is the single most common estimation mistake QA engineers make when
asked "how long would this take."

---

## 1. Actual chronology — Parabank portfolio, Phase 1 through 5

| Phase | Version tag | Date | Elapsed since previous phase | Key output |
|---|---|---|---|---|
| **Pre-repo exploration** | — | 2026-05-13 | — | First bugs found manually (H-007, H-008, H-009) via curl/browser exploration before any test code existed |
| **Pre-repo exploration (cont.)** | — | 2026-05-16 | +3 days | H-010, H-011, H-012, H-013 found |
| **Pre-repo exploration (cont.)** | — | 2026-05-24 to 05-25 | +8-9 days | H-014, H-015 found (Bill Pay and Loan flows explored) |
| **Phase 1 — Architecture** | v0.1.0 | 2026-05-28 | +3 days | ADRs 001-006, risk-based strategy, tech discovery report formalized into the repo |
| **Phase 2 — Implementation** | v0.2.0 | 2026-05-29 | +1 day | Page Objects, API Client, factories, fixtures, CI pipeline skeleton |
| **Phase 3 — Hard cases** | v0.3.0 | 2026-05-30 | +1 day | BVA edge cases (found H-016, H-017 same day), k6 scripts, accessibility audit (26 violations) |
| **Phase 4 — Operational maturity** | v0.4.0 | 2026-06-01 | +2 days | Docker Compose, healthcheck, BASE_URL env config |
| *(gap — see §2)* | — | 2026-06-06 to 06-19 | +5 to +18 days | H-018 discovered (06-06); P-001/P-002/P-003/P-004 blocker investigation |
| **Phase 5 — Closing blockers** | v0.5.0 | 2026-06-17 | +16 days since v0.4.0 | P-001 resolved (loan parameter contract); idempotency tests unblocked |
| **Phase 5 — Business invariants** | v0.6.0 | 2026-06-17 | same day | Ledger conservation invariant test added |
| **Phase 5 — H-019 confirmed** | v0.7.0 | 2026-06-19 | +2 days | P-002 resolved; Zod contract schemas; H-019 confirmed with real evidence |
| **Phase 5 — Complete framework** | v0.8.0 | 2026-06-20 | +1 day | Environment smoke tests, metrics delta, nightly CI workflow |

**Total elapsed, first bug found to "complete framework": 2026-05-13 to 2026-06-20 — 38 calendar days.**

---

## 2. The 16-day gap (v0.4.0 → v0.5.0) — a real example of blocked time

This is the single most instructive interval in the project's timeline, and
the one a polished-looking Gantt chart would normally hide.

| Date | Event |
|---|---|
| 2026-06-01 | v0.4.0 shipped — Docker Compose operational maturity complete |
| 2026-06-06 | H-018 (IDOR) discovered while exploring the REST API layer for authorization test design |
| 2026-06-06 | **P-001 opens** — `/requestLoan` returns HTTP 400, root cause initially misdiagnosed as a `BigDecimal` type mismatch (bytecode-level investigation) |
| 2026-06-16 | **P-001 resolved** — real root cause found via DevTools network capture: parameter name was `amount`, not `loanAmount`; also fixed URL casing (`/requestLoan` not `/requestloan`) |
| 2026-06-16 | **P-002 opens** — immediately after P-001's fix, `/requestLoan` now rejects with "insufficient funds" regardless of account balance |
| 2026-06-17 | **P-003 opens and resolves same day** — `/register.htm` contract investigated (GET-then-POST session pattern, form-encoded body) |
| 2026-06-18 | **P-004 opens (still open)** — Playwright's `APIRequestContext` produces false "username already exists" on registration; confirmed environment-specific via curl comparison |
| 2026-06-19 | **P-002 resolved** — root cause was corrupted WSDL loan provider state from accumulated unsedeed test runs, not a real funds problem; fix: `docker compose down -v && up -d` |

**What this gap actually cost:** 16 elapsed days, but not 16 days of
continuous work. The real cost breakdown, reconstructed from the investigation
narrative in `PENDING.md`:

| Activity | Estimated effort (not elapsed) | Elapsed contribution |
|---|---|---|
| Bytecode-level investigation of P-001 (wrong hypothesis) | ~2-3 hours | Dead end — contributed to elapsed time with no forward progress |
| DevTools network capture to find the real P-001 contract | ~1 hour | Resolved P-001 once the right tool was used instead of decompilation |
| P-002 diagnosis (misleading error message → real cause) | ~1-2 hours across several sessions | The bulk of the 16 days is *not* work — it's time between sessions, re-seeding the Docker image, and re-verifying state before concluding root cause |
| P-003 (register.htm contract) | ~2 hours | Resolved same day once investigated directly |
| P-004 (still open) | ~1 hour investigation, then parked | Correctly identified as environment-specific and documented rather than continuing to sink time into it |

**The estimation lesson this produces (usable in an interview):** a
16-calendar-day gap does not mean 16 days of QA effort — it means roughly
6-9 hours of actual diagnostic work spread across a period where each fix
attempt required re-verifying a live Docker environment's accumulated state
before drawing conclusions (see `docs/testing-methodology.md` "Verification
discipline" and the H-019 withdrawal/reconfirmation story). **Environment
verification overhead, not test-writing effort, is the dominant cost in this
kind of investigation** — a fact that is easy to state in the abstract and
much more convincing with dated, reconstructed evidence like this.

---

## 3. Second project — `qa-fintech` (Cucumber/BDD portfolio)

Per project memory, `qa-fintech` began after `parabank-qa-portfolio` was
declared complete and used Practice Software Testing (PST) as the SUT with
Playwright + TypeScript + Cucumber v11. Specific dated milestones for this
project are not yet captured in a CHANGELOG-equivalent document at time of
writing — this is flagged as a documentation gap rather than backfilled with
invented dates.

**Action item:** if `qa-fintech` reaches a comparable level of maturity,
create an equivalent `CHANGELOG.md` for that repo from the start, rather than
reconstructing dates retroactively as was necessary here. Retroactive
reconstruction works (this document proves it), but it's strictly worse than
having the dates captured contemporaneously — some of the effort/elapsed
distinction in §2 required inference from prose in `PENDING.md` rather than
being recorded directly.

---

## 4. Effort vs. Elapsed — the estimation principle this project demonstrates

The single most reusable insight from reconstructing this timeline:

> **Elapsed time and effort time diverge most sharply exactly where
> environment/infrastructure investigation is involved — not where test
> logic is being written.**

Evidence from this project:

| Work type | Effort-to-elapsed ratio | Example |
|---|---|---|
| Writing a new E2E test against a known, stable UI | Close to 1:1 | BVA edge cases (Phase 3) — designed and implemented same day as the phase shipped |
| Writing a new API contract test against a documented schema | Close to 1:1 | Contract tests (v0.7.0) — shipped alongside H-019 confirmation, same version |
| Diagnosing an undocumented API contract (P-001, P-003) | 2:1 to 4:1 | Hours of DevTools/curl work compressed into 1-2 calendar days once the right approach was found |
| Diagnosing environment state corruption (P-002) | 8:1 or worse | Each hypothesis required a full re-seed-and-reverify cycle before it could be confirmed or ruled out |
| Diagnosing a tooling-specific bug with no clear reproduction path (P-004) | Effort capped deliberately | Correctly triaged as "document and move on" rather than continuing to sink elapsed time chasing a low-value fix |

**How this is used when asked to estimate a new testing effort:** the
question "how long will this take" should decompose into "how much of this
is writing tests against a known, stable interface" (fast, predictable) vs.
"how much of this requires discovering the real behavior of an undocumented
or actively-changing system" (the P-001/P-002 pattern — budget 3-5x initial
gut-feel estimate, and expect the calendar cost to come from
verification-cycle overhead, not primarily code volume).

---

## 5. Effort summary — full project, all phases

| Metric | Value |
|---|---|
| First bug found to "complete framework" (v0.8.0) | 38 calendar days |
| Number of distinct environment blockers encountered (P-001 to P-004) | 4 |
| Blockers resolved within the project | 3 of 4 (P-004 remains open, documented, non-blocking to suite execution via `test.skip()`) |
| Bugs found during blocked/investigation time (not dedicated test-writing time) | 1 (H-018, found 2026-06-06 while investigating what became P-001) |
| Documentation retrofit effort (this document + severity/traceability/9 test-case docs, 2026-07) | Separate work session, ~1 day equivalent effort — see `docs/traceability-matrix.md` change log |

**What this table is useful for in an interview:** it lets you answer "how
long did this take you" with a number that has evidence behind it
(38 days, reconstructed from version tags and bug dates) rather than a vague
"a few months," and it lets you immediately follow up with the more
interesting number — that roughly 40% of that elapsed time (16 of 38 days)
was one investigation cycle, which is exactly the kind of thing a hiring
manager wants to hear you can diagnose and explain rather than hide.

---

## 6. How this document should be maintained going forward

- Every new phase of work (this document's own creation, in 2026-07, is an
  example) gets a row in §5's effort summary with an honest effort-vs-elapsed
  note, not just a "done" checkbox.
- If a new environment blocker is encountered, log its open/close date in
  `PENDING.md` as already practiced — this document derives its evidence from
  that file, so keeping it disciplined there is what makes future versions of
  this document possible without retroactive guesswork.
- This document is not meant to be defended as "the plan was followed
  perfectly" — it's meant to be defended as "here is what actually happened,
  and here is what it teaches about estimating the next similar project."