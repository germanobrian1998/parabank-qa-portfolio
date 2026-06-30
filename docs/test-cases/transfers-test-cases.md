# Test Cases — Transfers Module

| Field | Value |
|---|---|
| **Module** | Fund Transfers |
| **Risk level** | Critical — highest-risk operation in Parabank (money movement) |
| **Author** | QA Engineer |
| **Date** | 2026-06 |
| **Related documents** | `docs/bva-transfers-module.md` · `docs/tech-discovery-report.md` |
| **Automated suite** | `tests/e2e/transfer.spec.ts` · `tests/api/transfer.api.spec.ts` · `tests/edge-cases/transfer.edge.spec.ts` |

---

## Preconditions (all test cases)

- Parabank Docker container running: `docker run -d -p 8080:8080 germanobrian1998/parabank:latest`
- User `john / demo` authenticated with an active session
- At least two accounts exist for user `john` with sufficient balance for the test case
- Account IDs and current balances retrieved via `GET /services/bank/customers/{customerId}/accounts` before each test

---

## TC-TR-001 — Successful transfer between two own accounts

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-001 |
| **Title** | Successful fund transfer between two accounts of the same customer |
| **Type** | Functional — Happy Path |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `transfer.spec.ts`: `should confirm transfer and reflect updated balance in both accounts` |

**Preconditions:**
- `fromAccount` has balance ≥ $100
- `toAccount` is a different account belonging to the same customer

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Transfer Funds page | Transfer form is displayed with account dropdowns populated |
| 2 | Select `fromAccount` in the "From Account" dropdown | Account is selected |
| 3 | Select `toAccount` in the "To Account" dropdown | Account is selected; it is different from fromAccount |
| 4 | Enter `100` in the Amount field | Amount field shows `100` |
| 5 | Click "Transfer" | Page shows transfer confirmation |
| 6 | Read confirmation message | Message contains "Successfully transferred" with correct amount and account IDs |
| 7 | Call `GET /services/bank/accounts/{fromAccountId}` | Balance decreased by exactly $100 |
| 8 | Call `GET /services/bank/accounts/{toAccountId}` | Balance increased by exactly $100 |

**Expected result:** Transfer executes; confirmation displayed; balances updated correctly on both accounts.  
**Actual result:** ✅ Pass  
**Notes:** Balance verification is done via API (step 7–8) to avoid UI caching issues documented in `tech-discovery-report.md` section 3.1.

---

## TC-TR-002 — Transfer rejected when source account has insufficient funds

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-002 |
| **Title** | Transfer with amount exceeding available balance is rejected |
| **Type** | Functional — Negative / Security |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `transfer.spec.ts`: `[BUG] should reject transfer when source account has insufficient funds` |

**Preconditions:**
- `fromAccount` balance is known (retrieved via API)
- Transfer amount = `fromAccount balance + $0.01` (guaranteed insufficient)

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to Transfer Funds page | Transfer form displayed |
| 2 | Select `fromAccount` | Account selected |
| 3 | Select `toAccount` (different account) | Account selected |
| 4 | Enter amount exceeding `fromAccount` balance | Amount entered |
| 5 | Click "Transfer" | System displays error message |
| 6 | Verify error message | Message indicates insufficient funds |
| 7 | Call `GET /services/bank/accounts/{fromAccountId}` | Balance unchanged |
| 8 | Call `GET /services/bank/accounts/{toAccountId}` | Balance unchanged |

**Expected result:** Transfer rejected with error message; no balance change on either account.  
**Actual result:** 🐛 **FAIL — H-010:** Server accepts the transfer and executes the overdraft. No error is displayed. Both balances are updated despite insufficient funds.  
**Bug reference:** H-010 — `docs/bugs/` · `docs/tech-discovery-report.md`

---

## TC-TR-003 — Transfer rejected when amount is negative

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-003 |
| **Title** | Transfer with negative amount is rejected by the server |
| **Type** | Functional — Negative / Security · BVA lower boundary invalid |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `transfer.spec.ts`: `[BUG H-007] should reject transfer with negative amount` · `transfer.api.spec.ts` |

**Preconditions:**
- Authenticated session active
- Two valid accounts available

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Send `POST /services/bank/transfer?fromAccountId=A&toAccountId=B&amount=-100` directly via API | Server rejects with HTTP 4xx |
| 2 | Verify response status | HTTP 400 Bad Request |
| 3 | Verify response body | Error message indicating invalid amount |
| 4 | Call `GET /services/bank/accounts/{fromAccountId}` | Balance unchanged |
| 5 | Call `GET /services/bank/accounts/{toAccountId}` | Balance unchanged |

**Expected result:** Server rejects negative amount with HTTP 400; no transaction created; balances unchanged.  
**Actual result:** 🐛 **FAIL — H-007:** Server returns HTTP 200. Response body: `"Successfully transferred $-100 from account #A to account #B"`. Origin account balance **increases** by $100; destination account balance **decreases** by $100 — funds flow in the opposite direction of the request.  
**Bug reference:** H-007 — `docs/bugs/H-007-negative-transfer-amount.md`

---

