# Kaushal Farewell

## Current State

A privacy-focused photo/video upload app for Kaushal's farewell event. Users upload files with their name; only the admin can view/download/delete via a secured admin panel. The backend uses session token auth (survives canister restarts), brute-force protection, blob storage for files, and stores upload metadata (uploaderName, fileName, timestamp, blobId). The frontend has:
- HomePage: luxury/cinema warm-toned upload form with drag-drop, multi-file, progress tracking
- AdminPage: login form + uploads table with search, multi-select, delete selected, delete all, inline thumbnails, lightbox, download, auto-refresh every 2 seconds
- Footer: "Created by Dhruv Dhameliya" on all pages

## Requested Changes (Diff)

### Add
- File type filter in admin panel (All / Images only / Videos only) alongside the search bar
- Google Drive-style theme for the admin panel (clean white/light gray, blue accents, Material-style sidebar/header, card-based layout)
- Ensure upload button waits for actor to be ready before enabling (fix "Actor not available" error)

### Modify
- AdminPage: Replace current warm-brown coral theme with Google Drive-inspired clean, light theme (white background, #1a73e8 Google blue accents, gray sidebar/header, clean typography)
- AdminPage: Add file type filter chips/tabs (All, Images, Videos) next to search bar
- AdminPage: Remove 2-second auto-refresh or make it less aggressive (reduce to 10 seconds or manual only) — the auto-refresh is causing UI instability
- HomePage: Ensure upload button shows "Connecting..." and is disabled until actor is ready, then enables instantly

### Remove
- QR code section (already removed in previous version)
- Auto-refresh every 2 seconds (change to 15 seconds or remove entirely)

## Implementation Plan

1. Backend: No changes needed — existing backend API is complete
2. Frontend - HomePage:
   - Ensure actor readiness check before enabling upload button
3. Frontend - AdminPage:
   - Apply Google Drive-style visual theme (light background, blue accents, clean sans-serif)
   - Add file type filter state (all/images/videos) and filter chips UI
   - Apply filter to uploads list alongside search
   - Change auto-refresh interval from 2s to 15s (reduce flickering)
4. Footer: Keep "Created by Dhruv Dhameliya" on both pages
