# Test Cases — Accessibility Module

| Field | Value |
|---|---|
| **Module** | Accessibility (axe-core / WCAG 2.1 AA) |
| **Risk level** | Medium — legal (ADA/Section 508), financial (excludes customer segment), and reputational risk in a banking context |
| **Author** | QA Engineer |
| **Date** | 2026-07 |
| **Related documents** | `docs/accessibility-report.md` |
| **Automated suite** | `tests/accessibility/a11y.spec.ts` |

---

## Why these are documented as test cases, not just an audit report

`docs/accessibility-report.md` documents *findings* (26 violations, business
impact per violation). This document documents the *test cases* — which page,
under what standard, against what regression threshold — the same way every
other functional module in this project is traced from risk to test to
result.

---

## Methodology note (scope honesty)

axe-core detects an estimated 30-40% of WCAG violations automatically — issues
requiring human judgment (focus order, reading flow, cognitive load) are not
covered by any test case in this module. This is stated in
`docs/accessibility-report.md` and repeated here because a reviewer evaluating
test case completeness should see the ceiling on automated coverage before
assuming "5 passing accessibility tests" means "5 pages are accessible."

---

## Preconditions (all test cases)

- Parabank Docker container running and healthy
- `@axe-core/playwright` installed
- For authenticated pages (Transfer, Bill Pay, Accounts Overview): active
  session as `john / demo`

---

## TC-A11Y-001 — Login page meets WCAG 2.1 AA baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-A11Y-001 |
| **Title** | Login page violation count does not exceed the documented baseline |
| **Type** | Non-functional — Accessibility regression |
| **Priority** | P2 |
| **Baseline threshold** | ≤ 5 violations (measured 2026-06-19) |
| **Automated** | ✅ Yes — `a11y.spec.ts`: `login page should meet WCAG 2.1 AA` |

**Steps:**

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to login page | Page loads |
| 2 | Run axe-core scan with `wcag2a`/`wcag2aa` tags | Violation list returned |
| 3 | Assert violation count ≤ 5 | Test passes if at or below baseline |

**Expected result:** No new violations introduced beyond the documented baseline for this page.
**Actual result:** ✅ Pass (at baseline — 5 violations documented: `label` missing on username/password fields, `html-has-lang`, `color-contrast`, `image-alt`, `link-name` on the admin nav icon)
**Reference:** `docs/accessibility-report.md` — Login row

**Why this is regression testing, not zero-violation enforcement:** Parabank
is a legacy demo application with 26 known violations across 5 pages. Requiring
zero would make every test fail permanently on defects this project has no
ability to fix upstream. The threshold freezes the current state as a baseline
and fails only if a *new* violation is introduced — this is the correct pattern
for accessibility testing on an application the QA team does not own the
source code for.

---

## TC-A11Y-002 — Register page meets WCAG 2.1 AA baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-A11Y-002 |
| **Title** | Register page violation count does not exceed the documented baseline |
| **Type** | Non-functional — Accessibility regression |
| **Priority** | P2 |
| **Baseline threshold** | ≤ 5 violations |
| **Automated** | ✅ Yes — `a11y.spec.ts`: `register page should meet WCAG 2.1 AA` |

**Expected result:** Violation count ≤ 5 (13 unlabeled inputs contribute to the `label` violation category, counted once per rule, not once per element).
**Actual result:** ✅ Pass (at baseline)
**Why this page matters most:** registration is the only channel to *become*
a customer — a violation here is a barrier to entry, not just a barrier to
using an existing account.

---

## TC-A11Y-003 — Transfer page meets WCAG 2.1 AA baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-A11Y-003 |
| **Title** | Transfer page violation count does not exceed the documented baseline |
| **Type** | Non-functional — Accessibility regression |
| **Priority** | P1 |
| **Baseline threshold** | ≤ 6 violations |
| **Automated** | ✅ Yes — `a11y.spec.ts`: `transfer page should meet WCAG 2.1 AA` |

**Expected result:** Violation count ≤ 6 (includes `select-name` on the from/to account dropdowns — the highest-severity accessibility finding in the project).
**Actual result:** ✅ Pass (at baseline)
**Why this is P1 despite being "just" accessibility:** a screen reader user
who cannot distinguish the "From Account" and "To Account" dropdowns (both
announced generically as "combo box") could select them in reverse, sending
funds in the opposite direction from what was intended. This is one of the
few accessibility findings in this project with a *direct* financial
consequence, not just a usability one.

---

## TC-A11Y-004 — Bill Pay page meets WCAG 2.1 AA baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-A11Y-004 |
| **Title** | Bill Pay page violation count does not exceed the documented baseline |
| **Type** | Non-functional — Accessibility regression |
| **Priority** | P1 |
| **Baseline threshold** | ≤ 6 violations |
| **Automated** | ✅ Yes — `a11y.spec.ts`: `bill pay page should meet WCAG 2.1 AA` |

**Expected result:** Violation count ≤ 6.
**Actual result:** ✅ Pass (at baseline)
**Why this matters:** recurring bill payments are disproportionately used by
older adults and low-vision users. Unlabeled `Account #` and `Verify Account #`
fields (same `label` violation as elsewhere) are particularly risky here
because confusing them could route a payment to the wrong account.

---

## TC-A11Y-005 — Accounts overview meets WCAG 2.1 AA baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-A11Y-005 |
| **Title** | Accounts overview violation count does not exceed the documented baseline |
| **Type** | Non-functional — Accessibility regression |
| **Priority** | P2 |
| **Baseline threshold** | ≤ 4 violations |
| **Automated** | ✅ Yes — `a11y.spec.ts`: `accounts overview should meet WCAG 2.1 AA` |

**Expected result:** Violation count ≤ 4 — the lowest baseline of the five pages, since it has no complex form inputs (only the shared `html-has-lang`, `color-contrast`, `image-alt`, `link-name` violations present on every page).
**Actual result:** ✅ Pass (at baseline)
**Why this page matters:** it's the landing page for every authenticated
session — a blocking violation here would strand a user with a screen reader
immediately after logging in, before they can reach any other page.

---

## Summary and severity distribution reference

| TC | Page | Baseline | Result | Highest-severity violation on this page |
|---|---|---|---|---|
| TC-A11Y-001 | Login | 5 | ✅ Pass | `label` (Critical) |
| TC-A11Y-002 | Register | 5 | ✅ Pass | `label` (Critical, 13 affected inputs) |
| TC-A11Y-003 | Transfer | 6 | ✅ Pass | `select-name` (Critical — direct financial risk) |
| TC-A11Y-004 | Bill Pay | 6 | ✅ Pass | `label` (Critical — payee account fields) |
| TC-A11Y-005 | Accounts Overview | 4 | ✅ Pass | `image-alt` / `link-name` (Critical, admin nav icon) |

**All 5 test cases pass against their documented baselines.** Full violation
detail, business-impact narrative, and remediation priority (P1-P3) live in
`docs/accessibility-report.md` — this document exists so each page's
regression check is independently traceable by TC ID, consistent with every
other module in the project.