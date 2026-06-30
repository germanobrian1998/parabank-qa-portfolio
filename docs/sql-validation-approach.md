# SQL Validation Approach — Parabank QA Portfolio

**Document type:** Test Design — Compensated Constraint  
**Author:** QA Engineer  
**Date:** 2026-06  
**Related ADR:** `docs/decisions/ADR-004`

---

## Context

SQL / DB testing is listed as a skill in this QA profile with a concrete application: validating that financial operations produce correct state at the persistence layer, independent of what the API or UI report.

This document explains:
1. Why direct DB validation is not implemented in this project (constraint, not omission)
2. How that gap is compensated via API validation
3. What the SQL queries would look like in an environment where DB access is available

---

## Why ADR-004 ruled out direct DB access in this project

Parabank runs on **HSQLDB (HyperSQL)** — an embedded, in-memory database that initializes inside the same JVM process as the Spring application. It does not expose an external port. There is no JDBC connection string, no TCP listener, and no way to connect an external SQL client or JDBC driver from outside the container.

This is not a configuration choice that can be changed without forking the application. HSQLDB in embedded mode is architecturally incompatible with external DB connections.

Attempting to work around this would require:
- Replacing HSQLDB with PostgreSQL or MySQL in the Spring datasource config
- Rebuilding the Docker image from source
- Validating that the schema migration works correctly on the new engine

That scope exceeds the purpose of this portfolio project. The decision to accept the constraint and compensate via API validation is documented in ADR-004.

---

## Compensation strategy: API as DB proxy

Since the DB is not directly accessible, all data integrity assertions are made through the REST API layer — which reads from the same HSQLDB instance the application writes to.

This is not equivalent to direct DB validation, and the difference is acknowledged:

| Aspect | Direct DB validation | API-as-proxy validation |
|---|---|---|
| Bypasses application layer | ✅ Yes | ❌ No — reads through the same code that wrote |
| Detects silent DB corruption | ✅ Yes | ❌ No — corrupt data returned correctly by API looks like valid data |
| Detects ORM mapping bugs | ✅ Yes | ❌ Partial — only if the mapping bug affects the API response |
| Detects phantom writes | ✅ Yes | ✅ Yes — a write that never persisted won't appear in GET response |
| Detects phantom reads | ✅ Yes | ✅ Yes — a record that shouldn't exist will appear in GET response |
| Implementation cost | Low (SQL query) | Medium (authenticated API client setup) |

**Where API validation is used in this project:**

- `tests/e2e/billpay.spec.ts` — after a bill payment, the test calls `GET /accounts/{id}/transactions` and asserts the debit transaction exists with the correct amount. This replaces a direct `SELECT` on the transactions table.
- `tests/api/transfer.api.spec.ts` — after a transfer, the test calls `GET /accounts/{fromId}` and `GET /accounts/{toId}` and asserts the balance delta matches the transfer amount.
- `tests/api/contract.spec.ts` — Zod schemas validate the shape and types of every field returned by the API, which catches schema drift that would otherwise require a `DESCRIBE TABLE` or `information_schema` query.

---

## SQL queries for a DB-accessible environment

The following queries are written for the Parabank schema as inferred from API responses, ADR-004 notes, and the Spring MVC source structure. They represent what a DB validation layer would execute if HSQLDB were replaced with an externally accessible database (PostgreSQL, MySQL, or HSQLDB in server mode).

### 1. Verify transfer persisted correctly

After `POST /transfer?fromAccountId=A&toAccountId=B&amount=X`:

```sql
-- Assert debit transaction exists on source account
SELECT t.id, t.account_id, t.type, t.amount, t.description
FROM transaction t
WHERE t.account_id = :fromAccountId
  AND t.type = 'Debit'
  AND t.amount = :amount
ORDER BY t.date DESC
LIMIT 1;

-- Assert credit transaction exists on destination account
SELECT t.id, t.account_id, t.type, t.amount, t.description
FROM transaction t
WHERE t.account_id = :toAccountId
  AND t.type = 'Credit'
  AND t.amount = :amount
ORDER BY t.date DESC
LIMIT 1;

-- Assert balance updated correctly on both accounts
SELECT a.id, a.balance
FROM account a
WHERE a.id IN (:fromAccountId, :toAccountId);
```

**What this catches that API validation misses:** a scenario where the transfer API returns HTTP 200 with a success message but the DB write fails silently (e.g. due to a transaction rollback that the application swallows). The API response would look correct; the DB query would return no rows.

