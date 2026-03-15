# Frontend Dependency Upgrades (Task 07)

## Scope

- Feature: `full-project-audit-remediation`
- Task: `07-frontend-dependency-vulnerability-remediation-highcritical`
- Goal: eliminate frontend **high/critical** findings under policy enforce mode.

## Upgrade batches executed

### Batch 1 — direct vulnerable dependencies

- `axios`: `^1.9.0` → `^1.13.6`
- `react-router-dom`: `^6.30.0` → `^6.30.3`
  - transitively updates `react-router` and `@remix-run/router` to patched ranges.

Result after batch: remaining high findings were transitive (`flatted`, `glob`, `minimatch`, `rollup`).

### Batch 2 — transitive dependency control (overrides)

- Added `overrides` in `frontend/package.json`:
  - `flatted`: `^3.4.1`
  - `glob`: `^10.5.0`
  - `minimatch`: `^10.2.4`
  - `rollup`: `^4.59.0`

Result after batch: frontend audit enforce high/critical reduced to zero.

## Breaking/API notes

- `react-router-dom` was updated within major v6 line; existing route APIs used by this project remained compatible.
- `vite` remained on v5 in this task; no build config migration was required.
- Moderate/low advisories may remain outside this task threshold by policy (`high|critical` only).

## Rollback notes

If runtime regressions are found post-upgrade:

1. Revert dependency changes in `frontend/package.json` and `frontend/package-lock.json`.
2. Reinstall with `npm ci --prefix frontend`.
3. Re-run:
   - `npm run lint --prefix frontend`
   - `npm run test:ci --prefix frontend`
   - `npm run build:ci --prefix frontend`

## Verification evidence

- `node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-current.json` → exit `0`
- `node scripts/security/validate-audit-policy.cjs --audit frontend-audit-current.json --policy docs/security/ci-policy.md --scope frontend --mode enforce` → exit `0`
- `npm run lint --prefix frontend && npm run test:ci --prefix frontend && npm run build:ci --prefix frontend` → exit `0`
