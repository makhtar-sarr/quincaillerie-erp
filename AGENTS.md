# AGENTS.md — Quincaillerie ERP

Système de gestion (React 19 + Vite) pour quincailleries sénégalaises : stocks, devis, factures (FCFA), clients/fournisseurs. Déployé via **Google AI Studio** (l'app est un "AI Studio applet"), pas un déploiement Vite classique.

## Commands

- `npm install` — install dependencies (Node.js required)
- `npm run dev` — dev server on port 3000 (`vite --port=3000 --host=0.0.0.0`)
- `npm run build` — `vite build` (bundle only; this is the artifact AI Studio serves)
- `npm run lint` — **there is no real linter**; this script is just `tsc --noEmit` (type-check only)
- `npm run clean` — removes `dist/` and `server.js`
- No test suite exists. Do not add test commands expecting one.

## Architecture

- **Entrypoint**: `index.html` → `src/main.tsx` → `src/App.tsx` (single root component holding all state).
- **State lives in `App.tsx`** — every entity (items, movements, customers, suppliers, quotes, invoices, settings) is a `useState` there, passed down to views in `src/components/*`. There is no store/context/redux.
- **Persistence is localStorage, not the database.** Each `syncAndSet*` callback writes to both React state and `localStorage` (keys `erp_items`, `erp_customers`, etc.). Firebase is **backup-only** (see below).
- **Path alias**: `@/*` → repo root (set in both `vite.config.ts` and `tsconfig.json`). Import shared code via `@/types`, `@/utils/data`, `@/lib/firebase`.
- **Types**: `src/types.ts` is the single source of truth for domain models (Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings). Edit here first when changing shapes.
- **Seed/reference data**: `src/utils/data.ts` (DEFAULT_SETTINGS, INITIAL_ITEMS, etc.) — used to bootstrap localStorage on first load.

## Firebase (cloud backup only)

- Configured in `src/lib/firebase.ts` + `firebase-applet-config.json`. Uses a **custom Firestore database ID** `ai-studio-quincaillerieerp-...` (passed to `getFirestore(app, id)` — do not drop the second arg).
- Only the `backups` collection is used: `saveBackupToCloud`, `getBackupsFromCloud`, `deleteBackupFromCloud`.
- `firestore.rules` makes backups **immutable**: `create`/`delete`/`list`/`get` allowed but `update: if false`. A backup must contain exactly 7 keys under `data` (settings, items, movements, customers, suppliers, quotes, invoices) or writes are rejected.
- Firebase init is wrapped in try/catch and exposes `isFirebaseAvailable`; callers must handle the offline/unavailable case.

## Environment & AI Studio quirks

- `GEMINI_API_KEY` is **required** for Gemini calls but injected at runtime by AI Studio from user secrets — never commit it. `.env*` is gitignored except `.env.example`.
- `vite.config.ts` HMR behavior is gated by `DISABLE_HMR`: when `true`, HMR and file watching are disabled to avoid flicker during agent edits. **Do not modify this logic** — it is intentional for the AI Studio runtime.
- `metadata.json` declares capability `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`; `@google/genai` is the SDK for server-side Gemini.

## Domain conventions (easy to break)

- **Currency is FCFA**, integers (no decimals). Money math uses raw numbers, not floating-point formats.
- **French UI**; IDs/numbers follow fixed formats: invoices `FAC-2026-XXX`, quotes `DEV-2026-XXX`, items `prod-<timestamp>`, movements `mov-<timestamp>`. Changing these breaks restore/reference matching.
- **Invoice creation has side effects**: `handleAddInvoice` decrements item stock, logs SORTIE movements, and updates customer `outstandingBalance`. `handleDeleteInvoice` reverses all of this. Keep these in sync if you touch invoicing.
- Quote → Invoice conversion reuses quote totals via `handleConvertQuoteToInvoice`.
- Stock movements use `type: 'ENTREE' | 'SORTIE'` and a fixed `reason` enum (see `StockMovement` in `src/types.ts`).
