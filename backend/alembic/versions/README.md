# Database migrations

Add schema revisions here when initial participant, funding, expense, receipt, invoice, or audit requirements are confirmed. The repository intentionally has no participant schema or seed data yet: the category list, caps, expense lifecycle, and retention/security rules still require client confirmation.

Create revisions from `backend/` with `alembic revision --autogenerate -m "describe change"` after ORM models and local Postgres are ready. Review generated SQL before applying it. Do not seed real participant information.
