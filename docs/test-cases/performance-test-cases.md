# Test Cases — Performance Module

| Field | Value |
|---|---|
| **Module** | Performance (k6 — Login baseline, Transfer stress, Accounts soak) |
| **Risk level** | Medium — informative for a demo app, would be release-gating in production |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/performance-baseline.md` · `docs/risk-based-strategy.md` §2.1 |
| **Automated suite** | `tests/performance/login.baseline.k6.js` · `tests/performance/transfer.stress.k6.js` · `tests/performance/accounts.soak.k6.js` |

---

## Why these are documented as test cases, not just a baseline report

`docs/performance-baseline.md` documents *results* (numbers, interpretation).
This document documents the *test cases themselves* — what's being verified,
under what load, against what threshold — so performance testing is
traceable the same way functional testing is, with a TC ID a reviewer can
reference directly instead of reading prose to find the corresponding script.

---

## Preconditions (all test cases)

- Parabank Docker container running, freshly seeded (stress tests accumulate
  state between runs — see `docs/performance-baseline.md` "Decisiones de
  scope")
- k6 installed locally or in CI runner
- No other process competing for CPU/memory on the host during measurement

---

## TC-PERF-001 — Login response time under light concurrent load

| Field | Value |
|---|---|
| **Test Case ID** | TC-PERF-001 |
| **Title** | Login endpoint responds within SLA under 10 concurrent virtual users |
| **Type** | Non-functional — Performance baseline |
| **Priority** | P2 |
| **Script** | `tests/performance/login.baseline.k6.js` |
| **Load profile** | 10 VUs, 30s duration, 1s sleep between iterations |
| **Threshold** | p95 < 2000ms · error rate < 1% |
| **Justification for threshold** | NIST SP 800-63B — standard banking SLA for authentication endpoints |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Run `k6 run tests/performance/login.baseline.k6.js` | 300 iterations complete (10 VUs × 30s) |
| 2 | Check p95 response time | < 2000ms |
| 3 | Check error rate | < 1% |
| 4 | Verify each response contains `customerId` as a number | Check passes on every iteration |

**Expected result:** Login endpoint stays well within the banking-standard SLA under light concurrent load.
**Actual result:** ✅ Pass — measured baseline (2026-05-30): p95 = 18.64ms (107× below threshold), error rate 0.00%.
**Reference:** `docs/performance-baseline.md` §"Resultados baseline"

---

## TC-PERF-002 — Transfer endpoint under ramping concurrent load

| Field | Value |
|---|---|
| **Test Case ID** | TC-PERF-002 |
| **Title** | Transfer endpoint sustains acceptable response times as concurrent load ramps from 1 to 20 VUs |
| **Type** | Non-functional — Stress test |
| **Priority** | P2 |
| **Script** | `tests/performance/transfer.stress.k6.js` |
| **Load profile** | Ramp-up 1→20 VUs over 80s (20s→5, 40s→20, 20s ramp-down) |
| **Threshold** | p95 < 3000ms · error rate < 1% |
| **Justification for threshold** | Higher tolerance than login due to concurrent write load; 1% is the business-defined limit for acceptable transaction loss under peak load |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Setup resolves 2 CHECKING accounts dynamically with balance > $100 | Setup succeeds or fails loudly with a clear message (never runs against invalid accounts) |
| 2 | Run `k6 run tests/performance/transfer.stress.k6.js` | Ramp-up executes; ~1454 transfers attempted |
| 3 | Check p95 response time | < 3000ms |
| 4 | Check transfer error rate | < 1% |

**Expected result:** Transfer endpoint remains responsive under concurrent write load.
**Actual result:** ✅ Pass on the stated threshold — measured baseline: p95 = 17.67ms, error rate 0.00%.

**Critical caveat (documented, not hidden):** this test passing does not mean
the endpoint is "correct" — it means it's *fast*. The near-zero error rate is
partially explained by H-010 (overdraft allowed without validation): the
server skips the most expensive step of a real transfer (validating available
balance against the requested amount), which is part of why response times are
this low. A performance threshold passing on a system with H-010 present is
not equivalent to the same threshold passing on a system with correct
validation — this is flagged explicitly in `docs/performance-baseline.md`
under "Interpretación crítica de los resultados" and repeated here so it's
visible from the test case itself, not only the results narrative.

---

## TC-PERF-003 — Accounts read endpoint under sustained load (soak)

| Field | Value |
|---|---|
| **Test Case ID** | TC-PERF-003 |
| **Title** | Accounts read endpoint does not degrade over a sustained 2-minute load window |
| **Type** | Non-functional — Soak test |
| **Priority** | P3 |
| **Script** | `tests/performance/accounts.soak.k6.js` |
| **Load profile** | 5 VUs sustained for 2 minutes, 1s sleep between iterations |
| **Threshold** | p99 < 3000ms · error rate < 1% |
| **Justification for threshold** | p99 (not p95) is used because soak tests target *sustained* degradation (memory leaks, connection pool exhaustion) — p99 surfaces tail latency growth that p95 can mask |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Run `k6 run tests/performance/accounts.soak.k6.js` | 595 iterations complete (5 VUs × 2min) |
| 2 | Check p99 response time | < 3000ms |
| 3 | Check error rate | < 1% |
| 4 | Verify response is consistently a JSON array across all iterations | No degradation into malformed responses over time |

**Expected result:** No degradation trend across the sustained window.
**Actual result:** ✅ Pass — measured baseline: p99 = 27.69ms, error rate 0.00%.

**Explicit scope limitation:** 2 minutes is sufficient to establish a baseline
for a portfolio project but is **not** equivalent to a production soak test
(24-72 hours), which is the duration needed to reliably detect memory leaks.
This limitation is a documented, deliberate scope decision (see
`docs/performance-baseline.md` "Decisiones de scope"), not an oversight.

---

## Out-of-scope performance test cases (documented, not silently skipped)

| Would-be TC | Description | Why excluded | Reference |
|---|---|---|---|
| TC-PERF-004 | Loan processor under sustained load | Endpoint takes up to 31s per single request under normal conditions — no infrastructure exists to distinguish load-induced degradation from this known baseline latency | `docs/not-automated.md` §5 |
| TC-PERF-005 | Registration endpoint under load | Creates permanent, non-idempotent DB state per iteration — contaminates the environment for every subsequent test in the suite | `docs/performance-baseline.md` "Decisiones de scope" |
| TC-PERF-006 | Full-suite spike test (0→100 VUs instantaneous) | Parabank is a single-instance demo with no load balancer — results would not be representative of any real deployment topology | `docs/risk-based-strategy.md` §2.1 |

---

## Summary

| TC | Result | Notes |
|---|---|---|
| TC-PERF-001 | ✅ Pass | Login well within banking SLA |
| TC-PERF-002 | ✅ Pass (with caveat) | Fast partly *because* H-010 skips validation — documented explicitly |
| TC-PERF-003 | ✅ Pass (with scope limitation) | 2-minute soak, not production-length |

All three performance test cases pass their stated thresholds. The value of
this module is less in the passing numbers and more in the documented
reasoning for *why* those numbers can't be taken at face value without the
functional context (H-010) they sit alongside.