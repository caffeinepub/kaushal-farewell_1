# Kaushal Farewell – Admin Panel Google Drive Theme + File Type Filter

## Current State
- Admin panel has a warm luxury/cinema aesthetic (brown/coral/warm tones, oklch color palette)
- Search bar filters uploads by file name or uploader name
- Table shows checkboxes, preview thumbnail, uploader, filename, timestamp, actions
- No file type filter (images only / videos only) exists yet
- Color scheme uses warm oklch browns, coral accents, warm gradients

## Requested Changes (Diff)

### Add
- File type filter buttons (All / Images / Videos) next to the search bar in the toolbar area
- Filter logic: 'All' shows everything, 'Images' shows only image files, 'Videos' shows only video files
- Filter combined with existing search query (both apply simultaneously)
- Badge count updates to reflect currently active filter
- Google Drive-style theme for the admin panel only (NOT the upload/home page):
  - Clean white/light grey background instead of warm gradient
  - Google Drive's blue accent color (#1a73e8) for primary actions and active states
  - Clean sans-serif, minimal, spacious layout like Drive
  - Header: white background with subtle bottom border
  - Sidebar-style stats area or Drive-like top toolbar
  - File rows with hover highlight in light blue/grey
  - Action buttons styled like Drive's icon buttons
  - Login card: clean white, Google-style form with blue button

### Modify
- filteredUploads logic: apply both searchQuery AND fileTypeFilter
- Stats badge count: reflect filtered count
- Overall admin page color scheme: switch from warm brown/coral to Google Drive blue/white/grey
- Search bar area: add filter pill buttons (All / Images / Videos) inline
- Table header colors: switch from warm brown to Drive's grey
- Header: switch from warm brown to white/grey Drive style
- Footer: keep "Created by Dhruv Dhameliya" but in Drive's lighter style

### Remove
- Warm gradient background from admin page
- Coral/brown oklch color variables from admin panel (keep them on upload page)

## Implementation Plan
1. Add `fileTypeFilter` state ('all' | 'images' | 'videos') to AdminPage
2. Update `filteredUploads` to apply both searchQuery and fileTypeFilter simultaneously
3. Add filter pill buttons (All / Images / Videos) in the search bar area with image/video icons
4. Retheme entire AdminPage to Google Drive style:
   - Background: #f8f9fa (Drive's light grey)
   - Header: white, border-bottom: 1px solid #e0e0e0
   - Card/table container: white, rounded, subtle shadow
   - Primary accent: #1a73e8 (Google blue)
   - Text: #202124 (Google dark)
   - Secondary text: #5f6368 (Google grey)
   - Table row hover: #f1f3f4
   - Selected row: #e8f0fe (Google blue tint)
   - Action buttons: Drive-style icon buttons with grey hover
   - Delete buttons: red #d93025
   - Login form: white card, Google-style inputs, blue sign-in button
   - Filter active pill: blue background, white text
   - Filter inactive pill: grey border, dark text
5. Keep all existing functionality intact (checkboxes, delete, download, lightbox, search, auto-refresh, session management)
6. Keep footer 'Created by Dhruv Dhameliya'
7. Do NOT change HomePage.tsx styling
