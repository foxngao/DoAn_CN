# Dependency Hotfix Runbook

## Purpose

Standardize urgent dependency remediation when CI enforce policy fails on `high`/`critical` advisories.

## Inputs

- Current policy: `docs/security/ci-policy.md`
- Baselines:
  - `docs/security/audit-baseline-backend.md`
  - `docs/security/audit-baseline-frontend.md`

## Step 1 — Capture Current State

```bash
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-hotfix.json
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-hotfix.json
```

## Step 2 — Evaluate Policy Failures

```bash
node scripts/security/validate-audit-policy.cjs --audit backend-audit-hotfix.json --policy docs/security/ci-policy.md --scope backend --mode enforce
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-hotfix.json --policy docs/security/ci-policy.md --scope frontend --mode enforce
```

If enforce fails, identify advisory IDs and package paths from output.

## Step 3 — Patch Strategy

1. Prefer direct dependency upgrade first.
2. Use `overrides` only when direct upgrade is unavailable.
3. Avoid broad major-version jumps unless necessary for security.
4. Record compatibility risks and rollback plan in upgrade notes.

## Step 4 — Apply and Verify

```bash
npm install --prefix backend
npm install --prefix frontend
npm run lint --prefix backend && npm run test:ci --prefix backend
npm run lint --prefix frontend && npm run test:ci --prefix frontend && npm run build:ci --prefix frontend
```

Re-run enforce checks after upgrade:

```bash
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-hotfix.json
node scripts/security/validate-audit-policy.cjs --audit backend-audit-hotfix.json --policy docs/security/ci-policy.md --scope backend --mode enforce
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-hotfix.json
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-hotfix.json --policy docs/security/ci-policy.md --scope frontend --mode enforce
```

## Step 5 — Documentation Updates

Update related artifacts:

- `docs/security/dependency-upgrades-backend.md` (if backend changed)
- `docs/security/dependency-upgrades-frontend.md` (if frontend changed)
- `docs/security/audit-baseline-backend.md`
- `docs/security/audit-baseline-frontend.md`

## Rollback

If regression occurs:

1. Revert dependency bump commit.
2. Restore prior lockfile.
3. Re-run lint/test/build to confirm restored stability.
4. Open follow-up issue for alternative patch path.
