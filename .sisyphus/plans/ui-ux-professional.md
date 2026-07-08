# UI/UX Professionnelle — Design System, Routing, Responsive, Dark Mode

## TL;DR

> **Quick Summary**: Refonte UI/UX complète de l'ERP quincaillerie : design system sémantique, composants réutilisables, React Router, responsive mobile, et dark mode.
> 
> **Deliverables**:
> - Palette sémantique (primary, success, warning, danger, neutral) dans `@theme`
> - 6 composants UI dans `src/components/ui/` (Button, Modal, Input, Table, Badge, Card)
> - React Router avec lazy-loading et transitions animées
> - Tables responsive → cards sur mobile
> - Dark mode (système + toggle manuel)
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5/6 (parallel) → Final

---

## Context

### Original Request
Améliorations professionnelles de l'app ERP quincaillerie : design system cohérent, routing, responsive, dark mode.

### Interview Summary
**Key Discussions**:
- **Routing**: React Router choisi (partage d'URL, historique browser, lazy-loading)
- **Palette**: Séparer amber (primary/CTA) de warning (utiliser une teinte différente)
- **Dark mode**: Système auto + toggle manuel (respecte `prefers-color-scheme` + override)

**Research Findings**:
- 13 modals dupliqués (~1300 lignes de boilerplate identique)
- 50+ boutons bruts avec 6 variants distincts
- Zéro CSS variables, zéro composants partagés
- Amber ambigu : utilisé comme primary CTA ET warning
- ContactsView = seul avec cards responsive (pattern à reproduire)
- ~239 classes `bg-*` nécessitent des variants `dark:`

### Metis Review
**Identified Gaps** (addressed):
- `clsx` + `tailwind-merge` ajoutés comme prérequis Wave 1 (pas de className utility existant)
- Wave 2 doit utiliser des tokens sémantiques dès le départ (pas de raw Tailwind)
- React Router `<Routes>` doit être dans `<AnimatePresence>` avec `key={location.pathname}`
- Modals restent state-based (pas URL-routed) — seules les 6 vues sont des routes
- Anti-FOUC script nécessaire dans `index.html` pour dark mode
- Code mort `useLocalStorage.ts` à supprimer
- Vérifier les side effects facture (décrémentation stock) pendant migration routing
- Dark mode palette doit être warm-toned (pas cold slate-900)

---

## Work Objectives

### Core Objective
Transformer l'app ERP de 6 vues brutes sans design system en une application professionnelle avec composants réutilisables, routing URL, responsive mobile complet, et dark mode.

### Concrete Deliverables
- `src/index.css` : palette sémantique complète dans `@theme` + `@custom-variant dark`
- `src/components/ui/` : 6 composants (Button, Modal, Input, Table, Badge, Card)
- `src/hooks/useTheme.ts` : contexte thème (mode, resolved, setMode, toggle)
- `index.html` : anti-FOUC script
- `src/App.tsx` : React Router avec AnimatePresence
- Toutes les vues migrées vers composants UI + tokens sémantiques
- Tables responsive (cards sur mobile)
- Toggle dark mode dans SettingsView

### Definition of Done
- [ ] `npm run build` passe sans erreur
- [ ] Toutes les routes accessibles via URL directe
- [ ] Toggle dark mode fonctionne et persiste
- [ ] Tables affichent en cards sur écran < 768px
- [ ] Aucune classe `bg-white`, `text-slate-900` brute dans les vues (tokens sémantiques)
- [ ] Zéro raw `<button>` ou `<input>` dans les vues (composants UI)

### Must Have
- Palette sémantique dans `@theme` avec variants dark
- 6 composants UI réutilisables
- React Router avec transitions animées
- Responsive tables → cards
- Dark mode system + toggle
- `clsx` + `tailwind-merge` installés

### Must NOT Have (Guardrails)
- Toucher `StoreContext.tsx`, localStorage logic, Firebase, ou AI Studio integration
- Ajouter des dépendances au-delà de `react-router-dom`, `clsx`, `tailwind-merge`
- Créer plus de 6 composants UI (pas de Select, Tabs, Toast, Tooltip...)
- Rendre les modals URL-routed
- Ajouter tri/pagination aux tables
- Ajouter des gestes swipe
- Modifier `vite.config.ts` DISABLE_HMR
- Changer la logique métier (IDs, FCFA, side effects facture)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (no test suite)
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **UI Components**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **Routing**: Use Bash (curl) - Send requests, assert status + response
- **CSS/Tokens**: Use Bash (grep) - Verify pattern elimination
- **Build**: Use Bash (npm run build) - Verify compilation

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — sequential prerequisites):
├── Task 1: Install deps (clsx, tailwind-merge, react-router-dom) [quick]
├── Task 2: Design tokens + semantic palette in @theme [deep]
├── Task 3: ThemeContext + useTheme hook [quick]
├── Task 4: Anti-FOUC script + cleanup [quick]

Wave 2 (Core UI Components — MAX PARALLEL after Wave 1):
├── Task 5: Button component (6 variants) [deep]
├── Task 6: Input component (text/search/error) [quick]
├── Task 7: Modal component (13 replacements) [deep]
├── Task 8: Card + Badge components [quick]
├── Task 9: Table component [quick]

Wave 3 (Routing — after Wave 1):
├── Task 10: React Router setup + route definitions [deep]
├── Task 11: AnimatedRoutes wrapper + lazy loading [deep]

Wave 4 (View Migration — after Wave 2 + 3, per-view):
├── Task 12: Migrate DashboardView [quick]
├── Task 13: Migrate ItemsView [deep]
├── Task 14: Migrate DevisView [deep]
├── Task 15: Migrate InvoicesView [deep]
├── Task 16: Migrate ContactsView [deep]
├── Task 17: Migrate SettingsView [quick]

Wave 5 (Responsive + Dark Mode — after Wave 4, PARALLEL):
├── Task 18: Responsive tables → cards [deep]
├── Task 19: Dark mode all components [deep]
├── Task 20: Dark mode toggle in SettingsView [quick]
├── Task 21: Mobile menu overlay + touch targets [quick]

