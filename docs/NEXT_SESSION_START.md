# Next Session Start

Last updated: 2026-03-19

## Where We Are

- All planned Week 1-4 and Month 2 issues are closed.
- Firebase auth + Firestore persistence are integrated.
- Current production URL: https://job-sprint-ten.vercel.app/
- Dashboard right rail is more compact: Quick Actions stay accessible, and Probability Engine is collapsed by default.
- Today's Actions now surfaces missing `Log Application` tasks when a role has progressed without a linked application record.
- Roles page now starts with `Add Role` collapsed and blocks duplicate application creation for the same role with explicit feedback.
- Job OS import/export is available from the shared settings panel on all major Job OS surfaces.
- Assets Vault now works like a CV constructor: up to 5 managed CV variants, one default CV, linked application visibility, inline script/template editing, and stable `cvAssetId` links behind application records.
- Playwright now covers role-to-application logging, the Assets Vault CV constructor, CV file import, reusable asset delete confirmations, and Job OS import/export.
- Route-level lazy loading and focused manual chunk splitting are in place, including lazy-loaded CV import tooling on the Assets page; the initial entry bundle is smaller even though the heaviest shared vendor chunks still need attention.
- Outward-facing artifact drafted: `docs/CASE_STUDY_ASSETS_VAULT.md`.
- The case study is now linked from the README as the main proof-of-work artifact.

## Start Here (first 30 minutes)

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
   - Create, duplicate, rename, and delete a CV variant
   - Delete a script/template via modal and confirm toast feedback appears
   - Export then import Job OS state from settings and confirm reusable assets reappear
6. Open or confirm Month 3 issues for:
   - screenshot-backed or hosted demo packaging for the case study
   - deeper dependency-level bundle reduction
   - CI/reporting polish for the growing Playwright suite

## Recommended First Issue Next Session

`[M3-05] docs: package proof-of-work artifact into a shareable demo page`

Acceptance criteria:

- The README links to one clear outward-facing artifact.
- The case study includes screenshots and concise product framing.
- The artifact is easy to share with a reviewer without codebase context.
- Existing E2E and build checks stay green in CI.

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size improved after route splitting and lazy import extraction, but the shared vendor and PDF/chart chunks are still the main pressure points.
- CV labels are now safer because application rows carry `cvAssetId`, but older records may still rely on name fallback until more users touch or re-save them.
