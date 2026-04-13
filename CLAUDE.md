# CLAUDE.md — AI Session Rules for JobSprint

This file governs how Claude Code operates within this repository.
It is read at the start of every AI session. Do not remove or edit this file
without human review.

---

## Role Boundary

Claude is a **coding assistant**, not a decision-maker. The following decisions
always belong to the human owner:

- Prioritising or re-ordering the roadmap
- Adding, closing, or re-scoping issues
- Changing the tech stack or architecture
- Merging or closing pull requests
- Deciding what ships in a release

If Claude is uncertain about scope or priority, it **must ask the user** before
proceeding. Claude must never unilaterally resolve a roadmap or governance
question — surface it and wait for a decision.

---

## Pre-Commit Gate

**Both gates must pass before any commit is created.** No exceptions.

```bash
npm run lint   # must exit 0
npm run build  # must exit 0
```

If either gate fails, fix the failure before committing. Do not use
`--no-verify` or any flag that bypasses hooks.

---

## Branch Naming

All branches must match the pattern enforced by `policy-check.yml`:

```
feat/{N}-short-slug
fix/{N}-short-slug
chore/{N}-short-slug
docs/{N}-short-slug
refactor/{N}-short-slug
claude/*    (automation branches created by Claude Code)
```

Where `{N}` is the GitHub issue number. The `issue-` prefix is **not** allowed — the CI policy regex is `^(feat|fix|docs|chore|refactor)\/\d+-[a-z0-9-]+$`.

---

## Commit Format

Every commit must follow Conventional Commits:

```
type(scope): short description

Closes #N
```

Valid types: `feat` `fix` `chore` `docs` `refactor` `test`

The `Closes #N` line is required in the commit body for every feature or fix
commit. Merge commits are exempt.

---

## Anti-Patterns — Claude Must Refuse These

| # | Anti-pattern | Why it is banned |
|---|---|---|
| 1 | Adding MUI, Emotion, Bootstrap, or styled-components | Contradicts the Tailwind + Radix stack; creates duplicate styling systems |
| 2 | Moving `react` or `react-dom` to `peerDependencies` | This is an app, not a library; peer deps are wrong scope |
| 3 | Committing without running `npm run lint && npm run build` | Breaks CI gate discipline |
| 4 | Making roadmap or priority decisions unilaterally | Outside Claude's role; must ask the user |
| 5 | Pushing directly to `main` | All changes must go through a PR |
| 6 | Adding packages that duplicate existing capabilities | E.g. a second date library, a second icon set, a second charting lib |
| 7 | Leaving `console.log` debug statements in committed code | Pollutes production output |
| 8 | Skipping `Closes #N` in commit bodies | Breaks issue-tracking hygiene enforced by policy-check CI |
| 9 | Creating files that aren't needed for the current task | Over-engineering; adds maintenance burden |
| 10 | Amending published commits | Rewrites shared history; use a new commit instead |

---

## Pull Request Creation

Every PR **must** be created with `gh pr create` and a fully-populated `--body`.
Never leave placeholder text from the template unfilled.

Use this exact structure, replacing every placeholder with real content derived
from the actual changes in the branch:

```bash
gh pr create \
  --title "type(scope): short description" \
  --body "$(cat <<'EOF'
## What

<Concrete description of what changed — files, features, behaviours.>

## Why

<The problem this PR solves and why it is being solved now.>

## How To Test

1. <First step>
2. <Second step>
3. <Expected outcome>

## Evidence

- Issue: #N
- Demo artifact (screenshot/Loom): <URL or "N/A — non-UI change">

## Risk and Rollback

- Risk level: low / medium / high  ← pick one and delete the others
- Rollback plan: <revert commit SHA or feature-flag off>

## Checklist

- [x] Linked to an issue with clear acceptance criteria
- [x] Scope is limited to the issue
- [x] Local checks pass (`npm run build`)
- [x] Docs updated if behavior or workflow changed
- [x] `CHANGELOG.md` updated
- [x] Demo artifact attached
EOF
)"
```

Rules:
- **Every section must be filled.** No section may retain its template placeholder text.
- `## Evidence — Issue:` must contain the real issue number, e.g. `#42`.
- `## Risk and Rollback — Risk level:` must be exactly one of `low`, `medium`, or `high`.
- Checklist items must be checked `[x]` or explicitly unchecked `[ ]` with a reason noted inline.
- `Closes #N` must appear **both** in the commit body **and** in the PR body. The CI `policy-check.yml` enforces it in the PR body via regex `/(closes|fixes|resolves)\s+#\d+/i`.

---

## Scope Rules

- Work only on the issue explicitly assigned to the session.
- Do not opportunistically refactor code outside the issue scope.
- If a problem outside scope is noticed, open or reference an issue — do not
  silently fix it in the same PR.
- Maximum 1 in-progress feature issue at a time (per CONTRIBUTING.md).

---

## Stack Constraints (frozen)

| Concern | Approved choice |
|---|---|
| Bundler | Vite |
| UI framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | Radix UI primitives |
| Routing | React Router v7 |
| Persistence | Firebase Firestore (primary) / localStorage (fallback) |
| Auth | Firebase Auth (primary) / local session (fallback) |
| Testing | Vitest |
| CI | GitHub Actions |
| Hosting | Vercel |

Do not introduce alternatives to any item in the table above without a
dedicated issue approved by the user.
