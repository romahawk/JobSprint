# Next Session Start

Last updated: 2026-03-20

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
- Route-level lazy loading and focused manual chunk splitting are in place, including a lazy-loaded pipeline board on the legacy dashboard and file-type-specific CV import parsing for PDF and DOCX.
- Outward-facing artifact is now packaged as a hosted page: `/case-study/assets-vault`, with the repo markdown case study kept as source/supporting material.
- The README now points at the hosted case study first, and Playwright CI uploads HTML + raw artifacts plus JUnit output for easier failure inspection.

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

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size improved after route splitting, dashboard DnD lazy loading, and file-type-specific CV import loading, but the shared vendor chunk is still the main pressure point.
- CV labels are now safer because application rows carry `cvAssetId`, but older records may still rely on name fallback until more users touch or re-save them.
