# Suite Metrics — 2026-07-02

> Generated from `test-results/results.xml` via `npx ts-node scripts/generate-report.ts`
> Previous run: 2026-06-20T22:53:39.455Z

## Summary

| Metric | Current | Delta |
|--------|---------|-------|
| Total tests | 79 | ▼ -3 |
| Passed | 76 | ▼ -1 ⚠️ |
| Skipped (expected) | 3 | → 0 |
| Known bugs (`test.fail()`) | 24 | → 0 |
| Real failures | 0 | ▼ -2 ✅ |
| Total duration | 81.9s | ▲ +7.7s |
| Avg duration per test | 1037ms | — |
| Slowest spec | `e2e/auth.spec.ts` (18.5s) | — |

## Delta analysis

- **Tests added/removed:** ▼ -3 ⚠️
- **Pass rate change:** 76 / 79 vs 77 / 82 (96.2% vs 93.9%)
- **New real failures:** ✅ none
- **Duration change:** ▲ +7.7s

## Coverage by type

| Type | Tests |
|------|-------|
| E2E tests | 37 |
| API tests | 26 |
| Edge case tests | 6 |
| Accessibility tests | 5 |
| Performance scripts | 3 (k6, not in JUnit) |

## Specs

| Spec | Tests | Time |
|------|-------|------|
| `smoke/environment.spec.ts` | 5 | 1.5s |
| `accessibility/a11y.spec.ts` | 5 | 14.9s |
| `api/authorization.api.spec.ts` | 3 | 0.3s |
| `api/contract.api.spec.ts` | 9 | 0.9s |
| `api/login.api.spec.ts` | 5 | 0.4s |
| `api/reversal.api.spec.ts` | 3 | 0.7s |
| `api/transfer.api.spec.ts` | 6 | 1.3s |
| `e2e/accounts.spec.ts` | 9 | 12.9s |
| `e2e/auth.spec.ts` | 11 | 18.5s |
| `e2e/billpay.spec.ts` | 9 | 9.3s |
| `e2e/loans.spec.ts` | 5 | 4.8s |
| `e2e/transfers.spec.ts` | 3 | 7.8s |
| `edge-cases/transfer.edge.spec.ts` | 6 | 0.4s |

## Notes

- Tests marked with `test.fail()` document known bugs — they are intentional and expected to fail
- The skipped test is a BVA boundary case that requires exact account balance (non-deterministic across runs)
- Performance tests (k6) run separately and are not included in this JUnit report
- Metrics history stored in `test-results/metrics-history.json` (last 30 runs)
