# Next Session Start

Last updated: 2026-03-20

## Read This First

Treat this file as the session handoff source of truth.

Required process before making changes:

1. Read this file fully, then check `docs/ROADMAP.md` and `CHANGELOG.md`.
2. Run `git status --short` and `git log -1 --stat --oneline`.
3. Verify completed items in code before touching them.
4. Do not rebuild or replace a finished implementation unless you find a concrete bug or regression.
5. If something looks partially done, confirm it in the codebase and current UI before editing.
6. Update this file again at the end of the session.

## Current State

All Month 3 sprint issues are closed:
- #37 Playwright E2E baseline ✅
- #38 JSON export/import ✅
- #39 Case Study README ✅

Firebase auth + Firestore persistence operational.
Current production URL: https://job-sprint-ten.vercel.app/

## What Shipped This Session (2026-03-20)
- All planned Week 1-4 and Month 2 issues are closed.
- Firebase auth + Firestore persistence are integrated.
- Current production URL: https://job-sprint-ten.vercel.app/
- Latest commit at handoff: `3b00d0c` - `Ship hosted case study and tighten bundle reporting`

## Completed

- Dashboard right rail is more compact: Quick Actions stay accessible, and Probability Engine is collapsed by default.
- Today's Actions now surfaces missing `Log Application` tasks when a role has progressed without a linked application record.
- Roles page now starts with `Add Role` collapsed and blocks duplicate application creation for the same role with explicit feedback.
- Job OS import/export is available from the shared settings panel on all major Job OS surfaces.
- Assets Vault now works like a CV constructor: up to 5 managed CV variants, one default CV, linked application visibility, inline script/template editing, and stable `cvAssetId` links behind application records.
- Playwright now covers role-to-application logging, the Assets Vault CV constructor, CV file import, reusable asset delete confirmations, and Job OS import/export.
- Route-level lazy loading and focused manual chunk splitting are in place, including a lazy-loaded pipeline board on the legacy dashboard and file-type-specific CV import parsing for PDF and DOCX.
- Outward-facing artifact is now packaged as a hosted page: `/case-study/assets-vault`, with the repo markdown case study kept as source/supporting material.
- The README now points at the hosted case study first.
- Playwright CI now uploads HTML + raw artifacts and emits JUnit output for easier failure inspection.

## Do Not Rebuild

- Do not recreate the hosted case study from scratch. It already exists in `src/app/pages/CaseStudyAssetsVaultPage.tsx`.
- Do not re-implement CV import parsing. The import path is already split into `cvFileImportService`, `cvPdfImportService`, and `cvDocxImportService`.
- Do not redo the Job OS duplicate-prevention or CV-linking fixes unless you find a regression in current behavior.
- Do not replace the Playwright artifact setup unless there is a concrete CI problem with the current HTML/JUnit flow.

## Still Open

- The remaining shared `vendor` chunk is still above the ideal threshold and is the main bundle-size pressure point.
- Reviewer-facing polish for the hosted case study may still be worth doing after the next deploy review.
- Playwright reporting is better, but more polish is still possible if CI feedback is still hard to scan.

## First Checks (first 30 minutes)

1. Pull latest `main` and run checks:
   - `npm install`
   - `npm run test`
   - `npm run test:e2e`
   - `npm run build`
2. Verify Firebase env vars in local `.env` and Vercel environment settings.
3. Reproduce quick smoke in browser:
   - Sign in (email/password or Google)
   - Create one application
   - Refresh page and confirm persistence
4. Reproduce the latest Job OS UX guardrails in browser:
   - Add a role and confirm `Add Role` stays collapsed by default
   - Create one application from Roles and confirm success notice appears
   - Try to create the same application again and confirm duplicate prevention
5. Reproduce the latest Assets Vault behavior in browser:
   - Upload a CV text file and confirm snapshot import feedback appears
   - Upload one PDF CV and one DOCX CV and confirm the import path still succeeds after the parser split
   - Create, duplicate, rename, and delete a CV variant
   - Delete a script/template via modal and confirm toast feedback appears
   - Export then import Job OS state from settings and confirm reusable assets reappear
6. Open or confirm Month 3 issues for:
   - final reviewer-facing polish for the hosted case study
   - deeper shared-vendor bundle reduction
   - any extra CI/reporting polish beyond the new HTML/JUnit artifact setup

