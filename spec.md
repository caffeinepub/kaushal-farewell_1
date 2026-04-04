# Kaushal Farewell — Full Security Hardening

## Current State
- Admin login is client-side only: email/password (`kaushalfarewell@gmail.com` / `Kaushal@123`) are hardcoded as plain-text constants in `AdminPage.tsx`. Anyone who opens DevTools can see them.
- Backend functions `getAllUploads`, `deleteUpload`, and `getStats` are public — any caller (not just admin) can invoke them directly via the canister interface.
- No login attempt rate limiting; no session expiry.
- `uploadMemory` is correctly open to all users (intentional).

## Requested Changes (Diff)

### Add
- Backend `getAllUploads`, `deleteUpload`, `getStats` — enforce admin-only via `AccessControl.isAdmin` check; trap with "Unauthorized" if caller is not admin.
- Backend `adminLogin(password: Text) : async Bool` — a dedicated login function that the frontend calls. The backend hashes the incoming password with SHA256 and compares it to the stored hash. Returns `true` only on match. This means the plaintext password never needs to live in frontend source code.
- Frontend login rate limiting: max 5 failed attempts, then a 30-second lockout with countdown timer.
- Frontend session timeout: admin session auto-expires after 30 minutes of inactivity; timer resets on any interaction.
- Frontend: remove the two hardcoded credential constants entirely; replace with backend-verified login.
- Frontend: show a clear "Session expired" message when the timeout fires.

### Modify
- `AdminPage.tsx`: replace client-side credential comparison with `actor.adminLogin(password)` call; wire rate limiting and session timeout logic.
- `main.mo`: add admin-only guards to `getAllUploads`, `deleteUpload`, `getStats`; add `adminLogin` function with password hash comparison.

### Remove
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` plaintext constants from `AdminPage.tsx`.

## Implementation Plan
1. Regenerate backend (`generate_motoko_code`) with:
   - `adminLogin(password: Text) : async Bool` using SHA256 hash comparison
   - Admin-only guards on `getAllUploads`, `deleteUpload`, `getStats`
2. Delegate frontend update to frontend subagent:
   - Remove hardcoded credential constants
   - Call `actor.adminLogin(password)` on login form submit
   - Add 5-attempt rate limiter with 30s lockout and countdown
   - Add 30-minute inactivity session timeout with reset on interaction
   - Show session-expired toast/message
3. Validate and deploy
