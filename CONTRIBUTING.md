# Contributing

This project follows an **Issue → Branch → PR → main** workflow.

---

## Branch Model

JobSprint uses a **single stable branch model**:

| Branch | Purpose |
|---|---|
| `main` | Stable, releasable. Protected. All merges come via PR. |
| `feature/fix/chore/…` | Short-lived work branches. Deleted after merge. |
| `claude/*` | Automation branches created by Claude Code. Treated as feature branches. |

There is no permanent `dev` or `localdev` branch. Integration happens via PR against `main`.

---

## Workflow Rules

1. Open or select an issue before coding.
2. Keep scope small and aligned to the issue acceptance criteria.
3. Use the branch naming convention (must match CI policy check):
   - `feature/issue-{N}-short-slug`
   - `fix/issue-{N}-short-slug`
   - `docs/issue-{N}-short-slug`
   - `chore/issue-{N}-short-slug`
   - `refactor/issue-{N}-short-slug`
   - `claude/*` (automation only)
4. Use Conventional Commits with a `Closes #N` body line:
   ```
   type(scope): short description

   Closes #N
   ```
   Valid types: `feat` `fix` `chore` `docs` `refactor` `test`
5. Open a PR using the repository PR template.
6. Update `CHANGELOG.md` in every merge-worthy PR.
7. Include a demo artifact (screenshot or Loom) for feature PRs.

---

## Pre-Merge Gate

Both gates must pass before a PR is mergeable:

```bash
npm run lint   # must exit 0
npm run build  # must exit 0
```

Do not use `--no-verify` or any bypass flag.

---

## Automated Enforcement

- **CI build**: `.github/workflows/ci.yml` — runs on `main` and all PRs.
- **PR policy check**: `.github/workflows/policy-check.yml`
  - Branch naming convention
  - `Closes #<id>` reference in PR body
  - `CHANGELOG.md` required for `feature`, `chore`, and `bug` PR labels
- **Issue triage**: `.github/workflows/issue-triage.yml`

---

## Scope Governance

- Maximum 1 in-progress feature issue at a time.
- Do not include opportunistic refactors in feature PRs.
- Non-critical refactors must have dedicated issues.

---

## Definition of Done

- Acceptance criteria checked.
- `npm run lint && npm run build` pass.
- Changelog updated.
- Demo artifact attached (feature PRs).
- Branch deleted after merge.
