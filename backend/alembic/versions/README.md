# Database migrations

`0001_db_01_core_schema.py` creates the DB-01 core schema (twelve tables), makes `audit_events`
append-only with a trigger, enables row-level security on every table, and seeds the funding
category catalog. No caps, participants, or other records are seeded. Do not seed real
participant information.

Create a revision from `backend/` after changing models in `app/db/models/`:

```bash
alembic revision --autogenerate -m "describe change"
```

A post-write hook in `alembic.ini` runs `ruff format` and `ruff check --fix` on the new file
(install the dev extras first). Review and edit the generated file before applying it:
autogenerate misses CHECK-only changes, triggers, functions, data, and row-level security, so a
new table needs `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY` added by hand. Every revision
needs a working `downgrade()`; CI runs `upgrade head`, `downgrade base`, `upgrade head`, then
`alembic check`.
