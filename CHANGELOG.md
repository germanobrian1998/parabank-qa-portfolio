# CHANGELOG

All notable changes to this project are documented in this file.
Format: [version] — Phase: description | Technical notes explain *why*, not just *what*.

---

## [0.8.0] — 2026-06-20 | Phase 5: Gaps 5-10 — complete framework

### Added
- `tests/smoke/environment.spec.ts` — 5 environment readiness smoke tests that run before the functional suite: UI responds HTTP 200, API authenticates john/demo, john has at least one account, loan provider WSDL approves loans, and balances are within reasonable range. Detects contaminated DB and corrupted WSDL before they produce misleading symptoms in functional tests
- `scripts/generate-report.ts` updated with metrics delta — compares the current run against the previous one using `metrics-history.json` (last 30 entries). Shows variation in total tests, passed, real failures, known bugs and duration. Detects regressions between runs without manual intervention
- `.github/workflows/nightly.yml` — nightly workflow that runs at 3am UTC every day. Executes the full suite + performance in parallel, generates HTML report with metrics delta, and uploads artifacts with 30-day retention. Detects changes in the system under test that do not come from code changes
- `docs/testing-methodology.md` — methodology document describing the three phases (Discovery, Implementation, Continuous Testing), verification discipline, DB state management as a test variable, stack decisions, and framework quality metrics

### Fixed
- `src/helpers/assertions.ts` — `auditAccessibility()` updated with `options: { maxViolations?, warnOnly? }` parameter. With `warnOnly: false` and `maxViolations: N`, the function acts as a baseline regression: fails if the number of violations exceeds the documented threshold. Detects new violations introduced in a change without requiring the team to resolve historical ones first
- `tests/accessibility/a11y.spec.ts` — each `auditAccessibility()` call updated with real thresholds measured against `germanobrian1998/parabank:latest`: Login 5, Register 5, Transfer 6, Bill Pay 6, Accounts overview 4
- `tests/api/contract.api.spec.ts` — registration contract test added: verifies that a registered user can authenticate and that the login response conforms to `CustomerSchema`. Blocked by P-004 (`test.skip`) — Playwright's `APIRequestContext` reuses session state between requests in the same process, causing the server to reject the username as duplicate even when it is new

### Resolved
- **P-004** — partially investigated: the username validator in `/register.htm` returns "already exists" when using Playwright's `APIRequestContext`, but works correctly with curl. Probable cause: the server compares the submitted username against the `Customer` object pre-populated in `@SessionAttributes` during the prior GET, and Playwright's HTTP context reuses that state between tests in the same process. No workaround found — documented with `test.skip()` rather than blocking the suite

### Technical Notes
- The environment smoke tests are the most important lesson of this phase documented as code: P-002 (corrupted WSDL) and DB contamination from stress tests produce symptoms indistinguishable from real bugs. Having a test that explicitly says "the environment is broken, fix: `docker compose down -v`" is worth more than hours debugging false negatives
- The metrics delta required moving `metrics-history.json` outside of `test-results/` — Playwright deletes that directory between runs, wiping the history. It now lives in the project root
- Accessibility regression with threshold is the correct way to handle violations in a legacy app: zero violations cannot be required because 26 historical ones already exist, but new violations introduced by a change can be detected. The threshold freezes the current state as a baseline and fails if it worsens
- P-004 illustrates the difference between "works with curl" and "works with the framework's HTTP client": Playwright's `APIRequestContext` has different session behavior than curl because it persists cookies and possibly server state between requests in the same context. For Spring MVC endpoints with `@SessionAttributes`, this behavior can be incompatible with the flow the server expects

---

## [0.7.0] — 2026-06-19 | Phase 5: H-019 confirmed + Gap 4 contract testing

### Added
- `src/contracts/parabank.schemas.ts` — Zod schemas for all Parabank REST endpoints: `CustomerSchema`, `AccountSchema`, `AccountListSchema`, `TransactionSchema`, `TransactionListSchema`, `LoanResponseSchema`, `RegisterResponseSchema`. TypeScript types in `ApiClient.ts` are now inferred from these schemas rather than defined manually — a single source of truth for validation and static typing
- `tests/api/contract.api.spec.ts` — 8 contract tests that verify response structure (not behavior): login schema, account, account list, transaction list, numeric type of `balance` and `amount`, account type enum, and `requestLoan` schema. Includes ownership invariant in accounts and transactions (no account/transaction can belong to a customerId other than the one requested)

