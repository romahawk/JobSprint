# Next Session Start

Last updated: 2026-03-20

## Where We Are

- All Month 2 issues closed.
- Month 3 sprint active. Issue #39 (Case Study README) is closed.
- Firebase auth + Firestore persistence operational.
- Current production URL: https://job-sprint-ten.vercel.app/

## What Shipped This Session (2026-03-20)

- **Command Centre** replaces legacy Dashboard: next-action engine, pipeline snapshot, probability engine (collapsible), hot opportunities, quick actions pinned to top.
- **Probability engine** extended with `responseRate`, `interviewRate`, `offerRate` computed from Job OS data.
- **Recruiter-origin flag** on roles: picker in Add/Edit form, violet badge in table.
- **Case Study section** added to README with problem/solution/key-decisions/live-link/Loom placeholder (closes #39).
- **CHANGELOG** updated for 2026-03-20.

## Remaining Open Issues (Month 3 Sprint)

### Issue #37 — E2E baseline: Playwright + CI integration

**Status:** Not started.

**Goal:** Add Playwright and a happy-path E2E suite that runs in CI.

**Acceptance criteria:**
- Playwright installed and configured (separate `playwright.config.ts`)
- At least one happy-path flow: navigate to Command Centre, verify Today's Actions renders
- E2E job added to `.github/workflows/ci.yml` after unit tests
- Suite passes without real Firebase (app falls back to local session when `VITE_FIREBASE_*` vars are absent)

**Branch:** `feat/37-e2e-playwright-baseline`

**Known risk:** CI has no Firebase credentials — tests must work in local-session fallback mode (no sign-in required when env vars are absent).

---

### Issue #38 — Import / export: JSON round-trip for application data

**Status:** Reverted. Previous attempt conflicted with the existing CSV company-import on the Companies page.

**Goal:** Users can export all Job OS data as `jobsprint-export.json` and re-import it.

**Re-scope before starting:**
- Audit what import/export already exists on `JobOsCompaniesPage` (CSV-based, companies only).
- Place the new JSON backup/restore in a **dedicated location** — either a new `/job-os/settings` sub-page or the `JobOsLayout` navbar, not the Companies page.
- Keep the existing CSV company-import untouched.

**Acceptance criteria (unchanged):**
- Export button downloads `jobsprint-export.json` (companies + roles + applications + outreach)
- Import button parses, validates schema version, merges into current state
- Invalid files show a clear error without corrupting state
- Serialisation logic covered by Vitest unit tests

**Branch:** `feat/38-import-export-json`

---

## Start Here (next session)

1. `git pull origin main && npm install && npm run lint && npm run build && npm run test`
2. Confirm CI is green on the PR for this branch.
3. Pick **#37** (Playwright) or **#38** (re-scoped import/export) — both are unblocked.
4. For #37: check if `VITE_FIREBASE_*` vars need to be stubbed in `.github/workflows/ci.yml` to allow local-session fallback.
5. For #38: read `JobOsCompaniesPage.tsx` top-to-bottom before writing any code.

## Risks To Watch

- Browser privacy blockers (Brave Shields) can break Firebase connectivity.
- Firestore rules must stay aligned with user-scoped document paths.
- Bundle size is high — do not add new heavy dependencies without checking impact.
- `docs/assets/command-centre.png` screenshot is referenced in README but not yet captured — remind the owner to screenshot and commit it before merging the PR.
