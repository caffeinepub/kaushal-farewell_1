# Kaushal Farewell

## Current State
Admin panel uses Internet Identity for auth. Backend getAllUploads/getStats require admin principal.

## Requested Changes (Diff)

### Add
- Email/password login form on admin page

### Modify
- Replace Internet Identity with email/password in AdminPage
- Backend: remove admin checks from getAllUploads and getStats
- useQueries: work without authenticated actor

### Remove
- Internet Identity from admin panel

## Implementation Plan
1. Modify backend main.mo: remove admin checks from getAllUploads and getStats
2. Modify AdminPage.tsx: email/password form with local state
3. Modify useQueries.ts: queries work without auth
