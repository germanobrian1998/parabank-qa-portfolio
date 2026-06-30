# Postman Usage Guide — Parabank QA Portfolio

## Purpose

The Postman collection in this repository is a **manual exploration and validation tool**, not an automated test suite. Its role in the QA process is distinct from the Playwright automation layer:

| Layer | Tool | Execution | Purpose |
|---|---|---|---|
| Automated regression | Playwright + TypeScript | CI/CD (GitHub Actions) | Repeatable, version-controlled test execution |
| Manual API exploration | Postman | Developer workstation | Discovery, bug reproduction, ad-hoc validation |

Postman was used during the **discovery phase** of this project to:
- Map the Parabank REST API surface before writing automated tests
- Reproduce and isolate bugs identified during exploratory testing (H-007 to H-019)
- Validate API responses at the contract level before formalizing Zod schemas in `src/contracts/parabank.schemas.ts`
- Provide a low-friction environment for sharing reproducible bug steps with stakeholders unfamiliar with TypeScript/Playwright

> **Note:** Newman (Postman CLI) is intentionally not integrated into CI. See [ADR-002](decisions/ADR-002.md) for context on tool selection rationale. The Playwright API tests in `tests/api/` serve as the automated equivalent.

---

## Local Setup

### Prerequisites

- [Postman Desktop](https://www.postman.com/downloads/) (any recent version)
- Parabank running locally via Docker:

```bash
docker pull germanobrian1998/parabank:latest
docker run -d -p 8080:8080 --name parabank germanobrian1998/parabank:latest
```

Wait ~10 seconds for the Spring application to initialize, then verify at `http://localhost:8080/parabank`.

### Importing the Collection and Environment

1. Open Postman Desktop
2. Click **Import** → select both files from the `postman/` directory:
   - `parabank-qa-portfolio.postman_collection.json`
   - `parabank-local.postman_environment.json`
3. In the top-right environment selector, choose **Parabank Local**
4. Verify `BASE_URL` is set to `http://localhost:8080/parabank`

### Environment Variables

Only `BASE_URL` is pre-configured. The remaining variables in the environment (`customerId`, `fromAccountId`, `toAccountId`, `fromAccountBalance`, `toAccountBalance`, `transferAmount`, `JSESSIONID`) are populated automatically at runtime by the collection's test scripts as requests execute. They do not need to be set manually.

The intended execution order to populate all variables correctly is:

1. **Auth → Login** — sets `JSESSIONID`
2. **Accounts → Get All Accounts** — sets `customerId`, `fromAccountId`, `toAccountId`
3. **Accounts → Get Account Details** — sets `fromAccountBalance`, `toAccountBalance`
4. **Transfers → Transfer Funds** — uses `fromAccountId`, `toAccountId`, `transferAmount`

### Authentication

Parabank uses cookie-based sessions. The collection handles this automatically — the Login request captures `JSESSIONID` via a test script and stores it in the environment, where subsequent requests pick it up. Run **Auth → Login** first before executing requests in other folders.

---

## Collection Structure

### Auth (2 requests)

Covers session establishment and teardown.

| Request | Method | Endpoint | Purpose |
|---|---|---|---|
| Login | POST | `/login.htm` | Establish session; sets `JSESSIONID` cookie |
| Logout | GET | `/logout.htm` | Invalidate session |

**Test scripts:** Assert HTTP 200 on login; assert session cookie is present in response.

**Bug reproduction context:** H-016 (session not invalidated on logout) was first identified using these requests by confirming the session cookie remained valid after the Logout call.

### Accounts (3 requests)

Covers account enumeration and balance retrieval via the REST API.

| Request | Method | Endpoint | Purpose |
|---|---|---|---|
| Get All Accounts | GET | `/services/bank/customers/{customerId}/accounts` | List accounts for authenticated user |
| Get Account Details | GET | `/services/bank/accounts/{accountId}` | Retrieve balance and account type |
| Get Account Transactions | GET | `/services/bank/accounts/{accountId}/transactions` | Transaction history |

**Test scripts:** Assert response is JSON array; assert `accountId` field is present; assert balance is numeric.

**Bug reproduction context:** H-018 (IDOR — cross-account access) was confirmed here by substituting another user's `accountId` in the path parameter while authenticated as a different user.

### Transfers (2 requests)

Covers fund transfer execution and idempotency probing.

| Request | Method | Endpoint | Purpose |
|---|---|---|---|
| Transfer Funds | POST | `/services/bank/transfer` | Execute transfer between two accounts |
| Transfer (Negative Amount) | POST | `/services/bank/transfer` | BVA edge case — negative `amount` value |

**Test scripts:** Assert HTTP 200; assert response body contains `"Successfully transferred"`.

**Bug reproduction context:** H-007 (negative amount accepted) was isolated using the second request, which sends `amount: -100`. The server returns HTTP 200 without rejection — the behavior that led to the formal bug report.

### Transactions (1 request)

Covers transaction lookup by ID.

| Request | Method | Endpoint | Purpose |
|---|---|---|---|
| Get Transaction | GET | `/services/bank/transactions/{transactionId}` | Retrieve individual transaction details |

**Test scripts:** Assert `transactionId` matches path parameter; assert `amount` is positive.

---

## Relationship to Automated Tests

The Postman collection does not duplicate the automated suite — it predates and complements it:

- **Contract validation** done manually in Postman → formalized as Zod schemas in `src/contracts/parabank.schemas.ts` → enforced automatically in `tests/api/contract.spec.ts`
- **Bug reproduction steps** documented in Postman → replicated as `test.fail()` cases in the Playwright suite with regulatory mapping
- **Ad-hoc exploration** of undocumented endpoints → findings recorded in `docs/tech-discovery-report.md`

For regression testing, use the Playwright suite. Use this collection when you need to:
- Quickly reproduce a specific bug without running the full suite
- Explore a new endpoint before writing automation
- Demonstrate API behavior to a stakeholder in a visual interface
- Isolate whether a failure is at the API layer vs. the UI layer

---

## Known Limitations

- The collection was built against Parabank `germanobrian1998/parabank:latest`. Behavior may differ on the official ParaSoft image due to data seeding differences.
- The loan endpoint (`/services/bank/requestloan`) is not included because the WSDL loan provider in this image returns corrupted responses — see `docs/not-automated.md` for the exclusion rationale.
- HSQLDB is in-memory: restarting the Docker container resets all data. Re-run Login after any container restart.