# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/transfers.spec.ts >> Transfers — funds movement between own accounts >> [BUG H-007] should reject transfer with negative amount
- Location: tests/e2e/transfers.spec.ts:46:7

# Error details

```
Error: Negative transfer amount was accepted — server-side validation missing for negative monetary values

expect(locator).toBeVisible() failed

Locator: getByText(/invalid amount/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Negative transfer amount was accepted — server-side validation missing for negative monetary values with timeout 5000ms
  - waiting for getByText(/invalid amount/i)

```

```yaml
- link:
  - /url: admin.htm
  - img
- link "ParaBank":
  - /url: index.htm
  - img "ParaBank"
- paragraph: Experience the difference
- list:
  - listitem: Solutions
  - listitem:
    - link "About Us":
      - /url: about.htm
  - listitem:
    - link "Services":
      - /url: services.htm
  - listitem:
    - link "Products":
      - /url: http://www.parasoft.com/jsp/products.jsp
  - listitem:
    - link "Locations":
      - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
  - listitem:
    - link "Admin Page":
      - /url: admin.htm
- list:
  - listitem:
    - link "home":
      - /url: index.htm
  - listitem:
    - link "about":
      - /url: about.htm
  - listitem:
    - link "contact":
      - /url: contact.htm
- paragraph: Welcome John Smith
- heading "Account Services" [level=2]
- list:
  - listitem:
    - link "Open New Account":
      - /url: openaccount.htm
  - listitem:
    - link "Accounts Overview":
      - /url: overview.htm
  - listitem:
    - link "Transfer Funds":
      - /url: transfer.htm
  - listitem:
    - link "Bill Pay":
      - /url: billpay.htm
  - listitem:
    - link "Find Transactions":
      - /url: findtrans.htm
  - listitem:
    - link "Update Contact Info":
      - /url: updateprofile.htm
  - listitem:
    - link "Request Loan":
      - /url: requestloan.htm
  - listitem:
    - link "Log Out":
      - /url: logout.htm
- heading "Transfer Complete!" [level=1]
- paragraph: "-$50.00 has been transferred from account #13122 to account #13344."
- paragraph: See Account Activity for more details.
- list:
  - listitem:
    - link "Home":
      - /url: index.htm
    - text: "|"
  - listitem:
    - link "About Us":
      - /url: about.htm
    - text: "|"
  - listitem:
    - link "Services":
      - /url: services.htm
    - text: "|"
  - listitem:
    - link "Products":
      - /url: http://www.parasoft.com/jsp/products.jsp
    - text: "|"
  - listitem:
    - link "Locations":
      - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
    - text: "|"
  - listitem:
    - link "Forum":
      - /url: http://forums.parasoft.com/
    - text: "|"
  - listitem:
    - link "Site Map":
      - /url: sitemap.htm
    - text: "|"
  - listitem:
    - link "Contact Us":
      - /url: contact.htm
- paragraph: © Parasoft. All rights reserved.
- list:
  - listitem: "Visit us at:"
  - listitem:
    - link "www.parasoft.com":
      - /url: http://www.parasoft.com/
```

# Test source

```ts
  1  | // tests/e2e/transfer.spec.ts
  2  | import { test, expect } from '../../src/fixtures';
  3  | import { TransferFactory } from '../../src/factories/TransferFactory';
  4  | import { expectTransferConfirmed } from '../../src/helpers/assertions';
  5  | 
  6  | test.describe('Transfers — funds movement between own accounts', () => {
  7  | 
  8  |   test(
  9  |     'should confirm transfer and reflect updated balance in both accounts',
  10 |     async ({ authenticatedPage, transferPage }) => {
  11 |       // WHY THIS TEST MATTERS:
  12 |       // Transfer is the highest-risk operation in Parabank — money moves.
  13 |       // A silent failure here means customer sees incorrect balance
  14 |       // without any error, which is a critical trust issue.
  15 | 
  16 |       const transfer = TransferFactory.valid('13122', '13344');
  17 |       await transferPage.navigate();
  18 |       await transferPage.transfer(transfer);
  19 |       await expectTransferConfirmed(transferPage.currentPage);
  20 |     }
  21 |   );
  22 | 
  23 |   test(
  24 |     '[BUG] should reject transfer when source account has insufficient funds',
  25 |     async ({ authenticatedPage, transferPage }) => {
  26 |       // WHY THIS TEST MATTERS:
  27 |       // System must prevent overdraft. Parabank accepts transfers
  28 |       // exceeding available balance without any error — confirmed bug.
  29 |       // This test is expected to FAIL, documenting the vulnerability.
  30 | 
  31 |       test.fail(true, 'Parabank allows overdraft: transfer of $999999 from account with insufficient funds was accepted silently');
  32 | 
  33 |       await transferPage.navigate();
  34 |       await transferPage.transfer(
  35 |         TransferFactory.withAmount('13122', '13344', 999_999)
  36 |       );
  37 | 
  38 |       await expect(
  39 |         transferPage.currentPage.getByText(/insufficient|error/i),
  40 |         'No error shown for insufficient funds transfer — ' +
  41 |         'system is allowing overdraft silently'
  42 |       ).toBeVisible();
  43 |     }
  44 |   );
  45 | 
  46 |   test(
  47 |     '[BUG H-007] should reject transfer with negative amount',
  48 |     async ({ authenticatedPage, transferPage }) => {
  49 |       // WHY THIS TEST MATTERS:
  50 |       // Server accepts negative amounts (H-007, critical severity).
  51 |       // This test is expected to FAIL against current system,
  52 |       // demonstrating the framework finds real problems.
  53 | 
  54 |       test.fail(true, 'H-007: Server accepts negative transfer amounts — known critical bug');
  55 | 
  56 |       await transferPage.navigate();
  57 |       await transferPage.transfer(
  58 |         TransferFactory.withNegativeAmount('13122', '13344')
  59 |       );
  60 | 
  61 |       await expect(
  62 |         transferPage.currentPage.getByText(/invalid amount/i),
  63 |         'Negative transfer amount was accepted — ' +
  64 |         'server-side validation missing for negative monetary values'
> 65 |       ).toBeVisible();
     |         ^ Error: Negative transfer amount was accepted — server-side validation missing for negative monetary values
  66 |     }
  67 |   );
  68 | });
```