# Kaushal Farewell

## Current State
Admin panel shows a table listing all uploads (uploader name, file name, timestamp) with a "View" button that opens the file in a new browser tab. No inline preview and no download capability.

## Requested Changes (Diff)

### Add
- Inline image/video preview for each upload row (thumbnail for images, video player for videos)
- Download button per row that triggers a browser file download with the original filename
- A media preview modal/lightbox when clicking an image or video thumbnail for a larger view

### Modify
- Replace or extend the current "View" button in the uploads table with both a "Preview" (thumbnail inline) and a "Download" button
- Download should use fetch + blob URL + anchor click trick with the original `fileName` as the download filename

### Remove
- Nothing removed, only enhanced

## Implementation Plan
1. In `AdminPage.tsx`, for each upload row:
   - Detect file type (image vs video) by extension
   - For images: render an `<img>` thumbnail using `ExternalBlob.fromURL(entry.blobId).getDirectURL()`
   - For videos: render a `<video>` element with controls and a poster or just inline controls
   - Add a "Download" button that fetches the blob URL, creates an object URL, triggers anchor download with `entry.fileName` as the filename, then revokes the object URL
2. Add a lightbox/modal (using existing Dialog component) for clicking the thumbnail to view full size
3. Keep the existing "View" button or replace with a cleaner icon-based action row (View, Download)
