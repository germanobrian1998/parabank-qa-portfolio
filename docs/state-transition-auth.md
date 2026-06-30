# State Transition Testing — Authentication Flow

**Document type:** Test Design — Retroactive  
**Technique:** State Transition Testing  
**Module:** Authentication (Registration · Login · Logout)  
**Author:** QA Engineer  
**Date:** 2026-06  
**Related test file:** `tests/e2e/auth.spec.ts`

---

## Purpose

This document applies State Transition Testing to the Parabank authentication flow. It was produced retroactively to make explicit the design rationale behind the tests in `auth.spec.ts` — the states, transitions, and invalid paths that the suite covers.

State Transition Testing is appropriate here because the authentication module is fundamentally stateful: the system's behavior in response to any action (login, logout, navigate) depends entirely on the current session state, not just the input values.

---

## State Diagram

```
                        ┌─────────────────────────────────────────┐
                        │                                         │
                        ▼                                         │
              ┌─────────────────┐                                 │
              │                 │                                 │
    ─────────▶│   ANONYMOUS     │                                 │
    (initial) │                 │                                 │
              └────────┬────────┘                                 │
                       │                                          │
          ┌────────────┼────────────────────┐                     │
          │            │                    │                     │
          ▼            ▼                    ▼                     │
   [Login: valid]  [Login: invalid]   [Register: valid]           │
          │            │                    │                     │
          │     ┌──────────────┐            │                     │
          │     │ ANONYMOUS    │            ▼                     │
          │     │ (error shown)│   ┌────────────────┐            │
          │     └──────────────┘   │  REGISTERED    │            │
          │                        │  (unverified)  │            │
          │                        └───────┬────────┘            │
          │                                │                     │
          │                         [Login: valid]               │
          │                                │                     │
          └──────────────┬─────────────────┘                     │
                         ▼                                        │
              ┌─────────────────────┐                             │
              │                     │                             │
              │   AUTHENTICATED     │─────[Logout]────────────────┘
              │                     │
              └──────────┬──────────┘
                         │
              [Navigate to protected page]
                         │
                         ▼
              ┌─────────────────────┐
              │  AUTHENTICATED      │
              │  (page displayed)   │
              └─────────────────────┘
```

**States defined:**

| State ID | Name | Description |
|---|---|---|
| S1 | Anonymous | No active session. User has not authenticated. |
| S2 | Registered (unverified) | User completed registration but has not yet logged in with new credentials. |
| S3 | Authenticated | Valid session exists. User has access to protected resources. |
| S4 | Post-logout | Logout action was performed. **Expected:** session invalidated → S1. **Actual (H-009):** session cookie persists server-side. |

> **Note on S4:** In a correctly implemented system, Post-logout and Anonymous are the same state — logout transitions directly to S1. S4 is called out separately because H-009 confirms that Parabank's server-side session invalidation is not working, making S4 a distinct observable state in this SUT.

---

## Transition Table

| # | From State | Event / Input | Expected Next State | Expected Output | Test Coverage |
|---|---|---|---|---|---|
| T1 | S1 Anonymous | Register with valid unique data | S2 Registered | Welcome message shown; username confirmed | `should register a new customer and redirect to welcome page` |
| T2 | S1 Anonymous | Register with duplicate username | S1 Anonymous | Error: username already exists | `[BUG] should reject registration with duplicate username` *(test.fail — H-011)* |
| T3 | S1 Anonymous | Register with empty required fields | S1 Anonymous | Validation error shown | `[BUG] should show validation error when required fields are empty` *(test.fail)* |
| T4 | S1 Anonymous | Login with valid credentials | S3 Authenticated | Redirect to `overview.htm`; session established | `should authenticate with valid credentials and show account overview` |
| T5 | S1 Anonymous | Login with wrong password | S1 Anonymous | Error: authentication failed | `should reject login with incorrect password` |
| T6 | S1 Anonymous | Login with non-existent username | S1 Anonymous | Error: authentication failed | `should reject login with non-existent username` |
| T7 | S1 Anonymous | Login with empty credentials | S1 Anonymous | Error: validation failure | `should reject login with empty credentials` |
| T8 | S2 Registered | Login with new credentials immediately | S3 Authenticated | Redirect to `overview.htm` | `[BUG] should allow login with newly registered credentials` *(test.fail — H-011 UI layer)* |
| T9 | S3 Authenticated | Logout | S1 Anonymous | Redirect to `index.htm` or `login.htm`; session terminated | `should log out and redirect to public page` |
| T10 | S3 Authenticated | Navigate to protected page | S3 Authenticated | Page displayed normally | *(implicit in authenticated fixture usage across all E2E suites)* |
| T11 | S4 Post-logout | Navigate to protected page | S1 Anonymous (redirect) | Redirect to login page; access denied | `[BUG H-009] should not allow access to protected pages after logout` *(test.fail)* |
| T12 | S4 Post-logout | Check UI for logout link | S1 Anonymous | Logout link not visible | `should not show logout link on public pages` |

