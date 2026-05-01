# Roadmap

Last updated: 2026-04-29

---

## Completion Snapshot (as of 2026-04-29)

All foundational infrastructure and core Job OS modules are shipped:

| Area | Status |
|---|---|
| Firebase Auth + Firestore persistence | Done |
| Local-first with localStorage fallback | Done |
| Dashboard / Command Centre (next-action engine, probability engine) | Done |
| Analytics (funnel, conversion charts) | Done |
| Job OS: Companies, Roles, Applications, Outreach | Done |
| Assets Vault (CV snapshots, scripts, templates) | Done |
| Source Hub + Saved Searches | Done (PR #152) |
| CV Optimizer (profiles, tailoring, history) | Done |
| AfA Compliance module + public report | Done |
| JSON import/export | Done |
| Public landing page with auth redirect | Done |
| CI: lint, build, unit tests | Done |
| E2E: Playwright baseline (auth, pipeline, Job OS navigation) | Done |
| Branch policy + commit policy in CLAUDE.md | Done |

---

## Current Focus (April 2026)

Harden the execution loop from Source Hub through Application for a solo operator running a focused job search.

**In progress / next up:**

1. **Ship uncommitted local work** — session redirect (LandingPage) + state normalisation fix + auth refactor
2. **#117 First-class Next Action model** — add `nextActionDueDate` to roles and applications; surface in next-action engine
3. **#122 Onboarding first workflow** — guide user through: Source Hub → Company → Role → Application → Next Action
4. **#124 Normalize filters and views** — consistent filter/sort/view state across Sources, Roles, Applications

---

## Next 3 Months

### P1 — JobSprint Execution Quality

| Issue | Outcome |
|---|---|
| #117 Next Action model | Structured due-date tracking, scored in next-action engine |
| #122 Onboarding | User can complete first loop without friction |
| #124 Normalize filters | Saved views for A-fit / remote / English-first / MedTech / AI Product |
| CV Optimizer discoverability | Direct link from Applications row to CV Optimizer for the linked role |
| AfA Compliance discoverability | Link from Applications page so German job-seekers find it naturally |

### P2 — Reliability

| Issue | Outcome |
|---|---|
| #128 Unit tests | State, sync, next-action logic covered by Vitest |
| #127 E2E — full flow | Sources → Company → Role → Application → Dashboard next-action |
| #130 Bundle size | Lazy-load mammoth + pdfjs; target vendor chunk < 400 kB gzipped |

### P3 — Polish (after P1+P2 stable)

| Issue | Outcome |
|---|---|
| #123 Command palette | Quick-add + search from anywhere |
| #125 Board/list toggle | Kanban view for roles and applications |
| #126 Activity timeline | Per-entity history of status changes and outreach |

---

## Freeze List

- No framework migration.
- No MUI, Emotion, Bootstrap, or styled-components (Tailwind + Radix is the approved stack).
- No multi-user collaboration features.
- No ATS integrations before core execution loop is stable.
- No force pushes to `main`.
- No large-scale component migrations without a dedicated issue approved by the human owner.
