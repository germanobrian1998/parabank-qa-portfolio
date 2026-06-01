# Suite Metrics — 2026-06-01

> Generated from `test-results/results.xml` via `npx ts-node scripts/generate-report.ts`

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 58 |
| Passed | 57 |
| Skipped (expected) | 1 |
| Known bugs (`test.fail()`) | 22 |
| Real failures | 0 |
| Total duration | 61.4s |
| Avg duration per test | 1059ms |
| Slowest spec | `e2e/auth.spec.ts` (17.7s) |

## Coverage by type

| Type | Tests |
|------|-------|
| E2E tests | 37 |
| API tests | 10 |
| Edge case tests | 6 |
| Accessibility tests | 5 |
| Performance scripts | 3 (k6, not in JUnit) |

## Specs

| Spec | Tests | Time |
|------|-------|------|
| `accessibility/a11y.spec.ts` | 5 | 8.4s |
| `api/login.api.spec.ts` | 5 | 0.4s |
| `api/transfer.api.spec.ts` | 5 | 0.2s |
| `e2e/accounts.spec.ts` | 9 | 9.6s |
| `e2e/auth.spec.ts` | 11 | 17.7s |
| `e2e/billpay.spec.ts` | 9 | 8.7s |
| `e2e/loans.spec.ts` | 5 | 4.5s |
| `e2e/transfers.spec.ts` | 3 | 7.4s |
| `edge-cases/transfer.edge.spec.ts` | 6 | 0.4s |

## Notes

- Tests marked with `test.fail()` document known bugs — they are intentional and expected to fail
- The skipped test is a BVA boundary case that requires exact account balance (non-deterministic across runs)
- Performance tests (k6) run separately and are not included in this JUnit report
