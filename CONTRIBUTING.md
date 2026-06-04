# Contributing

## Branches

Create one branch per change from `main`:

```
git checkout -b <type>/<short-description>
```

Branch types: `fix`, `feat`, `docs`, `refactor`, `chore`, `ci`

Examples:
```
fix/remove-hardcoded-account-ids
docs/add-env-example
chore/update-playwright-config
```

## Commits — Conventional Commits

```
<type>(<scope>): <lowercase description>
```

| Type | When to use |
|------|-------------|
| `feat` | new feature or test case |
| `fix` | bug fix in code or test |
| `test` | adds or modifies existing tests |
| `docs` | documentation, ADRs, README |
| `refactor` | change that neither adds nor fixes anything |
| `chore` | configuration, dependencies, scripts |
| `ci` | changes to GitHub Actions or pipelines |

Examples:
```
fix(fixtures): remove hardcoded account IDs from transfer specs
feat(api): add idempotency test for transfer endpoint
docs(adr): add ADR-007 for credential management strategy
refactor(k6): move credentials to environment variables
chore(config): add explanatory comments to playwright configuration
```

## Pull Requests

1. Create a branch from `main`
2. Make changes with descriptive commits
3. Open a PR with a description that includes:
   - **Problem:** what was wrong or missing
   - **Change:** what was modified and why
4. Merge with squash

## Local Setup

```bash
npm install
npx playwright install chromium
docker compose up -d
npm test
```

Required environment variables — see `.env.example`.