### Fixed
- `ApiClient.ts` — manual interfaces `Customer`, `Account`, `Transaction`, `LoanResponse` removed and replaced by types inferred from `parabank.schemas.ts`. Most relevant adjustment: `LoanResponse.responseDate` was `string` in the manual interface but the server returns epoch ms (`number`); `LoanResponse.accountId` was `number | undefined` but the server sends explicit `null` when the loan is rejected — corrected to `number | null | undefined`
- `tests/api/idempotency.api.spec.ts` — the two idempotency bug tests (H-019) migrated from `test.skip()` to active documentation with annotations. Both vectors (sequential double submit and concurrent requests) turned out to be non-deterministic between runs: the server sometimes serializes the requests and does not reproduce the race condition. `test.fail()` replaced with `test.info().annotations` that record whether the bug reproduced or not on each run, without generating false negatives in CI

### Found
- **H-019** (High): `POST /requestLoan` endpoint does not implement idempotency — duplicate requests (sequential or concurrent) can create multiple independent LOAN accounts. Confirmed with real evidence on the first post-reseed run (2026-06-19): double submit created 2 LOAN accounts. Non-deterministic behavior in subsequent runs — reproduction depends on the internal state of the WSDL loan provider

### Resolved
- **P-002** — `POST /requestLoan` systematically rejected with `error.insufficient.funds.for.down.payment` regardless of account balance. Root cause: corrupted WSDL loan provider state from accumulating test runs without re-seeding the DB (not a balance problem). Fix: `docker compose down -v && docker compose up -d`. Lesson: the server's error message (`insufficient funds`) did not reflect the real cause of the rejection — diagnosis by error message is insufficient when the underlying state is corrupt

### Technical Notes
- The `requestLoan` contract test uses `.catch()` with an internal `test.skip()` instead of `test.fail()` — if the server returns 4xx (P-002 reactivated by dirty DB), the test is marked as skipped rather than failing, because it is not possible to validate the schema of a successful response without a successful response. This allows the test to be honest about its precondition rather than failing with a cryptic parsing error
- The distinction between contract tests and behavior tests was clarified in this phase: `transfer.api.spec.ts` verifies that the server rejects negative amounts (behavior); `contract.api.spec.ts` verifies that the response has the correct fields with the correct types (structure). A schema breaking change can go undetected in behavior tests if the changed field does not affect that test's specific assertion
- H-019 illustrates the limit of `test.fail()` for non-deterministic bugs: on the first post-reseed run the bug reproduced consistently; on subsequent runs the server serialized the requests and the test "passed" unexpectedly, causing `test.fail()` to mark it as an error. For bugs whose reproduction depends on timing or external state, annotations are more honest than expected failures

---

## [0.6.0] — 2026-06-17 | Phase 5: Business invariants

### Added
- `tests/api/transfer.api.spec.ts` — new test `total balance across all accounts should be conserved after transfer`: verifies that the sum of balances across all of John's accounts remains identical before and after an internal transfer. This is not a test of a specific bug but of a structural invariant: in any correct ledger, an internal transfer redistributes money, it never creates or destroys it

### Technical Notes
- Unlike H-007/H-010 tests (which verify that an invalid input is rejected), this test does not depend on any conditional `if` on the result — if `client.transfer()` throws `ApiError`, the test fails loudly and explicitly. This makes it immune to the silent false positive pattern that affected `idempotency.api.spec.ts` (see v0.5.0, P-002): there is no way for it to pass green without having exercised the full path
- Verified empirically against real data from the local Docker: `sumBefore = $15,088.67`, `sumAfter = $15,088.67`, `delta = $0.00`, using accounts `12345` (with strongly negative balance from stress test contamination) and `12456`. The invariant holds even when individual accounts have anomalous balances — the test measures the correct property (total conservation), not the state of a particular account
- `setupAuthenticatedClient()` does not filter accounts by balance (unlike `setupLoanClient()` in `idempotency.api.spec.ts`, which does so after the P-002 incident). This is intentional for now: if a contaminated account causes `transfer()` to throw an insufficient funds error, the test fails explicitly rather than giving a false positive

---

## [0.5.0] — 2026-06-17 | Phase 5: Closing pending blockers

