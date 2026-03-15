# CI Security Audit Policy (Deterministic Contract)

This policy defines the machine-checkable contract consumed by:

- `scripts/security/validate-audit-policy.cjs`
- `scripts/security/capture-npm-audit.cjs`
- `.github/workflows/ci.yml` security-audit job

## CI gating stage

- Current stage: **blocking** for `pull_request` targeting `main`.
- Contract check command:

```bash
node scripts/security/assert-ci-blocking-gate.cjs --workflow .github/workflows/ci.yml --job security-audit --event pull_request --target-branches main --require-pr-blocking true
```

- Security audit jobs must run `validate-audit-policy.cjs` in `enforce` mode for both scopes.

## Normative rules

1. `scope` enum is strictly: `backend|frontend`.
2. `enforce` mode fails when there is any `high|critical` advisory in the selected scope that is not covered by an unexpired exception.
3. `baseline` mode validates input structure, normalizes findings, and exits `0` when input is structurally valid.
4. Advisory identity precedence is fixed: advisory ID (`GHSA/CVE`) → advisory URL → `package@vulnerableRange`.
5. Exception entries are required to include non-empty fields: `advisory`, `reason`, `owner`, `expiry`, `scope`.
6. Expired exception entries fail validation.
7. Unmatched/stale exception entries (defined in policy but not present in current audit findings of that scope) fail validation.
8. Scope mismatch between finding and matching exception fails validation.

## Exit code contract

- `0`: pass
- `2`: invalid policy schema
- `3`: invalid/unreadable audit JSON
- `4`: unexcepted high/critical advisory found
- `5`: expired exception found
- `6`: scope mismatch exception
- `7`: unmatched/stale exception entry

## Policy JSON block

```json
{
  "version": 1,
  "scopes": ["backend", "frontend"],
  "severityThreshold": ["high", "critical"],
  "identityPrecedence": ["advisory", "url", "package_range"],
  "exceptions": []
}
```
