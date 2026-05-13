# Architecture Diagram — Parabank Automation Framework

**Versión:** 1.0  
**Fecha:** 2025-06  
**Decisión central:** framework de 4 capas con separación explícita entre API Client y Page Objects

---

## 1. Diagrama de capas

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TEST LAYER                                   │
│                                                                       │
│   tests/e2e/           tests/api/           tests/db/                │
│   ─────────────        ────────────         ────────                 │
│   Flujos completos     Contrato API         Integridad SQL            │
│   desde perspectiva    y consistencia       post-operación           │
│   del usuario          UI ↔ API                                      │
│                                                                       │
│   "Describe comportamiento observable del sistema"                    │
│   Regla: NUNCA contiene lógica de interacción ni queries SQL          │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ importa / compone
┌────────────────────────▼─────────────────────────────────────────────┐
│                    PAGE / SERVICE LAYER                               │
│                                                                       │
│   src/pages/                          src/api/                       │
│   ─────────────────────────────       ──────────────────────────     │
│   BasePage                            ParabankApiClient              │
│   ├── LoginPage                       ├── auth.client.ts             │
│   ├── RegisterPage                    ├── accounts.client.ts         │
│   ├── AccountsPage                    ├── transfers.client.ts        │
│   ├── TransferPage                    ├── loans.client.ts            │
│   ├── BillPayPage                     └── transactions.client.ts     │
│   ├── LoanPage                                                       │
│   └── TransactionsPage               [API Client separado de POM]   │
│                                                                       │
│   "Abstrae la mecánica de interacción con el sistema"                │
│   Regla: NUNCA contiene assertions de negocio ni lógica de datos     │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ importa
┌────────────────────────▼─────────────────────────────────────────────┐
│                       DATA LAYER                                      │
│                                                                       │
│   src/factories/                      src/fixtures/                  │
│   ─────────────────────────────       ──────────────────────         │
│   UserFactory                         test.fixture.ts                │
│   AccountFactory                      ├── authenticatedPage          │
│   TransferFactory                     ├── freshUser                  │
│   BillPayFactory                      └── accountWithBalance         │
│   LoanRequestFactory                                                 │
│                                       src/helpers/                   │
│   [Genera datos tipados en runtime]   ──────────────                 │
│                                       customAssertions.ts            │
│                                       dbHelper.ts                    │
│                                                                       │
│   "Provee el estado correcto para cada test"                         │
│   Regla: NUNCA interactúa con el browser ni con la API directamente  │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ configura el entorno de
┌────────────────────────▼─────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                                │
│                                                                       │
│   playwright.config.ts    docker-compose.yml    .github/workflows/   │
│   ───────────────────     ─────────────────     ─────────────────    │
│   projects: smoke/full    parabank service       ci.yml              │
│   baseURL config          hsqldb service         smoke job < 3min    │
│   retries: 0 (CI)         automation service     full job < 15min    │
│   reporter config         volumes para logs      artifact on failure  │
│                                                                       │
│   "Define dónde y cómo corre el framework, no qué prueba"            │
│   Regla: NUNCA contiene lógica de test ni de negocio                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo de datos: desde fixtures hasta assertions

Trazando el flujo de un test de transferencia como ejemplo concreto:

```
1. INFRASTRUCTURE LAYER
   playwright.config.ts define baseURL=http://localhost:8080
   docker-compose levanta Parabank + HSQLDB

2. DATA LAYER — Setup
   test.fixture.ts solicita fixture "accountWithBalance"
   └── UserFactory.create() genera datos de usuario con Faker
   └── ParabankApiClient.register(userData) crea el usuario via API
   └── ParabankApiClient.openAccount() crea cuenta origen con saldo
   └── Retorna { userId, sourceAccountId, targetAccountId }

3. PAGE / SERVICE LAYER — Interacción
   LoginPage.login(credentials) navega y autentica
   TransferPage.navigate() va a la página de transferencia
   TransferPage.fillForm({ amount, from, to }) completa el formulario
   TransferPage.submit() hace click y espera confirmación

4. TEST LAYER — Assertion
   expect(confirmationPage).toShowTransferSuccess(amount)
   [custom assertion que verifica mensaje de negocio, no selector]

5. DATA LAYER — Verificación post-operación (opcional)
   ParabankApiClient.getAccount(sourceAccountId) verifica saldo deducido
   dbHelper.getLastTransaction(sourceAccountId) verifica integridad SQL
```

**Principio:** los datos fluyen hacia abajo (Infrastructure → Data → Pages → Tests) para setup, y las verificaciones fluyen de vuelta hacia arriba (Tests consultan Pages o directamente API/DB para assertions).

