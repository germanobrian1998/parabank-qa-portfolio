# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/transfers.spec.ts >> Transfers — funds movement between own accounts >> [BUG] should reject transfer when source account has insufficient funds
- Location: tests/e2e/transfers.spec.ts:23:7

# Error details

```
Error: No error shown for insufficient funds transfer — system is allowing overdraft silently

expect(locator).toBeVisible() failed

Locator: getByText(/insufficient|error/i)
Expected: visible
Error: strict mode violation: getByText(/insufficient|error/i) resolved to 2 elements:
    1) <h1 class="title">↵⇆⇆⇆Error!↵⇆⇆</h1> aka getByText('Error!')
    2) <p class="error">↵⇆⇆⇆An internal error has occurred and has been l…</p> aka getByText('An internal error has')

Call log:
  - No error shown for insufficient funds transfer — system is allowing overdraft silently with timeout 5000ms
  - waiting for getByText(/insufficient|error/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - link:
        - /url: admin.htm
        - img [ref=e4] [cursor=pointer]
      - link "ParaBank":
        - /url: index.htm
        - img "ParaBank" [ref=e5] [cursor=pointer]
      - paragraph [ref=e6]: Experience the difference
    - generic [ref=e7]:
      - list [ref=e8]:
        - listitem [ref=e9]: Solutions
        - listitem [ref=e10]:
          - link "About Us" [ref=e11] [cursor=pointer]:
            - /url: about.htm
        - listitem [ref=e12]:
          - link "Services" [ref=e13] [cursor=pointer]:
            - /url: services.htm
        - listitem [ref=e14]:
          - link "Products" [ref=e15] [cursor=pointer]:
            - /url: http://www.parasoft.com/jsp/products.jsp
        - listitem [ref=e16]:
          - link "Locations" [ref=e17] [cursor=pointer]:
            - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - listitem [ref=e18]:
          - link "Admin Page" [ref=e19] [cursor=pointer]:
            - /url: admin.htm
      - list [ref=e20]:
        - listitem [ref=e21]:
          - link "home" [ref=e22] [cursor=pointer]:
            - /url: index.htm
        - listitem [ref=e23]:
          - link "about" [ref=e24] [cursor=pointer]:
            - /url: about.htm
        - listitem [ref=e25]:
          - link "contact" [ref=e26] [cursor=pointer]:
            - /url: contact.htm
    - generic [ref=e27]:
      - generic [ref=e28]:
        - paragraph [ref=e29]: Welcome John Smith
        - heading "Account Services" [level=2] [ref=e30]
        - list [ref=e31]:
          - listitem [ref=e32]:
            - link "Open New Account" [ref=e33] [cursor=pointer]:
              - /url: openaccount.htm
          - listitem [ref=e34]:
            - link "Accounts Overview" [ref=e35] [cursor=pointer]:
              - /url: overview.htm
          - listitem [ref=e36]:
            - link "Transfer Funds" [ref=e37] [cursor=pointer]:
              - /url: transfer.htm
          - listitem [ref=e38]:
            - link "Bill Pay" [ref=e39] [cursor=pointer]:
              - /url: billpay.htm
          - listitem [ref=e40]:
            - link "Find Transactions" [ref=e41] [cursor=pointer]:
              - /url: findtrans.htm
          - listitem [ref=e42]:
            - link "Update Contact Info" [ref=e43] [cursor=pointer]:
              - /url: updateprofile.htm
          - listitem [ref=e44]:
            - link "Request Loan" [ref=e45] [cursor=pointer]:
              - /url: requestloan.htm
          - listitem [ref=e46]:
            - link "Log Out" [ref=e47] [cursor=pointer]:
              - /url: logout.htm
      - generic [ref=e50]:
        - heading "Transfer Complete!" [level=1] [ref=e51]
        - paragraph [ref=e52]: "$999999.00 has been transferred from account #13122 to account #13344."
        - paragraph [ref=e53]: See Account Activity for more details.
  - generic [ref=e55]:
    - list [ref=e56]:
      - listitem [ref=e57]:
        - link "Home" [ref=e58] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e59]:
        - link "About Us" [ref=e60] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e61]:
        - link "Services" [ref=e62] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e63]:
        - link "Products" [ref=e64] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e65]:
        - link "Locations" [ref=e66] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e67]:
        - link "Forum" [ref=e68] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e69]:
        - link "Site Map" [ref=e70] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e71]:
        - link "Contact Us" [ref=e72] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e73]: © Parasoft. All rights reserved.
    - list [ref=e74]:
      - listitem [ref=e75]: "Visit us at:"
      - listitem [ref=e76]:
        - link "www.parasoft.com" [ref=e77] [cursor=pointer]:
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
> 42 |       ).toBeVisible();
     |         ^ Error: No error shown for insufficient funds transfer — system is allowing overdraft silently
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
  65 |       ).toBeVisible();
  66 |     }
  67 |   );
  68 | });
```