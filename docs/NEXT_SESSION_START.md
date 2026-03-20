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

## Recommended First Issue Next Session

`[M3-06] perf: reduce remaining shared vendor bundle weight`

Acceptance criteria:

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

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size improved after route splitting, dashboard DnD lazy loading, and file-type-specific CV import loading, but the shared vendor chunk is still the main pressure point.
- CV labels are now safer because application rows carry `cvAssetId`, but older records may still rely on name fallback until more users touch or re-save them.

## Prompt To Reuse

Use this at the start of the next Claude/Codex session:

`Continue from docs/NEXT_SESSION_START.md. Before making changes, read this handoff plus docs/ROADMAP.md and CHANGELOG.md, check git status and the latest commit, verify what is already completed in code, do not rebuild finished work unless you find a regression, then implement the next smallest unfinished roadmap-aligned task and update the handoff when done.`
