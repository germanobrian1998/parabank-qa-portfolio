<!-- docs/bva-transfers-module.md -->

# BVA — Módulo de Transferencias

## Contexto

El módulo de transferencias es el flujo de mayor riesgo en Parabank.
Boundary Value Analysis aplicado a este módulo produce los casos de mayor
densidad de bugs con la menor cantidad de tests.

Este documento describe el análisis completo. Los casos implementados
están en `tests/edge-cases/transfer.edge.spec.ts`.

---

## Variables de análisis

| Variable | Límite inferior inválido | Límite inferior válido | Rango válido | Límite superior válido | Límite superior inválido |
|---|---|---|---|---|---|
| **Monto** | negativo | $0.01 | $0.01 – saldo disponible | saldo exacto | saldo + $0.01 |
| **Cuenta destino** | — | ID existente propio | cualquier ID existente | — | ID inexistente |
| **Cuenta origen** | — | ID propio con saldo > 0 | — | — | ID igual a destino |

---

## Decision Table

| Monto | Saldo origen | Cuenta destino | Resultado esperado | Test | Estado |
|---|---|---|---|---|---|
| negativo | cualquiera | válida | ❌ Error 4xx | transfer.api.spec.ts | 🐛 H-007: acepta |
| $0.00 | cualquiera | válida | ❌ Error 4xx | transfer.edge.spec.ts | 🐛 H-016: acepta |
| $0.01 | suficiente | válida | ✅ Success | transfer.edge.spec.ts | ✅ passing |
| válido | exactamente suficiente | válida | ✅ Success | transfer.edge.spec.ts | ⏭ skip (saldo variable entre corridas) |
| válido | insuficiente | válida | ❌ Error 4xx | transfer.api.spec.ts | 🐛 H-010: acepta |
| válido | suficiente | inexistente | ❌ Error 4xx | transfer.edge.spec.ts | ✅ passing |
| válido | suficiente | = origen | ❌ Error 4xx | transfer.edge.spec.ts | 🐛 H-017: acepta |
| válido | suficiente | válida diferente | ✅ Success | transfer.spec.ts + transfer.api.spec.ts | ✅ passing |

---

## Bugs encontrados en este módulo

| ID | Descripción | Severidad | Impacto financiero |
|---|---|---|---|
| H-007 | Servidor acepta montos negativos | Crítica | Extracción de fondos sin autorización |
| H-010 | Servidor permite overdraft ilimitado | Crítica | Exposición de crédito no controlada |
| H-016 | Servidor acepta transferencias de $0.00 | Media | Contaminación del historial de transacciones; falsos positivos en detección de fraude |
| H-017 | Servidor acepta transferencias de cuenta a sí misma | Media | Par fantasma débito/crédito en historial; anomalía en auditorías financieras |

---

## Casos excluidos del scope y justificación

| Caso | Por qué se excluyó |
|---|---|
| Transferencia entre cuentas de distintos usuarios | Parabank demo no expone ese endpoint en la UI — no forma parte del contrato del sistema |
| Montos con más de 2 decimales ($10.001) | La API trunca o redondea — comportamiento de presentación, no de negocio |
| Concurrencia (doble submit simultáneo) | Documentado como H-008 — requiere tests de concurrencia separados (Fase 3, Tarea 2) |
| Monto máximo absoluto del sistema | Parabank no documenta un límite máximo — $999,999,999 ya cubre el caso de overflow práctico en H-010 |