### Fixed
- `ApiClient.requestLoan()` — the amount parameter was named `loanAmount`; the real server contract uses `amount`. Confirmed via DevTools capture (Network → Payload → Query String Parameters) against local Docker, not the public instance, to guarantee consistency with the `germanobrian1998/parabank:latest` image running in CI
- `ApiClient.requestLoan()` — the endpoint URL was lowercase (`/requestloan`); the server routing is case-sensitive and the real path is `/requestLoan` (capital L). This fix was discovered on a second run, after correcting the parameter: the first error was HTTP 400 (null parameter), the second HTTP 404 after fixing the parameter name but keeping the incorrect casing — the status code was the clue that distinguished both problems
- `test-results/` with root permissions after Playwright runs inside Docker — root cause resolved by adding `user: "${HOST_UID}:${HOST_GID}"` to the `playwright` service in `docker-compose.yml` (previously required manual `chown` after each run)
- `setupLoanClient()` in `idempotency.api.spec.ts` was picking the first account with `balance > 0` without excluding accounts contaminated by previous stress test runs (balances up to $2,002,994,958.48). Now requires a reasonable range (`100 <= balance <= 1,000,000`) and excludes `LOAN` type accounts

### Removed
- The `test.skip()` from the base contract test (`single loan request... @smoke`) in `tests/api/idempotency.api.spec.ts` — the parameter contract blocker (P-001) no longer exists

### Investigated (unresolved)
- **P-002**: `POST /requestLoan` rejects with `error.insufficient.funds.for.down.payment` across all tested combinations — accounts with balance $0, $100, and $2B+, with different `amount`/`downPayment` ratios. Account balance does not appear to be the determining variable. The two idempotency bug tests (double submit and concurrency) return to `test.skip()` until a combination the server approves is found. See `PENDING.md` (P-002) for the full investigation detail

### Technical Notes
- The root cause of P-001 was not the `BigDecimal` type as the initial bytecode investigation suggested, but simply the parameter name: the server expected `amount`, not `loanAmount` — any incorrect name produced the same symptom (`Cannot read field "intCompact" because "<parameter1>" is null`) regardless of the data type sent
- Reusable diagnostic pattern: HTTP 400 with a null conversion error points to an incorrect parameter name; HTTP 404 points to an incorrect URL or casing. Distinguishing both by status code saves debugging time on endpoints with undocumented contracts
- Lesson from this phase: a run with failing tests does not always mean the bug under test reproduced correctly. The first run after resolving P-001 showed 2 failing tests and was preliminarily interpreted as confirmation of an idempotency bug — a more careful analysis revealed the failure was not exercising the expected path (`approved: true`) at all, but failing for a different reason (account contaminated by stress test). A failing assertion is not evidence that it failed for the expected reason; preconditions must be confirmed before accepting the result

---

## [0.4.0] — 2026-06-01 | Phase 4: Operational maturity

### Added
- `docker-compose.yml` — reproducible setup with a single command: `docker compose up`
- Healthcheck in the `parabank` service — prevents Playwright from starting before Tomcat is ready (Parabank takes ~45s to initialize)
- `BASE_URL` as environment variable in `playwright.config.ts` — allows the suite to run both locally (`localhost:9090`) and inside Docker (`parabank:8080`) without code changes

### Fixed
- Hardcoded URLs in `LoginPage.ts`, `ApiClient.ts` and `billpay.spec.ts` — all used `http://localhost:9090` directly, causing `ECONNREFUSED` inside the Docker container where `localhost` does not resolve to Parabank
- Node types added to `tsconfig.json` (`"types": ["node"]`) — required for `process.env` to compile without errors

### Technical Notes
- The `mcr.microsoft.com/playwright:v1.44.0-jammy` image has Node 20.12.2, incompatible with faker v10 which requires ≥20.19.0. Fix: use `v1.60.0-noble` (Ubuntu 24.04, Node 20.19+)
- The Playwright version in the project (1.60.0) must match exactly the Docker image tag — a version mismatch causes `Executable doesn't exist` on all tests
- Re-seed of the Docker Hub image was necessary before this commit — the k6 stress test accumulated transfers leaving a balance of `-$1,000,002,759` on john's account

---

## [0.3.0] — 2026-05-30 | Phase 3: Hard cases

### Added
- `tests/edge-cases/transfer.edge.spec.ts` — 6 BVA cases derived from the transfers module decision table
- `tests/performance/login.baseline.k6.js` — login baseline: p95=18ms vs 2000ms threshold
- `tests/performance/transfer.stress.k6.js` — stress 1→20 VUs: p95=17ms, 0% error rate
- `tests/performance/accounts.soak.k6.js` — soak 5 VUs/2min: p99=27ms vs 3000ms threshold
- `tests/accessibility/a11y.spec.ts` — axe-core WCAG 2.1 AA audit across 5 pages
- `src/helpers/assertions.ts` — `auditAccessibility()` that reports violations as warnings, not failures
- `docs/bva-transfers-module.md` — complete decision table with real server states
- `docs/performance-baseline.md` — real measured numbers, not assumed
- `docs/accessibility-report.md` — 26 violations with business impact
- `docs/not-automated.md` — 5 justified exclusions with cost/risk analysis

