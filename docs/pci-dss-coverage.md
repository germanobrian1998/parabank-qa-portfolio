# Cobertura de controles PCI-DSS en el portfolio

**Sistema bajo prueba:** Parabank — Banking Demo Application  
**Versión PCI-DSS referenciada:** SAQ A (v4.0)  
**Última actualización:** junio 2026  
**Autor:** QA Automation Engineer  

> **Nota de contexto:** Parabank es una aplicación de demo educativa, no un sistema de producción.
> Los controles que figuran como cubiertos reflejan qué evidencia de testing produciría un QA
> en un sistema real equivalente. Los gaps identificados son gaps de la *aplicación demo*,
> no del framework de testing.

---

## Requerimiento 6 — Desarrollar y mantener sistemas seguros

| Control | Descripción | Test / evidencia que lo cubre | Estado |
|---------|-------------|-------------------------------|--------|
| 6.3 | Las vulnerabilidades de seguridad se identifican y se les asigna ranking de riesgo | H-007 a H-018 documentados en `tech-discovery-report.md` con severity (Critical / Alta / Media). Patrón sistémico identificado: ausencia de validación numérica server-side en todos los flujos financieros | ✅ Cubierto |
| 6.4 | Todos los cambios de software pasan por un proceso de QA antes de producción | CI pipeline con DAG `smoke → full → performance`. Ningún merge a `main` sin pipeline verde. Branch/PR workflow establecido con conventional commits | ✅ Cubierto |
| 6.5 | Los desarrolladores están entrenados en técnicas de codificación segura | No aplica — Parabank es aplicación demo sin proceso de desarrollo activo en este portfolio | N/A |

**Hallazgos que evidencian gaps en Req. 6:**

- **H-007** (Critical): el servidor acepta montos negativos en transferencias, bill pay y solicitudes de préstamo. Viola el principio de validación server-side independiente del cliente — la validación jQuery del frontend no es suficiente como único control.
- **H-016** (Media): el servidor acepta transferencias de $0.00. El límite inferior del rango válido no está validado.
- **H-015** (Critical): el servidor acepta montos negativos en solicitudes de préstamo. Misma raíz que H-007.

---

## Requerimiento 7 — Restringir el acceso a los datos del titular de la tarjeta

| Control | Descripción | Test / evidencia que lo cubre | Estado |
|---------|-------------|-------------------------------|--------|
| 7.1 | El acceso a componentes del sistema se limita a lo que es necesario para cada rol | `tests/api/authorization.api.spec.ts` — verifica que endpoints de cuentas y clientes rechacen requests sin sesión válida | 🐛 Bug documentado (H-018) |
| 7.2 | Los sistemas de control de acceso están implementados y configurados para denegar todo acceso por defecto | H-018: `GET /accounts/{id}` y `GET /customers/{id}/accounts` responden HTTP 200 sin JSESSIONID — el control de acceso no está implementado en la capa de API REST | 🐛 Bug documentado (H-018) |

**Detalle de H-018 (Critical — IDOR / Broken Access Control):**

Dos endpoints exponen datos financieros sin requerir autenticación:

| Endpoint | Sin sesión | Datos expuestos |
|----------|-----------|-----------------|
| `GET /services/bank/accounts/{accountId}` | HTTP 200 | balance, tipo, customerId |
| `GET /services/bank/customers/{customerId}/accounts` | HTTP 200 | lista completa de cuentas con balances |

El `customerId` es un entero secuencial — un atacante puede iterar sobre un rango de IDs y obtener la estructura financiera completa de todos los clientes sin credenciales.

**Patrón OWASP:** IDOR (Insecure Direct Object Reference) — A01:2021 Broken Access Control.  
**Comportamiento esperado:** HTTP 401 sin sesión válida; HTTP 403 si el usuario autenticado intenta acceder a recursos ajenos.

---

## Requerimiento 8 — Identificar y autenticar el acceso a los componentes del sistema

| Control | Descripción | Test / evidencia que lo cubre | Estado |
|---------|-------------|-------------------------------|--------|
| 8.2 | La identidad de todos los usuarios se gestiona correctamente | `tests/api/login.api.spec.ts` — credenciales inválidas retornan error; registro con username duplicado rechazado server-side (H-011: bug solo en UI, servidor correcto) | ✅ Cubierto |
| 8.3 | La autenticación individual se aplica a todos los usuarios | H-009: el JSESSIONID persiste válido en el servidor tras el logout — confirmado en UI y API directa. El servidor no invalida la sesión al cerrar sesión | 🐛 Bug documentado (H-009) |

