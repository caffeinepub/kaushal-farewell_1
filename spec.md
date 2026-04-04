# Kaushal Farewell

## Current State
The app has:
- A homepage with a file upload form
- An admin page with email/password login
- Backend with `adminLogin(password)` that assigns `#admin` role to the caller principal
- Backend endpoints `getAllUploads`, `getStats`, `deleteUpload` that check `AccessControl.isAdmin`
- The `useActor` hook creates an actor via React Query; for anonymous users it returns a plain anonymous actor
- Admin page calls `actor.adminLogin(password)` to authenticate, then calls `getAllUploads()` and `getStats()`

## Requested Changes (Diff)

### Add
- Reliable admin authentication that persists within a session
- Images and videos remain visible and don't disappear after login

### Modify
- Fix admin login: the anonymous principal IS stored in AccessControl after `adminLogin`, but `getUserRole` traps when the role is missing. The flow should work but the actor might be recreated between calls due to React Query staleTime/refetch behavior, causing a new anonymous actor with same principal -- actually anonymous principal is always `2vxsx-fae` so this should be consistent.
- The real issue: `getUserRole` calls `Runtime.trap("User is not registered")` for principals not in the map. The anonymous principal after logging in should be in the map, but if the map is cleared or actor re-initialized it won't be.
- Remove the `_initializeAccessControlWithSecret` call from `useActor` for non-II users (it's only called for authenticated II users currently, so this is fine).
- Simplify admin auth: bypass AccessControl entirely for admin operations -- just store a simple `var isAdminLoggedIn` boolean keyed by a session token map, or better: check password directly in each protected function using a stored password hash.
- Simplest reliable fix: store `adminPassword` in backend state, `adminLogin` returns a session token (random-ish Text), protected endpoints accept and verify the session token. Frontend passes session token with each request.

### Remove
- Remove dependency on AccessControl for admin page operations (it was designed for II-authenticated users, not password-based anonymous access)

## Implementation Plan
1. Update `main.mo`: add `var adminSessionToken : ?Text` state; `adminLogin(password)` sets and returns a session token on success; `getAllUploads(token)`, `getStats(token)`, `deleteUpload(blobId, token)` verify the token instead of caller principal.
2. Update `backend.d.ts` to reflect new function signatures.
3. Update `AdminPage.tsx` to store the session token after login and pass it to all admin API calls.
