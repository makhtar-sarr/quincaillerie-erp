
## F3 — Real Manual QA (2026-07-07)

### Build note
`npm run build` exits with code 0 when `build.watch` is disabled. The `vite.config.ts` file sets `build: { watch: { ignore: ['src-tauri/**'] } }` which keeps the process alive after the build completes (intentional for AI Studio runtime). The build phase itself completes successfully (2100 modules transformed, dist output generated).

### All checks passed
1. ✅ **Build succeeds** — dist/ produced with index.html, CSS, JS bundle
2. ✅ **Relative paths** — `dist/index.html` has `src="./assets/index-..."` and `href="./assets/index-..."`
3. ✅ **tauri.conf.json** — valid JSON, correct structure (frontendDist: ../dist, icon paths match filesystem)
4. ✅ **capabilities/default.json** — valid JSON, core:default permission
5. ✅ **build-windows.yml** — valid YAML, proper CI pipeline (checkout → node → rust → npm ci → tauri-action → upload artifact)
6. ✅ **Icon set** — 16 files in src-tauri/icons/ (minimum 5 required)

### Out of scope for Linux
Full .exe runtime verification requires downloading the CI artifact + a Windows VM. This verification is architectural/configuration-level only.
