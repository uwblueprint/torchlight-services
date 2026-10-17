# Backend implementation map

The backend currently contains the FastAPI app, PostgreSQL session setup, a database-backed health route, and ticket stubs/contracts. The modules below do not define a production schema or implement application workflows. The participant, expense, receipt, and report stub routes are mounted and return HTTP 501. No participant records, categories, receipts, or business rules are seeded.

## Suggested backend ticket order

1. **INFRA-01 — Local API + PostgreSQL verification**: start the existing Compose services together; verify database connectivity and container reload. The current health test mocks the DB, so add a separate PostgreSQL integration test.
2. **DB-01 — Core schema and category catalog**: add reviewed Alembic models/migrations for users, participants, assignments, categories, subcategories, and funding allocations. The supplied PassportONE reference lists 19 categories while other project sources refer to 18; confirm this discrepancy and category/cap source before treating seed data as authoritative.
3. **AUTH-01 — Authentication and role/assignment authorization**: enforce worker/admin access server-side before exposing participant or receipt data.
4. **BE-01 — Budget calculator**: implement tested `Decimal` calculations; distinguish participant allocation remaining from category cap headroom. Do not embed unconfirmed fees or acknowledgment policies.
5. **AUDIT-LOG-01 — Audit event persistence**: store actor/action/entity/time for sensitive changes without logging receipt bytes, OCR text, secrets, or unnecessary PII.
6. **API-01 / API-02 — Participant/funding APIs and expense ledger**: add participant-scoped queries, expense ownership/source, lifecycle, and balance updates.
7. **FILE-01 — Private receipt storage**: validate supported file type/size, authorization, metadata, and storage adapter. The source notes list PDF, JPEG, and Word, not Excel; the maximum upload size is still unspecified.
8. **OCR-01 — Document normalization**: convert PDFs and images into bounded raster pages; define safe handling for Word documents and unsupported/corrupt files.
9. **OCR-02 — Local Tesseract extraction and deterministic parser**: use pytesseract/Tesseract locally, parse candidate fields, preserve confidence/provenance, and flag ambiguity for manual review. Research notes say **not to use AI**. OCR must never approve or categorize an expense as eligible.
10. **REVIEW-01 — Admin receipt correction/review API**: queue unclear/missing data, save corrections/notes, and audit review decisions.
11. **SHIFT-01 / INVOICE-01 — Hours/mileage and uncovered-cost tracking**: only implement confirmed fields and lifecycle; do not invent mileage/meal rules or process payments.
12. **REPORT-01 / AUDIT-ARCHIVE-01 — Monthly workbook and receipt archive**: use the actual Ministry spreadsheet template; create per-person/date-range archives. The app prepares exports for staff and does not submit to PassportONE.
13. **QA-API-01 — Integration/security tests**: run against isolated PostgreSQL in CI and test both authorized and forbidden access.

Tickets can overlap where contracts are agreed (for example BE-01 can be implemented as pure logic while DB-01 progresses). API, receipt, OCR, and reporting implementation depends on the preceding data/access boundaries.

## OCR and Tesseract setup

`app/services/ocr/` contains interface/schema stubs for:

- file normalization (`normalizer.py`)
- local Tesseract integration (`engine.py`)
- deterministic field parsing (`parser.py`)
- typed candidate/result structures (`schemas.py`)

The base backend install intentionally does **not** require OCR packages or the Tesseract executable. Install Python OCR extras with:

```bash
python -m pip install -e ".[ocr]"
```

That optional group provides Python adapters. OCR implementation also requires the system Tesseract executable; PDF rasterization uses Poppler utilities. Those system binaries are not currently in `backend/Dockerfile`, and no endpoint should claim OCR is available until the OCR ticket adds and verifies them. The Python stubs use lazy dependency boundaries so unrelated API imports do not require OCR packages.

## Stub inventory

- `app/services/budget/calculator.py`: pure calculation contract, not implemented.
- `app/services/storage/receipts.py`: private receipt storage protocol, no provider selected.
- `app/services/audit.py`: audit event contract, no persistence.
- `app/api/v1/endpoints/`: participant, expense, receipt, and report endpoints return 501 until their tickets implement authorization, schemas, and services.

These stubs are planning boundaries for developer tickets—not working endpoints or approval of all proposed rules.
