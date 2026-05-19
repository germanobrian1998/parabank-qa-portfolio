# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Registration — new customer onboarding >> should allow login with newly registered credentials
- Location: tests/e2e/auth.spec.ts:49:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: [Form] No se pudo completar el campo "Username". Causa: locator.clear: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name=\'username\']')

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
        - paragraph [ref=e29]: Welcome Mossie Huel-Stamm
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
      - generic [ref=e48]:
        - list [ref=e50]:
          - listitem [ref=e51]: ATM Services
          - listitem [ref=e52]:
            - link "Withdraw Funds" [ref=e53] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e54]:
            - link "Transfer Funds" [ref=e55] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e56]:
            - link "Check Balances" [ref=e57] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
          - listitem [ref=e58]:
            - link "Make Deposits" [ref=e59] [cursor=pointer]:
              - /url: services/ParaBank?wsdl
        - list [ref=e60]:
          - listitem [ref=e61]: Online Services
          - listitem [ref=e62]:
            - link "Bill Pay" [ref=e63] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
          - listitem [ref=e64]:
            - link "Account History" [ref=e65] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
          - listitem [ref=e66]:
            - link "Transfer Funds" [ref=e67] [cursor=pointer]:
              - /url: services/bank?_wadl&_type=xml
        - paragraph [ref=e68]:
          - link "Read More" [ref=e69] [cursor=pointer]:
            - /url: services.htm
        - heading "Latest News" [level=4] [ref=e70]
        - list [ref=e71]:
          - listitem [ref=e72]: 05/16/2026
          - listitem [ref=e73]:
            - link "ParaBank Is Now Re-Opened" [ref=e74] [cursor=pointer]:
              - /url: news.htm#6
          - listitem [ref=e75]:
            - link "New! Online Bill Pay" [ref=e76] [cursor=pointer]:
              - /url: news.htm#5
          - listitem [ref=e77]:
            - link "New! Online Account Transfers" [ref=e78] [cursor=pointer]:
              - /url: news.htm#4
        - paragraph [ref=e79]:
          - link "Read More" [ref=e80] [cursor=pointer]:
            - /url: news.htm
  - generic [ref=e82]:
    - list [ref=e83]:
      - listitem [ref=e84]:
        - link "Home" [ref=e85] [cursor=pointer]:
          - /url: index.htm
        - text: "|"
      - listitem [ref=e86]:
        - link "About Us" [ref=e87] [cursor=pointer]:
          - /url: about.htm
        - text: "|"
      - listitem [ref=e88]:
        - link "Services" [ref=e89] [cursor=pointer]:
          - /url: services.htm
        - text: "|"
      - listitem [ref=e90]:
        - link "Products" [ref=e91] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/products.jsp
        - text: "|"
      - listitem [ref=e92]:
        - link "Locations" [ref=e93] [cursor=pointer]:
          - /url: http://www.parasoft.com/jsp/pr/contacts.jsp
        - text: "|"
      - listitem [ref=e94]:
        - link "Forum" [ref=e95] [cursor=pointer]:
          - /url: http://forums.parasoft.com/
        - text: "|"
      - listitem [ref=e96]:
        - link "Site Map" [ref=e97] [cursor=pointer]:
          - /url: sitemap.htm
        - text: "|"
      - listitem [ref=e98]:
        - link "Contact Us" [ref=e99] [cursor=pointer]:
          - /url: contact.htm
    - paragraph [ref=e100]: © Parasoft. All rights reserved.
    - list [ref=e101]:
      - listitem [ref=e102]: "Visit us at:"
      - listitem [ref=e103]:
        - link "www.parasoft.com" [ref=e104] [cursor=pointer]:
          - /url: http://www.parasoft.com/
```

# Test source

```ts
  1  | // src/pages/BasePage.ts
  2  | import { Page, Locator } from '@playwright/test';
  3  | 
  4  | export abstract class BasePage {
  5  |   constructor(protected readonly page: Page) {}
  6  | 
  7  |   get currentPage(): Page {
  8  |     return this.page;
  9  |   }
  10 | 
  11 |   protected async clickWithRetry(
  12 |     locator: Locator,
  13 |     businessContext: string,
  14 |     options?: { timeout?: number }
  15 |   ): Promise<void> {
  16 |     try {
  17 |       await locator.click({ timeout: options?.timeout ?? 10_000 });
  18 |     } catch (error) {
  19 |       throw new Error(
  20 |         `[${businessContext}] No se pudo completar la acción. ` +
  21 |         `Elemento no interactuable. Causa técnica: ${(error as Error).message}`
  22 |       );
  23 |     }
  24 |   }
  25 | 
  26 |   protected async clickElement(
  27 |     locator: Locator,
  28 |     businessContext: string,
  29 |     options?: { timeout?: number }
  30 |   ): Promise<void> {
  31 |     return this.clickWithRetry(locator, businessContext, options);
  32 |   }
  33 | 
  34 |   protected async fillField(
  35 |     locator: Locator,
  36 |     value: string,
  37 |     fieldName: string
  38 |   ): Promise<void> {
  39 |     try {
  40 |       await locator.clear();
  41 |       await locator.fill(value);
  42 |     } catch (error) {
> 43 |       throw new Error(
     |             ^ Error: [Form] No se pudo completar el campo "Username". Causa: locator.clear: Test timeout of 30000ms exceeded.
  44 |         `[Form] No se pudo completar el campo "${fieldName}". ` +
  45 |         `Causa: ${(error as Error).message}`
  46 |       );
  47 |     }
  48 |   }
  49 | 
  50 |   protected async getTextContent(
  51 |     locator: Locator,
  52 |     fieldName: string
  53 |   ): Promise<string> {
  54 |     try {
  55 |       const text = await locator.textContent({ timeout: 10_000 });
  56 |       return text ?? '';
  57 |     } catch (error) {
  58 |       throw new Error(
  59 |         `[${fieldName}] No se pudo obtener el texto del elemento. ` +
  60 |         `Causa: ${(error as Error).message}`
  61 |       );
  62 |     }
  63 |   }
  64 | 
  65 |   protected async waitForNavigation(
  66 |     expectedUrlPattern: string | RegExp,
  67 |     businessContext: string
  68 |   ): Promise<void> {
  69 |     try {
  70 |       await this.page.waitForURL(expectedUrlPattern, { timeout: 15_000 });
  71 |     } catch {
  72 |       throw new Error(
  73 |         `[${businessContext}] La navegación no completó hacia el destino esperado. ` +
  74 |         `URL actual: ${this.page.url()}`
  75 |       );
  76 |     }
  77 |   }
  78 | 
  79 |   protected async waitForUrl(
  80 |     urlPattern: string | RegExp,
  81 |     businessContext: string
  82 |   ): Promise<void> {
  83 |     return this.waitForNavigation(urlPattern, businessContext);
  84 |   }
  85 | }
```