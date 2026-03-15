# Backend Dependency Upgrades (Task 06)

## Scope

- Feature: `full-project-audit-remediation`
- Task: `06-backend-dependency-vulnerability-remediation-highcritical`
- Goal: eliminate backend **high/critical** findings under policy enforce mode.

## Upgrade batches executed

### Batch 1 — direct vulnerable dependencies

- `axios`: `^1.6.0` → `^1.13.6`
- `multer`: `^2.0.2` → `^2.1.1`
- `nodemailer`: `^6.9.7` → `^8.0.2`
- `sequelize`: `^6.35.1` → `^6.37.8`
- `express-validator`: `^7.0.1` → `^7.3.1`
- `jsonwebtoken`: `^9.0.2` → `^9.0.3`

Result after batch: backend audit still had one high advisory from transitive `flatted` (eslint cache chain).

### Batch 2 — transitive dependency control

- Added `overrides` in `backend/package.json`:
  - `flatted`: `^3.4.1`

Result after batch: backend audit high/critical reduced to zero.

## Compatibility / migration notes

- `nodemailer` major bump (`6` → `8`) verified against current usage sites:
  - `backend/src/modules/auth/controller.js`
  - `backend/src/OTP/email.service.js`
- No code-level API changes were required for existing transporter/sendMail calls.
- Regression checks passed (lint + full backend test suite).

## Rollback notes

If runtime regressions are found post-upgrade:

1. Revert dependency changes in `backend/package.json` and `backend/package-lock.json` to last known good commit.
2. Reinstall with `npm ci --prefix backend`.
3. Re-run:
   - `npm run lint --prefix backend`
   - `npm run test:ci --prefix backend`
4. Open a focused follow-up for package-level isolation (especially nodemailer major version path).

## Verification evidence

- `node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-current.json` → exit `0`
- `node scripts/security/validate-audit-policy.cjs --audit backend-audit-current.json --policy docs/security/ci-policy.md --scope backend --mode enforce` → exit `0`
- `npm run lint --prefix backend && npm run test:ci --prefix backend` → exit `0`
