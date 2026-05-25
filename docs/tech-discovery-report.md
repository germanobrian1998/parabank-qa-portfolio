# Tech Discovery Report — Parabank

**Fecha:** 2025-06  
**Última actualización:** 25/05/2026  
**Explorador:** QA Engineer (Portfolio Project)  
**Sistema:** Parabank — Banking Demo Application  
**URL:** https://parabank.parasoft.com  
**Credenciales demo:** john / demo

---

## 1. Perfil del sistema

Parabank es una aplicación de banca demo construida en Java (Spring Framework) con una arquitectura MVC tradicional. La UI renderiza mayoritariamente server-side, con mínimo JavaScript para interactividad. La API REST es una capa separada que expone los mismos casos de uso del dominio.

**Stack inferido:**
- Backend: Java + Spring MVC
- Persistencia: HyperSQL (HSQLDB) — base de datos embebida que se inicializa en memoria con Docker
- API: REST documentada en Swagger/OpenAPI (`/parabank/api-docs/index.html`)
- Autenticación: Session-based (no JWT), cookie de sesión tradicional
- Renderizado: Server-side HTML con jQuery para interactividad — sin SPA framework

**Implicancia arquitectónica inmediata:** al no haber JWT, los tests de API necesitan obtener y propagar la sesión manualmente (o autenticarse por cada request). Esto impacta el diseño del API Client.

---

## 2. Hallazgos de API

### 2.1 Inconsistencias REST

| Endpoint | Verbo | Anomalía | Impacto en automation |
|----------|-------|----------|----------------------|
| `POST /login` | POST | Correcto — autentica y retorna sesión | Necesita manejo explícito de cookies de sesión en el API Client |
| `GET /accounts/{id}` | GET | Correcto semánticamente | Requiere `accountId` obtenido previamente; no hay endpoint de "mis cuentas" público sin auth |
| `POST /transfer` | POST | El body mezcla campos de negocio y de contexto (accountId en body, no en URL) | Fixture de transferencia requiere IDs válidos de ambas cuentas |
| `POST /billpay` | POST | La payee info va embebida en el body junto con el monto — acoplamiento de entidades | Factory de Bill Pay debe construir payload compuesto |
| `GET /loan` | GET | Solicitud de préstamo usa GET con parámetros en query string — efecto lateral via GET | **Riesgo alto:** viola idempotencia REST. Un retry automático puede crear préstamos duplicados |
| `POST /register` | POST | Crea usuario y retorna `customerId` — correcto | El `customerId` debe capturarse y almacenarse en el contexto del test |
| `DELETE /logout` | POST | El logout usa POST, no DELETE ni un endpoint propio estándar | Menor, pero indica que las convenciones REST no son estrictas en todo el sistema |

### 2.2 Consistencia de error responses

Los endpoints no tienen un formato de error unificado. Algunos devuelven XML, otros JSON puro, dependiendo del `Accept` header. Sin header explícito, el comportamiento varía.

**Impacto:** el API Client debe establecer `Content-Type: application/json` y `Accept: application/json` en cada request, no asumir defaults.

### 2.3 Endpoints sin equivalente en UI

| Endpoint API | ¿Tiene UI equivalente? | Nota |
|-------------|----------------------|------|
| `GET /customers/{id}/accounts` | Sí | Usado para "Accounts Overview" |
| `GET /accounts/{id}/transactions` | Parcialmente | La UI muestra un subconjunto con paginación |
| `POST /transfer` | Sí | Equivalencia completa — candidato a test de consistencia UI↔API |
| `GET /loan` (request) | Sí | La UI tiene formulario de solicitud |
| Consulta de transacciones por fecha/monto/tipo | Sí (parcial) | La UI tiene filtros, la API tiene query params distintos |

---

## 3. Sincronización UI-DB

### 3.1 Comportamientos observados por flujo

| Flujo | Comportamiento observado | Riesgo para automation | Estrategia sugerida |
|-------|------------------------|----------------------|-------------------|
| Abrir cuenta nueva | La nueva cuenta aparece inmediatamente en la lista post-submit | Bajo | `waitForURL` al confirmation page es suficiente |
| Transferencia entre cuentas | Los saldos actualizados se muestran en la misma página de confirmación, no requieren reload | Bajo-Medio | Assertion sobre el texto de confirmación; verificar saldo via API en test separado |
| Solicitud de préstamo | El resultado (aprobado/denegado) aparece en la misma respuesta sincrónicamente | Bajo | No hay polling; la respuesta es inmediata en el demo |
| Bill Pay | La confirmación aparece en la misma página via jQuery show/hide | **Medio** | Ver sección 3.3 — requiere `getComputedStyle` para detección correcta |
| Historial de transacciones | La tabla de transacciones se actualiza post-transferencia solo después de navegar explícitamente al historial | **Medio** | El test debe navegar activamente al historial, no asumir actualización en background |

