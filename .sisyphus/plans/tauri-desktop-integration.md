# Plan: Tauri Desktop Integration - Git Init & CI Pipeline

## TL;DR

> **Quick Summary**: Initialize git, commit the existing Tauri desktop scaffold and CI workflow, push to GitHub to trigger Windows .exe build, and test the artifact.
> 
> **Deliverables**:
> - Git repository initialized (`.gitignore` already exists)
> - Single commit containing Tauri scaffold + CI workflow
> - GitHub repository with CI pipeline running
> - Windows .exe artifact downloaded and tested
> 
> **Estimated Effort**: Quick (20 minutes)
> **Parallel Execution**: NO - sequential steps required
> **Critical Path**: Git init → Commit → Push → CI → Download → Test

---

## Context

### Original Request
User wants to:
1. Initialize git in the project (no repo yet)
2. Commit the existing Tauri desktop wrapper + CI workflow
3. Push to GitHub to trigger the build-windows.yml workflow
4. Retrieve the .exe artifact from GitHub Actions
5. Test the .exe on a Windows machine

### Research Findings
**Project Status**: Tauri scaffold is already complete!
- `src-tauri/` directory with `tauri.conf.json`, `Cargo.toml`, icons, capabilities
- `build-windows.yml` GitHub Actions workflow configured
- `@tauri-apps/api` and `@tauri-apps/cli` in package.json
- CSP security policy configured for Firebase and Google APIs
- `.gitignore` already exists with proper exclusions (node_modules/, dist/, .env*, etc.)

**Key Configuration**:
- Tauri v2.11.3 with Windows NSIS installer target
- CI triggers on push to `main` or `release` branches
- Artifact uploaded to `src-tauri/target/release/bundle/nsis/*.exe`

---

## Work Objectives

### Core Objective
Initialize git repository and establish CI pipeline for building Windows desktop executable from existing Tauri scaffold.

### Concrete Deliverables
- Git repository initialized (`.gitignore` pre-existing)
- GitHub repository with CI workflow
- Windows .exe artifact (built by CI)
- Verified working desktop application

### Definition of Done
- [ ] Git repository initialized and first commit pushed
- [ ] GitHub Actions workflow triggered and completed successfully
- [ ] Windows .exe artifact downloaded from Actions tab
- [ ] .exe tested and running on Windows machine

### Must Have
- Single atomic commit with all Tauri files
- CI workflow triggered on push

### Must NOT Have (Guardrails)
- No code changes - the scaffold is already complete
- No modifications to `tauri.conf.json` or `Cargo.toml`
- No additions to `package.json` - dependencies already present
- No changes to existing React application code
- No modifications to `.gitignore` - it's already correct

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test suite)
- **Automated tests**: None
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Git Operations**: Use Bash - verify git status, log, remote configuration
- **CI Monitoring**: Use webfetch - check GitHub Actions status
- **Artifact Download**: Use Bash - verify file exists and is valid

---

## Execution Strategy

### Sequential Execution (Linear Flow)

