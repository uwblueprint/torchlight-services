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

The API is at `http://localhost:8000`; its interactive API docs are at `http://localhost:8000/docs`. `GET /api/v1/health` checks the database connection. Compose credentials are for local development only. No migrations or production secrets are configured yet.

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

`backend/tests/integration` checks the health endpoint against real connections. The unreachable-database tests always run; the live database test is skipped unless `TEST_DATABASE_URL` is set. To run it against the Compose database (adjust the URL if you changed the `POSTGRES_*` values in `.env`):

```bash
cd backend && TEST_DATABASE_URL=postgresql+asyncpg://torchlight:torchlight@localhost:5432/torchlight pytest tests/integration
```

Run checks relevant to your changes before opening a PR.

## CI

`.github/workflows/ci.yml` runs on every pull request, merge queue, and push to `main`. A newer push cancels the older run for the same PR. Each job maps to commands you can run locally:

| Check | What it runs |
|---|---|
| `backend` | `ruff check .`; `alembic upgrade head`, `alembic downgrade base`, `alembic upgrade head`, `alembic check` against a fresh PostgreSQL 16 service; then `pytest` with `TEST_DATABASE_URL` set |
| `frontend` | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` |
| `docker` | `docker compose config --quiet`, `docker compose up --build --detach --wait`, then `curl` `GET /api/v1/health` until it returns 200 |

- Every migration needs a working `downgrade()`, and `alembic check` fails if models in `Base.metadata` have changes without a migration. Generate one with `alembic revision --autogenerate`.
- When `CI` is set, `pytest` refuses to start without `TEST_DATABASE_URL`, so a misconfigured CI database fails the job instead of silently skipping live-database tests.
- To run the migration checks locally, point `DATABASE_URL` at a disposable database, not one with data you want to keep: `alembic downgrade base` drops everything.

### Branch protection for `main`

A repository admin configures these under **Settings → Rules → Rulesets** (or **Branches**):

- Require a pull request before merging.
- Require status checks to pass, and be up to date with `main`: `backend`, `frontend`, `docker`.
- Block force pushes and deletions.

If you rename or add a CI job, update the required checks in the same PR, or merges are blocked waiting for a check that never reports.

## Pull requests

- Keep each PR focused and link its issue.
- Explain behavior and note any policy/security decisions it assumes.
- Add tests for new business logic and error cases.
- Update setup/docs when commands, configuration, or contributor workflow changes.
- Never commit `.env`, credentials, real participant data, uploaded receipts, or database dumps.
- Do not treat sample budgets, category caps, OCR confidence, mileage rates, or fees as approved policy.
