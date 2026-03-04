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

All branches must match one of:

```
feature/issue-{N}-short-slug
fix/issue-{N}-short-slug
chore/issue-{N}-short-slug
docs/issue-{N}-short-slug
refactor/issue-{N}-short-slug
claude/*    (automation branches created by Claude Code)
```

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
