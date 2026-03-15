# Chat Auth Troubleshooting Runbook

## Purpose

Diagnose and fix realtime chat authentication/session issues across frontend socket client and backend Socket.IO middleware.

## Primary Components

- Frontend socket client: `frontend/src/services/chat/socketService.js`
- Backend socket auth middleware: `backend/src/chat/socketAuth.js`
- Socket server wiring: `backend/src/server.js`

## Typical Symptoms

- Chat never connects after login.
- Socket disconnect loop right after connect.
- Backend reports missing/invalid token in handshake.

## Quick Checks

1. Confirm session-cookie strategy is intact:
   - no hard dependency on `localStorage.token` for socket connect
   - socket client uses `withCredentials: true`
2. Confirm backend can extract token from either:
   - `handshake.auth.token`
   - `session_token` cookie
3. Confirm JWT secret configured and valid in backend env.

## Verification Commands

```bash
npm run test:ci --prefix frontend -- src/services/chat/socketService.test.js src/services/chat/socketService.session.test.js
npm run test:ci --prefix backend -- tests/chat/socket-auth-cookie.test.js tests/chat/socket-session-regression.test.js
```

Expected: exit code 0 for both commands.

## Deep Triage Steps

1. Browser checks:
   - Verify `session_token` cookie exists after login.
   - Verify WebSocket handshake includes credentials.
2. Backend logs:
   - Inspect auth middleware failures (invalid or missing token).
3. API auth cross-check:
   - Confirm HTTP endpoints accept current session (cookie path/domain/sameSite).

## Common Root Causes and Fixes

- **Missing cookie on frontend domain**
  - Fix cookie domain/sameSite configuration in backend auth controller.
- **Handshake parser mismatch**
  - Ensure `extractSocketTokenFromHandshake` handles expected formats (Bearer/raw token/cookie fallback).
- **Stale JWT secret or session invalidation**
  - Reissue session and restart backend with correct env.

## Regression Guardrails

- Keep socket auth tests passing in CI.
- Do not reintroduce localStorage token requirement.
- Preserve backward compatibility for `auth.token` while cookie-first flow remains primary.
