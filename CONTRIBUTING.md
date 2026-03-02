# Contributing

This project follows an Issue -> PR -> Deploy workflow.

## Workflow Rules

1. Open or select an issue before coding.
2. Keep scope small and aligned to issue acceptance criteria.
3. Use a branch naming convention:
   - `feat/<issue-id>-short-slug`
   - `fix/<issue-id>-short-slug`
   - `docs/<issue-id>-short-slug`
   - `chore/<issue-id>-short-slug`
4. Use Conventional Commits:
   - `feat: ...`
   - `fix: ...`
   - `docs: ...`
   - `chore: ...`
   - `refactor: ...`
5. Open PR using the repository PR template.
6. Update `CHANGELOG.md` in every merge-worthy PR.
7. Include a demo artifact (screenshot or Loom).

## Automated Enforcement

- CI build is enforced in `.github/workflows/ci.yml`.
- PR policy checks are enforced in `.github/workflows/policy-check.yml`:
  - Branch naming convention
  - Issue-closing reference in PR body (`Closes #<id>`)
  - `CHANGELOG.md` required for `feature`, `chore`, and `bug` PR labels
- Issue triage automation is in `.github/workflows/issue-triage.yml`.

## Scope Governance

- Max active scope: 1 in-progress feature issue at a time.
- Do not include opportunistic refactors in feature PRs.
- Non-critical refactors must have dedicated issues.

## Definition of Done

- Acceptance criteria checked.
- Build passes.
- Changelog updated.
- Demo artifact attached.
