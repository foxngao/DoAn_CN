# Remediation Rollout Checklist

## Goal

Release the audit remediation batch safely with rollback readiness and policy-gate compliance.

## Pre-merge Checklist

- [ ] Backend quality gate passes:
  - `npm run lint --prefix backend && npm run test:ci --prefix backend`
- [ ] Frontend quality gate passes:
  - `npm run lint --prefix frontend && npm run test:ci --prefix frontend && npm run build:ci --prefix frontend`
- [ ] Security enforce checks pass for both scopes:
  - `node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-final.json`
  - `node scripts/security/validate-audit-policy.cjs --audit backend-audit-final.json --policy docs/security/ci-policy.md --scope backend --mode enforce`
  - `node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-final.json`
  - `node scripts/security/validate-audit-policy.cjs --audit frontend-audit-final.json --policy docs/security/ci-policy.md --scope frontend --mode enforce`
- [ ] CI blocking contract validated:
  - `node scripts/security/assert-ci-blocking-gate.cjs --workflow .github/workflows/ci.yml --job security-audit --event pull_request --target-branches main --require-pr-blocking true`

## Regression Spot-checks

- [ ] `npm run test:ci --prefix backend -- tests/security/xss-regression.test.js`
- [ ] `npm run test:ci --prefix backend -- tests/auth/otp-disclosure.test.js`
- [ ] `npm run test:ci --prefix backend -- tests/chat/socket-session-regression.test.js`
- [ ] `npm run test:ci --prefix frontend -- src/pages/LoginPage.session.test.jsx`
- [ ] `npm run test:ci --prefix frontend -- src/pages/benhnhan/tintuc/TinTucRegression.test.jsx`

## Deployment Readiness

- [ ] Release notes include dependency/security changes.
- [ ] On-call owner assigned for first 24h after deploy.
- [ ] Rollback point identified (last known good commit/tag).

## Rollback Plan

1. Revert remediation commit set (or deploy previous stable image).
2. Restore previous lockfiles if dependency regression is root cause.
3. Re-run quality/security gates on rollback candidate.
4. Announce rollback status and open follow-up fix ticket.

## Sign-off

- Engineering owner:
- QA owner:
- Security owner:
- Date/time:
