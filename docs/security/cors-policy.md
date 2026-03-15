# CORS / Origin Policy by Environment

This document defines how backend HTTP CORS and Socket.IO origin validation behave across environments.

## Source of truth

- Policy implementation: `backend/src/config/originPolicy.js`
- HTTP CORS usage: `backend/src/config/cors.js`
- Socket CORS usage: `backend/src/server.js`

## Environment resolution

Runtime environment is resolved in this order:

1. `APP_ENV`
2. `NODE_ENV`

Values `production`, `staging`, `prod` are treated as **non-local** environments.

## Allowed origin inputs

Allowed origins are built from:

- `ALLOWED_ORIGINS` (comma-separated)
- `FRONTEND_ORIGIN` (comma-separated)

Wildcard `*` is ignored.

## Localhost default behavior

Default localhost origins:

- `http://localhost:5173`
- `http://localhost:4000`
- `http://localhost:5174`
- `http://localhost:5175`

### Development (or unspecified env)

- Default localhost origins are included automatically.
- Useful for local FE/BE/socket development.

### Staging / Production

- Default localhost origins are **not** auto-included.
- Localhost is only allowed if explicitly listed in `ALLOWED_ORIGINS` or `FRONTEND_ORIGIN`.

## Security intent

- Prevent accidental localhost access in deployment environments.
- Keep local developer experience intact for development.
- Keep policy explicit and auditable via environment configuration.

## Verification tests

- `backend/tests/security/socket-origin-policy.test.js`
- `backend/tests/security/origin-policy-subdomain.test.js`
