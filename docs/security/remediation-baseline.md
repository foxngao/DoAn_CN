# Security Remediation Baseline

This document records the deterministic baseline setup for the security remediation program.

## Scope

- Feature: `full-project-audit-remediation`
- Priority: bug/security-first
- Gate model: staged security-audit CI (non-blocking in Task 1, blocking in Task 8)

## Baseline artifacts created in Task 1

- `docs/security/audit-baseline-backend.md`
- `docs/security/audit-baseline-frontend.md`
- `docs/security/secret-rotation-checklist.md`
- `docs/security/ci-policy.md`
- `scripts/security/capture-npm-audit.cjs`
- `scripts/security/validate-audit-policy.cjs`
- `scripts/security/assert-ci-blocking-gate.cjs`
- `scripts/security/validate-secret-rotation-checklist.cjs`

## Deterministic verification contract

Baseline completion requires:

1. `.env` runtime files are ignored and not tracked.
2. Secret rotation defer record for `backend/.env` exists and passes validator.
3. npm-audit capture works for backend/frontend independent from npm audit vulnerability exit behavior.
4. Policy validator passes fixture checks with expected exit codes (`0`, `4`, `5`).
5. CI security gate exists for `pull_request` to `main` and is non-blocking (`continue-on-error: true`) in this stage.