Wave FINAL (Verification — after ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real QA — responsive + dark mode (unspecified-high)
├── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 2,3,4,5-9,10-11 |
| 2 | 1 | 3,5-9,18-19 |
| 3 | 2 | 10-11,20 |
| 4 | 1 | — |
| 5-9 | 2 | 12-17 |
| 10-11 | 1,3 | 12-17 |
| 12-17 | 5-9,10-11 | 18-21 |
| 18-21 | 12-17 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1→`quick`, T2→`deep`, T3→`quick`, T4→`quick`
- **Wave 2**: 5 tasks — T5→`deep`, T6→`quick`, T7→`deep`, T8→`quick`, T9→`quick`
- **Wave 3**: 2 tasks — T10→`deep`, T11→`deep`
- **Wave 4**: 6 tasks — T12→`quick`, T13-T16→`deep`, T17→`quick`
- **Wave 5**: 4 tasks — T18→`deep`, T19→`deep`, T20→`quick`, T21→`quick`
- **FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. Install Dependencies (clsx, tailwind-merge, react-router-dom)

  **What to do**:
  - `npm install clsx tailwind-merge react-router-dom`
  - Verify all 3 packages appear in `package.json` and `node_modules/`
  - No other packages to install

  **Must NOT do**:
  - Do not add any other dependencies (no react-hook-form, no radix, no headless-ui)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (first task, blocks everything)
  - **Parallel Group**: Wave 1 (sequential)
  - **Blocks**: Tasks 2,3,4,5-9,10-11
  - **Blocked By**: None

  **References**:
  - `package.json` — current dependencies, verify additions

  **Acceptance Criteria**:
  - [ ] `node_modules/clsx`, `node_modules/tailwind-merge`, `node_modules/react-router-dom` exist
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Dependencies installed correctly
    Tool: Bash
    Steps:
      1. Run: npm ls clsx tailwind-merge react-router-dom
      2. Assert: all 3 packages listed, no "MISSING" or "ERR"
    Expected Result: 3 packages listed with version numbers
    Evidence: .sisyphus/evidence/task-1-deps-installed.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): add clsx, tailwind-merge, react-router-dom`
  - Files: `package.json`, `package-lock.json`

- [x] 2. Design Tokens + Semantic Palette in @theme

  **What to do**:
  - Edit `src/index.css` `@theme` block to add semantic color tokens:
    - `--color-primary`: amber-500 (#f59e0b) — CTA, nav active
    - `--color-primary-hover`: amber-600
    - `--color-primary-light`: amber-50
    - `--color-success`: emerald-500
    - `--color-success-hover`: emerald-600
    - `--color-success-light`: emerald-50
    - `--color-warning`: orange-400 (#fb923c) — separate from primary
    - `--color-warning-hover`: orange-500
    - `--color-warning-light`: orange-50
    - `--color-danger`: rose-500
    - `--color-danger-hover`: rose-600
    - `--color-danger-light`: rose-50
    - `--color-neutral-50` through `--color-neutral-950` → slate equivalents
    - `--color-surface`: white
    - `--color-background`: #FAF9F6 (warm off-white preserved)
    - `--color-foreground`: slate-900
    - `--color-muted`: slate-400
    - `--color-border`: slate-200
  - Add radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-card`
  - Add shadow tokens: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-card`
  - Add `@custom-variant dark (&:where(.dark, .dark *));` after `@import "tailwindcss"`
  - Add `.dark {}` block with dark mode overrides for all semantic tokens
  - Dark mode palette must be warm-toned (use stone/warm-gray, not cold slate)

  **Must NOT do**:
  - Do not use `@theme inline` (breaks dark mode overrides)
  - Do not use `&:is(.dark *)` (specificity bug) — use `&:where(.dark, .dark *)`
  - Do not touch font tokens (keep existing)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 1)
  - **Parallel Group**: Wave 1 (sequential)
  - **Blocks**: Tasks 3, 5-9, 18-19
  - **Blocked By**: Task 1

  **References**:
  - `src/index.css` — current @theme block (3 font tokens only, 24 lines total)
  - `src/App.tsx` — `bg-[#FAF9F6]` hardcoded background to map as `--color-background`
  - Current color usage: amber=primary, emerald=success, orange=new-warning, rose=danger, slate=neutral

  **Acceptance Criteria**:
  - [ ] `@theme` block contains all semantic color tokens listed above
  - [ ] `@custom-variant dark` directive present after `@import "tailwindcss"`
  - [ ] `.dark {}` block contains dark mode overrides
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Semantic tokens defined correctly
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "color-primary" src/index.css
      2. Assert: result >= 1
      3. Run: grep "@custom-variant dark" src/index.css
      4. Assert: match found
      5. Run: grep ".dark" src/index.css
      6. Assert: dark overrides block exists
    Expected Result: All tokens present, dark variant configured
    Evidence: .sisyphus/evidence/task-2-tokens-verified.txt

  Scenario: Build still passes
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
    Expected Result: Build succeeds with new tokens
    Evidence: .sisyphus/evidence/task-2-build-pass.txt
  ```

  **Commit**: YES (groups with Task 3,4)
  - Message: `feat(design-system): add semantic tokens, dark variant, clsx/tailwind-merge`
  - Files: `src/index.css`

- [x] 3. ThemeContext + useTheme Hook

  **What to do**:
  - Create `src/hooks/useTheme.ts`:
    - `ThemeContext` with `mode: 'light' | 'dark' | 'system'`, `resolved: 'light' | 'dark'`
    - `ThemeProvider` wraps App
    - `useTheme()` returns `{ mode, resolved, setMode, toggle }`
    - On mount: read `localStorage.getItem('theme')`, default to 'system'
    - Listen to `prefers-color-scheme` media query for system mode
    - Toggle: adds/removes `.dark` class on `document.documentElement`
    - Persist to `localStorage` on every change
  - Wrap `<App>` in `<ThemeProvider>` in `src/main.tsx`

  **Must NOT do**:
  - Do not create a separate ThemeContext file — keep in `src/hooks/useTheme.ts`
  - Do not add complex animation transitions for theme switching (just CSS transition)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (after Task 2)
  - **Parallel Group**: Wave 1 (sequential)
  - **Blocks**: Tasks 10-11, 20
  - **Blocked By**: Task 2

  **References**:
  - `src/main.tsx` — entry point where ThemeProvider wraps App
  - `src/index.css` — `.dark` class selector from Task 2

  **Acceptance Criteria**:
  - [ ] `useTheme()` hook importable and returns `{ mode, resolved, setMode, toggle }`
  - [ ] `localStorage.getItem('theme')` persists across reloads
  - [ ] `document.documentElement.classList.contains('dark')` toggles correctly
  - [ ] System preference detection works (matchMedia listener)

  **QA Scenarios**:
  ```
  Scenario: Theme toggle works
    Tool: Bash
    Steps:
      1. Run: grep -c "ThemeProvider" src/main.tsx
      2. Assert: result >= 1
      3. Run: grep -c "useTheme" src/hooks/useTheme.ts
      4. Assert: result >= 2 (export + internal usage)
    Expected Result: ThemeProvider wraps App, useTheme is defined
    Evidence: .sisyphus/evidence/task-3-theme-context.txt
  ```

  **Commit**: YES (groups with Task 2,4)
  - Message: `feat(design-system): add ThemeContext + useTheme hook`
  - Files: `src/hooks/useTheme.ts`, `src/main.tsx`

- [x] 4. Anti-FOUC Script + Dead Code Cleanup

  **What to do**:
  - Add anti-FOUC inline script in `index.html` `<head>` BEFORE any stylesheets:
    ```html
    <script>
      (function() {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>
    ```
  - Delete `src/hooks/useLocalStorage.ts` (dead code, not imported anywhere)
  - Verify no file imports `useLocalStorage`

  **Must NOT do**:
  - Do not modify `vite.config.ts`
  - Do not change the existing scrollbar CSS in `index.css`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2,3)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `index.html` — add script in `<head>` section
  - `src/hooks/useLocalStorage.ts` — dead code to delete (25 lines)
  - `src/hooks/useTheme.ts` — from Task 3, script mirrors its logic

  **Acceptance Criteria**:
  - [ ] Anti-FOUC script present in `index.html` `<head>`
  - [ ] `src/hooks/useLocalStorage.ts` deleted
  - [ ] No imports of `useLocalStorage` anywhere (`grep -r "useLocalStorage" src/` returns empty)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Anti-FOUC script present
    Tool: Bash (grep)
    Steps:
      1. Run: grep "localStorage.getItem('theme')" index.html
      2. Assert: match found
      3. Run: grep "useLocalStorage" src/ -r
      4. Assert: no matches
    Expected Result: Script in index.html, dead code removed
    Evidence: .sisyphus/evidence/task-4-antifouc-cleanup.txt
  ```

  **Commit**: YES (groups with Task 2,3)
  - Message: `chore: add anti-FOUC script, remove dead useLocalStorage`
  - Files: `index.html`, `src/hooks/useLocalStorage.ts` (deleted)

- [x] 5. Button Component

  **What to do**:
  - Create `src/components/ui/Button.tsx`:
    - Props: `variant: 'primary' | 'secondary' | 'danger' | 'success' | 'dark' | 'icon'`, `size: 'sm' | 'md' | 'lg'`, `children`, `className`, `...props`
    - Use `cn()` utility from `clsx` + `tailwind-merge`
    - Primary: `bg-primary hover:bg-primary-hover text-white` (semantic tokens)
    - Secondary: `bg-white border-2 border-border hover:bg-neutral-50 text-foreground`
    - Danger: `bg-danger hover:bg-danger-hover text-white`
    - Success: `bg-success hover:bg-success-hover text-white`
    - Dark: `bg-neutral-900 hover:bg-neutral-800 text-white`
    - Icon: `p-2 text-muted hover:text-foreground hover:bg-neutral-100` (min 44px touch target)
    - All variants: `rounded-xl font-bold cursor-pointer transition-all`
    - Size sm: `px-3 py-1.5 text-xs`, md: `px-4 py-2 text-sm`, lg: `px-6 py-3 text-base`
    - `hover:scale-[1.02]` on primary/success only (not on icon/danger)
  - Export `cn()` utility from `src/lib/utils.ts`

  **Must NOT do**:
  - Do not add loading/spinner state
  - Do not add icon prop (use children with lucide icons)
  - Do not create a separate ButtonGroup component

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6,7,8,9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Task 2

  **References**:
  - Current button patterns in `src/components/ItemsView.tsx` — primary (amber), secondary (white border), icon variants
  - `src/index.css` — semantic tokens from Task 2

  **Acceptance Criteria**:
  - [ ] `Button` component renders all 6 variants without errors
  - [ ] `cn()` utility importable from `src/lib/utils.ts`
  - [ ] Icon buttons have minimum 44×44px touch target (p-2 = 8px padding)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Button renders all variants
    Tool: Playwright
    Steps:
      1. Create temporary test page rendering all 6 Button variants
      2. Screenshot each variant
      3. Assert: all visible, no CSS errors
    Expected Result: 6 buttons rendered with distinct visual styles
    Evidence: .sisyphus/evidence/task-5-button-variants.png

  Scenario: Icon button touch target
    Tool: Bash (grep)
    Steps:
      1. Run: grep "p-2" src/components/ui/Button.tsx
      2. Assert: match found (8px padding = min 44px with icon)
    Expected Result: Icon variant uses p-2 for touch targets
    Evidence: .sisyphus/evidence/task-5-touch-target.txt
  ```

  **Commit**: YES (groups with Tasks 6-9)
  - Message: `feat(ui): create Button component with 6 variants`
  - Files: `src/components/ui/Button.tsx`, `src/lib/utils.ts`

- [x] 6. Input Component

  **What to do**:
  - Create `src/components/ui/Input.tsx`:
    - Props: `variant: 'default' | 'search'`, `label?: string`, `error?: string`, `icon?: ReactNode`, `className`, `...props`
    - Default: `border border-border rounded-xl px-3 py-2.5 bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden text-foreground`
    - Search: adds `pl-10` for icon positioning
    - Error state: `border-danger focus:ring-danger` + error message below
    - Uses `cn()` for class merging
    - Minimum height: `min-h-[44px]` for touch targets

  **Must NOT do**:
  - Do not add a FormField wrapper (label is optional prop, not separate component)
  - Do not add autocomplete, debounce, or validation logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5,7,8,9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Task 2

  **References**:
  - Current input patterns in `src/components/ItemsView.tsx` — default and search variants
  - Focus ring: currently `focus:ring-amber-500`, migrate to `focus:ring-primary`

  **Acceptance Criteria**:
  - [ ] `Input` component renders default and search variants
  - [ ] Error state displays red border + error message
  - [ ] Minimum 44px height for touch targets
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Input renders with error state
    Tool: Bash (grep)
    Steps:
      1. Run: grep "focus:ring-primary" src/components/ui/Input.tsx
      2. Assert: match found
      3. Run: grep "border-danger" src/components/ui/Input.tsx
      4. Assert: error variant exists
    Expected Result: Input uses semantic tokens for focus and error
    Evidence: .sisyphus/evidence/task-6-input-variants.txt
  ```

  **Commit**: YES (groups with Tasks 5,7-9)
  - Message: `feat(ui): create Input component with default/search/error variants`
  - Files: `src/components/ui/Input.tsx`

- [x] 7. Modal Component

  **What to do**:
  - Create `src/components/ui/Modal.tsx`:
    - Props: `isOpen: boolean`, `onClose: () => void`, `title: string`, `icon?: ReactNode`, `size: 'sm' | 'md' | 'lg' | '3xl' | '4xl'`, `variant: 'default' | 'danger'`, `children`, `footer?: ReactNode`
    - Uses `AnimatePresence` + `motion.div` (from `motion/react`)
    - Backdrop: `bg-neutral-950/40 backdrop-blur-xs`
    - Content: `bg-surface rounded-2xl shadow-modal border border-border`
    - Sizes: sm=384px, md=448px, lg=512px, 3xl=768px, 4xl=896px
    - Header: gradient bg with icon + title + close button
    - Body: scrollable, `max-h-[90vh] overflow-y-auto`
    - Footer: optional, renders action buttons
    - Close on: ESC key, backdrop click, X button
    - Focus trap: first focusable element receives focus on open

  **Must NOT do**:
  - Do not add URL routing for modals
  - Do not add draggable/resizable
  - Do not add nested modal support

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5,6,8,9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Task 2

  **References**:
  - Modal pattern duplicated 13 times across `src/components/ItemsView.tsx`, `DevisView.tsx`, `InvoicesView.tsx`, `ContactsView.tsx`
  - All use identical `AnimatePresence + motion.div` with `initial={{ scale: 0.95, opacity: 0 }}`
  - Backdrop: `bg-slate-950/40 backdrop-blur-xs` → semantic `bg-neutral-950/40`

  **Acceptance Criteria**:
  - [ ] Modal renders with correct sizes (sm/md/lg/3xl/4xl)
  - [ ] ESC key closes modal
  - [ ] Backdrop click closes modal
  - [ ] Focus trap works (first element focused on open)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Modal opens and closes
    Tool: Playwright
    Steps:
      1. Create test page with Modal trigger button
      2. Click trigger → modal appears
      3. Press ESC → modal disappears
      4. Click trigger again → modal appears
      5. Click backdrop → modal disappears
    Expected Result: Modal opens/closes via all 3 methods
    Evidence: .sisyphus/evidence/task-7-modal-open-close.png

  Scenario: Modal sizes correct
    Tool: Bash (grep)
    Steps:
      1. Run: grep "max-w-" src/components/ui/Modal.tsx
      2. Assert: contains sm/md/lg/3xl/4xl mappings
    Expected Result: All 5 size variants defined
    Evidence: .sisyphus/evidence/task-7-modal-sizes.txt
  ```

  **Commit**: YES (groups with Tasks 5,6,8,9)
  - Message: `feat(ui): create Modal component (replaces 13 duplicated modals)`
  - Files: `src/components/ui/Modal.tsx`

- [x] 8. Card + Badge Components

  **What to do**:
  - Create `src/components/ui/Card.tsx`:
    - Props: `className`, `borderAccent?: 'primary' | 'success' | 'warning' | 'danger'`, `children`
    - Base: `bg-surface p-6 rounded-2xl border border-border shadow-xs`
    - Border accent: `border-b-4 border-b-{color}` (KPI card pattern)
    - Hover: optional `hover:shadow-md transition-shadow`
  - Create `src/components/ui/Badge.tsx`:
    - Props: `variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'`, `children`, `className`
    - Uses semantic tokens: `bg-primary-light text-primary` etc.
    - Rounded: `rounded-full px-2.5 py-0.5 text-xs font-bold`

  **Must NOT do**:
  - Do not add Card.Header/Card.Body sub-components (keep flat)
  - Do not add dismissible Badge

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5,6,7,9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Task 2

  **References**:
  - Card pattern in `src/components/DashboardView.tsx` — KPI cards with `border-b-4 border-b-{color}`
  - Badge patterns across all views — status indicators (paid, pending, etc.)

  **Acceptance Criteria**:
  - [ ] Card renders with optional border accent
  - [ ] Badge renders all 5 variants
  - [ ] Both use semantic tokens
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Card and Badge render correctly
    Tool: Bash (grep)
    Steps:
      1. Run: grep "borderAccent" src/components/ui/Card.tsx
      2. Assert: prop defined
      3. Run: grep "variant" src/components/ui/Badge.tsx
      4. Assert: 5 variants (primary/success/warning/danger/neutral)
    Expected Result: Both components have expected props
    Evidence: .sisyphus/evidence/task-8-card-badge.txt
  ```

  **Commit**: YES (groups with Tasks 5-7,9)
  - Message: `feat(ui): create Card and Badge components`
  - Files: `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`

- [x] 9. Table Component

  **What to do**:
  - Create `src/components/ui/Table.tsx`:
    - Props: `columns: Array<{ key: string, label: string, className?: string }>`, `data: Array<Record<string, ReactNode>>`, `onRowClick?: (row) => void`, `emptyMessage?: string`, `className`
    - Renders `<table>` with semantic header: `bg-neutral-50 border-b border-border text-muted uppercase text-[10px]`
    - Row hover: `hover:bg-neutral-50/50 transition-colors`
    - Empty state: `py-12 text-center text-muted font-mono italic`
    - Responsive wrapper: `overflow-x-auto` (horizontal scroll on mobile)
    - Mobile card mode: `mobileCard?: boolean` prop — renders cards on `< 768px` using `hidden md:table` + `md:hidden` card grid

  **Must NOT do**:
  - Do not add sorting, pagination, or search
  - Do not add row selection or checkbox columns
  - Do not add virtual scrolling

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5-8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Task 2

  **References**:
  - Table pattern in `src/components/ItemsView.tsx` lines 300-403 (9 columns)
  - Table pattern in `src/components/InvoicesView.tsx` lines 198-277 (8 columns)
  - Empty state pattern: `py-12 text-center text-slate-400 font-mono italic`

  **Acceptance Criteria**:
  - [ ] Table renders headers and rows from props
  - [ ] Empty state displays when data is empty
  - [ ] `mobileCard` prop renders cards on small screens
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Table renders data correctly
    Tool: Bash (grep)
    Steps:
      1. Run: grep "emptyMessage" src/components/ui/Table.tsx
      2. Assert: empty state handling exists
      3. Run: grep "mobileCard" src/components/ui/Table.tsx
      4. Assert: mobile card mode exists
    Expected Result: Table has empty state and mobile card support
    Evidence: .sisyphus/evidence/task-9-table-features.txt
  ```

  **Commit**: YES (groups with Tasks 5-8)
  - Message: `feat(ui): create Table component with mobile card mode`
  - Files: `src/components/ui/Table.tsx`

- [x] 10. React Router Setup + Route Definitions

  **What to do**:
  - Create `src/routes.tsx`:
    - Define routes: `/` → redirect to `/dashboard`
    - `/dashboard` → DashboardView
    - `/items` → ItemsView
    - `/quotes` → DevisView
    - `/invoices` → InvoicesView
    - `/contacts` → ContactsView
    - `/settings` → SettingsView
  - Create `src/components/Layout.tsx`:
    - Contains sidebar + main content area
    - Sidebar navigation uses `<NavLink>` from react-router-dom (active state via `isActive`)
    - Mobile menu toggle (existing pattern)
    - Sidebar items use `to="/dashboard"` etc. instead of `onClick={() => setCurrentView('dashboard')}`
  - Replace `currentView` state in `App.tsx` with `<BrowserRouter>` + `<Layout>` + `<Routes>`
  - Remove `renderPanel()` switch/case — routes handle view switching

  **Must NOT do**:
  - Do not URL-route modals (keep modals state-based)
  - Do not add route guards or auth checks
  - Do not add 404 page (optional, not in scope)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 3)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 11, 12-17
  - **Blocked By**: Tasks 1, 3

  **References**:
  - `src/App.tsx` lines 46, 363 — `currentView` state and `renderPanel()` switch
  - `src/App.tsx` lines 454-538 — sidebar navigation pattern to migrate to `<NavLink>`
  - `src/components/` — all 6 views receive props from App.tsx (callbacks, state)

  **Acceptance Criteria**:
  - [ ] URL `/dashboard` renders DashboardView
  - [ ] URL `/items` renders ItemsView
  - [ ] URL `/invoices` renders InvoicesView
  - [ ] URL `/quotes` renders DevisView
  - [ ] URL `/contacts` renders ContactsView
  - [ ] URL `/settings` renders SettingsView
  - [ ] URL `/` redirects to `/dashboard`
  - [ ] `currentView` state removed from App.tsx
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: All routes accessible via direct URL
    Tool: Bash (curl)
    Steps:
      1. Run: npm run dev (background)
      2. Wait for server on port 3000
      3. Curl each route: /dashboard, /items, /quotes, /invoices, /contacts, /settings
      4. Assert: all return 200 status
    Expected Result: All 6 routes respond with HTML
    Evidence: .sisyphus/evidence/task-10-routes.txt

  Scenario: currentView removed
    Tool: Bash (grep)
    Steps:
      1. Run: grep "currentView" src/App.tsx
      2. Assert: no matches (state variable removed)
    Expected Result: App.tsx no longer has currentView state
    Evidence: .sisyphus/evidence/task-10-no-currentview.txt
  ```

  **Commit**: YES
  - Message: `feat(routing): integrate React Router with route definitions`
  - Files: `src/routes.tsx`, `src/components/Layout.tsx`, `src/App.tsx`

- [x] 11. AnimatedRoutes Wrapper + Lazy Loading

  **What to do**:
  - Create `src/components/AnimatedRoutes.tsx`:
    - Wraps `<Routes>` inside `<AnimatePresence mode="wait">`
    - Uses `useLocation()` and `key={location.pathname}` for transition
    - Each route wrapped in `<motion.div>` with `initial`, `animate`, `exit` transitions
  - Add lazy loading:
    - `const DashboardView = lazy(() => import('./components/DashboardView'))`
    - Same for all 6 views
    - Wrap routes in `<Suspense fallback={<LoadingSpinner />}>`
  - Create simple `LoadingSpinner` component (just `animate-spin` with loading text)

  **Must NOT do**:
  - Do not add complex loading skeletons
  - Do not add error boundaries (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (after Task 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 12-17
  - **Blocked By**: Tasks 10, 3

  **References**:
  - Current transition: `AnimatePresence mode="wait"` with `key={currentView}` in `src/App.tsx`
  - `motion/react` import pattern (NOT framer-motion)

  **Acceptance Criteria**:
  - [ ] Page transitions animate (fade/slide between views)
  - [ ] Browser back/forward buttons navigate correctly
  - [ ] Lazy loading works (views load on demand)
  - [ ] `npm run build` produces code-split chunks
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Page transitions animate
    Tool: Playwright
    Steps:
      1. Navigate to /dashboard
      2. Click "Items" in sidebar
      3. Assert: transition animation occurs (not instant swap)
      4. Click browser back button
      5. Assert: navigates to /dashboard with animation
    Expected Result: Smooth animated transitions between views
    Evidence: .sisyphus/evidence/task-11-transitions.png

  Scenario: Lazy loading produces chunks
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Check dist/assets/ for multiple JS chunks
      3. Assert: more than 1 chunk file exists
    Expected Result: Code splitting active
    Evidence: .sisyphus/evidence/task-11-chunks.txt
  ```

  **Commit**: YES
  - Message: `feat(routing): add animated transitions + lazy loading`
  - Files: `src/components/AnimatedRoutes.tsx`, `src/App.tsx`

- [x] 12. Migrate DashboardView

  **What to do**:
  - Replace raw `<button>` with `<Button>` component
  - Replace raw stat cards with `<Card borderAccent={...}>` component
  - Replace raw table with `<Table>` component
  - Replace `bg-white`, `text-slate-900` etc. with semantic tokens (`bg-surface`, `text-foreground`)
  - Keep all business logic unchanged (KPI calculations, navigation callbacks)
  - Fix: remove `scrollbar-thin` class (no-op in Tailwind v4, use existing custom CSS)

  **Must NOT do**:
  - Do not change KPI calculation logic
  - Do not modify `useDashboardMetrics` hook
  - Do not change navigation behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13-17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/DashboardView.tsx` — 379 lines, 0 modals, simplest view
  - KPI cards pattern: `bg-white p-6 rounded-[2rem] border-2 border-slate-100/80 border-b-4 border-b-{color}`
  - Table: lines 236-276 (low stock alerts, 5 columns)

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>` elements in DashboardView
  - [ ] Zero `bg-white` or `text-slate-900` brute classes
  - [ ] KPI cards use `<Card>` component
  - [ ] Table uses `<Table>` component
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: DashboardView migrated
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "<button" src/components/DashboardView.tsx
      2. Assert: result = 0
      3. Run: grep -c "bg-white" src/components/DashboardView.tsx
      4. Assert: result = 0
      5. Run: grep -c "Card\|Table\|Button" src/components/DashboardView.tsx
      6. Assert: result >= 3
    Expected Result: Raw elements replaced with UI components
    Evidence: .sisyphus/evidence/task-12-dashboard-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 13-17)
  - Message: `refactor(dashboard): migrate to UI components + semantic tokens`
  - Files: `src/components/DashboardView.tsx`

- [x] 13. Migrate ItemsView

  **What to do**:
  - Replace all 3 modals with `<Modal>` component
  - Replace raw buttons with `<Button>` (6 variants used)
  - Replace raw inputs with `<Input>` (text + search variants)
  - Replace tables (catalog + movements) with `<Table>`
  - Replace status badges with `<Badge>`
  - Replace `bg-white`, `text-slate-900` with semantic tokens
  - Fix: `gray-100/500/800/900` → semantic neutral tokens
  - Fix: `focus:ring-indigo-500` → `focus:ring-primary` (8 occurrences)

  **Must NOT do**:
  - Do not change item CRUD logic
  - Do not modify stock adjustment side effects
  - Do not change ID generation format (`prod-<timestamp>`)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12,14-17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/ItemsView.tsx` — 865 lines, 3 modals, 2 tables
  - Gray/slate inconsistency: lines 178-196 (header uses gray)
  - Indigo focus rings: 8 occurrences of `focus:ring-indigo-500`
  - Current modal pattern: 3 instances (Add Item, Adjust Stock, Edit Item)

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>`, `<input>`, `<table>` in ItemsView
  - [ ] Zero `gray-` classes (all migrated to semantic tokens)
  - [ ] Zero `focus:ring-indigo-500` (all → `focus:ring-primary`)
  - [ ] All 3 modals use `<Modal>` component
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: ItemsView fully migrated
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "gray-" src/components/ItemsView.tsx
      2. Assert: result = 0
      3. Run: grep -c "indigo-500" src/components/ItemsView.tsx
      4. Assert: result = 0 (focus rings migrated)
      5. Run: grep -c "Modal" src/components/ItemsView.tsx
      6. Assert: result >= 3
    Expected Result: All gray/indigo removed, Modal component used
    Evidence: .sisyphus/evidence/task-13-items-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 12,14-17)
  - Message: `refactor(items): migrate to UI components + fix gray/slate + indigo focus`
  - Files: `src/components/ItemsView.tsx`

