# PENDING — Tareas bloqueadas o diferidas

## P-001: Resolver contrato de parámetros de POST /requestLoan

**Bloqueado desde:** 06/06/2026  
**Bloquea:** `tests/api/idempotency.api.spec.ts` (3 tests en skip)

**Contexto:**  
El endpoint `POST /services/bank/requestLoan` devuelve HTTP 400 con el error
`Cannot read field "intCompact" because "<parameter1>" is null`. La conversión
de QueryParam a BigDecimal falla independientemente del valor enviado.

**Investigación realizada:**
- Firma del bytecode confirmada via `strings`: `(int, BigDecimal, BigDecimal, int)`
- URL confirmada: `/requestLoan` (L mayúscula)
- Parámetros probados: `fromAccountId`, `accountId` — ambos producen el mismo error
- Valores probados: `1000` y `1000.00` — mismo resultado
- El `ApiClient.requestLoan()` usa `fromAccountId` — nombre incorrecto

**Opciones para resolver:**
1. Decompilación completa con `javap -verbose` en un entorno con JDK
2. Comparar contra la instancia pública `parabank.parasoft.com` con Burp/DevTools
   para capturar el request real del formulario de préstamo
3. Inspeccionar `applicationContext-base.xml` por configuración de parámetros JAX-RS

**Impacto si se resuelve:**  
Actualizar `ApiClient.requestLoan()` con los nombres correctos de QueryParam
y desbloquear los 3 tests de idempotencia en `idempotency.api.spec.ts`.