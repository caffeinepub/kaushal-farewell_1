# Kaushal Farewell

## Current State
Admin panel displays all uploaded memories in a table with checkboxes, inline previews, lightbox, download, individual delete, multi-select delete, and delete-all. No search or filter capability exists.

## Requested Changes (Diff)

### Add
- `searchQuery` state variable in AdminPage
- `filteredUploads` derived value that filters uploads by file name or uploader name (case-insensitive)
- Search bar UI below the table header controls bar, with a clear (X) button when query is active
- "No results found" empty state when search returns nothing
- Badge count updates to show `filtered / total` when a search query is active

### Modify
- Table now renders `filteredUploads` instead of `uploads` directly
- Lucide imports extended with `Search` and `XCircle`

### Remove
- Nothing removed

## Implementation Plan
1. Add `Search`, `XCircle` to lucide-react imports
2. Add `searchQuery` state
3. Derive `filteredUploads` from `uploads` filtered by `searchQuery`
4. Insert search bar below the header controls row
5. Replace `uploads.map` with `filteredUploads.map` in table render
6. Add "no results" empty state
7. Update badge to show filtered/total when searching
