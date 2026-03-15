# Fixture Policy - Expired Exception

```json
{
  "version": 1,
  "scopes": ["backend", "frontend"],
  "severityThreshold": ["high", "critical"],
  "identityPrecedence": ["advisory", "url", "package_range"],
  "exceptions": [
    {
      "advisory": "GHSA-EXPIRED-EXCEPTION-01",
      "reason": "Fixture expired exception",
      "owner": "fixture-owner",
      "expiry": "2000-01-01",
      "scope": "backend"
    }
  ]
}
```