- [x] 14. Migrate DevisView

  **What to do**:
  - Replace all 3 modals with `<Modal>` component
  - Replace raw buttons with `<Button>`
  - Replace raw inputs with `<Input>`
  - Replace table with `<Table>`
  - Replace status badges with `<Badge>`
  - Replace `bg-white`, `text-slate-900` with semantic tokens
  - Preserve print preview modal content (white bg for printing)

  **Must NOT do**:
  - Do not change quote creation logic
  - Do not modify quote → invoice conversion logic
  - Do not change ID format (`DEV-2026-XXX`)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12,13,15-17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/DevisView.tsx` — 745 lines, 3 modals (Create, Print, Convert)
  - Print preview has intentional dark header — preserve in migration

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>`, `<input>`, `<table>` in DevisView
  - [ ] All 3 modals use `<Modal>` component
  - [ ] Print preview still renders correctly (white content area)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: DevisView migrated
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "<button" src/components/DevisView.tsx
      2. Assert: result = 0
      3. Run: grep -c "Modal" src/components/DevisView.tsx
      4. Assert: result >= 3
    Expected Result: All raw elements replaced
    Evidence: .sisyphus/evidence/task-14-devis-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 12,13,15-17)
  - Message: `refactor(devis): migrate to UI components + semantic tokens`
  - Files: `src/components/DevisView.tsx`

