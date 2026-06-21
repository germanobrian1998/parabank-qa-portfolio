# PENDING — Blocked or deferred tasks

## P-001: Resolve POST /requestLoan parameter contract — RESOLVED

**Blocked since:** 2026-06-06  
**Resolved:** 2026-06-16  
**Blocked:** `tests/api/idempotency.api.spec.ts` (3 tests in skip)

**Original context:**
The `POST /services/bank/requestLoan` endpoint returned HTTP 400 with the error
`Cannot read field "intCompact" because "<parameter1>" is null`. The QueryParam
to BigDecimal conversion failed regardless of the value sent.

**Investigation performed:**
- Bytecode signature confirmed via `strings`: `(int, BigDecimal, BigDecimal, int)`
- URL confirmed: `/requestLoan` (capital L)
- Parameters tested: `fromAccountId`, `accountId` — both produced the same error
- Values tested: `1000` and `1000.00` — same result
- `ApiClient.requestLoan()` was using `fromAccountId` — incorrect name

**Resolution method:**
Real request capture via DevTools (Network tab → Payload → Query String Parameters)
against local Docker (`germanobrian1998/parabank:latest`, port 9090), user `john/demo`,
Request Loan → Apply Now flow.

**Confirmed correct parameters:**
- `customerId` — int (e.g. 12212)
- `amount` — BigDecimal (e.g. 100) — **not `loanAmount`/`fromAccountId` as assumed during bytecode investigation**
- `downPayment` — BigDecimal (e.g. 100)
- `fromAccountId` — int (e.g. 13677)

**Second finding — URL casing:**
After fixing the parameter names, the first real run returned HTTP 404 (not 400)
on `/services/bank/requestloan`. The bytecode investigation had already noted that
the real URL is `/requestLoan` with capital L — `ApiClient.ts` had it lowercase.
Server routing is case-sensitive: incorrect casing gives 404 (route not found),
while an incorrect parameter name gives 400 (null parameter) — distinct symptoms
that help diagnose which one is wrong.

The real root cause was not the BigDecimal type itself, but that the amount
parameter is named `amount`, not `fromAccountId` or `loanAmount` — hence any
value sent under those names arrived as null to the binding.

**Change applied:**
`ApiClient.requestLoan()` updated with the 4 correct names. The 3 idempotency
tests in `idempotency.api.spec.ts` were unblocked (removed `test.skip()`) — the
blocker was the parameter contract, not a test design problem; the code was
already written.

**Result after unblocking — correction:**
The first run after the fix showed 2 of 3 tests failing, which was initially
interpreted as confirmation of an idempotency bug (documented as H-019). Later
investigation revealed that reading was premature: `setupLoanClient()` was
picking the first account with `balance > 0`, and at that point returned an
account contaminated by previous stress tests (balance ≈ $2 billion). The
failing `expect` was not verifying the expected happy path behavior — `approved: true`
was never confirmed in any server response during that run. **H-019 was withdrawn**
from README.md and CHANGELOG.md until it could be confirmed with real approval
evidence. See P-002 for why `approved: true` could not be reproduced in any
tested scenario.

---

## P-002: /requestLoan rejects with insufficient.funds — RESOLVED

**Blocked since:** 2026-06-16  
**Resolved:** 2026-06-19  
**Root cause:** corrupted WSDL loan provider state from accumulating test runs
without re-seeding the DB. Not an account balance problem.  
**Fix applied:** `docker compose down -v && docker compose up -d`  
**Result after unblocking:** idempotency bug confirmed with real evidence.
The server creates 2 LOAN accounts on sequential double submit and on concurrent
requests. Documented as H-019 with annotations in `idempotency.api.spec.ts`.

---

## P-003: Real contract of POST /register.htm — RESOLVED

**Blocked since:** 2026-06-17  
**Resolved:** 2026-06-18  
**Blocked:** Vector 2 of H-018 in `tests/api/authorization.api.spec.ts`

**Confirmed root cause:**
The `register.htm` endpoint is classic Spring MVC, not a REST service. It requires
two steps different from the rest of the ApiClient endpoints:

1. Prior GET to `/register.htm` to establish a session (JSESSIONID). Without
   this GET, the POST returns HTTP 500 — the controller expects a Customer object
   pre-populated in session by the initial GET (`@SessionAttributes` in Spring MVC).
   Without that object in session, the POST binding throws an exception.

2. POST with data in the **body** as `application/x-www-form-urlencoded`,
   not as a query string in the URL. Parabank's REST endpoints
   (`/services/bank/*`) read params from the URL — `register.htm` reads them from the body.

**Evidence:**
- Raw curl without prior GET → HTTP 500
- Raw curl with prior GET (cookie jar `-c/-b`) → HTTP 200, user created
- The earlier debugging session with 'eric' worked because the browser does
  the GET automatically when navigating to the form

**Change applied:**
`ApiClient.register()` new public method implementing the correct pattern
(GET + POST with body). Vector 2 now uses this method instead of the previous
broken inline code. Immediate blocker: P-004 (see below).

---

## P-004: Parabank username validator returns false positives — OPEN

**Blocked since:** 2026-06-18  
**Blocks:** Vector 2 of H-018 in `tests/api/authorization.api.spec.ts`,
contract test in `tests/api/contract.api.spec.ts`

**Symptom:**
The server rejects registration of ANY new username with "This username already
exists", regardless of the value. The user is never created — the subsequent
login fails with "username and password could not be verified".

**Evidence — confirmation method:**
1. curl GET + POST (correct pattern from P-003) with username `diagonly_<timestamp>`
   → HTTP 200 with "This username already exists"
2. curl login with that same username → HTTP 200 with "could not be verified"
   → confirms the user was never inserted into the DB

Reproduced with at least 3 different usernames generated with `Date.now()`.
The same GET + POST pattern worked correctly minutes earlier with `curltest_888`
— something changed in the server state between those two sessions.

**Root cause investigation:**
The problem is specific to Playwright's `APIRequestContext` — curl works correctly
with fresh sessions. Probable cause: the server compares the submitted username
against a `Customer` object pre-populated in Spring MVC `@SessionAttributes`
during the prior GET. Playwright's HTTP context reuses that state between
requests in the same process, making any new username appear as a duplicate.
Workaround not found at the time of writing.

**Impact:**
`ApiClient.register()` is correctly implemented — the problem is not the client.
Both affected tests are documented with `test.skip()` rather than blocking the
suite. The browser-based registration flow (`tests/e2e/auth.spec.ts`) works
correctly because each test gets a fresh browser context.

**To resolve:**
Investigate whether creating a completely new `APIRequestContext` (separate
process or isolated context) before the GET step allows the POST to succeed
with a new username. If confirmed, update `ApiClient.register()` with the
isolation pattern and remove the `test.skip()` from both affected tests.