## TC-TR-004 — Transfer rejected when amount is zero

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-004 |
| **Title** | Transfer with $0.00 amount is rejected |
| **Type** | Functional — Negative · BVA lower boundary |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `transfer.edge.spec.ts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Send `POST /services/bank/transfer?fromAccountId=A&toAccountId=B&amount=0` | Server rejects with HTTP 4xx |
| 2 | Verify no transaction recorded | `GET /accounts/{fromAccountId}/transactions` — no new entry |

**Expected result:** Rejected with error; no transaction created.  
**Actual result:** 🐛 **FAIL — H-016:** Server returns HTTP 200: `"Successfully transferred $0 from account #A to account #B"`. Transaction recorded in history of both accounts with amount $0.00. Contaminates transaction ledger; may trigger false positives in fraud detection systems monitoring transaction volume.  
**Bug reference:** H-016 — `docs/tech-discovery-report.md`

---

## TC-TR-005 — Minimum valid amount ($0.01) is accepted

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-005 |
| **Title** | Transfer with minimum valid amount ($0.01) executes successfully |
| **Type** | Functional — BVA lower boundary valid |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `transfer.edge.spec.ts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Send `POST /services/bank/transfer?fromAccountId=A&toAccountId=B&amount=0.01` | HTTP 200 |
| 2 | Verify confirmation message | Contains "Successfully transferred $0.01" |
| 3 | Verify balance delta | `fromAccount` decreased by $0.01; `toAccount` increased by $0.01 |

**Expected result:** Transfer of $0.01 accepted and executed correctly.  
**Actual result:** ✅ Pass

---

## TC-TR-006 — Transfer to non-existent account is rejected

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-006 |
| **Title** | Transfer to an account ID that does not exist is rejected |
| **Type** | Functional — Negative |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `transfer.edge.spec.ts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Send `POST /services/bank/transfer?fromAccountId=A&toAccountId=99999999&amount=100` | HTTP 4xx |
| 2 | Verify error message | Indicates invalid destination account |
| 3 | Verify `fromAccount` balance | Unchanged |

**Expected result:** Rejected with error; no funds debited from source.  
**Actual result:** ✅ Pass

---

## TC-TR-007 — Transfer from account to itself is rejected

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-007 |
| **Title** | Transfer where source and destination account are the same is rejected |
| **Type** | Functional — Negative · BVA identity boundary |
| **Priority** | P2 |
| **Automated** | ✅ Yes — `transfer.edge.spec.ts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Send `POST /services/bank/transfer?fromAccountId=A&toAccountId=A&amount=100` | HTTP 4xx |
| 2 | Verify error message | Indicates source and destination cannot be the same |
| 3 | Verify account balance | Unchanged — no phantom debit/credit pair |

**Expected result:** Rejected with error; no transaction pair created in history.  
**Actual result:** 🐛 **FAIL — H-017:** Server returns HTTP 200. Two transactions recorded in the same account (one debit, one credit). Net balance is unchanged but the account history contains a phantom transaction pair. In financial audits, self-transfers are an anomaly associated with structuring attempts.  
**Bug reference:** H-017 — `docs/tech-discovery-report.md`

---

## TC-TR-008 — Duplicate transfer submission does not create duplicate transactions

| Field | Value |
|---|---|
| **Test Case ID** | TC-TR-008 |
| **Title** | Submitting the same transfer twice creates only one transaction |
| **Type** | Functional — Idempotency |
| **Priority** | P1 |
| **Automated** | ✅ Yes — `transfer.spec.ts`: `[BUG] should reject transfer when source account has insufficient funds` (covers double-submit via UI) · `tests/api/idempotency.api.spec.ts` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Submit transfer via UI or API | Confirmation shown; one transaction recorded |
| 2 | Submit the identical transfer a second time immediately | System rejects or deduplicates |
| 3 | Call `GET /accounts/{fromAccountId}/transactions` | Exactly one debit entry for the amount |
| 4 | Verify balance | Debited exactly once |

**Expected result:** Second submission is rejected or deduplicated; only one transaction in history; balance debited once.  
**Actual result:** 🐛 **FAIL — H-008:** Both submissions succeed. Two identical debit/credit transaction pairs are recorded. Balance is debited twice. Double-submit via UI (e.g. slow connection causing user to click twice) silently executes two transfers.  
**Bug reference:** H-008 — `docs/tech-discovery-report.md`

---

## Bug summary — Transfers module

| Bug ID | TC | Severity | Description |
|---|---|---|---|
| H-007 | TC-TR-003 | Critical | Negative amounts accepted; funds flow reversed |
| H-008 | TC-TR-008 | High | Duplicate submission creates duplicate transactions |
| H-010 | TC-TR-002 | Critical | Overdraft allowed; insufficient balance not validated |
| H-016 | TC-TR-004 | Medium | $0.00 transfers accepted; phantom ledger entries created |
| H-017 | TC-TR-007 | Medium | Self-transfer accepted; phantom debit/credit pair recorded |

4 out of 8 test cases expose bugs. All critical-severity bugs involve server-side validation gaps — the system accepts financially invalid operations that client-side validation would normally block but cannot prevent when bypassed via direct API calls.