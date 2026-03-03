# Next Session Start

Last updated: 2026-03-03

## Where We Are

- All planned Week 1-4 and Month 2 issues are closed.
- Firebase auth + Firestore persistence are integrated.
- Current production URL: https://job-sprint-ten.vercel.app/

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
4. Open new Month 3 issues (or confirm they exist) for:
   - E2E baseline (Playwright)
   - Import/export feature
   - Case-study and demo artifact packaging

## Recommended First Issue Next Session

`[M3-01] chore: add Playwright E2E baseline for auth + CRUD + pipeline`

Acceptance criteria:

- Login flow test passes.
- Create/edit/move/delete application flow test passes.
- Refresh persistence assertion passes.
- E2E job runs in CI on pull requests.

## Risks To Watch

- Browser privacy blockers (especially Brave Shields) can break Firebase connectivity.
- Firestore authorization rules must stay aligned with user-scoped document path.
- Bundle size is high; defer optimization unless it blocks UX.