### 3.2 Observación crítica sobre estado compartido

Parabank usa una base de datos en memoria inicializada con datos de seed. En el ambiente demo en vivo (`parabank.parasoft.com`), **múltiples usuarios concurrentes comparten el mismo estado de BD**. Esto significa:

- Las cuentas del usuario `john` pueden tener saldos variables si otros testers transfirieron dinero
- Tests que asuman saldos exactos son intrínsecamente frágiles en el ambiente compartido
- En el ambiente dockerizado propio, esto no es problema

**Impacto en estrategia:** los tests de E2E deben ejecutarse preferentemente contra la instancia dockerizada local, no contra el ambiente demo público.

### 3.3 Arquitectura real de Bill Pay (confirmada 24/05/2026)

La página `billpay.htm` usa **jQuery puro**, no Angular ni ningún SPA framework. Contiene tres divs que se muestran/ocultan:

- `#billpayForm` — el formulario (visible por defecto)
- `#billpayResult` — confirmación de éxito (oculto hasta éxito)
- `#billpayError` — panel de error del servidor (oculto hasta error)

**Comportamiento crítico de jQuery:** `.show()` y `.hide()` no siempre setean `element.style.display` inline. En algunos casos el display se maneja via CSS computed, por lo que `element.style.display` puede devolver `""` aunque el elemento sea visible. La detección correcta requiere `getComputedStyle(el).display`.

**Impacto en automation:**
- `waitForSelector` y comparaciones con `style.display` son insuficientes para este flujo
- La validación de campos es client-side (jQuery) — un submit con campos vacíos muestra spans de error inline con `display: inline` (no `block`) y **no hace POST al servidor**
- Los spans de error usan `id="validationModel-*"` con `style.display` inline

### 3.4 Limitación de sesión en Bill Pay (confirmada 24/05/2026)

Navegar a `overview.htm` antes de ejecutar el POST de bill pay **invalida el contexto de sesión** que Parabank necesita para procesar la operación — el servidor devuelve 500.

**Causa probable:** Parabank usa session tokens o CSRF tokens vinculados a la última página navegada. Al navegar a `overview.htm`, el token del contexto de bill pay se invalida.

**Impacto en diseño de tests:**
- Los tests de bill pay NO deben llamar a `AccountsPage.getAllAccounts()` ni navegar a `overview.htm` antes de `payBill()`
- El `fromAccountId` debe obtenerse del `<select>` del formulario de bill pay directamente (ya cargado vía AJAX)
- Los tests que necesitan verificar saldo antes y después del pago deben usar la API directamente (Fase 3) o aceptar la limitación como conocida

---

## 4. Validaciones cliente vs. servidor

### 4.1 Formulario de registro

| Campo | Valida cliente (HTML) | Valida servidor | Riesgo |
|-------|----------------------|-----------------|--------|
| Username | `required` | No verificable via API pública — endpoint /register devuelve 404 | Bajo — validación UI suficiente |
| Password | `required` | No verificable via API pública | Bajo |
| Confirm Password | JavaScript (match check) | No verificable via API pública — endpoint no expuesto | Medio — validación solo en cliente, no confirmada server-side |
| Nombre/Apellido | `required` | No verificable via API pública | Bajo |
| SSN | `required` | No verificable via API pública | Bajo |
| Dirección | `required` | No verificable via API pública | Bajo |

**Nota de verificación (13/05/2026):** el endpoint REST de registro
(`/register`) devuelve 404 en la instancia pública de Parabank.
La validación server-side de passwords no pudo verificarse via API.
Las validaciones de este formulario son testeables únicamente via
UI o contra una instancia Docker local donde el endpoint sí está disponible.

### 4.2 Formulario de transferencia

| Campo | Valida cliente | Valida servidor | Riesgo |
|-------|---------------|-----------------|--------|
| Monto > 0 | Validación HTML (`min`) | **No valida server-side** — acepta montos negativos (H-007 confirmado) | **Crítico** |
| Cuenta origen con saldo suficiente | No validado en cliente | **No valida server-side** — acepta overdraft (H-010 confirmado) | **Crítico** |
| Cuenta destino distinta a origen | No validado visualmente | Pendiente — requiere instancia Docker local | Medio |

### 4.3 Formulario de Bill Pay

