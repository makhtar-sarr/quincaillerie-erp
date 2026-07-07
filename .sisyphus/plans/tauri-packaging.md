# Plan: Packaging Quincaillerie ERP as Windows .exe via Tauri 2.x

## TL;DR

> **Quick Summary**: Add a Tauri 2.x desktop wrapper around the existing React/Vite ERP app, then build a Windows `.exe` installer via GitHub Actions (native Windows runner). No business-logic changes — the app works as-is inside the WebView (localStorage persists natively, Gemini is unused in code, Firebase degrades gracefully offline).
>
> **Deliverables**:
> - `src-tauri/` scaffold (Cargo.toml, tauri.conf.json, lib.rs, capabilities, icons)
> - 3 minimal `vite.config.ts` changes (`base:'./'`, `strictPort:true`, watch-ignore)
> - `.github/workflows/build-windows.yml` producing a Windows NSIS `.exe` artifact
> - CSP in `tauri.conf.json` permitting Firebase egress
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES — 2 waves (scaffold in parallel, then CI + verify)
> **Critical Path**: Task 1 → Task 3 (config) → Task 5 (CI) → Task 7 (verify)

---

## Context

### Original Request
User wants a Windows `.exe` of the project using Tauri (https://tauri.app/start/).

### Interview Summary
**Key Discussions**:
- Project: `/home/makhtar/projets/quincaillerie-erp` — React 19 + Vite ERP for Senegalese hardware stores.
- Deployed via Google AI Studio (AI Studio applet); `GEMINI_API_KEY` injected at runtime by platform. `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- **Decision**: Build target = GitHub Actions (native Windows runner). Scope = packaging ONLY (no business-logic changes).

**Research Findings**:
- `@google/genai` is a dependency but **NOT used anywhere in `src/`** (verified by reading App.tsx + grep). The Gemini capability is AI-Studio-platform-only. → No key-injection problem for the exe.
- State is `useState` in `App.tsx`, persisted to `localStorage` (keys `erp_items`, etc.). Works natively in Tauri WebView.
- Firebase is backup-only, key is a **public** Firebase web key, guarded by `isFirebaseAvailable` (offline-safe).
- `vite.config.ts` has `DISABLE_HMR` gating — MUST NOT be modified (intentional for AI Studio).
- No SPA router (view switching via `useState`), no `src-tauri/` exists yet, no test suite.

### Metis Review (gaps addressed)
- **CRITICAL gap found**: Executor runs on Linux → cannot run a Windows `.exe`. Acceptance criteria rewritten as Linux-runnable checks (build + config parse + icon presence + YAML validity).
- **3 required `vite.config.ts` changes** I had missed: `base:'./'` (relative asset paths for Tauri), `server.strictPort:true` (fixed port for `tauri dev`), `build.watch.ignore:['src-tauri/**']`.
- **CSP**: must permit Firebase `connect-src` or backup silently fails (app still works offline).
- **Icons**: `npx tauri icon` must generate the full set or `tauri build` hard-fails.
- **Capabilities**: keep minimal (`core:default` only) — no extra plugins.
- **CI**: use `npm install` (not `npm ci`) unless lockfile confirmed; pin Node version.

---

## Work Objectives

### Core Objective
Wrap the existing ERP SPA in a Tauri 2.x desktop shell and produce a Windows `.exe` NSIS installer via GitHub Actions — without touching application/business logic.

### Concrete Deliverables
- `src-tauri/tauri.conf.json` (with `identifier`, `frontendDist:"../dist"`, `beforeBuildCommand:"npm run build"`, CSP)
- `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`
- `src-tauri/capabilities/default.json` (minimal)
- `src-tauri/icons/` (full set via `npx tauri icon`)
- Modified `vite.config.ts` (3 changes only)
- `.github/workflows/build-windows.yml` (tauri-action on windows-latest)

### Definition of Done
- [ ] `npm run build` produces `dist/index.html` with `src="./assets/...` (relative)
- [ ] `src-tauri/tauri.conf.json` and `capabilities/default.json` parse as valid JSON
- [ ] `src-tauri/icons/` contains ≥5 icon files
- [ ] `.github/workflows/build-windows.yml` is valid YAML and produces a Windows `.exe` NSIS artifact in CI
- [ ] No business-logic file (`App.tsx`, `firebase.ts`, etc.) was modified

### Must Have
- Tauri 2.x scaffold integrated with existing Vite project
- `vite.config.ts` patched for Tauri (3 changes)
- `npx tauri icon` icon set generated
- GitHub Actions workflow building Windows `.exe` on `windows-latest`
- CSP allowing Firebase egress

### Must NOT Have (Guardrails)
- MUST NOT modify `App.tsx`, `src/lib/firebase.ts`, or any business logic
- MUST NOT modify the `DISABLE_HMR` gating logic in `vite.config.ts`
- MUST NOT add `tauri-plugin-store` / `fs` / `shell` / `dialog` or any data-layer change
- MUST NOT refactor state management or change ID/currency/Firebase conventions
- MUST NOT add a test suite
- MUST NOT change `vite.config.ts` beyond the 3 specified changes

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — all verification agent-executed on Linux. The `.exe` itself cannot run on Linux; runtime verification requires the GitHub Actions artifact + a Windows VM, which is out of scope for the executor. Executor verifies build artifacts + config correctness only.

### Test Decision
- **Infrastructure exists**: NO (no test suite)
- **Automated tests**: None (out of scope per guardrails)
- **Framework**: n/a

### QA Policy
Every task includes agent-executed QA scenarios runnable on Linux (build, JSON-parse, grep, ls, YAML-lint). Evidence saved to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (scaffold — parallel):
├── Task 1: Patch vite.config.ts (3 Tauri changes) [quick]
├── Task 2: Scaffold src-tauri via `npx tauri init` [quick]
└── Task 3: Generate icon set via `npx tauri icon` [quick]

Wave 2 (config + CI + verify — parallel):
├── Task 4: Edit tauri.conf.json (identifier, CSP, windows bundle) [quick]
├── Task 5: Edit capabilities/default.json (minimal) [quick]
├── Task 6: Create .github/workflows/build-windows.yml [quick]
└── Task 7: Verify build artifacts + config (Linux-runnable checks) [quick]
```

### Dependency Matrix
- **1** (vite patch): - | blocks: 4 (conf depends on build setup), 7
- **2** (tauri init): - | blocks: 4, 5, 7
- **3** (icons): - | blocks: 7
- **4** (conf.json): 1, 2 | blocks: 7
- **5** (capabilities): 2 | blocks: 7
- **6** (CI workflow): 2 | blocks: 7
- **7** (verify): 1,2,3,4,5,6 | - (final)

### Agent Dispatch Summary
- **Wave 1**: Task 1 → `quick`, Task 2 → `quick`, Task 3 → `quick`
- **Wave 2**: Task 4 → `quick`, Task 5 → `quick`, Task 6 → `quick`, Task 7 → `quick`

---

## TODOs

- [x] 1. Patch `vite.config.ts` for Tauri (3 changes only)

  **What to do**:
  - Add top-level `base: './'` to the `defineConfig` return (so Vite emits relative `./assets/` paths — required for Tauri WebView).
  - Add `server.strictPort: true` inside the existing `server` block (so `tauri dev` always finds the dev server on port 3000).
  - Add `build: { watch: { ignore: ['src-tauri/**'] } }` (so Rust file changes don't trigger Vite HMR).
  - Do NOT touch the existing `plugins`, `resolve.alias`, or the `DISABLE_HMR` gating logic.

  **Must NOT do**:
  - Do NOT modify `DISABLE_HMR` logic or `hmr`/`watch` under `server` beyond adding `strictPort`.
  - Do NOT remove the `@` alias or tailwind/react plugins.

  **Recommended Agent Profile**:
  - **Category**: `quick` — single-file config edit, low risk.
  - **Skills**: [] — no specialist skill needed.
  - **Skills Evaluated but Omitted**: `oracle` (overkill for a 3-line config edit).

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4, Task 7
  - **Blocked By**: None

  **References**:
  - `vite.config.ts:1-22` — current config; preserve `plugins`, `resolve.alias`, and the `DISABLE_HMR` gating block at lines 14-20.
  - Tauri Vite guide (librarian research): requires `base:'./'`, `strictPort:true`, `watch.ignore:['src-tauri/**']`.

  **Acceptance Criteria**:
  - [ ] `vite.config.ts` contains `base: './'`
  - [ ] `vite.config.ts` contains `strictPort: true`
  - [ ] `vite.config.ts` contains `watch: { ignore: ['src-tauri/**'] }` under `build`
  - [ ] `DISABLE_HMR` gating logic (lines 14-20) unchanged

  **QA Scenarios**:
  ```
  Scenario: vite config parses and uses relative base
    Tool: Bash
    Preconditions: vite.config.ts edited
    Steps:
      1. grep -n "base:" vite.config.ts  → expect "base: './'"
      2. grep -n "strictPort" vite.config.ts → expect "strictPort: true"
      3. grep -n "src-tauri" vite.config.ts → expect watch ignore entry
      4. npx tsc --noEmit (type-check) → expect 0 errors
    Expected Result: all 3 greps match; tsc passes
    Failure Indicators: missing any of the 3; DISABLE_HMR block altered
    Evidence: .sisyphus/evidence/task-1-vite-config.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-1-vite-config.txt` (grep output)

  **Commit**: YES (group with Task 2,3) — Message: `build(tauri): scaffold Tauri wrapper + vite config for desktop` — Files: `vite.config.ts`

---

- [x] 2. Scaffold `src-tauri/` via `npx tauri init`

  **What to do**:
  - Run `npm install -D @tauri-apps/cli@latest` then `npx tauri init`.
  - Answer prompts: App name `Quincaillerie ERP`, Window title `Quincaillerie ERP`, Web assets location `../dist`, Dev server URL `http://localhost:3000`, Frontend dev command `npm run dev`, Frontend build command `npm run build`.
  - Verify `src-tauri/` now contains: `Cargo.toml`, `build.rs`, `tauri.conf.json`, `src/main.rs`, `src/lib.rs`, `capabilities/default.json`, `icons/` (placeholder).
  - Install the JS API package: `npm install @tauri-apps/api@latest`.

  **Must NOT do**:
  - Do NOT run `npx tauri dev`/`build` on Linux (Rust target missing — that's for CI).
  - Do NOT modify `src/main.rs` (only `lib.rs` if needed).

  **Recommended Agent Profile**:
  - **Category**: `quick` — scaffolding command, then config edits follow.
  - **Skills**: [] — CLI scaffold.
  - **Skills Evaluated but Omitted**: none.

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 4, 5, 6, 7
  - **Blocked By**: None

  **References**:
  - `package.json:6-12` — scripts; `tauri` script will be added by init or manually.
  - Tauri 2.x project structure (librarian): `src-tauri/` layout, `lib.rs` is the editable entry.

  **Acceptance Criteria**:
  - [ ] `src-tauri/tauri.conf.json` exists
  - [ ] `src-tauri/Cargo.toml` exists
  - [ ] `src-tauri/src/lib.rs` exists
  - [ ] `src-tauri/capabilities/default.json` exists
  - [ ] `@tauri-apps/api` present in `package.json` devDependencies

  **QA Scenarios**:
  ```
  Scenario: scaffold files present
    Tool: Bash
    Preconditions: tauri init run
    Steps:
      1. ls src-tauri/ → expect Cargo.toml, tauri.conf.json, build.rs, src/
      2. ls src-tauri/src/ → expect main.rs, lib.rs
      3. ls src-tauri/capabilities/ → expect default.json
    Expected Result: all paths present
    Failure Indicators: missing any scaffold file
    Evidence: .sisyphus/evidence/task-2-scaffold.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-2-scaffold.txt` (ls output)

  **Commit**: YES (group with Task 1,3) — Message: `build(tauri): scaffold Tauri wrapper + vite config for desktop` — Files: `src-tauri/**`, `package.json`

---

- [x] 3. Generate Tauri icon set via `npx tauri icon`

  **What to do**:
  - Create a source PNG (e.g., `app-icon.png`, 1024×1024) — a simple placeholder is acceptable (solid color + "SQ" text, or reuse branding). Place it at repo root or `src-tauri/`.
  - Run `npx tauri icon app-icon.png` → generates the full set into `src-tauri/icons/`.
  - Verify `src-tauri/icons/` contains: `icon.ico`, `icon.icns`, `32x32.png`, `128x128.png`, `128x128@2x.png` (plus others).

  **Must NOT do**:
  - Do NOT skip icon generation — `tauri build` hard-fails without the set.

  **Recommended Agent Profile**:
  - **Category**: `quick` — single CLI command.
  - **Skills**: [] — no specialist needed.

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:
  - Metis review: `npx tauri icon` populates `src-tauri/icons/` with the required set.
  - Tauri icon docs: source PNG ≥1024px.

  **Acceptance Criteria**:
  - [ ] `src-tauri/icons/icon.ico` exists
  - [ ] `src-tauri/icons/icon.icns` exists
  - [ ] `src-tauri/icons/32x32.png` exists
  - [ ] `src-tauri/icons/128x128.png` exists
  - [ ] `src-tauri/icons/128x128@2x.png` exists

  **QA Scenarios**:
  ```
  Scenario: icon set present
    Tool: Bash
    Preconditions: npx tauri icon run
    Steps:
      1. ls src-tauri/icons/ | grep -E "icon.ico|icon.icns|32x32.png|128x128.png|128x128@2x.png" → expect ≥5 matches
    Expected Result: all 5 icon files present
    Failure Indicators: any icon file missing
    Evidence: .sisyphus/evidence/task-3-icons.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-3-icons.txt` (ls output)

  **Commit**: YES (group with Task 1,2) — Message: `build(tauri): scaffold Tauri wrapper + vite config for desktop` — Files: `src-tauri/icons/`, `app-icon.png`

---

- [x] 4. Edit `src-tauri/tauri.conf.json` (identifier, CSP, windows bundle)

  **What to do**:
  - Set `productName`: `Quincaillerie ERP`, `version`: `0.1.0`, `identifier`: `com.quincaillerie.erp`.
  - Ensure `build`: `beforeDevCommand:"npm run dev"`, `devUrl:"http://localhost:3000"`, `beforeBuildCommand:"npm run build"`, `frontendDist:"../dist"`.
  - Set `app.windows[0]`: `title:"Quincaillerie ERP"`, `width:1280`, `height:800`, `resizable:true`, `minWidth:800`, `minHeight:600`.
  - Set `app.security.csp`: `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebasestorage.googleapis.com`. (Permits Firebase egress so backup degrades gracefully instead of CSP-block.)
  - Ensure `bundle.active:true`, `bundle.targets:"all"`, `bundle.icon` lists the icon files, and `bundle.windows` NSIS enabled (default).

  **Must NOT do**:
  - Do NOT add plugin permissions here (capabilities file handles that).
  - Do NOT change `frontendDist` away from `../dist`.

  **Recommended Agent Profile**:
  - **Category**: `quick` — JSON config edit.
  - **Skills**: [] — config only.

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1, Task 2

  **References**:
  - `src-tauri/tauri.conf.json` (generated by init) — edit in place.
  - Metis review: MUST have `identifier`, `frontendDist:"../dist"`, `beforeBuildCommand:"npm run build"`; CSP MUST include Firebase `connect-src`.

  **Acceptance Criteria**:
  - [ ] `tauri.conf.json` parses as valid JSON
  - [ ] contains `identifier: "com.quincaillerie.erp"`
  - [ ] `build.frontendDist` === `"../dist"`
  - [ ] `build.beforeBuildCommand` === `"npm run build"`
  - [ ] `app.security.csp` contains `https://*.googleapis.com` and `https://*.firebasestorage.googleapis.com`

  **QA Scenarios**:
  ```
  Scenario: tauri.conf.json valid + correct fields
    Tool: Bash
    Preconditions: edited
    Steps:
      1. node -e "const c=JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json')); console.log(c.identifier, c.build.frontendDist, c.build.beforeBuildCommand, c.app.security.csp)"
         → expect "com.quincaillerie.erp ../dist npm run build <csp string>"
      2. echo $? → expect 0 (JSON parsed)
    Expected Result: identifier, frontendDist, beforeBuildCommand correct; CSP has Firebase domains
    Failure Indicators: JSON parse error; wrong frontendDist; CSP missing Firebase
    Evidence: .sisyphus/evidence/task-4-conf.json.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-4-conf.json.txt`

  **Commit**: YES (group with Task 6) — Message: `ci: add GitHub Actions Windows .exe build` — Files: `src-tauri/tauri.conf.json`

---

- [x] 5. Edit `src-tauri/capabilities/default.json` (minimal)

  **What to do**:
  - Ensure the file contains only `core:default` permission (no extra plugins). If `tauri init` added `opener:default`, it is acceptable but NOT required — keep minimal.
  - Confirm `identifier:"default"`, `windows:["main"]`.

  **Must NOT do**:
  - Do NOT add `store:default`, `fs:default`, `shell:default`, `dialog:default`, or any plugin permission (guardrail).

  **Recommended Agent Profile**:
  - **Category**: `quick` — JSON config edit.
  - **Skills**: [] — config only.

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  - `src-tauri/capabilities/default.json` (generated).
  - Metis review: keep minimal `core:default` only; no extra plugins.

  **Acceptance Criteria**:
  - [ ] `capabilities/default.json` parses as valid JSON
  - [ ] permissions array contains only `core:default` (and optionally `opener:default`)
  - [ ] NO `store`/`fs`/`shell`/`dialog` permissions present

  **QA Scenarios**:
  ```
  Scenario: capabilities minimal + valid
    Tool: Bash
    Preconditions: edited
    Steps:
      1. node -e "const c=JSON.parse(require('fs').readFileSync('src-tauri/capabilities/default.json')); console.log(JSON.stringify(c.permissions))"
         → expect contains 'core:default', no 'store'/'fs'/'shell'/'dialog'
    Expected Result: only allowed permissions present
    Failure Indicators: extra plugin permission found
    Evidence: .sisyphus/evidence/task-5-capabilities.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-5-capabilities.txt`

  **Commit**: YES (group with Task 6) — Message: `ci: add GitHub Actions Windows .exe build` — Files: `src-tauri/capabilities/default.json`

---

- [x] 6. Create `.github/workflows/build-windows.yml`

  **What to do**:
  - Create `.github/workflows/build-windows.yml` using `tauri-action@v1` on `windows-latest`.
  - Steps: checkout, setup-node (pin a Node LTS, e.g. `lts/*`), install Rust stable (dtolnay/rust-toolchain or tauri-action handles it), `npm install` (NOT `npm ci` — confirm lockfile; if `package-lock.json` exists, `npm ci` is fine), `tauri-action@v1` with `args: ''` (Windows target default), upload artifact (`.exe` + NSIS installer from `src-tauri/target/release/bundle/nsis/`).
  - Trigger on `push` to `main`/`release` and on workflow_dispatch.

  **Must NOT do**:
  - Do NOT attempt Linux cross-compile (user chose GitHub Actions native Windows).
  - Do NOT add macOS/Linux matrix targets (scope = Windows .exe only).

  **Recommended Agent Profile**:
  - **Category**: `quick` — YAML workflow authoring.
  - **Skills**: [] — standard CI pattern.
  - **Skills Evaluated but Omitted**: none.

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  - Tauri GitHub pipeline docs (librarian): `tauri-action@v1` on `windows-latest`, `GITHUB_TOKEN` env, artifact upload.
  - Metis review: use `npm install` unless lockfile confirmed; pin Node version.

  **Acceptance Criteria**:
  - [ ] `.github/workflows/build-windows.yml` exists and is valid YAML
  - [ ] uses `tauri-action@v1` on `windows-latest`
  - [ ] runs `npm install` (or `npm ci` if lockfile present)
  - [ ] uploads `*.exe` / NSIS installer as artifact

  **QA Scenarios**:
  ```
  Scenario: workflow YAML valid + correct shape
    Tool: Bash
    Preconditions: file created
    Steps:
      1. node -e "const y=require('yaml'); y.parse(require('fs').readFileSync('.github/workflows/build-windows.yml','utf8')); console.log('YAML OK')" → expect "YAML OK" (or python3 -c "import yaml; yaml.safe_load(open(...))")
      2. grep -n "windows-latest" .github/workflows/build-windows.yml → expect ≥1
      3. grep -n "tauri-action" .github/workflows/build-windows.yml → expect ≥1
    Expected Result: YAML parses; windows-latest + tauri-action present
    Failure Indicators: YAML parse error; missing runner or action
    Evidence: .sisyphus/evidence/task-6-workflow.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-6-workflow.txt`

  **Commit**: YES (group with Task 4,5) — Message: `ci: add GitHub Actions Windows .exe build` — Files: `.github/workflows/build-windows.yml`

---

- [x] 7. Verify build artifacts + config (Linux-runnable checks)

  **What to do**:
  - Run `npm install` then `npm run build`.
  - Verify `dist/index.html` exists and contains `src="./assets/` (relative path → Tauri-compatible).
  - Validate `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json` parse as JSON.
  - List `src-tauri/icons/` to confirm the icon set.
  - Confirm `git status` shows no business-logic files (App.tsx, firebase.ts) modified.
  - Document: full `.exe` runtime verification requires downloading the CI artifact + a Windows VM — out of scope for Linux executor.

  **Must NOT do**:
  - Do NOT attempt to run the Windows `.exe` on Linux.
  - Do NOT modify business logic to "test" anything.

  **Recommended Agent Profile**:
  - **Category**: `quick` — verification commands.
  - **Skills**: [] — build + grep + parse.

  **Parallelization**:
  - **Can Run In Parallel**: NO (final, depends on all)
  - **Parallel Group**: Sequential (after Wave 2)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 1, 2, 3, 4, 5, 6

  **References**:
  - Metis review AC1–AC7: Linux-runnable checks only; `.exe` runtime needs Windows.

  **Acceptance Criteria**:
  - [ ] `npm run build` exits 0, `dist/index.html` exists
  - [ ] `grep -c 'src="./assets' dist/index.html` ≥ 1
  - [ ] both Tauri JSON configs parse
  - [ ] icon set present (≥5 files)
  - [ ] `git diff --name-only` does NOT include `src/App.tsx` or `src/lib/firebase.ts`

  **QA Scenarios**:
  ```
  Scenario: build produces Tauri-compatible dist
    Tool: Bash
    Preconditions: all prior tasks done
    Steps:
      1. npm run build → expect exit 0
      2. test -f dist/index.html → expect true
      3. grep -c 'src="./assets' dist/index.html → expect ≥1
      4. node -e "JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json')); JSON.parse(require('fs').readFileSync('src-tauri/capabilities/default.json'))" → expect no throw
      5. git diff --name-only | grep -E "src/App.tsx|src/lib/firebase.ts" → expect NO match (exit 1)
    Expected Result: build OK, relative assets, configs valid, no business-logic changes
    Failure Indicators: build fails; absolute /assets/ paths; config parse error; business file touched
    Evidence: .sisyphus/evidence/task-7-verify.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-7-verify.txt` (build + grep + parse output)

  **Commit**: NO (verification only)

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read files, run build). For each "Must NOT Have": grep codebase for forbidden patterns (App.tsx unchanged, no tauri-plugin-* added, DISABLE_HMR logic intact). Check evidence files exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` (npm run lint equivalent). Verify vite.config.ts changes are minimal and correct. Validate JSON/YAML with parsers. Check no `as any`/dead imports introduced.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  On Linux: run `npm run build`, parse dist/index.html for relative paths, validate config JSON, list icons, validate workflow YAML. (Full .exe runtime test requires Windows artifact — documented as out-of-scope for executor.)
  Output: `Scenarios [N/N pass] | Artifact-Verifiable [Y/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec built, nothing beyond. Check "Must NOT do" compliance (no business-logic edits). Flag contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- Group Wave 1 commits: `build(tauri): scaffold Tauri wrapper + vite config for desktop`
- Group Wave 2 commits: `ci: add GitHub Actions Windows .exe build`
- Note: do NOT commit `src-tauri/target/` or `dist/`. Ensure `.gitignore` covers them.

## Success Criteria

### Verification Commands
```bash
npm run build                                  # expect: dist/ with index.html
grep -c 'src="./assets' dist/index.html        # expect: >=1
node -e "JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json'))"   # expect: no throw
ls src-tauri/icons/                            # expect: icon.ico, icon.icns, 32x32.png, 128x128.png, 128x128@2x.png
node -e "JSON.parse(require('fs').readFileSync('src-tauri/capabilities/default.json'))"  # expect: no throw
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `npm run build` succeeds with relative asset paths
- [ ] CI workflow YAML valid and produces Windows `.exe` artifact
