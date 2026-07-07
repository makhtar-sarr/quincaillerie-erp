# Draft: Tauri Desktop Integration

## Requirements (confirmed)
- Initialize git in the project (no repo yet)
- Commit the existing Tauri scaffold + CI workflow
- Push to GitHub to trigger the build-windows.yml workflow
- Retrieve the .exe artifact from GitHub Actions
- Test the .exe on a Windows machine

## Technical Decisions
- **Tauri version**: v2.11.3 (already configured)
- **Frontend**: Vite + React 19 + TypeScript
- **CI**: GitHub Actions with `tauri-apps/tauri-action@v1`
- **Build target**: Windows NSIS installer (.exe)

## Research Findings
- Project already has complete Tauri scaffold in `src-tauri/`
- `build-windows.yml` workflow is configured and ready
- `@tauri-apps/api` and `@tauri-apps/cli` are in package.json
- CSP security policy is configured for Firebase and Google APIs
- `.gitignore` already exists with proper exclusions (node_modules/, dist/, .env*, etc.)
- Git is NOT initialized yet (user confirmed "pas encore de repo")

## Actual Project State
- **Git**: NOT initialized (no .git directory)
- **.gitignore**: EXISTS with proper exclusions
- **Tauri scaffold**: COMPLETE in `src-tauri/`
- **CI workflow**: EXISTS in `.github/workflows/build-windows.yml`
- **Dependencies**: `@tauri-apps/api` and `@tauri-apps/cli` in package.json

## Open Questions
- None - all requirements are clear

## Scope Boundaries
- INCLUDE: Git init, commit, push, CI trigger, artifact download, testing
- EXCLUDE: Any code changes - the scaffold is already complete
- EXCLUDE: Creating .gitignore - it already exists
