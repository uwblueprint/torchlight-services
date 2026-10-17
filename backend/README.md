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

Tickets can overlap where contracts are agreed (for example pure-logic BE-01 can progress while DB-01 is underway). API, receipt, OCR, and reporting implementation depends on the relevant data/access boundaries.

These are the current repository ticket IDs; do not reuse the old scaffold sequence where BE-01 meant DevOps, BE-02 meant migrations, or BE-04 meant document normalization. FE-01 is the frontend MVP/workflow implementation in the frontend README. Ticket order is dependency guidance, not a fixed sprint calendar; confirm ticket scope, priorities, and owners with Torchlight/Blueprint.

## Release and operations workstream

Production deployment is a separate release milestone after the MVP is secure and usable. Create/link release issues for a hosting/security decision and deployment, then require a readiness checklist before real data is loaded: approved hosting region and recurring-cost estimate; TLS and managed secrets; least-privilege accounts and access review; migrations/rollback procedure; encrypted backups with a restore test; monitoring, incident contact, and recovery runbook; retention/export ownership; and an agreed pilot/sign-off. The target recurring hosting budget is $10–$20/month, but it is not a verified quote. Include database, private receipt storage, backups, domain/email, tax, and OCR/API charges in the cost review; do not cut security or backup requirements to fit a target. Escalate a cost mismatch for explicit budget or scope approval.

Staff training, showcase packaging, and autonomous handoff follow successful release readiness and pilot validation. Train admin and worker roles separately using synthetic data, provide task-based quick-reference and troubleshooting documentation, prepare a sanitized demo and technical overview, and transfer operational ownership, credentials through an approved secure channel, runbooks, backup/restore steps, data export/retention responsibilities, and escalation contacts. Handoff is complete only when Torchlight staff demonstrate routine operation and know how to respond to common failures; the showcase is not a substitute for this operational acceptance.

## Current backend ticket map

| Ticket | Scope | Dependency / gate |
|---|---|---|
| INFRA-01 | Verify local API + PostgreSQL Compose stack and live DB health | None; local development only |
| DB-01 | Approved core schema, migrations, and category catalog | Resolve authoritative category/cap list before seeding |
| AUTH-01 | Authentication, roles, and assignment-scoped authorization | Schema contract; required before real records |
| BE-01 | Pure `Decimal` budget split calculator | Can overlap DB-01; approved ledger/cap rules required |
| AUDIT-LOG-01 | Persist sensitive-action audit events | Schema and actor identity contract |
| API-01 / API-02 | Participant/funding reads and expense ledger | DB-01, AUTH-01, BE-01, audit rules |
| FILE-01 | Private receipt intake/storage | AUTH-01, size/type/retention policy, storage decision |
| OCR-01 / OCR-02 | Local document normalization, Tesseract, deterministic field candidates | OCR-02 depends on OCR-01; neither requires FILE-01 for local sample testing |
| REVIEW-01 | Admin correction/review workflow | OCR-02, API/receipt records, audit events |
| SHIFT-01 / INVOICE-01 | Confirmed hours/mileage and uncovered-cost tracking | Approved hours, mileage, payer, and status policies |
| REPORT-01 / AUDIT-ARCHIVE-01 | Ministry-layout workbook and authorized receipt archive | Approved template, authorization, retention policy |
| QA-API-01 | Isolated PostgreSQL integration and authorization/security tests | Relevant API and schema implementation |
| Release/handoff | Production deployment, operational training, showcase materials, and autonomous staff operation | All launch-critical tickets, readiness gate, and pilot sign-off |

The release/handoff work is a milestone with linked delivery tasks, not a reason to treat production as safe while core authorization, privacy, backup, and recovery requirements remain open.

## Suggested sequencing

1. Confirm scope/policies and example Ministry spreadsheet; plan FE-01 and align API contracts.
2. INFRA-01 and DB-01; BE-01 can proceed in parallel once its calculation rules are confirmed.
3. AUTH-01 and AUDIT-LOG-01 before protected application data is exposed; then API-01/API-02.
4. FILE-01 and OCR-01/OCR-02, followed by REVIEW-01; OCR local testing can use synthetic sample files independently of storage.
5. SHIFT-01/INVOICE-01 only for confirmed MVP requirements; implement reporting/archives after template and retention decisions.
6. QA-API-01 and frontend/API end-to-end verification; then production readiness, controlled pilot, role-based training/showcase, and formal handoff.

This is a proposed dependency order, not a commitment to deliver every listed feature in the first release. Defer uncertain policy-dependent features rather than inventing rules.

## Frontend workstream

- **FE-01 — Frontend MVP and workflow implementation:** replace the navigable stubs with the agreed worker/admin MVP flows, connect to authorized API contracts, and verify responsive/accessible behavior and empty/loading/error states. The exact screen list and API integration should be finalized against the approved MVP; do not treat the current stub pages as completed functionality.
- Release, training, showcase, and autonomous operation are cross-cutting final milestones; see the root README for the readiness gate and handoff definition.

## Timeline assessment

The requested production hosting, staff training, showcase documentation, and official handoff are a sensible final milestone, but they are not a single last-minute task. Budget and provider selection, data/security requirements, training needs, showcase audience/format, and staff ownership should be confirmed early. Documentation and training materials can be drafted during implementation; live training should use a stable pilot, and handoff sign-off should follow supported operation. The SOW's 8–12 month estimate is the only timeline in the source documents; no release date or milestone durations are approved here.


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