### 2. Verify new account creation

After opening a new CHECKING or SAVINGS account:

```sql
-- Assert account exists with correct type and owner
SELECT a.id, a.customer_id, a.type, a.balance
FROM account a
WHERE a.customer_id = :customerId
  AND a.type = :accountType
ORDER BY a.id DESC
LIMIT 1;

-- Assert initial balance is $0.00 (documents H-013: Parabank sets $100 instead)
SELECT a.balance
FROM account a
WHERE a.id = :newAccountId;
-- Expected: 0.00
-- Actual (H-013): 100.00
```

**Relationship to H-013:** this query would be the definitive evidence for the bug report — a direct read of the balance column at the moment of creation, before any other operation touches the account. The current evidence in `accounts.spec.ts` reads the balance through the UI, which introduces the possibility that the display layer is rounding or transforming the value.

### 3. Verify bill payment transaction record

After `POST /billpay` with `fromAccountId=A`, `amount=X`, `payeeName=Y`:

```sql
-- Assert bill payment transaction exists in ledger
SELECT t.id, t.account_id, t.type, t.amount, t.description
FROM transaction t
WHERE t.account_id = :fromAccountId
  AND t.type = 'Debit'
  AND t.amount = :amount
  AND t.description LIKE '%' || :payeeName || '%'
ORDER BY t.date DESC
LIMIT 1;

-- Assert source account balance decreased by payment amount
SELECT a.balance
FROM account a
WHERE a.id = :fromAccountId;
-- Expected: (balance_before - :amount)
```

### 4. Verify user registration

After `POST /register`:

```sql
-- Assert customer record was created
SELECT c.id, c.username, c.first_name, c.last_name
FROM customer c
WHERE c.username = :username;

-- Assert customer has a default account assigned
SELECT a.id, a.type, a.balance
FROM account a
WHERE a.customer_id = (
  SELECT c.id FROM customer c WHERE c.username = :username
);
```

### 5. Detect phantom transactions (H-007 negative amount validation)

In a system with correct validation, this query should return zero rows after a rejected negative-amount transfer attempt:

```sql
-- Assert no transaction was recorded for a rejected negative-amount transfer
SELECT COUNT(*) as phantom_count
FROM transaction t
WHERE t.account_id = :fromAccountId
  AND t.amount < 0
  AND t.type = 'Debit'
  AND t.date >= :testStartTime;
-- Expected: 0
-- Actual (H-007): > 0 — Parabank records the negative transaction
```

This query makes H-007 forensically precise: it is not just that the API returns HTTP 200 — the invalid transaction is persisted in the ledger. In a real audit, this is the difference between a UX bug and a data integrity violation.

### 6. IDOR audit — detect unauthorized reads (H-018)

In a system with correct access control logging:

```sql
-- Detect reads of account data by sessions belonging to a different customer
SELECT al.session_id, al.endpoint, al.account_id, al.timestamp
FROM access_log al
JOIN account a ON al.account_id = a.id
JOIN customer c ON a.customer_id = c.id
WHERE al.session_customer_id != c.id
  AND al.endpoint LIKE '/services/bank/accounts/%'
ORDER BY al.timestamp DESC;
-- Expected: 0 rows (no cross-customer reads)
-- Actual (H-018): rows present — unauthenticated reads are not logged or blocked
```

Note: Parabank does not implement an `access_log` table. This query represents what a production banking system's DB audit layer would look like to detect the IDOR pattern documented in H-018.

---

## How this skill applies in production fintech contexts

In a real fintech system with an externally accessible DB (PostgreSQL, MySQL, Aurora), DB-layer validation is used for:

- **Reconciliation testing:** asserting that the sum of all debit transactions equals the sum of all credit transactions within a time window — a constraint the application layer cannot self-report accurately if it has a bug
- **Idempotency verification:** asserting that a duplicated API call (same `idempotency_key`) produced exactly one DB record, not two
- **Audit trail completeness:** asserting that every state change in the application has a corresponding entry in the audit log table
- **Schema contract testing:** asserting that column types, constraints (NOT NULL, UNIQUE, FK), and indexes match the expected schema — equivalent to what `src/contracts/parabank.schemas.ts` does at the API level, but at the persistence layer

These patterns are directly applicable to the microservices fintech framework project (payments-service + accounts-service with PostgreSQL), where each service has its own externally accessible DB and DB-layer validation is part of the test architecture.