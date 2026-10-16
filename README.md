# Torchlight Passport Workspace

An early-stage web application scaffold for Passport funding workflows, including receipts and expenses, category balances, worker hours and mileage, monthly reporting, and audit retrieval. Worker and admin screens currently use fabricated sample data; see the status below for what is and is not implemented.

## Current scaffold

- **API:** FastAPI, async SQLAlchemy, PostgreSQL, versioned API, database-backed health endpoint.
- **Web:** Next.js App Router and TypeScript, with navigable worker/admin workflow previews and illustrative sample data.
- **Local development:** Docker Compose PostgreSQL + API; frontend runs locally with npm.
- **Contributor workflow:** CI, PR checklist, feature/task issue forms, and [`CONTRIBUTING.md`](CONTRIBUTING.md).

The worker/admin pages are **prototype UI only**. Authentication, roles, participant records, migrations, receipt upload/OCR, the expense ledger, budgets, Ministry exports, audit ZIPs, invoices, and payment processing are not implemented. Do not enter real participant data. The Compose credentials are local development defaults only and must never be used in production.

## Prerequisites

- Python 3.12 or newer
- Node.js 22 or newer with npm
- Docker Desktop + Docker Compose for the local PostgreSQL/API stack

## Run locally

Install backend dependencies:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate  # Git Bash/macOS/Linux
# Windows PowerShell: backend/.venv/Scripts/Activate.ps1
python -m pip install -e "backend[dev]"
```

Start PostgreSQL and the API:

```bash
docker compose up --build
```

- API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>
- Database check: `GET http://localhost:8000/api/v1/health`

In a separate terminal, start the web app:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. Navigate from the landing page to the worker or admin preview. Sample names and amounts are fabricated, non-sensitive examples.

To stop containers, run `docker compose down`. Local PostgreSQL data persists in the `postgres_data` volume. No reset/volume-deletion command is included so data is not removed accidentally.

## Checks

```bash
cd backend && ruff check . && pytest
cd frontend && npm run lint && npm run typecheck && npm run build
```

## Making the project actionable

1. Open a feature/task issue using the GitHub templates. Include the user problem, explicit acceptance criteria, dependencies, and test expectations.
2. Confirm business rules before encoding them (for example official category/cap lists, when expenses affect balances, OCR review/approval, retention, mileage/meal rules, and fee treatment).
3. Link the issue in a focused PR; follow `CONTRIBUTING.md` and `.github/pull_request_template.md`.

## Repository map

```text
backend/                 FastAPI application and backend tests
frontend/                Next.js worker/admin workflow preview
.github/ISSUE_TEMPLATE/   Feature and engineering task forms
.github/workflows/       Continuous integration
CONTRIBUTING.md           Developer and ticket workflow
```
