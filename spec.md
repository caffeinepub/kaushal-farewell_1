# Kaushal Farewell

## Current State
Admin panel shows uploads with inline previews, lightbox, view and download buttons. No delete functionality exists.

## Requested Changes (Diff)

### Add
- deleteUpload backend function: removes an upload entry by blobId
- Delete button in each row of uploads table
- Confirmation dialog before deleting

### Modify
- main.mo: add deleteUpload(blobId: Text)
- AdminPage.tsx: add delete button with confirmation AlertDialog

### Remove
- Nothing

## Implementation Plan
1. Add deleteUpload to main.mo
2. Add delete button with AlertDialog in AdminPage
3. On confirm: call backend deleteUpload, then refetch
