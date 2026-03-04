# Sprint Backlog

Current sprint: **Month 3 — Proof-of-Work Expansion** (2026-03-04 →)

---

## Active Issues

### Issue #37 — E2E baseline: Playwright + CI integration

**Goal:** Add Playwright and a happy-path E2E suite that runs in CI.

**Acceptance criteria:**

- [ ] Playwright installed and configured in `vite.config.ts` / separate config
- [ ] At least one happy-path flow covered: sign-in → create application → move stage → delete with undo
- [ ] E2E job added to `.github/workflows/ci.yml` after unit tests
- [ ] E2E suite passes on `main` branch (green CI badge)

**Branch:** `feat/37-e2e-playwright-baseline`
**Label:** feature

---

### Issue #38 — Import / export: JSON round-trip for application data

**Goal:** Users can export all application data as JSON and re-import it.

**Acceptance criteria:**

- [ ] Export button in Settings or Dashboard that downloads `jobsprint-export.json`
- [ ] Import button that parses the file and merges/replaces current data
- [ ] Schema validation on import (invalid files show a clear error, do not corrupt state)
- [ ] Export/import is covered by a Vitest unit test for the serialisation logic
- [ ] Changelog updated

**Branch:** `feat/38-import-export-json`
**Label:** feature

---

### Issue #39 — Case-study section in README with Loom link

**Goal:** Add a portfolio-facing case-study narrative to README.

**Acceptance criteria:**

- [ ] "Case Study" section added to README above the "Setup" section
- [ ] Section includes: problem, solution, key decisions, live link, and Loom link placeholder
- [ ] Loom placeholder replaced with actual Loom URL before PR is merged
- [ ] Screenshot of the section committed to `docs/assets/` and embedded

**Branch:** `docs/39-case-study-readme`
**Label:** docs

---

## Icebox (not in current sprint)

- Offline/connection UX polish for Firebase sync errors
- Release KPI snapshots page
- First multi-user collaboration spike

---

## Definition of Done (all issues)

- Acceptance criteria checkboxes all ticked
- `npm run lint && npm run build` pass
- PR references `Closes #N`
- `CHANGELOG.md` updated (for feature/chore/bug labels)
- Demo artifact attached to PR (screenshot or Loom)