**Detalle de H-009 (Media — Sesión no invalidada post-logout):**

Confirmado en ambas capas (UI y API directa). Tras ejecutar logout, el JSESSIONID original permanece activo en el servidor. Un atacante con acceso al token de sesión (XSS, shoulder surfing, shared terminal) mantiene acceso indefinido aunque el usuario legítimo haya cerrado sesión.

**Refs:** `test.fail()` en `auth.spec.ts`, `accounts.spec.ts`, `billpay.spec.ts`, `login.api.spec.ts`.

---

## Bugs críticos sin mapeo directo a Req. 6/7/8 — contexto adicional

Estos hallazgos no mapean a los requerimientos del foco QA en SAQ A, pero son relevantes para una auditoría más amplia:

| Bug | Severidad | Relevancia de compliance |
|-----|-----------|--------------------------|
| H-008: doble submit genera transacciones duplicadas | Alta | Integridad transaccional — relevante para Req. 10 (logging) en entornos PCI completos |
| H-010: overdraft permitido sin validación | Crítica | Integridad financiera — relevante para controles anti-fraude internos |
| H-013: cuentas nuevas se crean con $100 en lugar de $0 | Media | Puede ser comportamiento intencional del demo; en producción sería un defecto de integridad de datos |
| H-014: mismatch de cuenta de beneficiario no validado server-side | Alta | Relevante para controles de exactitud en pagos — PCI Req. 6.3 aplicado a datos de destino |
| H-017: self-transfer aceptada | Media | Transacciones cuenta-a-sí-misma son anomalía de auditoría financiera (structuring) |

---

## Gaps identificados

Los siguientes controles PCI-DSS no tienen cobertura en este portfolio porque Parabank carece de las capas de infraestructura que los requerimientos asumen. En un sistema de producción real estos controles requerirían:

| Control | Gap | Tests que se agregarían en producción |
|---------|-----|--------------------------------------|
| Req. 6.5 — Codificación segura | Parabank no tiene proceso de desarrollo activo | Code review gates en CI, SAST integration tests (Semgrep / SonarQube) |
| Req. 7.3 — Revisión periódica de accesos | No hay sistema de gestión de roles en Parabank demo | Tests de matriz de permisos por rol; validación de segregación de funciones |
| Req. 8.4 — MFA para acceso administrativo | No hay panel administrativo en Parabank demo | Tests de flujo MFA; verificación de que acceso admin no funciona sin segundo factor |
| Req. 8.6 — Contraseñas de sistema/aplicación | No hay gestión de service accounts en Parabank demo | Tests de rotación de credenciales; verificación de no-hardcoding en configs |
| Req. 10 — Logging y auditoría | HSQLDB no expone logs de acceso auditables en la demo | Tests que verifiquen que operaciones sensibles generan entradas de audit log |

**Diferencia entre SAQ A y SAQ D (respuesta de entrevista):**
SAQ A aplica a merchants que solo procesan pagos via iframes o redirects a terceros certificados — tienen alcance de infraestructura reducido. SAQ D es el cuestionario completo para cualquier entidad que almacena, procesa o transmite datos de tarjeta directamente — mayor alcance, más controles aplicables. El portfolio referencia SAQ A porque Parabank es una demo sin infraestructura de producción; en un banco real, el alcance sería SAQ D o una auditoría QSA completa.

---

## Respuesta preparada para entrevista

> "PCI-DSS define controles técnicos que QA puede verificar directamente. El requerimiento 8 sobre autenticación mapea a tests de sesión — en Parabank documenté H-009, donde el JSESSIONID no se invalida post-logout, lo que viola el control 8.3. El requerimiento 7 sobre control de acceso mapea a tests de autorización — documenté H-018, un IDOR donde cualquier cliente HTTP puede leer balances de cuenta sin sesión válida, violando el control 7.1 y el patrón OWASP A01:2021. No necesito ser auditor de PCI — necesito saber qué tests producen evidencia relevante para una auditoría, y poder relacionar cada hallazgo con el control que viola."

---

*Generado como parte del roadmap de 90 días — Fase 3, Tarea 1*