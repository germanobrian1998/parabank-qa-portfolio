# Contributing

## Branches

Crear una rama por cambio desde `main`:

```
git checkout -b <tipo>/<descripcion-corta>
```

Tipos de rama: `fix`, `feat`, `docs`, `refactor`, `chore`, `ci`

Ejemplos:
```
fix/remove-hardcoded-account-ids
docs/add-env-example
chore/update-playwright-config
```

## Commits — Conventional Commits

```
<tipo>(<scope>): <descripción en minúsculas>
```

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | nueva funcionalidad o test case |
| `fix` | corrección de bug en código o test |
| `test` | agrega o modifica tests existentes |
| `docs` | documentación, ADRs, README |
| `refactor` | cambio que no agrega ni corrige nada |
| `chore` | configuración, dependencias, scripts |
| `ci` | cambios en GitHub Actions o pipelines |

Ejemplos:
```
fix(fixtures): remove hardcoded account IDs from transfer specs
feat(api): add idempotency test for transfer endpoint
docs(adr): add ADR-007 for credential management strategy
refactor(k6): move credentials to environment variables
chore(config): update playwright timeout thresholds
```

## Pull Requests

1. Crear rama desde `main`
2. Hacer los cambios con commits descriptivos
3. Abrir PR con descripción que incluya:
   - **Problema:** qué estaba mal o qué faltaba
   - **Cambio:** qué se modificó y por qué
4. Hacer merge con squash

## Setup local

```bash
npm install
npx playwright install chromium
docker compose up -d
npm test
```

Variables de entorno requeridas — ver `.env.example`.