# Performance Baseline — Parabank

**Fecha de medición inicial:** 30/05/2026  
**Ambiente:** Docker local — `germanobrian1998/parabank:latest`  
**Herramienta:** k6  
**Host:** Ubuntu 24

---

## Cómo ejecutar

```bash
# Escenario 1 — baseline de login
k6 run tests/performance/login.baseline.k6.js

# Escenario 2 — stress de transferencia
k6 run tests/performance/transfer.stress.k6.js

# Escenario 3 — soak de lectura
k6 run tests/performance/accounts.soak.k6.js
```

---

## Thresholds y justificación

| Escenario | Threshold | Justificación |
|---|---|---|
| Login baseline | p95 < 2000ms, error rate < 1% | SLA bancario estándar para autenticación (NIST SP 800-63B) |
| Transfer stress | p95 < 3000ms, error rate < 1% | Tolerancia mayor por carga concurrente; 1% de pérdida de transacciones es el límite de negocio |
| Accounts soak | p99 < 3000ms, error rate < 1% | Endpoint de lectura de alta frecuencia — el p99 detecta degradación sostenida, no solo picos |

---

## Resultados baseline — 30/05/2026

| Escenario | p50 | p95 | p99 | Error rate | ¿Threshold cumplido? |
|---|---|---|---|---|---|
| Login baseline (10 VUs, 30s) | 8.78ms | 18.64ms | 206.71ms | 0.00% | ✅ |
| Transfer stress (1→20 VUs, 80s) | 10.50ms | 17.67ms | — | 0.00% | ✅ |
| Accounts soak (5 VUs, 2m) | 10.20ms | 16.74ms | 27.69ms | 0.00% | ✅ |

### Detalle por escenario

**Login baseline**
- Iteraciones: 300 (10 VUs × 30s con sleep 1s)
- avg: 13.04ms / min: 4.84ms / max: 211.42ms
- Throughput: 9.82 req/s
- Todos los checks pasaron: login returns 200, response contains customerId, response time < 2000ms

**Transfer stress**
- Iteraciones: 1454 transferencias ejecutadas bajo ramp-up 1→20 VUs
- avg: 11.22ms / min: 5.02ms / max: 32.98ms
- Throughput: 18.15 req/s en pico
- Todos los checks pasaron: transfer returns 200, response time < 3000ms

**Accounts soak**
- Iteraciones: 595 (5 VUs × 2m con sleep 1s)
- avg: 11.09ms / min: 6.76ms / max: 38.72ms
- Throughput: 4.94 req/s sostenido
- Todos los checks pasaron: accounts returns 200, response is array, response time < 3000ms

---

## Interpretación crítica de los resultados

### Los thresholds pasaron — pero eso no es toda la historia

Los tres escenarios pasaron con margen amplio. El p95 de login (18.64ms)
está **107 veces por debajo** del threshold definido (2000ms). Este resultado
tiene dos lecturas:

**Lectura 1 — positiva:** Parabank en Docker local tiene performance
excelente para carga demo. Los thresholds son conservadores porque están
calibrados para producción real, no para una instancia single-node local.

**Lectura 2 — crítica (más importante):** el transfer stress ejecutó
1454 transferencias con 0 errores y p95 de 17ms. Esto parece un resultado
positivo, pero oculta el bug H-010.

**El servidor no valida saldo antes de ejecutar la transferencia (H-010).**
Esto significa que el bajo tiempo de respuesta se explica parcialmente
porque el servidor omite el paso más costoso de una transferencia real:
consultar el saldo disponible, validarlo, y rechazar si es insuficiente.
Un sistema correcto haría al menos una query adicional a la BD por
transferencia — el tiempo de respuesta real de un sistema con validación
correcta sería mayor.

En otras palabras: **el sistema es "rápido" en parte porque está roto.**
Un threshold de performance que pasa en un sistema con H-010 no es
equivalente a un threshold que pasa en un sistema con validación correcta.

Esta distinción demuestra que los tests de performance pueden detectar
síntomas de problemas de correctitud, no solo de velocidad.

---

## Decisiones de scope — qué no se midió y por qué

| Caso excluido | Justificación |
|---|---|
| Load test de registro de usuarios | Crea estado permanente en la BD — contamina el ambiente de test. En producción se usaría un ambiente de perf aislado con reset automatizado |
| Spike test (0→100 VUs instantáneo) | Parabank es una app demo single-instance sin load balancer — el resultado no sería representativo de un sistema real bajo spike |
| Performance de UI con Playwright | El overhead del browser (rendering, JS execution) distorsiona las métricas del servidor. La separación browser tests / load tests es una práctica estándar en pipelines de calidad |
| Soak test de larga duración (24h+) | En producción real un soak dura 24-72 horas para detectar memory leaks. 2 minutos es suficiente para establecer baseline en un portfolio — la decisión arquitectónica está documentada |
| Performance de endpoints de escritura (register, billpay, loan) | Crean estado permanente no idempotente. El endpoint de transfer es el proxy correcto para medir escrituras financieras |

---

## Cómo interpretar una regresión de performance

Si en una corrida futura los números superan los thresholds:

1. Verificar que el contenedor Docker tenga la imagen limpia (`germanobrian1998/parabank:latest` sin estado acumulado)
2. Verificar que no haya otros procesos compitiendo por CPU/memoria en el host
3. Si el entorno está limpio y los números siguen siendo altos, es una regresión real — documentarla con el delta respecto a este baseline
4. El threshold de transfer stress fallando con error rate > 1% indicaría degradación del servidor bajo carga concurrente — investigar antes de cualquier merge