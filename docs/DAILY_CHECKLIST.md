# Daily Checklist

Run through this list at the **start** and **end** of every working session.

---

## Session Start

- [ ] Pull latest from `main`: `git pull origin main`
- [ ] Check open issues assigned to you — confirm the session issue is clear and scoped
- [ ] Read the sprint backlog (`docs/SPRINT_BACKLOG.md`) — no scope drift
- [ ] Create or switch to the correct feature branch (pattern: `type/issue-{N}-slug`)
- [ ] Confirm `npm run build` passes on a clean pull before writing any code
- [ ] Confirm `npm run lint` passes (or note pre-existing warnings to exclude from your diff)

---

## During Development

- [ ] Work only within the scope of the current issue's acceptance criteria
- [ ] Run `npm run lint` after each meaningful change
- [ ] Run `npm run build` before staging any commit
- [ ] Write or update tests for any logic added or changed
- [ ] Do not add packages without checking the stack constraints in `CLAUDE.md`

---

## Before Committing

- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run test` exits 0
- [ ] Commit message follows `type(scope): description` format
- [ ] Commit body includes `Closes #N`
- [ ] No `console.log` debug statements left in committed code
- [ ] No unrelated files staged

---

## Before Opening a PR

- [ ] Branch is up to date with `main`: `git fetch origin main && git rebase origin/main`
- [ ] All acceptance criteria checkboxes in the issue are ticked
- [ ] `CHANGELOG.md` updated (required for feature/chore/bug labels)
- [ ] PR body includes `Closes #N` reference
- [ ] Demo artifact attached (screenshot or Loom link)
- [ ] PR template sections completed (What, Why, How, Evidence, Checklist)

---

## Session End

- [ ] Push the current branch: `git push -u origin <branch-name>`
- [ ] Leave a comment on the issue with session progress if the PR is not yet open
- [ ] Update `docs/SPRINT_BACKLOG.md` if acceptance criteria status changed
- [ ] Note any blockers or next steps at the top of the issue or in `docs/NEXT_SESSION_START.md`
