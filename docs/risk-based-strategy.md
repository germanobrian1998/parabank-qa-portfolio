# Risk-Based Test Strategy — Parabank Automation Framework

**Versión:** 1.0  
**Fecha:** 2025-06  
**Autor:** QA Engineer (Portfolio Project)  
**Sistema:** Parabank — Banking Demo Application

---

## Propósito de este documento

Este documento no es una lista de casos de prueba. Es la justificación de qué se prueba, qué no se prueba, y cómo se mide el éxito del framework. Un conjunto de tests sin esta base es cobertura sin criterio.

---

## Sección 1: Riesgos técnicos de Parabank como sistema financiero

### 1.1 Metodología de priorización

Los riesgos se evalúan en dos dimensiones:

- **Probabilidad de ocurrencia:** histórica en aplicaciones bancarias similares y basada en los hallazgos del Tech Discovery Report
- **Impacto de negocio:** consecuencia para el usuario final si el defecto llega a producción

La combinación define qué módulos reciben mayor densidad de tests y qué técnicas se aplican.

### 1.2 Registro de riesgos

| # | Riesgo | Módulo | Probabilidad | Impacto de negocio | Estrategia de mitigación | Cubierto por |
|---|--------|--------|-------------|-------------------|--------------------------|-------------|
| R1 | Transferencia duplicada por doble submit o retry | Transfers | Alta | Pérdida financiera directa; difícil de revertir sin soporte | Test de doble click + test de idempotencia via API | E2E edge case + API test |
| R2 | Saldo desactualizado en UI post-transferencia | Transfers | Alta | Usuario toma decisiones financieras con información incorrecta | Assertion de saldo pre y post operación; verificación cruzada UI↔API | E2E + consistency test |
| R3 | Validación de monto solo en cliente, bypass via API | Transfers / Bill Pay | Alta | Transacción con monto inválido (negativo, cero, fraccionario) persiste en DB | Test de API con payloads malformados | API test |
| R4 | Sesión no invalidada correctamente en logout | Auth | Media | Acceso no autorizado si el dispositivo es compartido | E2E de logout + intento de navegación a URL protegida post-logout | E2E auth |
| R5 | Creación de préstamo con datos inconsistentes (monto vs. ingresos) | Loans | Media | Préstamo aprobado que no debería serlo, o rechazado sin razón clara | Boundary tests sobre monto/ingresos | E2E + edge cases |
| R6 | Registro de usuario con username existente sin error claro | Auth / Register | Media | Confusión de usuario, posible shadowing de cuenta | E2E de registro con username duplicado | E2E auth |
| R7 | Historial de transacciones no refleja operación reciente | Transactions | Media | Usuario asume que la transferencia no ocurrió y la repite | Assertion de historial inmediatamente post-operación | E2E transfers |
| R8 | Bill Pay enviado a cuenta destino inexistente sin error | Bill Pay | Media | Dinero enviado sin confirmación de destino válido | Test con número de cuenta inválido | E2E + API |
| R9 | Inconsistencia entre datos en UI y en DB post-transferencia | Transfers | Baja-Media | Saldo en pantalla no coincide con saldo real; pérdida de confianza del usuario | Validación SQL post-operación | DB test |
| R10 | Apertura de cuenta con tipo incorrecto (CHECKING vs SAVINGS) | Accounts | Baja | Producto incorrecto asignado al cliente | Verificación de tipo de cuenta post-creación | E2E accounts |

### 1.3 Mapa de densidad de testing por módulo

```
Módulo          Riesgo agregado    Tests E2E    API tests    DB tests    Edge cases
─────────────   ───────────────    ─────────    ─────────    ────────    ──────────
Auth            Medio              3            1            0           1
Accounts        Bajo               2            1            0           0
Transfers       Alto               3            3            1           5 (BVA)
Bill Pay        Medio              2            2            0           1
Loans           Medio              2            1            0           2
Transactions    Bajo               1            1            0           0
─────────────────────────────────────────────────────────────────────────────────
TOTAL                             13           9            1           9
```

**Lectura del mapa:** Transfers recibe la mayor densidad porque concentra los riesgos más altos (R1, R2, R3, R9) y es el flujo con mayor impacto financiero directo.

---

## Sección 2: Qué NO se va a testear y por qué es una decisión correcta

### 2.1 Performance de carga (Load Testing extensivo)

**Qué sería:** tests con k6 o Locust simulando cientos o miles de usuarios concurrentes.

