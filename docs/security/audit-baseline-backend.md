# Backend Audit Baseline

Generated via:

```bash
node scripts/security/capture-npm-audit.cjs --prefix backend --out backend-audit-baseline.json
node scripts/security/validate-audit-policy.cjs --audit backend-audit-baseline.json --policy docs/security/ci-policy.md --scope backend --mode baseline
```

## Notes

- This baseline is intentionally non-blocking in Task 1.
- High/critical remediation is implemented in Task 6.
- Any temporary exceptions must be recorded in `docs/security/ci-policy.md` with `owner` and `expiry`.

## Task 6 remediation status

- Date: 2026-03-15
- Remediated high/critical package set in backend:
  - `axios` → `^1.13.6`
  - `multer` → `^2.1.1`
  - `nodemailer` → `^8.0.2`
  - `sequelize` → `^6.37.8`
  - `express-validator` → `^7.3.1` (pulls patched `validator`)
  - `jsonwebtoken` → `^9.0.3` (pulls patched `jws`)
- Added backend override to resolve transitive high advisory from lint cache chain:
  - `overrides.flatted` → `^3.4.1`
- Current backend audit enforce target: **0 high / 0 critical**.