| Campo | Valida cliente | Valida servidor | Riesgo |
|-------|---------------|-----------------|--------|
| Campos requeridos (nombre, dirección, etc.) | jQuery — muestra spans de error inline, no hace POST | No valida (si se bypasea cliente) | Medio |
| Número de cuenta del payee | jQuery — formato numérico | **No valida mismatch** (H-014 confirmado) | **Alto** |
| Verify Account # | jQuery — verifica coincidencia | **No valida server-side** (H-014 confirmado) | **Alto** |
| Monto | jQuery — `isNaN` check | **Acepta montos negativos** (H-007 extendido a bill pay, confirmado 24/05/2026) | **Crítico** |
| Monto cero | jQuery — no valida | **Acepta $0.00** (confirmado 24/05/2026) | Media |

### 4.4 Formulario de solicitud de préstamo

| Campo | Valida cliente | Valida servidor | Riesgo |
|-------|---------------|-----------------|--------|
| Monto del préstamo > 0 | Validación HTML (`min`) | **No valida server-side** — acepta montos negativos (H-015 confirmado) | **Crítico** |
| Down payment | No validado en cliente | **No valida monto cero** — aprueba préstamos sin down payment (H-015 relacionado) | **Alto** |
| Lógica de aprobación crediticia | N/A | Criterios de aprobación no documentados — comportamiento inconsistente bajo ciertas condiciones | Medio |

---

## 5. Observaciones de race conditions

### 5.1 Doble submit en transferencia

**Estado:** Confirmado — ver H-008.

### 5.2 Sesión concurrente

**Estado:** Confirmado — ver H-009.

### 5.3 Idempotencia en creación de cuenta

**Estado:** Pendiente — requiere instancia Docker local.

---

## 6. Hallazgos verificados con evidencia

### H-007: El servidor acepta montos negativos — dirección de transferencia invertida

**Fecha de verificación:** 13/05/2026  
**Extendido a Bill Pay:** 24/05/2026  
**Método:** curl directo al endpoint REST (transfers); jQuery trigger con monto negativo (bill pay)

**Evidencia (transfers):**
- Request: `POST /transfer?fromAccountId=13344&toAccountId=13566&amount=-100`
- Response: `Successfully transferred $-100 from account #13344 to account #13566`
- Cuenta origen 13344: aumentó $100
- Cuenta destino 13566: disminuyó $100

**Evidencia (bill pay):**
- Pago con monto `-100` procesado exitosamente
- Confirmación: "Bill Payment to [payee] in the amount of $-100.00 was successful"
- El servidor no valida montos negativos en ninguno de los dos flujos

**Severidad de negocio:** Crítica.

**Impacto en automation:**
- Test de monto negativo en bill pay marcado `test.fail()` como H-007 (bug confirmado)
- Consistente con el hallazgo de transfers — afecta múltiples flujos financieros

---

### H-008: Doble submit en transferencia crea transacciones duplicadas

**Fecha de verificación:** 13/05/2026  
**Severidad:** Alta  
**Estado:** Confirmado — test.fail() en transfer.spec.ts

---

### H-009: Sesiones concurrentes no se invalidan

**Fecha de verificación:** 13/05/2026  
**Severidad:** Media  
**Estado:** Confirmado — test.fail() en auth.spec.ts y accounts.spec.ts

---

### H-010: Transferencias con saldo insuficiente son aceptadas

**Fecha de verificación:** 16/05/2026  
**Severidad:** Crítica  
**Estado:** Confirmado — test.fail() en transfer.spec.ts

---

### H-011: Parabank acepta registro con username duplicado

**Fecha de verificación:** 16/05/2026  
**Severidad:** Alta  
**Estado:** Confirmado — test.fail() en auth.spec.ts

---

### H-012: Parabank acepta registro con campos obligatorios vacíos

**Fecha de verificación:** 16/05/2026  
**Severidad:** Media  
**Estado:** Confirmado — test.fail() en auth.spec.ts

---

### H-013: Cuentas nuevas se crean con $100 en lugar de $0

**Fecha de verificación:** 16/05/2026  
**Severidad:** Media  
**Estado:** Confirmado — test.fail() en accounts.spec.ts

**Evidencia:**
- Apertura de cuenta nueva (CHECKING o SAVINGS) vía UI
- Saldo inicial mostrado en confirmación: $100.00
- Comportamiento esperado: $0.00 (cuenta nueva sin fondos)

**Nota:** puede ser comportamiento intencional del demo (fondeo automático para facilitar pruebas). Documentado como hallazgo porque difiere del comportamiento esperado en producción real.

---

### H-014: Mismatch de cuenta del beneficiario no validado server-side en Bill Pay

