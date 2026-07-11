# AGENTS.md — Quincaillerie ERP

Système de gestion (React 19 + Vite) pour quincailleries sénégalaises : stocks, devis, factures (FCFA), clients/fournisseurs. Déployé via **Google AI Studio** (l'app est un "AI Studio applet"), pas un déploiement Vite classique.

## Commands

- `npm install` — install dependencies (Node.js required)
- `npm run dev` — dev server on port 3000 (`vite --port=3000 --host=0.0.0.0`)
- `npm run build` — `vite build` (bundle only; this is the artifact AI Studio serves)
- `npm run preview` — `vite preview` (preview production build locally)
- `npm run lint` — **there is no real linter**; this script is just `tsc --noEmit` (type-check only)
- `npm run clean` — removes `dist/` and `server.js` (generated AI Studio artifact)
- `npm run test` — vitest (89 tests: utilities + business logic with better-sqlite3 mirror)

## Architecture

- **Entrypoint**: `index.html` → `src/main.tsx` → `src/App.tsx` (single root component holding all state).
- **State lives in `App.tsx`** — every entity (items, movements, customers, suppliers, quotes, invoices, settings) is a `useState` there, passed down to views in `src/components/*`. There is no store/context/redux.
- **Persistence is localStorage, not the database.** Each `syncAndSet*` callback writes to both React state and `localStorage` (keys `erp_items`, `erp_customers`, etc.). Firebase is **backup-only** (see below).
- **Path alias**: `@/*` → repo root (set in both `vite.config.ts` and `tsconfig.json`). Import shared code via `@/types`, `@/utils/data`, `@/lib/firebase`.
- **Types**: `src/types.ts` is the single source of truth for domain models (Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings). Edit here first when changing shapes.
- **Seed/reference data**: `src/utils/data.ts` (DEFAULT_SETTINGS, INITIAL_ITEMS, etc.) — used to bootstrap localStorage on first load.
- **Views** (6 components in `src/components/`): `DashboardView`, `ItemsView` (catalogue + stock), `DevisView` (quotes), `InvoicesView` (sales), `ContactsView` (clients + fournisseurs), `SettingsView`.

## Routing (React Router v7)

- **Router**: BrowserRouter in `src/App.tsx` wrapping Layout + Routes
- **Routes**: Lazy-loaded via React.lazy() in `src/routes.tsx` (6 routes + redirect `/` → `/dashboard`)
- **Navigation**: Sidebar with NavLink (desktop), hamburger menu with backdrop (mobile)
- **Layout**: `src/components/Layout.tsx` — sticky sidebar (desktop), mobile top navbar + slide-in menu

## UI Components (6 reusable components)

All in `src/components/ui/`:

- **Button**: 6 variants (primary, secondary, danger, success, dark, icon) × 3 sizes (sm, md, lg). Uses `inline-flex items-center gap-1.5` for icon alignment.
- **Input**: Default + search variants, error state, min 44px height. Dark mode: `dark:bg-neutral-100 dark:text-neutral-800`.
- **Modal**: AnimatePresence + motion.div, 5 sizes (sm, md, lg, xl, full), ESC/backdrop/close, focus trap, danger variant.
- **Card**: With optional `borderAccent` prop for highlighted cards.
- **Badge**: 5 variants (primary, success, warning, danger, neutral).
- **Table**: Desktop table + mobile card mode via `mobileCard` prop, empty state, row click handler.

## Design System & Dark Mode

- **Design tokens**: Defined in `src/index.css` using `@theme` directive (primary, success, warning, danger, neutral, surface, background, foreground, muted, border, radius, shadow)
- **Dark mode**: Class-based `.dark` on `<html>`, warm stone palette (NOT cold slate)
- **Theme hook**: `src/hooks/useTheme.ts` — ThemeContext + ThemeProvider + useTheme hook (mode, resolved, setMode, toggle)
- **Toggle**: SettingsView has Clair/Sombre/Système buttons
- **Palette inversion**: neutral-50→dark, neutral-800→near-white. Use `dark:bg-neutral-100` for backgrounds, NOT `dark:bg-neutral-800`.
- **CSS transition**: Smooth dark mode switching via `* { transition: background-color 0.2s, color 0.2s, border-color 0.2s }`

## Frontend stack specifics

- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin in `vite.config.ts`. There is **no `tailwind.config.*` or `postcss.config.*`** file. Theme is extended in `src/index.css` using `@theme` directive. Do not expect PostCSS-based Tailwind.
- **Custom fonts**: Inter (sans), Outfit (display), JetBrains Mono (mono) loaded via `@import` in `src/index.css` with `@theme` tokens `--font-sans`, `--font-display`, `--font-mono`.
- **Animation**: `motion` v12, imported as `motion/react` (the post-framer-motion package). Do not import from `framer-motion`.
- **Icons**: `lucide-react` throughout.
- **Class utilities**: `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional classes.

## Server-side dependencies (AI Studio runtime, not in `src/`)

- `package.json` includes `express`, `@google/genai`, `dotenv` — **these are never imported in `src/` code**. They are used by AI Studio's generated `server.js` for the server-side Gemini API capability declared in `metadata.json`.
- `npm run clean` removes the generated `server.js`. It is not committed.
- `GEMINI_API_KEY` is **required** for Gemini calls but injected at runtime by AI Studio from user secrets — never commit it. `.env*` is gitignored except `.env.example`.

## Firebase (cloud backup only)

- Configured in `src/lib/firebase.ts` + `firebase-applet-config.json`. Uses a **custom Firestore database ID** `ai-studio-quincaillerieerp-...` (passed to `getFirestore(app, id)` — do not drop the second arg).
- Only the `backups` collection is used: `saveBackupToCloud`, `getBackupsFromCloud`, `deleteBackupFromCloud`.
- `firestore.rules` makes backups **immutable**: `create`/`delete`/`list`/`get` allowed but `update: if false`. A backup must contain exactly 7 keys under `data` (settings, items, movements, customers, suppliers, quotes, invoices) or writes are rejected.
- Firebase init is wrapped in try/catch and exposes `isFirebaseAvailable`; callers must handle the offline/unavailable case.
- `firebase-blueprint.json` declares the Firestore schema for AI Studio's integration layer.

## Testing

- **vitest** runs via `npm run test` (`vitest run`). 89 tests across 11 files: utilities + business logic.
- **`better-sqlite3` is a devDependency only** — never imported in `src/` runtime code. Tests that need a node environment declare `// @vitest-environment node` at the top of the file.
- Test files use explicit imports (`import { it, expect } from 'vitest'`), not globals.
- Business logic is mirrored against a better-sqlite3 in-memory DB in `src/lib/__tests__/business.*` to validate invoicing/stock side effects.

## Features added (phases 3-6)

- **Zod + React Hook Form validation** on all 5 forms (Items, Quotes, Invoices, Contacts, Settings). Schemas in `@/lib/validation` (or co-located), wired via `@hookform/resolvers/zod`.
- **Advanced search** via the `useAdvancedSearch` hook (filtering across items, invoices, customers, etc.).
- **Audit trail** — advisory only, stored in localStorage. It is NOT tamper-proof; do not treat it as a security log.
- **Financial charts** via `recharts` (cashflow, margin, donut) on the dashboard.
- **Customer reminders** — flags invoices >30 days overdue.

### Intentionally excluded (this phase)

- **Barcode scanner** — not implemented.
- **Multi-currency** — FCFA only, by design. Do not add currency conversion.

## Environment & AI Studio quirks

- `vite.config.ts` HMR behavior is gated by `DISABLE_HMR`: when `true`, HMR and file watching are disabled to avoid flicker during agent edits. **Do not modify this logic** — it is intentional for the AI Studio runtime.
- No CI, no pre-commit hooks, no lint config beyond `tsconfig.json`.

## Domain conventions (easy to break)

- **Currency is FCFA**, integers (no decimals). Money math uses raw numbers, not floating-point formats.
- **French UI**; IDs/numbers follow fixed formats: invoices `FAC-2026-XXX`, quotes `DEV-2026-XXX`, receipts `REC-<timestamp>`, items `prod-<timestamp>`, customers `cust-<timestamp>`, suppliers `supp-<timestamp>`, movements `mov-<timestamp>`. Changing these breaks restore/reference matching.
- **Invoice creation has side effects**: `handleAddInvoice` decrements item stock, logs SORTIE movements, and updates customer `outstandingBalance`. `handleDeleteInvoice` reverses all of this. Keep these in sync if you touch invoicing.
- Quote → Invoice conversion reuses quote totals via `handleConvertQuoteToInvoice`.
- Stock movements use `type: 'ENTREE' | 'SORTIE'` and a fixed `reason` enum (see `StockMovement` in `src/types.ts`).
