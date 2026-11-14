# Contributing

Thanks for helping build the Torchlight Passport workspace. This repository is a starting scaffold: application flows, database infrastructure, and tests are present, but authentication, participant data, receipt ingestion, OCR, budgets, exports, and invoices are not production features yet.

## Before opening a ticket

- Read `TORCHLIGHT_PROJECT_OUTLINE.md` and link the relevant decision or workflow.
- Use the Feature Proposal or Engineering Task issue template. Make acceptance criteria observable.
- Do not include participant names, receipts, funding records, credentials, or other personal information in issues, screenshots, fixtures, or pull requests.
- Flag unresolved business rules (category lists/caps, approval lifecycle, retention, fees, mileage, and hosting) rather than guessing.

## Prerequisites

- Python 3.12+
- Node.js 22+ and npm
- Docker Desktop with Docker Compose (optional; needed to run local PostgreSQL through Compose)

## Start the backend

From the repository root:

```bash
python -m venv backend/.venv
# macOS/Linux/Git Bash
source backend/.venv/bin/activate
# Windows PowerShell: backend/.venv/Scripts/Activate.ps1
python -m pip install -e "backend[dev]"
```

Start the local database and API:

```bash
docker compose up --build
```

The API is at `http://localhost:8000`; its interactive API docs are at `http://localhost:8000/docs`. `GET /api/v1/health` checks the database connection. Compose credentials are for local development only. Alembic is configured but no migrations exist yet, and no production secrets are configured.

To run just the API after Compose has started the database:

```bash
cd backend
uvicorn app.main:app --reload
```

## Start the frontend

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The worker and admin pages are prototype previews with fabricated data only; no API integration or real upload is enabled.

## Checks

```bash
cd backend && ruff check . && pytest
cd frontend && npm run lint && npm run typecheck && npm run build
```

`backend/tests/integration` checks the health endpoint against real connections. The unreachable-database tests always run; the live database tests are skipped unless `TEST_DATABASE_URL` is set (in CI, pytest errors instead). To run it against the Compose database (adjust the URL if you changed the `POSTGRES_*` values in `.env`):

```bash
cd backend && TEST_DATABASE_URL=postgresql+asyncpg://torchlight:torchlight@localhost:5432/torchlight pytest tests/integration
```

Run checks relevant to your changes before opening a PR.

## Frontend conventions

These apply to every screen under `frontend/`. The worker and admin screens share one API
contract, so a convention broken in one screen becomes a bug in another.

### Money

- Amounts cross the wire as decimal strings: `"1234.50"`, two decimals, no currency
  symbol or thousands separators. Never JSON numbers — JS parses them as IEEE-754 doubles.
- Format once from the string with `src/lib/money.ts`
  (`Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" })`). Do not
  `Number()` a value and re-format it.
- No addition, subtraction, or comparison of money in the browser. Totals, balances, and
  coverage estimates come from the API (BE-01 for estimates).
- Request bodies send strings too. Server validation is the control; client validation is
  a courtesy.

### Collections

```json
{ "items": [], "total": 0, "next_cursor": null }
```

- Every collection uses `items`, including nested subresources. A single resource is a
  bare object.
- Reserve `total` and `next_cursor`; add paging to a list before it outgrows one screen.

### Dates, IDs, fiscal year

- Dates are `YYYY-MM-DD`; timestamps are ISO 8601 UTC with `Z`.
- IDs are UUID strings. Unknown ID → 404; malformed ID → the API's 422 surfaced as an
  error, not a blank screen.
- `fiscal_year` is an integer query filter, never a write field: it is derived from the
  expense date server-side (DB-01). The boundary is unconfirmed, so UI copy does not
  assert one.

### Data access

- Next.js 16 App Router. Read the relevant guide in
  `frontend/node_modules/next/dist/docs/` before writing code; this version's APIs and
  conventions differ from earlier ones.
- Server Components by default. `"use client"` only where handlers or interaction state
  require it.
- One typed client in `src/lib/api/`, one function per endpoint, shared types in
  `src/lib/api/types.ts`. No `fetch` in components.
- No client data/state library until a ticket justifies one, and say why in the PR.
- Shareable state — selected participant, fiscal year, filters — goes in URL search
  params.
- Never store session tokens in `localStorage`; AUTH-01 chooses the mechanism.

### Every data screen

- Loading skeleton; empty state that says what is missing and offers the primary action;
  error with retry; unauthorized redirect or 403; dedicated 404 for record routes.
- No optimistic updates for money: save, refetch, render server truth.
- Labels bound with `htmlFor`; keyboard reachable with visible focus; a navigating table
  row contains a real link; status is never colour-only; `aria-live="polite"` for async
  results.
- Worker screens are mobile-first; admin screens stay usable at 1280px and above.

### Boundaries

- No PassportONE submission, payment processing, or OCR auto-approval (decisions.md 4–5).
- Synthetic fixtures only: no names, amounts, receipts, or records from source documents or
  real participants (decisions.md 6).
- Hiding a control is not authorization. The API enforces access, and server-rendered pages
  re-check before rendering protected data.

### Verification

```bash
cd frontend && npm run lint && npm run typecheck && npm run build
```

There is no frontend test runner yet. A PR that adds one names the runner and covers its
logic in the same change.

## CI

`.github/workflows/ci.yml` runs on every pull request, merge queue, and push to `main`. A newer push cancels the older run for the same PR. Each job maps to commands you can run locally:

| Check | What it runs |
|---|---|
| `backend` | `ruff check .`; `alembic upgrade head`, `alembic downgrade base`, `alembic upgrade head`, `alembic check` against a fresh PostgreSQL 16 service; then `pytest` with `TEST_DATABASE_URL` set |
| `frontend` | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` |
| `docker` | `docker compose config --quiet`, `docker compose up --build --detach --wait`, then `curl` `GET /api/v1/health` until it returns 200 |

- Every migration needs a working `downgrade()`, and `alembic check` fails if models in `Base.metadata` have changes without a migration. Generate one with `alembic revision --autogenerate`. `alembic check` only sees models imported by `alembic/env.py`, so import every new model module there. Autogenerated downgrades don't drop PostgreSQL `ENUM` types; drop them explicitly or the round trip fails.
- When `CI` is set, `pytest` refuses to start without `TEST_DATABASE_URL`, so a misconfigured CI database fails the job instead of silently skipping live-database tests.
- To run the migration checks locally, point `DATABASE_URL` at a disposable database, not one with data you want to keep: `alembic downgrade base` drops everything.
- The `docker` job runs the dev Compose stack, which bind-mounts `./backend` over the image and overrides its `CMD`. It proves the image builds and the stack boots, not that the image runs on its own; add a standalone `docker run` check when a production image matters.

### Branch protection for `main`

A repository admin configures these under **Settings → Rules → Rulesets** (or **Branches**):

- Require a pull request before merging.
- Require status checks to pass, and be up to date with `main`: `backend`, `frontend`, `docker`.
- Block force pushes and deletions.
- Open decision: whether PRs also need an approving review.

If you rename or add a CI job, update the required checks in the same PR, or merges are blocked waiting for a check that never reports.

## Pull requests

- Keep each PR focused and link its issue.
- Explain behavior and note any policy/security decisions it assumes.
- Add tests for new business logic and error cases.
- Update setup/docs when commands, configuration, or contributor workflow changes.
- Never commit `.env`, credentials, real participant data, uploaded receipts, or database dumps.
- Do not treat sample budgets, category caps, OCR confidence, mileage rates, or fees as approved policy.