**Fecha de verificación:** 24/05/2026  
**Método:** bypass de validación client-side via `payBillWithMismatchedAccounts()`  
**Severidad:** Alta

**Evidencia:**
- Formulario de bill pay tiene dos campos: Account # y Verify Account #
- La validación jQuery verifica que coincidan antes de hacer el POST
- Al enviar el formulario con números distintos via jQuery trigger:
  - El servidor procesa el pago exitosamente usando el primer número
  - No devuelve error de validación
  - La confirmación muestra el pago como exitoso

**Comportamiento esperado:** el servidor debería rechazar el pago si los dos números de cuenta del beneficiario no coinciden, independientemente de si la validación client-side fue ejecutada.

**Severidad de negocio:** Alta.  
Un atacante que bypasee la validación JavaScript podría enviar un número de cuenta incorrecto en el campo de verificación y el pago se procesaría igual. Esto elimina la protección contra typos en el número de cuenta del beneficiario.

**Impacto en automation:**
- Test marcado `test.fail()` en billpay.spec.ts
- Demuestra la importancia de tests de API directos que bypaseen la validación client-side

---

### H-015: El servidor acepta montos negativos en solicitud de préstamo

**Fecha de verificación:** 25/05/2026  
**Método:** formulario de solicitud de préstamo vía UI con monto negativo  
**Severidad:** Crítica

**Evidencia:**
- Request con `amount=-500` en el formulario de loan request
- El servidor procesa la solicitud sin rechazarla por validación
- Respuesta incluye aprobación o denegación basada en lógica crediticia, ignorando el monto negativo

**Comportamiento esperado:** el servidor debería rechazar cualquier solicitud de préstamo con monto ≤ 0 antes de evaluar la lógica crediticia.

**Severidad de negocio:** Crítica.  
Un monto negativo en una solicitud de préstamo podría generar deuda invertida o crédito no autorizado dependiendo de cómo el sistema contable procese el resultado aprobado.

**Patrón:** consistente con H-007 (transfers) y H-007 extendido (bill pay) — el sistema no valida rangos numéricos server-side en ningún flujo financiero.

**Impacto en automation:**
- Test marcado `test.fail()` en loans.spec.ts
- Confirma patrón sistémico de ausencia de validación numérica server-side

---

## 7. Decisiones que este reporte informa

| Hallazgo | Decisión arquitectónica que modifica |
|----------|-------------------------------------|
| La API usa session cookies, no JWT | El API Client debe gestionar cookies explícitamente con `storageState` de Playwright o un cookie jar manual |
| `GET /loan` tiene efecto lateral | Los tests de API de préstamos NO pueden usar retry automático; se necesita idempotency guard explícito |
| Estado de BD compartido en demo público | Todos los tests E2E corren contra instancia Docker local; el ambiente público se usa solo para exploración manual |
| Saldos iniciales variables | Los tests no pueden asumir saldos hardcodeados; deben consultar el saldo actual via API antes de calcular montos de transferencia |
| No hay formato de error unificado | El API Client necesita una capa de normalización de errores antes de llegar a las assertions |
| Historial no se actualiza automáticamente | Los tests que verifican transacciones deben navegar explícitamente al historial, no asumir refresh automático |
| Bill Pay usa jQuery show/hide con computedStyle | Detección de visibilidad requiere `getComputedStyle(el).display`, no `el.style.display` |
| Navegar a overview.htm invalida sesión de bill pay | Tests de bill pay obtienen fromAccountId del select del formulario, no de AccountsPage.getAllAccounts() |
| H-007 confirmado en transfers, bill pay y loans | Patrón sistémico: el sistema no valida rangos numéricos server-side en ningún flujo financiero |
| H-008 confirmado: doble submit genera transacciones duplicadas | R1 confirmada como riesgo real; Page Objects implementan waitForNavigation post-submit |
| H-009 confirmado: sesiones concurrentes no se invalidan | Tests paralelos pueden correr sin riesgo de invalidación mutua |
| H-010 confirmado: overdraft permitido | Confirma R1 del risk-based-strategy como bug real |
| H-011 confirmado: username duplicado aceptado | Candidato a test de API en Fase 3 para verificar constraint de unicidad |
| H-012 confirmado: campos vacíos aceptados en registro | Validación solo client-side confirmada |
| H-013 confirmado: saldo inicial $100 en lugar de $0 | Documentado; puede ser comportamiento intencional del demo |
| H-014 confirmado: mismatch de cuenta no validado server-side | Demuestra necesidad de tests de API directos que bypaseen validación JS |
| H-015 confirmado: monto negativo en préstamo aceptado | Confirma patrón sistémico H-007; candidato prioritario para suite de API tests en Fase 3 |