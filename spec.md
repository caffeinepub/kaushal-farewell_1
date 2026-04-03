# Kaushal Farewell

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Public upload form: name field + multi-file selector (images and videos)
- File upload to blob storage backend
- Upload log tracking: uploader name, file name, timestamp
- Loading spinner during upload and success message on completion
- Admin-only view to browse uploaded files and the upload log
- Authorization (admin role) to protect the admin panel
- Fast, error-free, beautiful UI

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Select `authorization` and `blob-storage` components
2. Generate Motoko backend with:
   - Public upload endpoint (no auth required): accepts name, file blob, file name, mime type
   - Stores file in blob storage
   - Logs upload entry (name, filename, timestamp) in stable storage
   - Admin-only endpoint to list all upload log entries
   - Admin-only endpoint to retrieve file URLs
3. Build frontend:
   - Public page: clean upload form with name field, multi-file drag-and-drop, per-file progress bars, success/error feedback
   - Admin page (login required): table of uploads with file links and uploader info
   - Fast chunked upload to handle large video files
   - Warm, elegant visual design