- [x] 15. Migrate InvoicesView

  **What to do**:
  - Replace all 2 modals with `<Modal>` component
  - Replace raw buttons with `<Button>`
  - Replace raw inputs with `<Input>`
  - Replace table with `<Table>`
  - Replace status badges with `<Badge>`
  - Replace `bg-white`, `text-slate-900` with semantic tokens
  - Preserve print preview modal content (white bg for printing)
  - CRITICAL: Verify invoice creation side effects still work (stock decrement, SORTIE movements, outstandingBalance update)

  **Must NOT do**:
  - Do not change invoice creation/deletion logic
  - Do not modify side effects (stock, movements, balance)
  - Do not change ID format (`FAC-2026-XXX`)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12-14,16,17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/InvoicesView.tsx` — 725 lines, 2 modals (Create, Print)
  - `handleAddInvoice` side effects: stock decrement, SORTIE movement, outstandingBalance
  - `handleDeleteInvoice` reverses all side effects

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>`, `<input>`, `<table>` in InvoicesView
  - [ ] Both modals use `<Modal>` component
  - [ ] Invoice creation still decrements stock (verify logic unchanged)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: InvoicesView migrated without breaking side effects
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "<button" src/components/InvoicesView.tsx
      2. Assert: result = 0
      3. Run: grep "handleAddInvoice" src/components/InvoicesView.tsx
      4. Assert: function still exists and calls stock logic
    Expected Result: UI migrated, business logic preserved
    Evidence: .sisyphus/evidence/task-15-invoices-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 12-14,16,17)
  - Message: `refactor(invoices): migrate to UI components + semantic tokens`
  - Files: `src/components/InvoicesView.tsx`

