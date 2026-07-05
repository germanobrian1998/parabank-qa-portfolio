# Severity & Priority Matrix — Parabank QA Portfolio

| Field | Value |
|---|---|
| **Document ID** | SPM-001 |
| **Version** | 1.0 |
| **Status** | Final |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Methodology** | Probability × Business Impact (ISTQB-aligned risk matrix) |
| **Related documents** | `docs/risk-based-strategy.md` · `docs/tech-discovery-report.md` · `docs/traceability-matrix.md` |

---

## Purpose

This document formalizes the classification criteria used throughout the project to
assign **Severity** (technical/business consequence of a defect) and **Priority**
(urgency of fixing it) to every bug (H-007 to H-019) and every risk (R1 to R10).

Before this document existed, severity was assigned by judgment call on a
per-bug basis (Critical / High / Medium, consistently applied but not backed
by an explicit rubric). This document makes that rubric explicit and retroactively
validates that every existing classification in `tech-discovery-report.md` and
`docs/bugs/` is consistent with it.

**Why this matters for an interview:** a reviewer who asks "why is H-007 Critical
and H-013 only Medium?" should get an answer that points to a documented rubric,
not "it felt more serious." This document is that rubric.

---

## 1. Severity — technical/business consequence

Severity answers: **"How bad is it if this happens?"** — independent of how
likely it is to happen or how urgently it needs fixing.

### 1.1 Severity levels

| Level | Definition | Financial/Security impact | Example from this project |
|---|---|---|---|
| **Critical** | Direct, unrecoverable financial loss, unauthorized fund movement, or exposure of financial data without authentication. No workaround exists. | Money moves incorrectly or data is exposed with no user action required. | H-007 (negative amounts reverse fund direction), H-010 (unlimited overdraft), H-018 (IDOR — account data exposed with no auth) |
| **High** | Incorrect financial outcome or security control failure that requires a specific user/attacker action to trigger, or produces duplicated/incorrect records without direct fund creation. | Money movement is duplicated or a security control is bypassed, but requires a precondition (double-click, bypassing client validation). | H-008 (duplicate transactions on double-submit), H-011 (UI accepts duplicate username), H-014 (beneficiary mismatch not validated) |
| **Medium** | Data integrity or UX inconsistency that does not move funds incorrectly but corrupts records, misleads the user, or weakens a non-financial control. | No direct fund loss; ledger/audit trail pollution or session hygiene issue. | H-009 (session not invalidated), H-012 (empty fields accepted), H-013 ($100 instead of $0 on new account), H-016 ($0.00 transfers), H-017 (self-transfers) |
| **Low / Informational** | Cosmetic, accessibility, or documentation gap with no functional or financial consequence. | None — improves usability/compliance posture only. | Individual WCAG 2.1 AA violations (see `docs/accessibility-report.md`) below Critical impact tier |

### 1.2 Severity decision tree

```
Does the defect move money incorrectly OR expose financial data
without authentication?
│
├── YES, with no precondition required ──────────────► CRITICAL
│
├── YES, but requires a specific trigger
│   (double-submit, bypassing client-side JS) ────────► HIGH
│
├── NO — but it corrupts the transaction ledger,
│   audit trail, or leaves a security control weakened
│   (e.g. session not invalidated) ───────────────────► MEDIUM
│
└── NO — cosmetic, accessibility, or documentation only ► LOW
```

---

## 2. Priority — urgency of remediation

Priority answers: **"How soon must this be fixed, regardless of severity?"**
Priority and Severity are independent axes — a Low-severity defect can be
P1 if it blocks a compliance deadline; a Critical defect can theoretically
be P2 if a compensating control exists elsewhere. In this project, Severity
and Priority are correlated (fintech context: financial severity almost
always implies urgency) but the axes are kept separate for methodological
correctness.

| Priority | Definition | SLA-equivalent framing used in this project |
|---|---|---|
| **P1** | Must be fixed before any further release; blocks production readiness. | Any Critical severity bug; any High severity bug on a PCI-DSS-mapped control |
| **P2** | Should be fixed in the current cycle; does not block release if documented and monitored. | Medium severity bugs affecting data integrity |
| **P3** | Backlog — fix opportunistically. | Low severity / cosmetic / accessibility violations already baselined |

### 2.1 Priority assignment rule used in this project

```
Priority = P1  if Severity == Critical
Priority = P1  if Severity == High AND bug maps to a PCI-DSS requirement
Priority = P2  if Severity == High (no PCI-DSS mapping) OR Severity == Medium
Priority = P3  if Severity == Low
```

---

## 3. Full classification table — every bug found in this project

This table is the single source of truth for severity/priority. Every other
document (`tech-discovery-report.md`, `docs/bugs/`, `docs/pci-dss-coverage.md`,
`test-summary-report.md`) must agree with this table. If a discrepancy is
found, this table wins and the other document is corrected.

