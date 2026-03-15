# Security Incident Response Runbook

## Purpose

Provide a deterministic response flow when a security incident is suspected in HMS (credential leak, account takeover, XSS exploitation, suspicious audit findings, or CI gate bypass).

## Scope

- Backend (`backend/*`)
- Frontend (`frontend/*`)
- CI policy and audit enforcement (`docs/security/ci-policy.md`, `.github/workflows/ci.yml`)

## Triggers

- Unexpected `high`/`critical` advisory appears in CI enforce mode.
- Confirmed or suspected secret exposure (`.env`, API key, DB credential, JWT secret).
- Confirmed stored/reflected XSS or auth/session bypass.
- Security-audit job fails on PR to `main`.

## Severity Classification

- **SEV1**: active exploitation or leaked production secrets.
- **SEV2**: high-impact vulnerability confirmed but not actively exploited.
- **SEV3**: policy breach or non-exploited weakness.

## Immediate Actions (0–30 minutes)

1. Appoint incident commander and recorder.
2. Freeze risky merges to `main` until triage completes.
3. Capture immutable evidence:
   - failing CI run URL
   - failing command output
   - advisory IDs / package paths
4. If secrets may be leaked, rotate immediately (DB/API/JWT/email) and invalidate active sessions where possible.

## Triage Checklist

1. Confirm blast radius:
   - affected scopes: `backend`, `frontend`, or both
   - data sensitivity involved
2. Reproduce locally with policy tools:

```bash
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-incident.json
node scripts/security/validate-audit-policy.cjs --audit backend-audit-incident.json --policy docs/security/ci-policy.md --scope backend --mode enforce
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-incident.json
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-incident.json --policy docs/security/ci-policy.md --scope frontend --mode enforce
```

3. Determine containment strategy:
   - dependency hotfix (see `docs/runbooks/dependency-hotfix.md`)
   - rollback to previous known-safe deploy
   - temporary feature disable if applicable

## Containment and Eradication

1. Apply minimal fix first (non-breaking preferred).
2. Add/extend regression tests for exploited vector.
3. Re-run full verification matrix:

```bash
npm run lint --prefix backend && npm run test:ci --prefix backend
npm run lint --prefix frontend && npm run test:ci --prefix frontend && npm run build:ci --prefix frontend
```

4. Ensure CI security gate is still blocking PR to `main`:

```bash
node scripts/security/assert-ci-blocking-gate.cjs --workflow .github/workflows/ci.yml --job security-audit --event pull_request --target-branches main --require-pr-blocking true
```

## Recovery and Handoff

1. Confirm all policy checks pass in enforce mode.
2. Document root cause, fix scope, and timeline.
3. Update baseline docs if dependency landscape changed.
4. Post-incident action items:
   - strengthen automated detection
   - improve runbooks/tests for recurrence prevention

## Communication Template

- Incident ID:
- Severity:
- Detection source:
- User impact:
- Containment status:
- ETA for remediation:
