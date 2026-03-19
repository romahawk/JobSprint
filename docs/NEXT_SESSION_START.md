# Next Session Start

Last updated: 2026-03-19

## Where We Are

- All planned Week 1-4 and Month 2 issues are closed.
- Firebase auth + Firestore persistence are integrated.
- Current production URL: https://job-sprint-ten.vercel.app/
- Dashboard right rail is more compact: Quick Actions stay accessible, and Probability Engine is collapsed by default.
- Today's Actions now surfaces missing `Log Application` tasks when a role has progressed without a linked application record.
- Roles page now starts with `Add Role` collapsed and blocks duplicate application creation for the same role with explicit feedback.

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
5. Open or confirm Month 3 issues for:
   - E2E baseline (Playwright)
   - Import/export feature
   - Case-study and demo artifact packaging

## Recommended First Issue Next Session

`[M3-01] chore: add Playwright E2E baseline for auth + Job OS CRUD + duplicate-guard flows`

Acceptance criteria:

- Login flow test passes.
- Create/edit/move/delete application flow test passes.
- Role-to-application creation path is covered, including duplicate prevention.
- Refresh persistence assertion passes.
- E2E job runs in CI on pull requests.

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size is high; defer optimization unless it blocks UX.
- Some next-action logic still depends on data consistency between roles and applications; E2E should lock this down before larger feature work.
