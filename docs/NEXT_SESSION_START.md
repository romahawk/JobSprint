# Next Session Start

Last updated: 2026-04-29

---

## Current State

**Production URL:** https://job-sprint-ten.vercel.app/

**Canonical branch:** `main`
Remote branches: only `origin/main` (dev and feat/131 were merged and deleted 2026-04-29)

**Checks (as of 2026-04-29):**
- `npm run lint` — PASS (0 warnings)
- `npm run build` — PASS (warnings on chunk size > 500 kB — mammoth, pdfjs, vendor)
- `npm run test` — PASS (16/16 Vitest unit tests)
- `npm run test:e2e` — Not re-run in this session; last known state: passing on CI

---

## What Shipped Since Last Session

**PR #152 — feat/131 Source Hub Workflow (merged to main)**
- Source Hub page (`/app/job-os/sources`) is live
- Saved Searches management included
- Qualification Queue integration: `DiscoveryStatus` flow from `discovered` → `to_apply`
- Default source library and saved searches seeded in `jobOsState.ts`

**Repo audit (2026-04-29):**
- `origin/dev` and `origin/feat/131-source-hub-workflow` remote branches deleted (merged)
- 11 local branches deleted (fully merged to main)
- 3 stale git worktrees pruned
- `docs/ARCHITECTURE.md` rewritten to reflect current data model and structure
- `docs/SPRINT_BACKLOG.md` replaced with current backlog
- `docs/NEXT_SESSION_START.md` updated (this file)
- `docs/ROADMAP.md` updated

---

## Uncommitted Work on Local `feat/131-source-hub-workflow`

There are **3 modified files + 1 unpushed commit** on the local branch that are NOT yet in `main`:

1. **Unpushed commit** (`bdedc42`): `feat(job-os): seed default source library and saved searches`
   - Changes `useJobOs.ts` and `jobOsState.ts`
2. **`src/app/hooks/useJobOs.ts`** — wrap state merge in `normalizeJobOsState()` (fixes edge-case state corruption)
3. **`src/app/services/auth.ts`** — extract `readStoredSession()` helper (clean refactor, no behaviour change)
4. **`src/marketing/LandingPage.tsx`** — redirect already-signed-in users directly to `/app` instead of showing the landing page

**Action required:** Create `fix/153-session-redirect-and-auth-cleanup` (or similar), commit these three files, open a PR. This is small and low-risk but improves UX (no landing flash for signed-in users) and correctness (state normalisation).

---

## Start Here (first 30 minutes)

```bash
git checkout main
git pull origin main
npm install
npm run lint
npm run test
npm run build
```

Then verify in browser:
1. Sign in → confirm redirect to `/app` works
2. Sign out → confirm landing page is shown to unauthenticated users
3. Source Hub → confirm default sources are seeded
4. Add a company → role → application → check Dashboard shows next action

---

## Recommended Next Issues

**Immediate (create PR):**
1. Ship the 3 uncommitted files from local `feat/131` as `fix/153-session-redirect-and-auth-cleanup`

**Next sprint (P1):**
2. **#117** — First-class Next Action model (branch `feat/117-structured-next-action` has initial work)
3. **#122** — Onboarding first workflow (branch `feat/122-first-workflow-onboarding` has initial work; may overlap with #117)
4. **#124** — Normalize filters and views (no branch yet)

**Deferred:**
5. **#123** Command palette — polish, not blocking
6. **#125** Board/list toggle — polish
7. **#126** Activity timeline — polish

---

## Risks To Watch

- **Vendor chunk (821 kB)**: mammoth + pdfjs are the heaviest. Issue #130 tracks this. Do not add new heavy libraries without checking bundle impact.
- **State normalisation edge cases**: The `normaliseJobOsState()` change in the uncommitted work is important — without it, partial merges of Job OS state can produce inconsistent entities. Ship it promptly.
- **E2E stability**: Playwright suite covers sign-in, pipeline, and Job OS navigation but does NOT yet cover the Sources flow. Add a Sources smoke test when shipping #117.
- **Local branches with open work**: See `docs/SPRINT_BACKLOG.md` for branches needing review before deletion.
- **AfA Compliance discoverability**: AfA is under "System" in the top nav but not in the Job OS sidebar. German job-seekers may not find it. Consider adding a link from the Applications page.

---

## Product Module Status

| Module | Route | Status |
|---|---|---|
| Dashboard / Command Centre | `/app` | Stable |
| Analytics | `/app/analytics` | Stable |
| Source Hub | `/app/job-os/sources` | Shipped PR #152 |
| Companies | `/app/job-os/companies` | Stable |
| Roles | `/app/job-os/roles` | Stable |
| Applications | `/app/job-os/applications` | Stable |
| Outreach | `/app/job-os/outreach` | Stable |
| Assets Vault | `/app/job-os/assets` | Stable |
| CV Optimizer | `/app/cv-optimizer` | Stable (needs discoverability fix) |
| AfA Compliance | `/app/compliance/afa` | Stable (needs discoverability fix) |
| Settings / Export | `/app/job-os/settings` | Stable |