---

## Test Coverage Summary

### Covered transitions (passing)

| Transition | Test name | Notes |
|---|---|---|
| T1 | `should register a new customer and redirect to welcome page` | `@smoke` tagged |
| T4 | `should authenticate with valid credentials and show account overview` | `@smoke` tagged |
| T5 | `should reject login with incorrect password` | — |
| T6 | `should reject login with non-existent username` | — |
| T7 | `should reject login with empty credentials` | — |
| T9 | `should log out and redirect to public page` | `@smoke` tagged |
| T12 | `should not show logout link on public pages` | — |

### Covered transitions (test.fail — known bugs)

| Transition | Test name | Bug ID | Bug description |
|---|---|---|---|
| T2 | `[BUG] should reject registration with duplicate username` | H-011 (UI layer) | Server rejects correctly; UI does not process the error response |
| T3 | `[BUG] should show validation error when required fields are empty` | — | Server-side validation gap |
| T8 | `[BUG] should allow login with newly registered credentials` | H-011 (UI layer) | Registration succeeds but immediate login fails |
| T11 | `[BUG H-009] should not allow access to protected pages after logout` | H-009 | Session cookie persists server-side after logout |

### Transitions not covered

| Transition | Reason |
|---|---|
| T10 (explicit) | Covered implicitly via authenticated fixture in all other E2E suites (`fixtures/index.ts`); no standalone test needed |

---

## Invalid Transitions (negative paths)

These are transitions the system should reject and does not allow from a given state:

| From State | Invalid Event | Expected behavior | Verified by |
|---|---|---|---|
| S1 Anonymous | Access `overview.htm` directly | Redirect to login | Implicit in smoke check `environment.spec.ts` |
| S3 Authenticated | Register again | Not applicable — navigation to `/register` is possible but starts a new registration flow, not a state violation | Not tested (out of scope) |
| S3 Authenticated | Login again | Not applicable — existing session would be replaced | Not tested (out of scope) |

---

## Design Notes

**Why State Transition is the right technique here:**  
Authentication behavior depends on session state, not just inputs. The same action — navigating to `overview.htm` — produces different results depending on whether the user is in S1, S3, or S4. Equivalence partitioning alone would not capture this because the distinguishing factor is state, not input value.

**On the S4 / H-009 finding:**  
The most valuable output of applying this technique to Parabank was making H-009 explicit as a state transition failure. The test `should not allow access to protected pages after logout` is not simply a negative test — it documents that transition T11 (S4 → S1 on protected page access) is broken: the server accepts the stale `JSESSIONID` and serves the protected page, meaning the system is stuck in an observable S4 rather than completing the transition to S1.

**Retroactive vs. prospective design:**  
This document was produced retroactively. The tests in `auth.spec.ts` were designed from domain knowledge, not from this diagram. However, the mapping confirms that the suite achieves full N-switch coverage at N=0 (all individual transitions are exercised) and covers the most critical N=1 sequence: T4 → T9 → T11 (login → logout → protected page access), which is the path that exposes H-009.