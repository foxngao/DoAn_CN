# Fixture Policy - Valid

```json
{
  "version": 1,
  "scopes": ["backend", "frontend"],
  "severityThreshold": ["high", "critical"],
  "identityPrecedence": ["advisory", "url", "package_range"],
  "exceptions": [
    {
      "advisory": "GHSA-AAAA-BBBB-CCCC",
      "reason": "Fixture risk acceptance",
      "owner": "fixture-owner",
      "expiry": "2099-12-31",
      "scope": "backend"
    }
  ]
}
```