| Bug ID | Description | Severity | Rationale (per decision tree §1.2) | Priority | PCI-DSS mapped? |
|---|---|---|---|---|---|
| H-007 | Negative amounts accepted (transfer/billpay/loan) — reverses fund direction | Critical | Moves money incorrectly, no precondition | P1 | Yes — Req. 6.2.4/6.3.3 |
| H-008 | Double-submit creates duplicate transactions | High | Moves money incorrectly, requires trigger (double-submit) | P1 | Informal — Req. 10 (logging) in full PCI scope |
| H-009 | Session not invalidated post-logout | Medium | No direct fund loss; weakens auth control | P2 | Yes — Req. 8.3 |
| H-010 | Overdraft permitted without validation | Critical | Moves money incorrectly, no precondition | P1 | Yes — Req. 6.3.3 |
| H-011 | UI accepts duplicate username (server rejects correctly) | High → **Informational at server level** | UI-only defect; server control is intact | P2 | No |
| H-012 | Empty required fields accepted on registration | Medium | Data integrity, no fund movement | P2 | No |
| H-013 | New accounts created with $100 instead of $0 | Medium | Ledger inconsistency, no unauthorized movement | P2 | No |
| H-014 | Beneficiary account mismatch not validated server-side | High | Moves money incorrectly, requires bypassing client validation | P1 | Yes — Req. 6.3 (data accuracy) |
| H-015 | Negative amounts accepted in loan requests | Critical | Moves money incorrectly, no precondition | P1 | Yes — Req. 6.2.4 |
| H-016 | $0.00 transfers accepted | Medium | Ledger pollution, no fund movement | P2 | No |
| H-017 | Self-transfers accepted | Medium | Ledger/audit anomaly, no net fund movement | P2 | No |
| H-018 | IDOR — account data exposed without authentication | Critical | Data exposure, no precondition (no auth required at all) | P1 | Yes — Req. 7.1/7.2 |
| H-019 | `/requestLoan` not idempotent — duplicate LOAN accounts | High | Moves money/creates liability incorrectly, requires trigger (retry/concurrency) | P1 | Informal — Req. 10 in full PCI scope |

**Note on H-011:** this is the one entry in the project where severity depends
on *which layer* is being evaluated. The UI-level defect (accepts duplicate
username, shows false success) is High because it misleads the customer about
account state. The server-level behavior is correct and requires no fix — this
distinction is why `tech-discovery-report.md` documents it as "bug solo en UI."

---

## 4. Full classification table — every risk in the risk register

Cross-reference with `docs/risk-based-strategy.md` §1.2. This table adds the
explicit Probability × Impact grid that the risk register applied informally.

| Risk ID | Description | Probability | Business Impact | Severity (derived) | Priority |
|---|---|---|---|---|---|
| R1 | Duplicate transfer via double-submit/retry | High | High | High | P1 |
| R2 | Stale balance in UI post-transfer | High | High | High | P1 |
| R3 | Client-only amount validation, API bypass | High | High | Critical (realized as H-007/H-015) | P1 |
| R4 | Session not invalidated on logout | Medium | Medium | Medium | P2 |
| R5 | Loan created with inconsistent amount/income data | Medium | Medium | Medium | P2 |
| R6 | Duplicate username registration without clear error | Medium | Low-Medium | Low-Medium | P3 |
| R7 | Transaction history lag after operation | Medium | Medium | Medium | P2 |
| R8 | Bill Pay to nonexistent destination account | Medium | Medium | Medium | P2 |
| R9 | UI/DB balance inconsistency post-transfer | Low-Medium | High | Medium | P2 |
| R10 | Wrong account type on account opening | Low | Low | Low | P3 |

### 4.1 Probability × Impact grid (visual reference)

```
                    IMPACT →
                Low        Medium       High
P  High    │   P3    │    P1/P2   │    P1     │  R1, R2, R3
R  Medium  │   P3    │    P2      │    P2     │  R4, R5, R7, R8, R9
O  Low     │   P3    │    P3      │    P2     │  R6, R10
B
```

This grid confirms the risk-density map already in `risk-based-strategy.md`
§1.3: Transfers concentrates the High/High cell (R1, R2, R3), which is why it
receives the highest test density (3 E2E + 3 API + 1 DB + 5 BVA edge cases).

---

## 5. How this document is used

- **New bugs found in future work** are classified using the decision tree in
  §1.2 before being written up in `docs/bugs/` — severity is assigned first,
  independent of how "urgent it feels."
- **New risks added to the register** go through the Probability × Impact grid
  in §4.1 before receiving a test density allocation.
- **Any severity disagreement in code review** is resolved by pointing to this
  document's decision tree, not by re-litigating the specific bug.

---

*Cross-referenced by: `docs/traceability-matrix.md` · `docs/pci-dss-coverage.md` · `docs/test-summary-report.md`*