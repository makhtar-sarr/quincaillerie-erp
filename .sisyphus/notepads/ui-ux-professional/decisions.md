# Decisions — ui-ux-professional

## Routing
- React Router chosen over lighter extraction approach
- Modals stay state-based (NOT URL-routed) — only 6 views get routes
- AnimatePrespreserved with location.pathname as key

## Palette
- Amber = primary/CTA (keeping as primary action color)
- Orange = warning (separate from primary)
- Emerald = success, Rose = danger, Slate = neutral
- Dark mode: warm neutral/stone tones (NOT cold slate)

## Dark Mode
- System preference + manual toggle (respects prefers-color-scheme)
- Anti-FOUC script in index.html head
- CSS transition for smooth switching (0.2s)

## Components
- 6 UI components only (Button, Modal, Input, Table, Badge, Card)
- clsx + tailwind-merge for className utility
- No additional component libraries (no radix, no headless-ui)