- [x] 16. Migrate ContactsView

  **What to do**:
  - Replace all 5 modals with `<Modal>` component
  - Replace raw buttons with `<Button>`
  - Replace raw inputs with `<Input>`
  - Replace status badges with `<Badge>`
  - Replace `bg-white`, `text-slate-900` with semantic tokens
  - ContactsView already uses card grid (responsive) — keep this pattern, just use `<Card>` component
  - Replace `SettingsView` `gray-100` border with semantic token

  **Must NOT do**:
  - Do not change customer/supplier CRUD logic
  - Do not modify debt calculation or recovery logic

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12-15,17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/ContactsView.tsx` — 754 lines, 5 modals (most modals)
  - Card grid pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (responsive gold standard)

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>`, `<input>` in ContactsView
  - [ ] All 5 modals use `<Modal>` component
  - [ ] Card grid pattern preserved with `<Card>` component
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: ContactsView migrated
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "<button" src/components/ContactsView.tsx
      2. Assert: result = 0
      3. Run: grep -c "Modal" src/components/ContactsView.tsx
      4. Assert: result >= 5
    Expected Result: All modals use Modal component
    Evidence: .sisyphus/evidence/task-16-contacts-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 12-15,17)
  - Message: `refactor(contacts): migrate to UI components + semantic tokens`
  - Files: `src/components/ContactsView.tsx`

