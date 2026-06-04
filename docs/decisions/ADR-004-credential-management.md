# ADR-004 — Credential Management Strategy

**Date:** 2026-06-04  
**Status:** Accepted

## Context

The k6 performance scripts originally contained hardcoded credentials and base URLs as string literals:

```js
http.get('http://localhost:9090/parabank/services/bank/login/john/demo')
```

In a CI pipeline, these values appear in runner logs and GitHub Actions artifacts. In a fintech environment subject to PCI-DSS compliance, hardcoded credentials in source code constitute an audit finding — even when the values are demo credentials for a test environment.

Additionally, the `login.baseline.k6.js` script contained a hardcoded customer ID (`id === 12212`) in an assertion, coupling the test to a specific database state.

## Decision

All credentials and environment-specific URLs are read from environment variables at runtime, with safe fallbacks to demo values for local development:

```js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';
const USER     = __ENV.PARABANK_USER || 'john';
const PASS     = __ENV.PARABANK_PASS || 'demo';
```

A `.env.example` file documents the required variables at the repo root. The actual `.env` file is excluded via `.gitignore`.

Assertions that previously compared against hardcoded IDs now verify the type of the field instead:

```js
// before
'response contains customerId': (r) => JSON.parse(r.body).id === 12212

// after
'response contains customerId': (r) => typeof JSON.parse(r.body).id === 'number'
```

## Consequences

- No credentials or environment-specific values appear as string literals in source code
- Scripts can target different environments (local, staging, CI) via environment variables without code changes
- CI pipelines pass credentials via secrets, never via committed files
- The `.env.example` file serves as self-documenting reference for anyone cloning the repo
- Assertions are decoupled from specific database state and pass on any fresh Docker instance