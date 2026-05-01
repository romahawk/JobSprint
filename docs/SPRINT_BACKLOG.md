# Sprint Backlog

Last updated: 2026-04-29
Current canonical branch: `main`
Production: https://job-sprint-ten.vercel.app/

---

## P0 — Repo Health (do first)

| # | Issue | Status | Notes |
|---|---|---|---|
| — | Make `main` canonical | DONE (2026-04-29) | Remote dev and feat/131 deleted; main is the only remote branch |
| — | Prune stale worktrees | DONE (2026-04-29) | 3 stale worktrees pruned |
| — | Validate build/lint/test | DONE (2026-04-29) | All 16 tests pass; lint clean; build clean |
| — | Update ARCHITECTURE.md | DONE (2026-04-29) | Full rewrite reflecting current data model and structure |
| — | Update SPRINT_BACKLOG.md | DONE (2026-04-29) | This file |
| — | Update NEXT_SESSION_START.md | DONE (2026-04-29) | See docs/NEXT_SESSION_START.md |
| — | Ship local feat/131 work as PR | PENDING | 1 unpushed commit + 3 modified files on local feat/131-source-hub-workflow; create `feat/153-source-hub-seed-and-session` and PR |

### In-progress work on local feat/131-source-hub-workflow (NOT YET IN MAIN)

Three files have uncommitted changes that should go into their own PR:

- `src/app/hooks/useJobOs.ts` — wrap state merge in `normalizeJobOsState()` (correctness fix)
- `src/app/services/auth.ts` — extract `readStoredSession()` helper (code quality)
- `src/marketing/LandingPage.tsx` — redirect already-signed-in users to `/app` (UX fix)

**Recommended action:** Create branch `fix/153-session-redirect-and-auth-cleanup`, commit these changes, open PR referencing a new issue or `Closes #153`.

---

## P1 — JobSprint Effectiveness

| Priority | Issue | Label | Action |
|---|---|---|---|
| 1.1 | #117 — Add first-class Next Action model | P1 / data / feature | Keep; branch `feat/117` has real feature work (nextActionDueDate). Create PR. |
| 1.2 | #122 — Add onboarding for first workflow | P1 / onboarding / ux | Keep; branch `feat/122` has Getting Started checklist work. Create PR. |
| 1.3 | #124 — Normalize filters and views | P1 / consistency / ux | Keep; no branch yet. Next actionable issue after #117/#122. |
| 1.4 | Source Hub defaults | — | Harden default sources and saved searches seeded by `jobOsState.ts` |
| 1.5 | CV Optimizer discoverability | — | CV Optimizer is hidden under System nav; add link from Applications and Assets pages |
| 1.6 | AfA Compliance placement | — | AfA feels detached; add link from Applications page for German job-seekers |

---

## P2 — Reliability

| Priority | Issue | Label | Action |
|---|---|---|---|
| 2.1 | #128 — Expand unit tests for state/sync | P2 / quality / testing | Keep; good next step after P1 features |
| 2.2 | #127 — Playwright E2E for core flow | P2 / quality / testing | Keep; update scope — existing e2e tests need to cover Sources → Application full flow |
| 2.3 | #130 — Reduce bundle size | P2 / performance | Keep; vendor chunk 821 kB is real concern; mammoth + pdfjs are the main offenders |
| 2.4 | #129 — Runtime monitoring | P2 / infra | Defer; add only after core flow is stable |

---

## P3 — Polish

| Priority | Issue | Label | Action |
|---|---|---|---|
| 3.1 | #123 — Command palette | P1 / ux / feature | Defer to P3; nice-to-have after flow is solid |
| 3.2 | #125 — Board/list toggle + batch | P1 / ux / feature | Defer to P3 |
| 3.3 | #126 — Activity timeline | P1 / ux / feature | Defer to P3 |

---

## Local Branches Requiring Manual Review

These local branches have unique commits vs `main` and have not been deleted. Each needs a decision:

| Branch | Unique work | Recommended action |
|---|---|---|
| `feat/117-structured-next-action` | nextActionDueDate field + Getting Started checklist | Create PR for issue #117 |
| `feat/122-first-workflow-onboarding` | Getting Started checklist (same commit as #117 branch) | Investigate if #117 PR covers this; may close #122 as duplicate scope |
| `claude/paste-link-import-engine-Gmr65` | 5 commits — Dashboard command center, unified add modal, entity model | Verify if content is already in `main` via other PRs; likely safe to delete but needs human review |
| `feat/115-116-unified-add-modal-dashboard-engine` | AfA label swap commit | Check if swap is in `main`; if yes, delete branch |
| `feat/119-auto-link-entities` | 1 e2e test fix | Likely superseded; check tests/e2e and delete if covered |
| `feat/47-navbar-jobos-standardization` | Row index in companies table | Check if in main; if yes, delete |
| `feat/88-ai-job-ingestion` | Probability smoothing | Check if in main; if yes, delete |

---

## Definition of Done (all issues)

- Acceptance criteria checkboxes ticked
- `npm run lint && npm run build && npm run test` pass
- PR references `Closes #N` in both commit body and PR body
- `CHANGELOG.md` updated
- Demo artifact or N/A declared in PR