```
Task 1: Initialize Git Repository [quick]
    ↓
Task 2: Commit Tauri Scaffold + CI [quick]
    ↓
Task 3: Create GitHub Repository & Push [quick]
    ↓
Task 4: Monitor CI Pipeline [unspecified-high]
    ↓
Task 5: Download & Test .exe Artifact [unspecified-high]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | - | 2 |
| 2 | 1 | 3 |
| 3 | 2 | 4 |
| 4 | 3 | 5 |
| 5 | 4 | - |

---

## TODOs

- [x] 1. Initialize Git Repository

  **What to do**:
  - Run `git init` in project root
  - Configure git user (if not already set)
  - Verify git status shows all project files
  - Note: `.gitignore` already exists with proper exclusions

  **Must NOT do**:
  - Do not create any files (`.gitignore` already exists)
  - Do not make any commits yet

  **Recommended Agent Profile**:
  > Quick git operation, no special skills needed.
  - **Category**: `quick`
    - Reason: Simple git initialization command
  - **Skills**: []
    - No skills needed for basic git operations
  - **Skills Evaluated but Omitted**:
    - `git-master`: Overkill for simple `git init`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 1 of 5)
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - None - this is a standard git initialization

  **API/Type References**:
  - None

  **External References**:
  - Git documentation: `https://git-scm.com/docs/git-init`

  **WHY Each Reference Matters**:
  - Standard git operation, no project-specific patterns needed

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Git repository initialized successfully
    Tool: Bash
    Preconditions: No .git directory exists in project root
    Steps:
      1. Run: git init
      2. Run: git status
      3. Verify output shows "On branch main" or "On branch master"
      4. Verify .git directory exists: ls -la .git
      5. Verify .gitignore is tracked: git status --short | grep ".gitignore"
    Expected Result: Git repository initialized, .gitignore present
    Failure Indicators: git command fails, .git directory missing
    Evidence: .sisyphus/evidence/task-1-git-init.txt

  Scenario: Git user configuration verified
    Tool: Bash
    Preconditions: Git repository initialized
    Steps:
      1. Run: git config user.name
      2. Run: git config user.email
      3. Verify both return non-empty values
    Expected Result: Git user configured with name and email
    Failure Indicators: Empty output from git config commands
    Evidence: .sisyphus/evidence/task-1-git-config.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-git-init.txt - Output of git init and git status
  - [ ] task-1-git-config.txt - Output of git config commands

  **Commit**: NO (initialization only)

---