**Command Centre & UX**
- Command Centre replaces legacy Dashboard as primary surface: next-action engine,
  pipeline snapshot, probability engine (collapsible, closed by default), hot opportunities.
- Quick Actions pinned to top of right column for always-accessible navigation.
- Recruiter-origin flag on roles: picker in Add/Edit form, violet badge in table.
- Probability engine extended with `responseRate`, `interviewRate`, `offerRate`.

**#37 — Playwright E2E baseline**
- `playwright.config.ts`: Chromium only, uses `vite preview` (port 4173), retries=2 in CI.
- `e2e/helpers.ts`: `signIn()` helper uses local-session auth (no Firebase required).
- `e2e/auth.spec.ts`: sign-in renders, local sign-in redirects to /, unauthenticated → /signin.
- `e2e/command-centre.spec.ts`: Today's Actions, Pipeline Snapshot, Quick Actions, all four
  nav links, Probability Engine toggle.
- `e2e/job-os-navigation.spec.ts`: Companies / Roles / Applications pages, AppNavbar links.
- `ci.yml`: `e2e` job (needs: build) installs chromium, builds, runs `test:e2e`, uploads
  report artifact on failure.
- `vite.config.ts`: excludes `e2e/**` from Vitest runner.
`[M3-06] perf: reduce remaining shared vendor bundle weight`

**#38 — JSON export/import**
- `src/app/services/jobOsExport.ts`: serialize / parse / download utilities, schema v1.
- `src/app/services/jobOsExport.test.ts`: 9 Vitest unit tests (all passing).
- `useJobOs.importAll()`: optimistic local state + Firestore setDoc merge.
- `src/app/pages/job-os/JobOsSettingsPage.tsx`: Export + Import at `/job-os/settings`.
- `JobOsLayout`: Settings nav link added; existing CSV company import untouched.

**#39 — Case Study README**
- Problem / solution / key-decisions table / live link / Loom placeholder added.
- CHANGELOG updated.
- The remaining shared `vendor` chunk is materially smaller or split more intentionally.
- The default signed-in path avoids loading dependencies that are only needed for secondary workflows.
- Existing unit, E2E, and build checks stay green.
- Any chunking tradeoffs are captured in docs or commit notes.

## Key Files

- `src/app/pages/CaseStudyAssetsVaultPage.tsx`
- `src/app/routes.tsx`
- `src/services/cvFileImportService.ts`
- `src/services/cvPdfImportService.ts`
- `src/services/cvDocxImportService.ts`
- `playwright.config.ts`
- `.github/workflows/ci.yml`
- `vite.config.ts`

## Open TODOs (require human action before merging PR)

1. Record Loom walkthrough → replace `<!-- TODO: replace with Loom URL -->` in README.
2. Screenshot Command Centre → save as `docs/assets/command-centre.png`.
3. Verify E2E job passes in GitHub Actions CI (needs live PR + GitHub Actions run).

## Icebox (not in current sprint)

- Offline/connection UX polish for Firebase sync errors
- Release KPI snapshots page
- First multi-user collaboration spike

## Start Here (next session)

1. `git pull origin main && npm install && npm run lint && npm run build && npm run test`
2. Check GitHub Actions CI is green for the PR (especially the new `e2e` job).
3. Check the icebox — pick the next roadmap-aligned issue or ask the owner for a new sprint brief.

## Risks To Watch

- Playwright E2E job has never run in real CI — monitor first PR run for any
  `webServer` timing or browser install issues.
- `docs/assets/command-centre.png` is referenced in README but not yet committed.
- Bundle size is high — do not add new heavy dependencies without checking impact.
- Firestore rules must stay aligned with user-scoped document paths.
- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size improved after route splitting, dashboard DnD lazy loading, and file-type-specific CV import loading, but the shared vendor chunk is still the main pressure point.
- CV labels are now safer because application rows carry `cvAssetId`, but older records may still rely on name fallback until more users touch or re-save them.

## Prompt To Reuse

Use this at the start of the next Claude/Codex session:

`Continue from docs/NEXT_SESSION_START.md. Before making changes, read this handoff plus docs/ROADMAP.md and CHANGELOG.md, check git status and the latest commit, verify what is already completed in code, do not rebuild finished work unless you find a regression, then implement the next smallest unfinished roadmap-aligned task and update the handoff when done.`