- [x] 17. Migrate SettingsView

  **What to do**:
  - Replace raw buttons with `<Button>`
  - Replace raw inputs with `<Input>`
  - Replace `gray-100` border with semantic token
  - Add dark mode toggle section (placeholder — full implementation in Task 20)
  - Replace `bg-white`, `text-slate-900` with semantic tokens

  **Must NOT do**:
  - Do not change store settings logic
  - Do not modify cloud backup functionality
  - Do not change Firebase integration

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12-16)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 18-21
  - **Blocked By**: Tasks 5-9, 10-11

  **References**:
  - `src/components/SettingsView.tsx` — 439 lines, 0 modals (simplest to migrate)

  **Acceptance Criteria**:
  - [ ] Zero raw `<button>`, `<input>` in SettingsView
  - [ ] Zero `gray-100` classes
  - [ ] Dark mode toggle section added (placeholder)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: SettingsView migrated
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "<button" src/components/SettingsView.tsx
      2. Assert: result = 0
      3. Run: grep -c "gray-" src/components/SettingsView.tsx
      4. Assert: result = 0
    Expected Result: All raw elements and gray classes removed
    Evidence: .sisyphus/evidence/task-17-settings-migrated.txt
  ```

  **Commit**: YES (groups with Tasks 12-16)
  - Message: `refactor(settings): migrate to UI components + add dark mode placeholder`
  - Files: `src/components/SettingsView.tsx`

- [x] 18. Responsive Tables → Cards on Mobile

  **What to do**:
  - ItemsView catalog table: convert to card grid on `< 768px`
    - Use `hidden md:table` for table, `md:hidden` for card grid
    - Cards show: name, category, price, stock, actions
    - Follow ContactsView card pattern (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
  - ItemsView movements table: keep as horizontal scroll (historical data, not primary UI)
  - DevisView quotes table: convert to card grid on mobile
    - Cards show: reference, client, date, total, status badge, actions
  - InvoicesView invoices table: convert to card grid on mobile
    - Cards show: reference, client, date, total, status badge, actions
  - DashboardView low-stock table: keep as horizontal scroll (small, 5 columns)
  - Increase touch targets: all icon buttons `p-1.5` → `p-2` (min 44px)
  - Mobile menu: add backdrop overlay for tap-to-close

  **Must NOT do**:
  - Do not add swipe gestures
  - Do not change desktop table layout
  - Do not add infinite scroll or pagination

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19,20,21)
  - **Parallel Group**: Wave 5
  - **Blocks**: Tasks F1-F4
  - **Blocked By**: Tasks 12-17

  **References**:
  - ContactsView card pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — replicate for Items/Devis/Invoices
  - ItemsView catalog: 9 columns (most complex table to convert)
  - DevisView: 7 columns
  - InvoicesView: 8 columns
  - Mobile menu: `src/App.tsx` lines 454-538 — add backdrop overlay

  **Acceptance Criteria**:
  - [ ] ItemsView catalog shows cards at 375px viewport
  - [ ] DevisView quotes shows cards at 375px viewport
  - [ ] InvoicesView invoices shows cards at 375px viewport
  - [ ] All icon buttons have min 44px touch target
  - [ ] Mobile sidebar has backdrop overlay
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Responsive cards on mobile
    Tool: Playwright
    Steps:
      1. Set viewport to 375px (iPhone SE)
      2. Navigate to /items
      3. Assert: table is hidden, cards are visible
      4. Navigate to /quotes
      5. Assert: table is hidden, cards are visible
      6. Navigate to /invoices
      7. Assert: table is hidden, cards are visible
    Expected Result: All 3 views show cards on mobile
    Evidence: .sisyphus/evidence/task-18-responsive-cards.png

  Scenario: Touch targets minimum 44px
    Tool: Playwright
    Steps:
      1. Set viewport to 375px
      2. Find all icon buttons (edit/delete/print)
      3. Measure bounding box
      4. Assert: width >= 44px AND height >= 44px
    Expected Result: All interactive elements meet touch target minimum
    Evidence: .sisyphus/evidence/task-18-touch-targets.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): table-to-card mobile layout + touch targets + mobile overlay`
  - Files: `src/components/ItemsView.tsx`, `src/components/DevisView.tsx`, `src/components/InvoicesView.tsx`, `src/App.tsx`

