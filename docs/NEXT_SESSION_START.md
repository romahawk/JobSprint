# Next Session Start

Last updated: 2026-03-20

## Where We Are

All Month 3 sprint issues are closed:
- #37 Playwright E2E baseline ✅
- #38 JSON export/import ✅
- #39 Case Study README ✅

Firebase auth + Firestore persistence operational.
Current production URL: https://job-sprint-ten.vercel.app/

## What Shipped This Session (2026-03-20)

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

**#38 — JSON export/import**
- `src/app/services/jobOsExport.ts`: serialize / parse / download utilities, schema v1.
- `src/app/services/jobOsExport.test.ts`: 9 Vitest unit tests (all passing).
- `useJobOs.importAll()`: optimistic local state + Firestore setDoc merge.
- `src/app/pages/job-os/JobOsSettingsPage.tsx`: Export + Import at `/job-os/settings`.
- `JobOsLayout`: Settings nav link added; existing CSV company import untouched.

**#39 — Case Study README**
- Problem / solution / key-decisions table / live link / Loom placeholder added.
- CHANGELOG updated.

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
