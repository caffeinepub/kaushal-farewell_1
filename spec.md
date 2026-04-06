# Kaushal Farewell

## Current State
The app has a homepage (`HomePage.tsx`) with a warm coral/peach luxury theme. It includes a hero section, upload form card, and info cards. The footer credits Dhruv Dhameliya. The color palette uses oklch tokens with a warm brown/coral scheme.

## Requested Changes (Diff)

### Add
- A QR code section on the HomePage that displays a scannable QR code pointing to the current website URL (dynamic, reads `window.location.href` or `window.location.origin`)
- The QR code must visually match the existing luxury/cinema theme: dark charcoal or warm brown background, gold/coral accent border, elegant card styling consistent with the other cards on the page
- A small label/caption below the QR code like "Scan to open this page" or "Share via QR Code"
- A download button (optional but nice) so users can save the QR code image

### Modify
- `package.json`: Add `qrcode.react` dependency (v3+) for QR code generation

### Remove
- Nothing removed

## Implementation Plan
1. Add `qrcode.react` to `src/frontend/package.json` dependencies
2. Create a `QRCodeSection` component inline in `HomePage.tsx` or as a separate component
3. Use `<QRCode>` from `qrcode.react` with custom colors matching the site theme (dark background #1a1a1a or oklch equivalent, coral/gold foreground color)
4. Wrap it in a styled card matching the existing white rounded-3xl card style
5. Place the QR section below the info cards section, above the footer
6. Include a download button that uses canvas ref to export the QR code as PNG