### Found
- **H-016** (Medium): server accepts $0.00 transfers — discovered in BVA, not in initial exploration
- **H-017** (Medium): server accepts transfers from an account to itself — generates phantom debit/credit pair in transaction history

### Technical Notes
- `auditAccessibility()` does not throw exceptions by design — mixing a11y failures with functional failures masks real problems in the CI report
- `URLSearchParams` does not exist in the k6 runtime — use template literals to build query strings
- The stress test accumulates transfers in the DB between runs — can exhaust account balances. Fix: `setup()` dynamically resolves two CHECKING accounts with balance > $100 instead of hardcoding IDs
- `transfer_error_rate: 100%` in CI was a symptom of a dirty DB (account with negative balance), not a framework bug

---

## [0.2.0] — 2026-05-29 | Phase 2: Implementation

### Added
- `src/pages/` — BasePage, LoginPage, TransferPage, AuthPage, RegisterPage, AccountsPage, BillPayPage, LoanPage
- `src/api/client/ApiClient.ts` — HTTP client with session-based auth, absolute URLs, plain text fallback for endpoints that do not return JSON
- `src/factories/` — UserFactory, TransferFactory, BillPayFactory, LoanFactory with dynamic data via faker
- `src/fixtures/index.ts` — `authenticatedAsJohn` and `authenticatedPage` with teardown without explicit logout
- `tests/e2e/` — 5 critical flows: auth, transfer, accounts, billpay, loans
- `tests/api/` — contract tests for login and transfer APIs
- `.github/workflows/ci.yml` — pipeline with stratified smoke, full and performance jobs

### Found
- **H-007** (Critical): server accepts negative amounts in transfers, bill pay and loans
- **H-008** (High): double submit generates duplicate transactions
- **H-009** (Medium): session not invalidated after logout
- **H-010** (Critical): overdraft allowed without validation
- **H-011** (High): UI accepts registration with duplicate username, server correctly rejects it
- **H-012** (Medium): empty fields accepted in registration
- **H-013** (Medium): new accounts created with $100 instead of $0
- **H-014** (High): payee account mismatch not validated server-side in Bill Pay
- **H-015** (Critical): server accepts negative amounts in loan requests

### Technical Notes
- `waitForSelector` with `state: 'visible'` does not work in LoanPage — jQuery does not set `display` inline. Fix: `waitForFunction` with `getComputedStyle(el).display !== 'none'` + timeout 60,000ms
- BillPayPage uses plain jQuery, not Angular — clicking "Send Payment" requires `page.evaluate(() => $(...).trigger('click'))`
- Fixture teardown does not do explicit logout — logout closes the context before Playwright can clean it up, causing "Target page closed"
- `faker.phone.number()` generates extensions the server rejects — use `faker.string.numeric(10)`
- ADR-005: custom Docker image required because `parasoft/parabank:latest` starts with an empty DB (no john/demo credentials)

---

## [0.1.0] — 2026-05-28 | Phase 1: Architecture

### Added
- `docs/tech-discovery-report.md` — technical exploration findings: REST inconsistencies, client-side-only validations, potential race conditions
- `docs/architecture-diagram.md` — layer diagram with justification for API/E2E separation
- `docs/risk-based-strategy.md` — strategy with KPIs defined before writing code
- `docs/decisions/ADR-001` — POM over Screenplay Pattern
- `docs/decisions/ADR-002` — native Playwright over BDD/Cucumber
- `docs/decisions/ADR-003` — hybrid test data strategy
- `docs/decisions/ADR-004` — DB tests discarded, integrity verified via API
- `docs/decisions/ADR-005` — custom Docker image for CI
- `docs/decisions/ADR-006` — payment verification via API instead of UI balance

### Technical Notes
- The most important decision of this phase was ADR-001: POM was chosen over Screenplay Pattern because the audience is technical hiring managers evaluating code readability, not POs reading specs in natural language
- ADR-003 establishes the pattern that prevented multiple state bugs during Phase 2: static fixtures for configuration, dynamic factories for users, API setup for prior state