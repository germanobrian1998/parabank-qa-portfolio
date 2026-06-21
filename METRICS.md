# Suite Metrics — 2026-06-20

> Generated from `test-results/results.xml` via `npx ts-node scripts/generate-report.ts`
> Previous run: 2026-06-20T22:53:35.456Z

## Summary

| Metric | Current | Delta |
|--------|---------|-------|
| Total tests | 82 | → 0 |
| Passed | 77 | → 0 |
| Skipped (expected) | 3 | → 0 |
| Known bugs (`test.fail()`) | 24 | → 0 |
| Real failures | 2 | → 0 |
| Total duration | 74.2s | → ~0s |
| Avg duration per test | 905ms | — |
| Slowest spec | `e2e/auth.spec.ts` (18.3s) | — |

## Delta analysis

- **Tests added/removed:** → 0
- **Pass rate change:** 77 / 82 vs 77 / 82 (93.9% vs 93.9%)
- **New real failures:** ✅ none
- **Duration change:** → ~0s

## Coverage by type

| Type | Tests |
|------|-------|
| E2E tests | 37 |
| API tests | 29 |
| Edge case tests | 6 |
| Accessibility tests | 5 |
| Performance scripts | 3 (k6, not in JUnit) |

## Specs

| Spec | Tests | Time |
|------|-------|------|
| `accessibility/a11y.spec.ts` | 5 | 9.2s |
| `api/authorization.api.spec.ts` | 3 | 0.2s |
| `api/contract.api.spec.ts` | 9 | 0.6s |
| `api/idempotency.api.spec.ts` | 3 | 0.3s |
| `api/login.api.spec.ts` | 5 | 0.2s |
| `api/reversal.api.spec.ts` | 3 | 0.3s |
| `api/transfer.api.spec.ts` | 6 | 0.5s |
| `e2e/accounts.spec.ts` | 9 | 12.9s |
| `e2e/auth.spec.ts` | 11 | 18.3s |
| `e2e/billpay.spec.ts` | 9 | 12.3s |
| `e2e/loans.spec.ts` | 5 | 4.4s |
| `e2e/transfers.spec.ts` | 3 | 7.8s |
| `edge-cases/transfer.edge.spec.ts` | 6 | 0.4s |
| `smoke/environment.spec.ts` | 5 | 0.4s |

## Notes

- Tests marked with `test.fail()` document known bugs — they are intentional and expected to fail
- The skipped test is a BVA boundary case that requires exact account balance (non-deterministic across runs)
- Performance tests (k6) run separately and are not included in this JUnit report
- Metrics history stored in `test-results/metrics-history.json` (last 30 runs)