- [ ] 2. Commit Tauri Scaffold + CI

  **What to do**:
  - Stage all project files: `git add .`
  - Create initial commit with message: `build(tauri): scaffold Tauri desktop wrapper + CI`
  - Verify commit contains all expected files
  - Verify commit hash is created

  **Must NOT do**:
  - Do not modify any files before commit
  - Do not create multiple commits
  - Do not push yet (Task 3)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard git commit operation
  - **Skills**: []
    - No skills needed for basic git commit
  - **Skills Evaluated but Omitted**:
    - `git-master`: Overkill for single commit operation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 2 of 5)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References** (CRITICAL):

  **Pattern References**:
  - Conventional Commits: `https://www.conventionalcommits.org/`
  - Commit message format: `build(tauri): scaffold Tauri desktop wrapper + CI`

  **External References**:
  - Git add documentation: `https://git-scm.com/docs/git-add`
  - Git commit documentation: `https://git-scm.com/docs/git-commit`

  **WHY Each Reference Matters**:
  - Ensures commit message follows project conventions
  - Verifies all files are staged correctly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Commit created successfully
    Tool: Bash
    Preconditions: Git initialized, .gitignore exists
    Steps:
      1. Run: git add .
      2. Run: git status
      3. Verify all files are staged (green)
      4. Run: git commit -m "build(tauri): scaffold Tauri desktop wrapper + CI"
      5. Run: git log --oneline -1
      6. Verify output shows commit hash and message
    Expected Result: Commit created with correct message
    Failure Indicators: Git commit fails, wrong message
    Evidence: .sisyphus/evidence/task-2-commit.txt

  Scenario: Commit contains expected files
    Tool: Bash
    Preconditions: Commit created
    Steps:
      1. Run: git show --stat HEAD
      2. Verify src-tauri/ directory is included
      3. Verify .github/workflows/build-windows.yml is included
      4. Verify package.json is included
      5. Verify src/ directory is included
    Expected Result: All Tauri and CI files present in commit
    Failure Indicators: Missing files in commit
    Evidence: .sisyphus/evidence/task-2-commit-files.txt
  ```

  **Evidence to Capture:**
  - [ ] task-2-commit.txt - Git commit output and log
  - [ ] task-2-commit-files.txt - Files included in commit

  **Commit**: YES (this IS the commit)
  - Message: `build(tauri): scaffold Tauri desktop wrapper + CI`
  - Files: All project files (excluding .gitignore exclusions)

---

- [ ] 3. Create GitHub Repository & Push

  **What to do**:
  - Create GitHub repository using `gh repo create`
  - Add remote origin to local repository
  - Push commit to GitHub: `git push -u origin main`
  - Verify remote is configured correctly

  **Must NOT do**:
  - Do not create repository manually via web UI
  - Do not force push
  - Do not push to wrong branch

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: GitHub CLI operations
  - **Skills**: []
    - No skills needed for basic GitHub operations
  - **Skills Evaluated but Omitted**:
    - `git-master`: Overkill for simple push operation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 3 of 5)
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References** (CRITICAL):

  **Pattern References**:
  - GitHub CLI documentation: `https://cli.github.com/manual/gh_repo_create`
  - Git remote documentation: `https://git-scm.com/docs/git-remote`

  **External References**:
  - GitHub API: For repository creation
  - Git push documentation: `https://git-scm.com/docs/git-push`

  **WHY Each Reference Matters**:
  - Ensures correct repository creation and push process

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: GitHub repository created and push successful
    Tool: Bash
    Preconditions: Local commit exists
    Steps:
      1. Run: gh repo create quincaillerie-erp --private --source=. --remote=origin --push
      2. Verify command succeeds (exit code 0)
      3. Run: git remote -v
      4. Verify origin remote points to GitHub URL
      5. Run: git log --oneline -1
      6. Verify local and remote commits match
    Expected Result: Repository created on GitHub with commit pushed
    Failure Indicators: gh command fails, push rejected
    Evidence: .sisyphus/evidence/task-3-github-push.txt

  Scenario: Remote configuration verified
    Tool: Bash
    Preconditions: Push completed
    Steps:
      1. Run: git remote -v
      2. Verify origin shows fetch and push URLs
      3. Run: git branch -vv
      4. Verify main branch tracks origin/main
    Expected Result: Remote properly configured and tracking
    Failure Indicators: Missing remote, not tracking
    Evidence: .sisyphus/evidence/task-3-remote-config.txt
  ```

  **Evidence to Capture:**
  - [ ] task-3-github-push.txt - Repository creation and push output
  - [ ] task-3-remote-config.txt - Remote configuration verification

  **Commit**: NO (pushing existing commit)

---

- [ ] 4. Monitor CI Pipeline

  **What to do**:
  - Check GitHub Actions workflow status
  - Wait for workflow to complete (may take 5-10 minutes)
  - Verify workflow succeeds (green checkmark)
  - If fails, identify and document failure reason

  **Must NOT do**:
  - Do not cancel or restart workflow
  - Do not modify workflow file
  - Do not bypass CI checks

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires monitoring and potential troubleshooting
  - **Skills**: []
    - No special skills needed for CI monitoring
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 4 of 5)
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References** (CRITICAL):

  **Pattern References**:
  - GitHub Actions documentation: `https://docs.github.com/en/actions`
  - Tauri GitHub Action: `https://github.com/tauri-apps/tauri-action`

  **External References**:
  - Workflow file: `.github/workflows/build-windows.yml`
  - GitHub Actions status API

  **WHY Each Reference Matters**:
  - Understanding workflow structure helps identify issues
  - Tauri action documentation explains build process

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CI workflow triggered and running
    Tool: Bash
    Preconditions: Repository pushed to GitHub
    Steps:
      1. Run: gh run list --workflow=build-windows.yml --limit=1
      2. Verify workflow "Build Windows EXE" is listed
      3. Verify workflow status shows "in_progress" or "completed"
      4. If completed, verify status is "success" (green checkmark)
    Expected Result: Workflow triggered and running/completed
    Failure Indicators: Workflow not found, failed status
    Evidence: .sisyphus/evidence/task-4-ci-status.txt

  Scenario: CI workflow completed successfully
    Tool: Bash
    Preconditions: Workflow completed
    Steps:
      1. Run: gh run list --workflow=build-windows.yml --limit=1
      2. Verify conclusion column shows "success"
      3. Run: gh run view {run-id}
      4. Verify all steps passed
    Expected Result: Workflow completed with success status
    Failure Indicators: Failed or cancelled workflow
    Evidence: .sisyphus/evidence/task-4-ci-complete.txt
  ```

  **Evidence to Capture:**
  - [ ] task-4-ci-status.txt - Workflow status from GitHub
  - [ ] task-4-ci-complete.txt - Workflow completion details

  **Commit**: NO (monitoring only)

---

- [ ] 5. Download & Test .exe Artifact

  **What to do**:
  - Download Windows installer artifact from GitHub Actions
  - Verify artifact file exists and is valid .exe
  - Document testing instructions for Windows machine
  - (Optional) If Windows machine available, test installation

  **Must NOT do**:
  - Do not modify the artifact
  - Do not distribute the artifact publicly
  - Do not skip verification steps

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires artifact handling and potential cross-platform testing
  - **Skills**: []
    - No special skills needed for artifact download
  - **Skills Evaluated but Omitted**:
    - None applicable

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 5 of 5)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 4

  **References** (CRITICAL):

  **Pattern References**:
  - GitHub Actions artifact download: `https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun`
  - Tauri build output: `src-tauri/target/release/bundle/nsis/*.exe`

  **External References**:
  - GitHub CLI artifact download: `gh run download`
  - NSIS installer documentation

  **WHY Each Reference Matters**:
  - Ensures correct artifact download process
  - Verifies expected output location matches workflow

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Artifact downloaded successfully
    Tool: Bash
    Preconditions: CI workflow completed successfully
    Steps:
      1. Run: gh run download --name windows-installer --dir ./artifacts
      2. Verify command succeeds (exit code 0)
      3. Run: ls -la ./artifacts/
      4. Verify .exe file exists
      5. Run: file ./artifacts/*.exe
      6. Verify output shows "PE32+ Windows executable" or similar
    Expected Result: .exe artifact downloaded and valid
    Failure Indicators: Download fails, file missing or invalid
    Evidence: .sisyphus/evidence/task-5-artifact-download.txt

  Scenario: Artifact ready for Windows testing
    Tool: Bash
    Preconditions: Artifact downloaded
    Steps:
      1. Run: ls -lh ./artifacts/*.exe
      2. Verify file size is reasonable (>10MB)
      3. Create testing instructions file
      4. Document: "Transfer .exe to Windows machine and run"
    Expected Result: Artifact ready for distribution/testing
    Failure Indicators: File too small, missing, or corrupt
    Evidence: .sisyphus/evidence/task-5-artifact-ready.txt
  ```

  **Evidence to Capture:**
  - [ ] task-5-artifact-download.txt - Download output and file verification
  - [ ] task-5-artifact-ready.txt - Testing instructions and file details

  **Commit**: NO (artifact handling only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> After completing all tasks, perform final verification to ensure everything works.

- [ ] F1. **Git Repository Verified** — `quick`
  Verify git repository is properly initialized, commit exists, and remote is configured.

- [ ] F2. **CI Pipeline Verified** — `unspecified-high`
  Verify GitHub Actions workflow completed successfully and artifact is available.

- [ ] F3. **Artifact Verified** — `unspecified-high`
  Verify Windows .exe artifact downloaded and is valid for testing.

---

## Commit Strategy

- **Task 2**: `build(tauri): scaffold Tauri desktop wrapper + CI` - All project files (excluding .gitignore exclusions)

---

## Success Criteria

### Verification Commands
```bash
# Verify git initialized
git status  # Expected: On branch main, nothing to commit

# Verify remote configured
git remote -v  # Expected: origin https://github.com/{username}/quincaillerie-erp.git

# Verify CI workflow
gh run list --workflow=build-windows.yml  # Expected: Recent successful run

# Verify artifact downloaded
ls -la ./artifacts/*.exe  # Expected: Valid .exe file
```

### Final Checklist
- [ ] Git repository initialized
- [ ] Commit created with Tauri scaffold + CI
- [ ] GitHub repository created and commit pushed
- [ ] CI workflow triggered and completed successfully
- [ ] Windows .exe artifact downloaded
- [ ] Artifact verified as valid Windows executable
- [ ] Testing instructions documented
