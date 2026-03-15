# Frontend Audit Baseline

Generated via:

```bash
node scripts/security/capture-npm-audit.cjs --prefix frontend --out frontend-audit-baseline.json
node scripts/security/validate-audit-policy.cjs --audit frontend-audit-baseline.json --policy docs/security/ci-policy.md --scope frontend --mode baseline
```

## Notes

- This baseline is intentionally non-blocking in Task 1.
- High/critical remediation is implemented in Task 7.
- Any temporary exceptions must be recorded in `docs/security/ci-policy.md` with `owner` and `expiry`.

## Task 7 remediation status

- Date: 2026-03-15
- Remediated high/critical package set in frontend:
  - `axios` → `^1.13.6`
  - `react-router-dom` → `^6.30.3` (transitively updates `react-router` and `@remix-run/router` to patched ranges)
- Added frontend overrides for remaining transitive high advisories:
  - `flatted` → `^3.4.1`
  - `glob` → `^10.5.0`
  - `minimatch` → `^10.2.4`
  - `rollup` → `^4.59.0`
- Current frontend audit enforce target: **0 high / 0 critical**.