**Por qué se excluye:** Parabank es una aplicación demo sin SLA definido, sin arquitectura de producción, y corriendo sobre HSQLDB embebida — una base de datos diseñada para desarrollo, no para concurrencia. Cualquier threshold que definamos sería arbitrario, no basado en requerimientos reales de negocio. Un test de performance que falla contra un sistema demo no evidencia un problema real de calidad.

**Qué SÍ se incluye:** medición de tiempo de respuesta de los endpoints más críticos como baseline informativo (no como criterio de fallo), incluida en la Fase 3 como ejercicio de criterio, no como gate de CI.

**Cómo se argumenta en entrevista:** "El valor de un test de performance está en el threshold, y el threshold requiere un SLA. Sin SLA, el test no tiene criterio de fallo significativo. Documenté esta decisión en lugar de agregar tests que parecerían rigor pero no serían útiles."

### 2.2 Compatibilidad cross-browser completa

**Qué sería:** test suite corriendo en Chromium, Firefox, Safari/WebKit, y variantes móviles.

**Por qué se excluye parcialmente:** Parabank renderiza server-side HTML estándar, sin APIs de browser avanzadas ni CSS experimental. El riesgo de incompatibilidad es bajo. Mantener una suite idéntica en 4 browsers multiplica el tiempo de CI sin un beneficio proporcional para este tipo de aplicación.

**Qué SÍ se incluye:** Chromium como browser primario (cobertura completa) + Firefox para el smoke suite (sanity check de compatibilidad básica). Esto cubre el 90% del riesgo de compatibilidad con el 30% del costo.

### 2.3 Security testing avanzado (OWASP / Penetration testing)

**Qué sería:** SQL injection, XSS, CSRF, análisis de headers de seguridad, fuzzing de inputs.

**Por qué se excluye:** security testing requiere herramientas especializadas (OWASP ZAP, Burp Suite), conocimiento de threat modeling, y un proceso de responsible disclosure. Incluirlo superficialmente como "checkbox" — por ejemplo, un test que envía `<script>alert(1)</script>` y verifica que no ejecuta — no agrega valor real y puede dar falsa sensación de seguridad.

**Qué SÍ se incluye:** validaciones server-side (R3 en el registro de riesgos) que verifican que el servidor rechaza inputs inválidos. Esto es automation funcional con implicancia de seguridad, no security testing propiamente dicho.

### 2.4 Internacionalización y localización (i18n / l10n)

**Por qué se excluye:** Parabank no tiene soporte multi-idioma. No hay strings externalizados, no hay cambio de locale. Testear algo que el sistema no implementa no es cobertura — es ruido.

### 2.5 Accesibilidad exhaustiva (WCAG 2.1 AA completo)

**Qué se excluye:** auditoría manual completa de accesibilidad, testing con screen readers reales (NVDA, JAWS, VoiceOver).

**Por qué:** una auditoría de accesibilidad exhaustiva requiere usuarios reales con discapacidad y herramientas de evaluación manual. axe-core (que sí se incluye) detecta el 30-40% de issues de accesibilidad automáticamente. El resto requiere evaluación humana que está fuera del scope de automation.

**Qué SÍ se incluye:** integración de axe-core en cada Page Object como práctica de retrofitting. Los violations encontrados se documentan con impacto de negocio, no solo como hallazgos técnicos.

### 2.6 Resumen de exclusiones

| Área excluida | Costo de inclusión | Riesgo mitigado | Decisión |
|---------------|-------------------|-----------------|----------|
| Load testing extensivo | Alto (setup, thresholds, mantenimiento) | Bajo (no hay SLA) | Excluir; baseline informativo en Fase 3 |
| Cross-browser completo (4 browsers) | Medio (x4 tiempo CI) | Bajo (HTML estándar) | Chromium full + Firefox smoke |
| OWASP / Pen testing | Alto (herramientas, expertise) | Cubierto parcialmente por R3 | Excluir; server-side validation sí incluida |
| i18n / l10n | Bajo | Nulo (feature no existe) | Excluir completamente |
| Accesibilidad manual completa | Alto (usuarios, tiempo) | Parcialmente cubierto por axe-core | axe-core automático; manual excluido |

---

## Sección 3: KPIs del framework

Estos tres KPIs definen si el framework es exitoso, independientemente del número de tests que contenga.

### KPI-1: Tiempo de feedback en CI — suite smoke < 3 minutos

**Definición precisa:** tiempo transcurrido desde que `git push` dispara el workflow de GitHub Actions hasta que el job `smoke` reporta resultado (pass o fail), medido en la rama principal.

**Por qué importa:** un framework que tarda 15 minutos en dar feedback en la rama principal no se usa. Los desarrolladores hacen checkout de otra rama mientras esperan. El feedback rápido es la condición necesaria para que el framework sea adoptado como herramienta de desarrollo, no solo de validación post-hecho.

**Cómo se mide:** promedio de las últimas 10 ejecuciones del job `smoke` en GitHub Actions. Se registra en el CHANGELOG cuando hay variaciones de más de ±30 segundos.

**Threshold:** fallo si el smoke suite supera 3 minutos en promedio. Warning si supera 2 minutos 30 segundos.

**Tests incluidos en smoke:** login, una transferencia exitosa, consulta de saldo — los tres flujos de mayor riesgo y mayor frecuencia de uso.

### KPI-2: Tasa de fallos no reproducibles < 5%

**Definición precisa:** porcentaje de ejecuciones en CI donde al menos un test falla pero el mismo test pasa en la ejecución inmediata siguiente con el mismo código y sin cambios en el sistema bajo prueba.

**Por qué importa:** un framework con 20% de fallos no reproducibles (flakiness) es un framework que se ignora. Cuando un desarrollador ve una falla, su primera hipótesis será "es el test, no el código". Un framework creíble tiene fallos que siempre indican un problema real.

**Cómo se mide:** en las primeras 20 ejecuciones de CI post-implementación, se registra cada fallo. Para cada fallo, se ejecuta nuevamente sin cambios. Si pasa, se cuenta como fallo no reproducible. El ratio es `fallos no reproducibles / total de fallos`.

**Threshold:** el framework falla este KPI si supera 5% de fallos no reproducibles. Si se detecta un test flaky, se marca con `@flaky` y se excluye del smoke suite hasta que se corrige — nunca se silencia con retry.

**Nota de diseño:** la política deliberada es `retries: 0` en `playwright.config.ts` para CI. Un retry silencioso esconde el problema; un test marcado `@flaky` lo expone.

### KPI-3: Costo de mantenimiento por cambio de selector — 1 archivo modificado

**Definición precisa:** cuando un elemento crítico de la UI cambia su selector (id, data-testid, texto de botón, etc.), el número de archivos del repositorio que requieren modificación es exactamente 1 — el Page Object correspondiente.

**Por qué importa:** este KPI mide directamente si el framework cumple su promesa de abstracción. Si un selector está hardcodeado en 5 tests diferentes, un cambio de UI rompe 5 tests y el desarrollador debe buscar y editar en 5 lugares. Eso es mantenimiento de bajo valor que erosiona la confianza en el framework.

**Cómo se mide:** se hace una búsqueda en el repositorio de los selectores más usados (ej: el selector del botón de transferencia). Si ese string aparece en más de 1 archivo, el KPI falla para ese selector.

**Implementación:** uso obligatorio de `data-testid` attributes donde sea posible (o selectores semánticos como `getByRole`), definidos como constantes en el Page Object correspondiente. Los tests NUNCA referencian strings de selectores directamente.

```typescript
// ❌ Viola KPI-3 — selector en el test
await page.click('#transfer-btn');

// ✅ Cumple KPI-3 — selector encapsulado en el Page Object
await transferPage.submit(); // el Page Object sabe cómo encontrar el botón
```

---

## Sección 4: Criterios de entrada y salida por fase

### Criterio de entrada al CI completo (full suite)

Un test puede entrar al CI completo cuando:
- Tiene un `test.step()` o comentario que explica por qué el caso importa en términos de negocio
- Falla con un mensaje que describe el problema de negocio, no el error técnico
- Usa datos generados dinámicamente (no valores hardcodeados que dependan del estado de la DB)
- Tiene un fixture de setup que no depende de otros tests haber corrido previamente

### Criterio de salida del proyecto (Fase 5)

El framework está completo cuando:
- Los 3 KPIs están medidos con datos reales (no proyectados)
- Existe al menos 1 bug real o violation documentado con evidencia
- El `README.md` responde "¿qué problema de calidad resuelve este framework?" en las primeras 3 oraciones
- Un QA Engineer sin contexto puede clonar, ejecutar, y leer los resultados en menos de 10 minutos
