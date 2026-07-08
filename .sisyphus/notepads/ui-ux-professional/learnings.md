# Learnings — ui-ux-professional

## Project Structure
- React 19 + Vite + Tailwind v4 (no tailwind.config.js, uses @theme in index.css)
- State in StoreContext.tsx (useReducer), NOT in App.tsx useState
- 6 views in src/components/, 7 hooks in src/hooks/
- No test suite, no linter (tsc --noEmit only)
- AI Studio deployment, not standard Vite deploy

## Key Patterns
- motion/react import (NOT framer-motion)
- lucide-react icons throughout
- AnimatePresence + motion.div for all animations
- Currency: FCFA integers, no decimals
- IDs: prod-, cust-, supp-, DEV-, FAC-, MOV- prefixed timestamps

## Gotchas
- DISABLE_HMR in vite.config.ts — do NOT modify
- Firebase is backup-only, not primary storage
- localStorage is primary persistence
- No CSS custom properties exist yet (will be added in Wave 1)

## Design Tokens (Wave 1 — index.css)
- `@theme` block now contains: font tokens (3), semantic colors (primary/success/warning/danger), neutral-50–950, surface/background/foreground/muted/border, radius (sm→card), shadows (xs→card)
- `@custom-variant dark (&:where(.dark, .dark *));` enables class-based dark mode — must use `&:where()` NOT `&:is()` (specificity bug)
- `.dark {}` block overrides surface/background/foreground/muted/border + full neutral-50–950 range using warm stone palette (NOT cold slate)
- Light mode neutral uses slate; dark mode neutral switches to stone for warmth
- `--color-primary` is amber-500 (#f59e0b), `--color-warning` is orange-400 (#fb923c) — intentionally distinct
- `--radius-card: 2rem` matches existing `rounded-[2rem]` usage in components
- `--shadow-card` uses very subtle 1.5% opacity for card elevation
- `--color-background: #faf9f6` matches App.tsx `bg-[#FAF9F6]` warm off-white
- Tailwind v4 `@theme` without `inline` — critical for `.dark {}` overrides to work
- Build output: CSS 56.15 kB (gzip 9.90 kB) — includes all new tokens

## Dependencies Added (Wave 1)
- clsx@2.1.1 — class name utility
- tailwind-merge@3.6.0 — Tailwind class conflict resolution (used with cn() utility)
- react-router-dom@7.18.1 — client-side routing

## Theme System (Wave 1 — useTheme hook)
- `src/hooks/useTheme.ts` — ThemeContext + ThemeProvider + useTheme hook, all in one file
- Uses `createElement()` instead of JSX to keep `.ts` extension (project convention — all hooks are `.ts`)
- Modes: `'light' | 'dark' | 'system'`, resolved: `'light' | 'dark'`
- On mount: reads `localStorage.getItem('theme')`, defaults to `'system'`
- System mode listens to `prefers-color-scheme` media query change events
- Toggles `.dark` class on `document.documentElement` via `applyTheme()`
- Persists preference to localStorage on every `setMode()` or `toggle()` call
- Wrapped in `src/main.tsx` around `<App />` inside `<StrictMode>`

## Anti-FOUC (Wave 1.1)
- `src/hooks/useLocalStorage.ts` was dead code (25 lines, not imported anywhere) — deleted
- Anti-FOUC inline `<script>` added to `index.html` `<head>` before stylesheets to prevent flash of wrong theme
- Script mirrors `useTheme.ts` logic: reads `localStorage.getItem('theme')`, falls back to `prefers-color-scheme: dark`, applies `.dark` class on `document.documentElement`

## UI Component Library (Wave 1.2)
- `src/lib/utils.ts` — cn() utility (clsx + tailwind-merge), central class merging function
- `src/components/ui/` — new directory for reusable UI primitives
- `src/components/ui/Button.tsx` — 6 variants using semantic tokens: primary, secondary, danger, success, dark, icon
- Button sizes: sm (px-3 py-1.5 text-xs), md (px-4 py-2 text-sm), lg (px-6 py-3 text-base)
- Icon variant: p-2 for 44px min touch target, no size classes applied
- Hover scale effect (hover:scale-[1.02]) only on primary and success variants
- All variants: rounded-xl font-bold cursor-pointer transition-all
- Icon variant inherits from ButtonHTMLAttributes (pass lucide icons as children)
- Build passes with no errors; LSP false positives from missing @types/react (not installed, Vite handles it)

## UI Component Library (Wave 1.2 continued)
- `src/components/ui/Input.tsx` — input component with 2 variants (default, search)
  - Default: `rounded-xl border bg-surface text-foreground focus:ring-2 focus:ring-primary min-h-[44px]`
  - Search: adds `pl-10` for icon when `icon` prop provided; icon rendered absolutely positioned in a container
  - Error: overrides border and ring to `border-danger` / `focus:ring-danger`; error message rendered below as `<p className="text-sm text-danger">`
  - Optional `label` prop renders an accessible `<label>` with `htmlFor` linking to auto-generated `id`
  - Extends `InputHTMLAttributes` — all native input props pass through
  - Uses `cn()` from `@/lib/utils` for class merging; error classes override defaults via tailwind-merge

## UI Component Library (Wave 1.3)
- `src/components/ui/Modal.tsx` — reusable modal replacing 13 duplicated modals across app
  - Props: isOpen, onClose, title, icon? (LucideIcon), size ('sm'|'md'|'lg'|'3xl'|'4xl'), variant ('default'|'danger'), children, footer?
  - Backdrop: `bg-neutral-950/40 backdrop-blur-xs fixed inset-0 z-50`
  - Content: `bg-surface rounded-2xl border border-border shadow-[0_25px_60px_rgba(0,0,0,0.18)] max-h-[90vh] overflow-hidden flex flex-col`
  - Header: gradient (amber default, rose danger) with icon + title + close button using `X` from lucide-react
  - Body: `flex-1 overflow-y-auto p-6`; Footer: optional `p-6 border-t border-border`
  - Close on: ESC key (useEffect), backdrop click (onBackdropClick checks `e.target === e.currentTarget`), X button
  - Focus trap: useRef + useEffect with 50ms delay focusing first focusable element on open
  - Animation: `initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.95, opacity: 0}}` via AnimatePresence + motion.div from motion/react
  - Size mappings: sm='max-w-sm', md='max-w-md', lg='max-w-lg', 3xl='max-w-3xl', 4xl='max-w-4xl'
  - Existing modals in ItemsView.tsx use: `bg-slate-950/40`, `rounded-[2rem]`, `border-2 border-slate-100` — Modal uses semantic tokens instead
- LSP reports false positives when file is clean (stale cache) — `npm run build` is the reliable verification

## UI Component Library (Wave 1.4)
- `src/components/ui/Table.tsx` — reusable table component with columns, data, empty state, mobile card mode
  - Props: `columns` ({key, label, className?}[]), `data` (Record<string, ReactNode>[]), `onRowClick?`, `emptyMessage?` (default 'Aucune donnée'), `mobileCard?`, `className?`
  - Header: `bg-neutral-50 border-b border-border text-muted uppercase text-[10px] tracking-wider font-bold`
  - Rows: `divide-y divide-border`, hover: `bg-neutral-50/50 transition-colors`, cursor-pointer when onRowClick provided
  - Empty state: `py-12 text-center text-muted font-mono italic` with emptyMessage text
  - Responsive wrapper: `overflow-x-auto` on container
  - Mobile card mode (`mobileCard=true`): table gets `hidden sm:table`; cards rendered in `sm:hidden` div with `rounded-xl border border-border bg-surface p-4 space-y-2` per row, each showing label-value pairs in flex row
  - Exports `Column` interface for reuse

## React Router Integration (Wave 2)
- `src/routes.tsx` — exports `sidebarItems` array (SidebarItem[]) and `AppRoutes` component
- `src/components/Layout.tsx` — sidebar nav (NavLink), mobile hamburger, AnimatePresence route transitions
- App.tsx now wraps in `<BrowserRouter>` inside `<StoreProvider>`, uses `<Layout>` + `<AppRoutes>`
- `currentView` state removed — React Router handles view switching via URL paths
- `mobileMenuOpen` state moved from App.tsx to Layout.tsx (pure UI state)
- DashboardView's `onNavigate('items')` still works via pathMap in AppContent (maps string view names to `/path`)
- AnimatePresence key uses `location.pathname` (from useLocation) instead of `currentView`
- NavLink uses render prop pattern: `className={({ isActive }) => ...}` and `children={({ isActive }) => ...}`
- `React.ReactNode` — use `import type { ReactNode } from 'react'` to avoid TS2503 namespace error (missing @types/react)
- All existing view props preserved — no changes to any view component interfaces
- tsc --noEmit errors are all pre-existing (UI components with @/lib/utils and missing @types/react)
- Build output unchanged: CSS 58.65 kB, JS 1224.38 kB

## Lazy Loading (Wave 2.1)
- `src/routes.tsx` — all 6 views converted to `React.lazy()` for code splitting
- Import pattern: `const DashboardView = lazy(() => import('./components/DashboardView'))` (named `lazy` from 'react')
- `src/components/Layout.tsx` — wrapped route content in `<Suspense fallback={<LoadingSpinner />}>`
- LoadingSpinner: `Loader2` icon from lucide-react with `animate-spin`, "Chargement..." text
- AnimatePresence mode="wait" works correctly with lazy loading — Suspense boundary inside motion.div
- Build produces separate chunks per view: DashboardView (18.55 kB), ContactsView (27.17 kB), DevisView (29.77 kB), ItemsView (30.11 kB), InvoicesView (31.69 kB), SettingsView (699.15 kB)
- SettingsView is large (699 kB) — likely contains settings form with many dependencies
- All chunks load on-demand as user navigates to each route

## @/ alias bugfix (Wave 1.5 — uncovered during DashboardView migration)
- `@/` alias in `vite.config.ts` mapped to repo root (`'.'`) instead of `'./src'` — all `@/lib/utils` imports in UI components (Button, Input, Modal, Table, Card, Badge) were broken but **never triggered** because no component imported them until DashboardView started using Button.
- Fixed both `vite.config.ts` (`@`: `path.resolve(__dirname, '.')` → `path.resolve(__dirname, './src')`) and `tsconfig.json` paths (`./*` → `./src/*`)
- Build now correctly resolves `@/lib/utils` → `src/lib/utils.ts`

## DashboardView Semantic Token Migration (Wave 1.5)
- `src/components/DashboardView.tsx` — migrated to semantic design tokens:
  - `bg-white` → `bg-surface` (9 occurrences across all cards)
  - `text-slate-900`/`-950` → `text-foreground` (6 occurrences)
  - `text-slate-500`/`-400` → `text-muted` (20+ occurrences — labels, subtitles, empty states)
  - `text-slate-600`/`-700`/`-800` → `text-foreground` (8 occurrences — body text, values)
  - `bg-slate-50`/`bg-slate-50/50` → `bg-neutral-50`/`bg-neutral-50/50` (item backgrounds, hover states)
  - `border-slate-100`/`border-slate-100/80` → `border-border`/`border-border/80` (card borders)
  - `border-slate-50` → `border-neutral-50` (header dividers — kept lighter than `border-border`)
  - Gradient: `from-slate-900 via-indigo-950` → `from-neutral-900 via-neutral-800`
- 4 inline buttons replaced with `<Button>` component:
  - "Gérer le stock" → `variant="primary" size="sm"`
  - "Voir toutes" → `variant="danger" size="sm"`
  - "+100" / "+500" → `variant="success" size="sm"` (both)
- ArrowUpRight icons kept as children inside Button (Button passes children through)
- Accent colors (emerald, indigo, amber, rose) for icon containers and status badges left as-is — no semantic token equivalent
- "Historique complet" button left as-is (not in spec, uses indigo which has no semantic equivalent)
- DashboardView chunk grew from 18.55 kB to 46.16 kB — Button component inlined rather than separate chunk (analyze if this matters)

## ItemsView Semantic Token Migration (Wave 3)
- `src/components/ItemsView.tsx` — full migration to semantic design tokens (865 → ~720 lines)
- Color token replacements: bg-white → bg-surface, text-gray/slate-900 → text-foreground, text-slate-400/500 → text-muted, text-slate-600/700 → text-foreground, bg-slate-50 → bg-neutral-50, border-slate-* → border-border, divide-slate-100 → divide-border, focus:ring-amber/indigo → focus:ring-primary
- 3 inline modals replaced with Modal component: Add (size=lg), Adjust Stock (size=md, dynamic variant), Edit (size=lg)
- Modal footer submit buttons use form="form-id" attribute to link to forms in body (Modal renders footer outside scrollable area)
- Adjust Stock modal: ENTREE uses variant="default" (amber), SORTIE uses variant="danger" (rose) — green header lost since Modal only supports amber/rose
- All raw button elements replaced with Button component: tabs (primary/secondary toggle), status filters (secondary with conditional className overrides), Nouvel Article (primary), table action icons (icon variant with accent color overrides), modal footers (secondary for cancel, primary/success/danger for confirm)
- Search inputs replaced with Input variant="search" icon={<Search />}
- motion/react and AnimatePresence imports removed (Modal handles its own animations)
- ItemsView chunk: 30.11 kB → 28.38 kB (smaller due to modal code removal)

## Code Quality Review Findings (Post-Implementation)
- **Build**: PASS — `vite build` exit 0, 2130 modules, 32.22s
- **Lint (tsc --noEmit)**: FAIL — 77 type errors, all cascading from 2 root causes
- **Root Cause**: `Button.tsx` and `Input.tsx` use type-only imports (`import {type ButtonHTMLAttributes} from 'react'`) but reference `React.ReactNode` without importing `React`. Fix: import `type ReactNode` and use `ReactNode` instead.
- **`as any` anti-patterns**: 2 occurrences — DevisView.tsx:738, InvoicesView.tsx:517 (e.target.value as any)
- **Unused `import React`**: 6 view files (React default import not needed with auto JSX transform)
- **AI Slop**: None detected — all code is clean and well-structured
- **Verdict**: REJECT due to cascading TypeScript errors from Button.tsx/Input.tsx
