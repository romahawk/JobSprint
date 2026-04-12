# Developer Workflow

Practical day-to-day guide for working on JobSprint. For governance rules see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Prerequisites

- Node.js 20+
- npm 10+
- Git

Optional (for Firebase-backed mode and CV tailoring):

- Firebase project with Auth + Firestore enabled
- OpenAI API key

---

## Initial Setup

```bash
git clone https://github.com/romahawk/JobSprint.git
cd JobSprint
npm install
cp .env.example .env          # add VITE_FIREBASE_* vars if using Firebase
cp .env.server.example .env.server  # add OPENAI_API_KEY for CV tailoring
```

The app works fully offline with local-storage fallback — Firebase vars are optional.

---

## Dev Loop

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run lint      # ESLint (0 warnings allowed)
npm run build     # Production build — run before every commit
npm run test      # Vitest unit tests
npm run test:e2e  # Playwright E2E tests (requires dev server)
```

Start a feature:

```bash
git checkout main && git pull origin main
git checkout -b feature/issue-{N}-short-slug
# ... make changes ...
npm run lint && npm run build   # both must exit 0
git add <files>
git commit -m "feat(scope): what and why

Closes #N"
git push -u origin feature/issue-{N}-short-slug
```

---

## Branch Naming

Branches must match one of:

```
feature/issue-{N}-short-slug
fix/issue-{N}-short-slug
chore/issue-{N}-short-slug
docs/issue-{N}-short-slug
refactor/issue-{N}-short-slug
claude/*
```

CI rejects PRs from branches that don't match this pattern.

---

## Commit Format

```
type(scope): short description

Closes #N
```

Valid types: `feat` `fix` `chore` `docs` `refactor` `test`

The `Closes #N` body line is required for every feature or fix commit — it links the commit to the issue and is enforced by `policy-check.yml`.

---

## Pre-Commit Gate

**Always run both before committing:**

```bash
npm run lint && npm run build
```

Never use `--no-verify`. If either gate fails, fix the root cause.

---

## Testing

### Unit tests (Vitest)

```bash
npm run test
```

Tests live alongside source in `src/` with `.test.ts` / `.test.tsx` suffixes.

### E2E tests (Playwright)

```bash
npm run dev &          # start the dev server first
npm run test:e2e       # run all Playwright tests
npx playwright test --ui   # interactive mode
```

E2E tests seed `localStorage` in `beforeEach` — no external services required.
Fixtures live in `tests/e2e/fixtures.ts`.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Optional | Firebase Auth + Firestore |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firestore project |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase App ID |
| `VITE_JSPRINT_REMOTE_API_URL` | Optional | CV tailoring API endpoint |
| `OPENAI_API_KEY` | Server only | OpenAI model for CV tailoring |

Without Firebase vars, the app uses `localStorage` for all persistence.

---

## CI Pipeline

`.github/workflows/ci.yml` runs on every PR and on `main`:

1. **lint** — `npm run lint`
2. **unit tests** — `npm run test`
3. **build** — `npm run build`
4. **e2e** — `npm run test:e2e` (Playwright against `npm run dev`)

`.github/workflows/policy-check.yml` enforces:
- Branch naming convention
- `Closes #N` in PR body
- `CHANGELOG.md` updated for feature/chore/bug PRs

---

## PR Checklist

1. Branch follows naming convention
2. `npm run lint && npm run build` pass locally
3. Tests pass (`npm run test`)
4. `CHANGELOG.md` updated under `[Unreleased]`
5. PR body contains `Closes #N`
6. Demo artifact attached for UI features (screenshot or Loom)

---

## Stack Reference

| Concern | Choice |
|---|---|
| Bundler | Vite 6 |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | Radix UI primitives |
| Routing | React Router v7 |
| Persistence | Firebase Firestore / localStorage fallback |
| Auth | Firebase Auth / local session fallback |
| Charts | Recharts |
| Toasts | Sonner |
| Animations | Motion (framer-motion) |
| Unit testing | Vitest |
| E2E testing | Playwright |
| CI/hosting | GitHub Actions + Vercel |

Do not introduce alternatives to any item above without a dedicated issue approved by the project owner.