- [x] 19. Dark Mode — All Components

  **What to do**:
  - Add `dark:` variants to all 6 view components + Layout:
    - `bg-surface` → `dark:bg-neutral-900`
    - `text-foreground` → `dark:text-neutral-100`
    - `bg-neutral-50` → `dark:bg-neutral-800`
    - `border-border` → `dark:border-neutral-700`
    - `text-muted` → `dark:text-neutral-400`
    - Status badges: `dark:bg-{color}-900 dark:text-{color}-300`
    - Modals: `dark:bg-neutral-900 dark:border-neutral-700`
    - Sidebar: already dark, no changes needed
  - Warm dark palette: use `neutral`/`stone` tones, NOT cold `slate`
  - Add CSS transition for smooth theme switching:
    ```css
    * { transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
    ```
  - Verify WCAG AA contrast ratios (4.5:1 minimum)

  **Must NOT do**:
  - Do not add per-component transition orchestration
  - Do not change light mode colors
  - Do not add dark mode-specific layouts

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18,20,21)
  - **Parallel Group**: Wave 5
  - **Blocks**: Tasks F1-F4
  - **Blocked By**: Tasks 12-17

  **References**:
  - ~239 `bg-*` classes across 6 views need `dark:` variants
  - Semantic tokens from Task 2: `--color-surface`, `--color-foreground`, `--color-neutral-*`
  - Sidebar already dark (`bg-slate-900`) — no changes needed

  **Acceptance Criteria**:
  - [ ] All views render correctly in dark mode
  - [ ] No white-on-white or dark-on-dark text issues
  - [ ] Warm dark palette (neutral/stone, not cold slate)
  - [ ] Theme transition smooth (< 0.3s)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Dark mode renders correctly
    Tool: Playwright
    Steps:
      1. Add .dark class to document.documentElement
      2. Navigate to each view
      3. Screenshot each view in dark mode
      4. Assert: no white-on-white text, no broken layouts
    Expected Result: All views render correctly in dark mode
    Evidence: .sisyphus/evidence/task-19-dark-mode.png

  Scenario: Warm dark palette
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "slate-900" src/components/ -r
      2. Assert: result is low (migrated to neutral/stone)
      3. Run: grep "dark:bg-neutral" src/components/ -r | head -5
      4. Assert: warm neutral tones used
    Expected Result: Dark mode uses warm neutral palette
    Evidence: .sisyphus/evidence/task-19-warm-palette.txt
  ```

  **Commit**: YES
  - Message: `feat(dark-mode): add dark variants to all components + warm palette`
  - Files: All component files + `src/index.css`

- [x] 20. Dark Mode Toggle in SettingsView

  **What to do**:
  - Add dark mode toggle section in SettingsView:
    - 3 options: Light / Dark / System
    - Uses `useTheme()` hook from Task 3
    - Radio buttons or segmented control
    - Shows current resolved mode (what's actually displayed)
  - Verify toggle persists to localStorage
  - Verify system preference detection works

  **Must NOT do**:
  - Do not add complex animation for toggle
  - Do not add theme preview

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18,19,21)
  - **Parallel Group**: Wave 5
  - **Blocks**: Tasks F1-F4
  - **Blocked By**: Tasks 3, 17

  **References**:
  - `src/hooks/useTheme.ts` — from Task 3, provides `mode`, `resolved`, `setMode`
  - `src/components/SettingsView.tsx` — from Task 17, already migrated

  **Acceptance Criteria**:
  - [ ] Toggle shows Light/Dark/System options
  - [ ] Toggle switches theme immediately
  - [ ] Preference persists across page reload
  - [ ] System option follows OS preference
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Toggle persists preference
    Tool: Playwright
    Steps:
      1. Navigate to /settings
      2. Click "Dark" toggle
      3. Assert: document.documentElement.classList.contains('dark')
      4. Reload page
      5. Assert: dark class still present
      6. Check localStorage.getItem('theme')
      7. Assert: value is 'dark'
    Expected Result: Dark mode persists across reload
    Evidence: .sisyphus/evidence/task-20-toggle-persists.png

  Scenario: System preference detection
    Tool: Playwright
    Steps:
      1. Set OS preference to dark (emulate media query)
      2. Click "System" toggle
      3. Assert: dark class applied
      4. Set OS preference to light
      5. Assert: dark class removed
    Expected Result: System mode follows OS preference
    Evidence: .sisyphus/evidence/task-20-system-pref.txt
  ```

  **Commit**: YES
  - Message: `feat(dark-mode): add toggle UI in SettingsView`
  - Files: `src/components/SettingsView.tsx`

