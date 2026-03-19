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
- Playwright now covers both role-to-application logging and the Assets Vault CV constructor flow.
- Route-level lazy loading and initial manual chunk splitting are in place, which reduced the entry bundle significantly even though the shared vendor chunk is still large.
- Outward-facing artifact drafted: `docs/CASE_STUDY_ASSETS_VAULT.md`.

## Start Here (first 30 minutes)

1. Pull latest `main` and run checks:
   - `npm install`
   - `npm run test`
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
   - Create a new CV, duplicate it, set one as default, then rename it
   - Confirm linked application rows still show the right CV after rename
   - Delete a script/template via modal and confirm toast feedback appears
6. Open or confirm Month 3 issues for:
   - import/export E2E coverage
   - screenshot-backed case-study/demo packaging
   - deeper vendor chunk reduction

## Recommended First Issue Next Session

`[M3-03] test: cover import/export and reusable asset editing flows`

Acceptance criteria:

- Export JSON and import JSON flow is covered in browser.
- Script/template edit and delete flows are covered in browser.
- CV constructor and stable CV-id coverage stays green in CI.
- E2E job runs in CI on pull requests.

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size improved after route splitting, but the shared vendor chunk is still the main pressure point.
- CV labels are now safer because application rows carry `cvAssetId`, but older records may still rely on name fallback until more users touch or re-save them.
