# CHANGELOG

All notable changes to this project are documented in this file.
Format: [version] — Phase: description | Technical notes explain *why*, not just *what*.

---

## [0.4.0] — 2026-06-01 | Fase 4: Madurez operacional

### Added
- `docker-compose.yml` — setup reproducible con un solo comando: `docker compose up`
- Healthcheck en el servicio `parabank` — evita que Playwright arranque antes de que Tomcat esté listo (Parabank tarda ~45s en inicializar)
- `BASE_URL` como variable de entorno en `playwright.config.ts` — permite que la suite corra tanto en local (`localhost:9090`) como dentro de Docker (`parabank:8080`) sin cambios de código

### Fixed
- URLs hardcodeadas en `LoginPage.ts`, `ApiClient.ts` y `billpay.spec.ts` — todos usaban `http://localhost:9090` directamente, lo que causaba `ECONNREFUSED` dentro del contenedor Docker donde `localhost` no resuelve a Parabank
- Tipos de Node agregados a `tsconfig.json` (`"types": ["node"]`) — necesario para que `process.env` compile sin errores

### Technical Notes
- La imagen `mcr.microsoft.com/playwright:v1.44.0-jammy` tiene Node 20.12.2, incompatible con faker v10 que requiere ≥20.19.0. Fix: usar `v1.60.0-noble` (Ubuntu 24.04, Node 20.19+)
- La versión de Playwright en el proyecto (1.60.0) debe coincidir exactamente con el tag de la imagen Docker — una diferencia de versión causa `Executable doesn't exist` en todos los tests
- Re-seed de la imagen Docker Hub fue necesario antes de este commit — el stress test k6 acumuló transferencias dejando saldo `-$1,000,002,759` en la cuenta de john

---

## [0.3.0] — 2026-05-30 | Fase 3: Casos difíciles

### Added
- `tests/edge-cases/transfer.edge.spec.ts` — 6 casos BVA derivados de decision table del módulo de transferencias
- `tests/performance/login.baseline.k6.js` — baseline de login: p95=18ms vs threshold 2000ms
- `tests/performance/transfer.stress.k6.js` — stress 1→20 VUs: p95=17ms, 0% error rate
- `tests/performance/accounts.soak.k6.js` — soak 5 VUs/2min: p99=27ms vs threshold 3000ms
- `tests/accessibility/a11y.spec.ts` — auditoría axe-core WCAG 2.1 AA en 5 páginas
- `src/helpers/assertions.ts` — `auditAccessibility()` que reporta violations como warnings, no como failures
- `docs/bva-transfers-module.md` — decision table completa con estados reales del servidor
- `docs/performance-baseline.md` — números reales medidos, no asumidos
- `docs/accessibility-report.md` — 26 violations con impacto de negocio
- `docs/not-automated.md` — 5 casos justificados con análisis costo/riesgo

### Found
- **H-016** (Media): servidor acepta transferencias de $0.00 — descubierto en BVA, no en exploración inicial
- **H-017** (Media): servidor acepta transferencias de cuenta a sí misma — genera par débito/crédito fantasma en el historial

### Technical Notes
- `auditAccessibility()` no lanza excepciones por diseño — mezclar failures de a11y con failures funcionales enmascara problemas reales en el reporte de CI
- `URLSearchParams` no existe en el runtime de k6 — usar template literals para construir query strings
- El stress test acumula transferencias en la BD entre corridas — puede agotar el saldo de las cuentas. Fix: `setup()` resuelve dinámicamente dos cuentas CHECKING con balance > $100 en lugar de hardcodear IDs
- `transfer_error_rate: 100%` en CI fue síntoma de BD sucia (cuenta con saldo negativo), no un bug del framework

---

## [0.2.0] — 2026-05-29 | Fase 2: Implementación

### Added
- `src/pages/` — BasePage, LoginPage, TransferPage, AuthPage, RegisterPage, AccountsPage, BillPayPage, LoanPage
- `src/api/client/ApiClient.ts` — cliente HTTP con autenticación por sesión, URLs absolutas, fallback texto plano para endpoints que no devuelven JSON
- `src/factories/` — UserFactory, TransferFactory, BillPayFactory, LoanFactory con datos dinámicos via faker
- `src/fixtures/index.ts` — `authenticatedAsJohn` y `authenticatedPage` con teardown sin logout explícito
- `tests/e2e/` — 5 flujos críticos: auth, transfer, accounts, billpay, loans
- `tests/api/` — contract tests para login y transfer APIs
- `.github/workflows/ci.yml` — pipeline con jobs smoke, full y performance estratificados

### Found
- **H-007** (Crítica): servidor acepta montos negativos en transferencias, bill pay y loans
- **H-008** (Alta): doble submit genera transacciones duplicadas
- **H-009** (Media): sesión no invalidada post-logout
- **H-010** (Crítica): overdraft permitido sin validación
- **H-011** (Alta): UI acepta registro con username duplicado, servidor sí lo rechaza
- **H-012** (Media): campos vacíos aceptados en registro
- **H-013** (Media): cuentas nuevas se crean con $100 en lugar de $0
- **H-014** (Alta): mismatch de cuenta del beneficiario no validado server-side en Bill Pay
- **H-015** (Crítica): servidor acepta montos negativos en solicitud de préstamo

### Technical Notes
- `waitForSelector` con `state: 'visible'` no funciona en LoanPage — jQuery no setea `display` inline. Fix: `waitForFunction` con `getComputedStyle(el).display !== 'none'` + timeout 60_000ms
- BillPayPage usa jQuery puro, no Angular — el click en "Send Payment" requiere `page.evaluate(() => $(...).trigger('click'))`
- El teardown de fixtures no hace logout explícito — logout cierra el contexto antes de que Playwright pueda limpiarlo, causando "Target page closed"
- `faker.phone.number()` genera extensiones que el servidor rechaza — usar `faker.string.numeric(10)`
- ADR-005: imagen Docker custom necesaria porque `parasoft/parabank:latest` arranca con BD vacía (sin credenciales john/demo)

---

## [0.1.0] — 2026-05-28 | Fase 1: Arquitectura

### Added
- `docs/tech-discovery-report.md` — hallazgos técnicos de exploración: inconsistencias REST, validaciones solo client-side, potenciales race conditions
- `docs/architecture-diagram.md` — diagrama de capas con justificación de separación API/E2E
- `docs/risk-based-strategy.md` — estrategia con KPIs definidos antes de escribir código
- `docs/decisions/ADR-001` — POM sobre Screenplay Pattern
- `docs/decisions/ADR-002` — Playwright nativo sobre BDD/Cucumber
- `docs/decisions/ADR-003` — estrategia híbrida de datos de prueba
- `docs/decisions/ADR-004` — DB tests descartados, integridad verificada via API
- `docs/decisions/ADR-005` — imagen Docker custom para CI
- `docs/decisions/ADR-006` — verificación de pagos via API en lugar de balance UI

### Technical Notes
- La decisión más importante de esta fase fue ADR-001: POM fue elegido sobre Screenplay Pattern porque la audiencia son hiring managers técnicos que evalúan legibilidad del código, no POs que leen specs en lenguaje natural
- ADR-003 establece el patrón que evitó múltiples bugs de estado durante la Fase 2: fixtures estáticos para configuración, factories dinámicas para usuarios, API setup para estado previo