---

## 3. Decisión: API Client separado de Page Objects

### Por qué NO meter el API Client dentro de los Page Objects

La alternativa más simple sería agregar métodos de API directamente en cada Page Object:

```typescript
// ❌ Approach acoplado — NO se usa en este framework
class AccountsPage {
  async getAccountBalanceViaApi(accountId: string) {
    // request HTTP dentro del Page Object
  }
}
```

**Problema:** los Page Objects pasarían a tener dos responsabilidades — interacción con UI y comunicación con API. Cuando Parabank cambie un selector HTML, el archivo cambia. Cuando Parabank cambie un endpoint, el mismo archivo cambia. Dos razones para tocar el mismo archivo = violación de Single Responsibility.

### Por qué SÍ es un cliente separado en este proyecto

En Parabank existen flujos híbridos que justifican la separación:

1. **Setup via API, verificación en UI:** crear una cuenta bancaria via `POST /createaccount` (más rápido que UI), luego verificar que aparece en la vista de cuentas del browser.

2. **Acción en UI, verificación via API:** hacer una transferencia desde el formulario web, luego verificar el saldo resultante via `GET /accounts/{id}` en lugar de parsear HTML.

3. **Tests puramente de API:** validar que el endpoint de transferencia rechaza montos negativos, sin involucrar browser en absoluto.

En los tres casos, el `ParabankApiClient` se importa directamente desde el test o desde el fixture, independientemente del Page Object. La separación es física y conceptual.

```typescript
// ✅ Approach separado — sí se usa
// En un fixture de setup:
import { ParabankApiClient } from '../api/accounts.client';
const api = new ParabankApiClient(baseURL);
const account = await api.createAccount(userId, 'CHECKING');

// En un test de consistencia:
const uiBalance = await accountsPage.getDisplayedBalance(accountId);
const apiBalance = await api.getAccount(accountId).balance;
expect(uiBalance).toBe(apiBalance); // UI ↔ API consistency test
```

---

## 4. Reglas de dependencia entre capas

| Capa | Puede importar de | NO puede importar de |
|------|------------------|---------------------|
| Test Layer | Page Layer, Data Layer, Helpers | Infrastructure (directamente) |
| Page Layer | Infrastructure (Playwright types) | Test Layer, Data Layer |
| API Client | Infrastructure (fetch/axios) | Page Layer, Test Layer |
| Data Layer | API Client (para setup) | Page Layer, Test Layer |
| Infrastructure | — | Ninguna capa de negocio |

**Razón de esta restricción:** si un Page Object importa de la Data Layer, un cambio en cómo se generan datos impacta los page objects — acoplamiento innecesario. La Data Layer conoce la API, pero no la UI.

---

## 5. Estructura de directorios resultante

```
parabank-qa/
├── src/
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── AccountsPage.ts
│   │   ├── TransferPage.ts
│   │   ├── BillPayPage.ts
│   │   ├── LoanPage.ts
│   │   └── TransactionsPage.ts
│   ├── api/
│   │   ├── base.client.ts          ← cookie/session management
│   │   ├── auth.client.ts
│   │   ├── accounts.client.ts
│   │   ├── transfers.client.ts
│   │   ├── loans.client.ts
│   │   └── transactions.client.ts
│   ├── factories/
│   │   ├── user.factory.ts
│   │   ├── account.factory.ts
│   │   ├── transfer.factory.ts
│   │   ├── billpay.factory.ts
│   │   └── loan.factory.ts
│   ├── fixtures/
│   │   └── test.fixture.ts          ← Playwright fixture extensions
│   └── helpers/
│       ├── assertions.ts            ← custom expect matchers
│       └── db.helper.ts             ← HSQLDB query wrapper
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── accounts.spec.ts
│   │   ├── transfers.spec.ts
│   │   ├── billpay.spec.ts
│   │   └── loans.spec.ts
│   ├── api/
│   │   ├── transfers.api.spec.ts
│   │   └── consistency.spec.ts      ← UI ↔ API tests
│   ├── db/
│   │   └── transfers.db.spec.ts
│   └── edge-cases/
│       └── transfers.bva.spec.ts
├── docs/
│   ├── tech-discovery-report.md
│   ├── architecture-diagram.md      ← este archivo
│   ├── risk-based-strategy.md
│   └── decisions/
│       ├── ADR-001-page-objects.md
│       ├── ADR-002-bdd-approach.md
│       └── ADR-003-test-data.md
├── docker-compose.yml
├── playwright.config.ts
└── package.json
```
