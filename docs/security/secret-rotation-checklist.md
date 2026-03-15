# Secret Rotation Checklist

This checklist tracks deterministic defer/rotation records for secret exposure findings.

### Finding: backend/.env

- finding: backend/.env
- status: deferred-rotation-required
- owner: ops-security
- environment: production-and-shared-dev
- due-date: 2026-03-31
- rotation-trigger: complete-before-release-of-remediation-batch
- notes: runtime env file is not tracked in git; rotate DB/JWT/API/encryption credentials in secret manager and redeploy.
