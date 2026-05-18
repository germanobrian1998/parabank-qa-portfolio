# Tech Discovery Report — Parabank

**Fecha:** 2025-06  
**Última actualización:** 13/05/2026  
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
- Renderizado: Server-side HTML, sin SPA framework

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
| Bill Pay | La confirmación aparece en la misma página | Bajo | `waitForSelector` en el mensaje de confirmación |
| Historial de transacciones | La tabla de transacciones se actualiza post-transferencia solo después de navegar explícitamente al historial | **Medio** | El test debe navegar activamente al historial, no asumir actualización en background |

### 3.2 Observación crítica sobre estado compartido

Parabank usa una base de datos en memoria inicializada con datos de seed. En el ambiente demo en vivo (`parabank.parasoft.com`), **múltiples usuarios concurrentes comparten el mismo estado de BD**. Esto significa:

- Las cuentas del usuario `john` pueden tener saldos variables si otros testers transfirieron dinero
- Tests que asuman saldos exactos son intrínsecamente frágiles en el ambiente compartido
- En el ambiente dockerizado propio, esto no es problema

**Impacto en estrategia:** los tests de E2E deben ejecutarse preferentemente contra la instancia dockerizada local, no contra el ambiente demo público.

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
Esta limitación refuerza la decisión de ejecutar el suite completo
contra instancia Docker local (sección 3.2).

### 4.2 Formulario de transferencia

| Campo | Valida cliente | Valida servidor | Riesgo |
|-------|---------------|-----------------|--------|
| Monto > 0 | Validación HTML (`min`) | **No valida server-side** — acepta montos negativos (H-007 confirmado con evidencia el 13/05/2026) | **Crítico** |
| Cuenta origen con saldo suficiente | No validado en cliente (dropdowns preseleccionados) | Pendiente — requiere instancia Docker local | **Alto** |
| Cuenta destino distinta a origen | No validado visualmente | Pendiente — requiere instancia Docker local | Medio |

### 4.3 Formulario de Bill Pay

| Campo | Valida cliente | Valida servidor | Riesgo |
|-------|---------------|-----------------|--------|
| Número de cuenta del payee | Regex básico HTML | Pendiente — requiere instancia Docker local | Medio |
| Monto | `min="0"` en HTML | Pendiente — requiere instancia Docker local | **Alto** |
| Nombre del payee | `required` | Pendiente — requiere instancia Docker local | Bajo |

> **Nota metodológica:** los ítems marcados "Pendiente" requieren
> ejecutar requests directos a la API con payloads inválidos contra
> una instancia Docker local. El endpoint correspondiente devuelve
> 404 en la instancia pública, por lo que la verificación no puede
> realizarse contra el ambiente demo compartido sin riesgo de
> afectar datos de otros usuarios.

---

## 5. Observaciones de race conditions

### 5.1 Doble submit en transferencia

**Hipótesis:** la UI podría no deshabilitar el botón "Transfer" inmediatamente tras el primer click, permitiendo doble submit.

**Cómo verificar:** usar `page.click()` dos veces en rápida sucesión antes del navigation o con `{ force: true }` y observar si aparecen dos transacciones en el historial.

**Severidad de negocio:** Alta — una transferencia duplicada en una aplicación bancaria real implica pérdida económica directa para el usuario.

**Estado:** Confirmado — ver H-008. El sistema crea transacciones duplicadas con cada click adicional. El botón Transfer no se deshabilita post-primer-click.

---

### 5.2 Sesión concurrente

**Hipótesis:** Parabank probablemente no invalida sesiones anteriores al hacer login desde un segundo contexto.

**Cómo verificar:** abrir dos páginas de browser con el mismo usuario, realizar una operación en una, verificar si la otra mantiene sesión activa.

**Severidad de negocio:** Media — en banca real, sesión única es un control de seguridad esperado.

**Estado:** Confirmado — ver H-009. Las sesiones concurrentes permanecen activas. El login desde una segunda ventana no invalida la sesión de la primera.

---

### 5.3 Idempotencia en creación de cuenta

**Hipótesis:** enviar dos requests idénticos de apertura de cuenta puede crear dos cuentas.

**Cómo verificar:** enviar `POST /createaccount` dos veces con los mismos parámetros en menos de 500ms.

**Severidad de negocio:** Baja en demo, Alta en producción.

**Estado:** Pendiente — requiere instancia Docker local para evitar
afectar el ambiente compartido con requests duplicados en la
instancia pública.

---

## 5.4 Hallazgos verificados con evidencia

### H-007: El servidor acepta montos negativos — dirección de transferencia invertida

**Fecha de verificación:** 13/05/2026
**Método:** curl directo al endpoint REST

**Evidencia:**
- Request: `POST /transfer?fromAccountId=13344&toAccountId=13566&amount=-100`
- Response: `Successfully transferred $-100 from account #13344 to account #13566`
- Cuenta origen 13344: aumentó $100 (de $1331.10 a $1431.10)
- Cuenta destino 13566: disminuyó $100 (de $985.00 a $885.00)

**Comportamiento:** el servidor procesó la operación como exitosa.
El monto negativo invirtió la dirección real de la transferencia
sin ningún tipo de validación ni alerta.

**Severidad de negocio:** Crítica.
En una aplicación real, este comportamiento permitiría extraer
fondos de cuentas ajenas invirtiendo la dirección de la operación.

**Impacto en estrategia de testing:**
- Test de API con monto negativo es obligatorio en el smoke suite
- Valida la decisión del ADR-003: este caso no puede detectarse
  solo desde la UI — requiere API Client separado
- Actualiza R3 en risk-based-strategy.md: probabilidad cambia
  de hipotética a confirmada con evidencia

**Test case derivado:**
Este test FALLARÁ intencionalmente contra Parabank.
Eso es el punto — demuestra que el framework encuentra bugs reales.

---

### H-008: Doble submit en transferencia crea transacciones duplicadas

**Fecha de verificación:** 13/05/2026
**Método:** clicks múltiples rápidos en el botón Transfer desde la UI

**Evidencia:**
- Se ejecutaron clicks múltiples en el botón Transfer con monto $10
- El historial de la cuenta 13566 muestra 3 transacciones
  "Funds Transfer Sent" de $10.00 en la misma fecha
- El sistema no deshabilitó el botón post-primer-click
- Cada click generó una transacción independiente y persistida en DB

**Severidad de negocio:** Alta.
En una aplicación bancaria real, clicks múltiples accidentales
(doble click por costumbre, lag de red) generarían transferencias
duplicadas que el usuario no autorizó conscientemente.

**Impacto en estrategia de testing:**
- Confirma R1 del risk-based-strategy.md como riesgo real,
  no solo hipotético
- El test de doble submit entra al suite de edge cases con
  prioridad alta — es un bug demostrable con evidencia
- Los Page Objects deben implementar waitForNavigation post-submit
  para evitar que los tests de E2E generen duplicados
  accidentalmente durante la ejecución

**Test case derivado:**
```typescript
test('debería procesar exactamente una transferencia por submit', async ({
  transferPage, apiClient, accountWithBalance
}) => {
  // PORQUÉ: clicks múltiples crean transacciones duplicadas
  // confirmado en exploración H-008
  await transferPage.submitMultipleTimes({ clicks: 2, amount: 10 });

  const transactions = await apiClient.getTransactions(
    accountWithBalance.sourceAccountId
  );
  const transfersOf10 = transactions.filter(t => t.amount === 10);

  expect(transfersOf10).toHaveLength(1);
  // Este test FALLARÁ — documenta bug real encontrado
});
```

---

### H-009: Sesiones concurrentes no se invalidan

**Fecha de verificación:** 13/05/2026
**Método:** login simultáneo desde dos ventanas del mismo browser

**Evidencia:**
- Ventana 1: sesión activa con john/demo, navegando en Transfer Funds
- Ventana 2: login con john/demo desde ventana nueva (Ctrl+N)
- Resultado: ventana 1 siguió activa y funcional post-login en ventana 2
- El sistema no invalidó la sesión anterior ni redirigió al login

**Severidad de negocio:** Media.
En banca real, permitir sesiones concurrentes es un control de
seguridad ausente. Si un usuario olvida cerrar sesión en un
dispositivo público, cualquier persona puede seguir operando
desde ese dispositivo aunque el usuario haya iniciado sesión
en otro lado.

**Impacto en estrategia de testing:**
- Los tests de E2E pueden asumir que abrir un segundo contexto
  de browser NO invalida el contexto principal — esto simplifica
  el diseño de fixtures paralelos
- No se necesita lógica de re-autenticación entre tests paralelos
  por invalidación de sesión
### H-010: Transferencias con saldo insuficiente son aceptadas

**Fecha de verificación:** 16/05/2026
**Método:** transferencia de $999,999 desde cuenta con saldo $1100

**Evidencia:**
- Request: transferencia de $999,999 desde cuenta 13122 (saldo $1100)
- Response: "Transfer Complete! $999999.00 has been transferred"
- El sistema no validó que el saldo fuera suficiente

**Severidad de negocio:** Crítica
Permite overdraft ilimitado sin autorización del cliente.

**Impacto en estrategia de testing:**
- Test 2 de transfers usa test.fail() igual que H-007
- Confirma R1 del risk-based-strategy como bug real
---

## 6. Decisiones que este reporte informa

| Hallazgo | Decisión arquitectónica que modifica |
|----------|-------------------------------------|
| La API usa session cookies, no JWT | El API Client debe gestionar cookies explícitamente con `storageState` de Playwright o un cookie jar manual |
| `GET /loan` tiene efecto lateral | Los tests de API de préstamos NO pueden usar retry automático; se necesita idempotency guard explícito |
| Estado de BD compartido en demo público | Todos los tests E2E corren contra instancia Docker local; el ambiente público se usa solo para exploración manual |
| Saldos iniciales variables | Los tests no pueden asumir saldos hardcodeados; deben consultar el saldo actual via API antes de calcular montos de transferencia |
| No hay formato de error unificado | El API Client necesita una capa de normalización de errores antes de llegar a las assertions |
| Historial no se actualiza automáticamente | Los tests que verifican transacciones deben navegar explícitamente al historial, no asumir refresh automático |
| Formulario de registro: validación server-side no verificable via API pública | Tests de registro se ejecutan exclusivamente contra instancia Docker local |
| H-007 confirmado: servidor acepta montos negativos | R3 en risk-based-strategy sube a "confirmada con evidencia"; test de monto negativo entra al smoke suite; valida separación de API Client en ADR-003 |
| H-008 confirmado: doble submit genera transacciones duplicadas | R1 confirmada como riesgo real; Page Objects implementan waitForNavigation post-submit para evitar duplicados accidentales |
| H-009 confirmado: sesiones concurrentes no se invalidan | Tests paralelos pueden correr sin riesgo de invalidación mutua; fixtures no necesitan lógica de re-auth |
| Validaciones de Bill Pay y saldo insuficiente pendientes | Se verifican en Fase 2 contra instancia Docker local; no bloquean inicio de implementación |
| H-010 confirmado: transferencias con saldo insuficiente son aceptadas | Confirma R1 del risk-based-strategy como bug real; test usa test.fail() igual que H-007; el framework tiene ahora 3 bugs críticos documentados con evidencia antes de terminar Fase 2 |