- [x] 21. Mobile Menu Overlay + Touch Target Fixes

  **What to do**:
  - Mobile sidebar backdrop overlay:
    - When sidebar open on mobile, show full-screen semi-transparent overlay
    - Clicking overlay closes sidebar
    - Overlay: `bg-neutral-950/50 fixed inset-0 z-40`
    - z-index: overlay z-40, sidebar z-50
  - Fix all touch targets across the app:
    - Icon buttons: `p-1.5` → `p-2` (minimum 44px)
    - Hamburger menu: increase to `p-2`
    - Search input clear button: increase to `p-2`
  - Font size audit:
    - `text-[9px]` → reserve for print only
    - `text-[10px]` → reserve for print/table headers only
    - Interactive elements: minimum `text-xs` (12px)

  **Must NOT do**:
  - Do not make sidebar collapsible on desktop
  - Do not add swipe gestures
  - Do not change desktop layout

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18,19,20)
  - **Parallel Group**: Wave 5
  - **Blocks**: Tasks F1-F4
  - **Blocked By**: Tasks 12-17

  **References**:
  - `src/App.tsx` lines 454-538 — mobile menu implementation
  - Current icon button padding: `p-1.5` throughout (too small)

  **Acceptance Criteria**:
  - [ ] Mobile sidebar has backdrop overlay
  - [ ] Clicking overlay closes sidebar
  - [ ] All icon buttons have min 44px touch target
  - [ ] No `text-[9px]` in interactive elements
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Mobile overlay works
    Tool: Playwright
    Steps:
      1. Set viewport to 375px
      2. Click hamburger menu
      3. Assert: sidebar appears
      4. Assert: backdrop overlay visible
      5. Click overlay
      6. Assert: sidebar closes
    Expected Result: Overlay tap-to-close works
    Evidence: .sisyphus/evidence/task-21-mobile-overlay.png

  Scenario: Touch targets verified
    Tool: Playwright
    Steps:
      1. Find all buttons with p-1 or p-1.5 classes
      2. Assert: count = 0 (all migrated to p-2+)
    Expected Result: No undersized touch targets
    Evidence: .sisyphus/evidence/task-21-touch-targets.txt
  ```

  **Commit**: YES
  - Message: `feat(responsive): mobile sidebar overlay + touch target fixes`
  - Files: `src/App.tsx`, various component files

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `tsc --noEmit`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop patterns.
  Output: `Build [PASS/FAIL] | Types [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real QA — Responsive + Dark Mode** — `unspecified-high` (+ `playwright` skill)
  Test at 375px, 768px, 1024px viewports. Verify tables → cards, modal stacking, touch targets. Test dark mode toggle, system preference detection, localStorage persistence. Screenshot evidence.
  Output: `Responsive [N/N] | Dark Mode [N/N] | Screenshots [N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 compliance. Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(design-system): add semantic tokens, theme context, clsx/tailwind-merge`
- **Wave 2**: `feat(ui): create Button, Input, Modal, Card, Badge, Table components`
- **Wave 3**: `feat(routing): integrate React Router with animated transitions`
- **Wave 4**: `refactor(views): migrate all views to UI components + semantic tokens`
- **Wave 5a**: `feat(responsive): table-to-card mobile layout + touch targets`
- **Wave 5b**: `feat(dark-mode): system preference + toggle + dark variants`

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: exits 0, no errors
npm run lint   # Expected: passes (tsc --noEmit)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All routes accessible via direct URL
- [ ] Dark mode toggle works and persists
- [ ] Responsive at 375px, 768px, 1024px
- [ ] Zero raw `<button>` or `<input>` in view files
- [ ] Zero `bg-white` or `text-slate-900` brute in views (semantic tokens only)
