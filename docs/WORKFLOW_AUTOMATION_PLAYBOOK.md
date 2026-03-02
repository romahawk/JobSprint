# Workflow Automation Playbook (Reusable)

Use this guide to apply the same Issue -> PR -> Deploy discipline in other repositories.

## Goal

Automate repeatable governance checks while keeping product decisions manual.

## Files to Copy

- `.github/workflows/ci.yml`
- `.github/workflows/policy-check.yml`
- `.github/workflows/issue-triage.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

## Required Labels

Create these labels in the target repository:

- `feature`
- `chore`
- `docs`
- `bug`

## Branch Naming Rule

Branches must match:

- `feat/<issue-id>-short-slug`
- `fix/<issue-id>-short-slug`
- `docs/<issue-id>-short-slug`
- `chore/<issue-id>-short-slug`
- `refactor/<issue-id>-short-slug`

Examples:

- `feat/14-activity-card`
- `docs/10-readme-cleanup`

## PR Policy Rule

Every PR must include:

- Issue closing line in PR body, for example: `Closes #14`
- `CHANGELOG.md` update when label is `feature`, `chore`, or `bug`

## GitHub Settings (Manual Once Per Repo)

1. `Settings -> Branches -> Add branch protection rule` for `main`
2. Require pull request reviews before merging
3. Require status checks to pass before merging
4. Add required checks:
   - `CI / build`
   - `PR Policy Check / policy`
5. Disable direct pushes to `main`

## Daily Loop

1. Pick one open issue with acceptance criteria.
2. Create branch with naming rule.
3. Implement minimal scope.
4. Run local checks.
5. Open PR and include `Closes #<id>`.
6. Attach screenshot/Loom evidence.
7. Merge after green checks.
8. Verify changelog entry.

## Copy/Paste PR Body Snippet

```md
Closes #<issue-id>
```

## Notes

- Keep one active feature issue at a time.
- Avoid mixing refactors into feature PRs.
- If a repository is private on a free plan, some branch protection APIs may be unavailable, so configure settings in the GitHub UI.

