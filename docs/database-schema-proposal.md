# Database Schema — Torchlight Passport Application

> **Superseded by [`docs/tickets/DB-01.md`](tickets/DB-01.md).** The table list below describes the
> earlier 24-table design. Keep it as the record of what was proposed and why the MVP cut it down to
> twelve tables; do not read its column lists as current. The section on product and data boundaries
> still applies.

**Status: implemented as SQLAlchemy models (`backend/app/db/models/`) and one Alembic migration (`backend/alembic/versions/`). No seed rows. Not approved for real participant data.**

The funding model is deliberately flat. For one participant, one funding year, and one category there is a single ceiling that confirmed spending fills up. There is no plan object, no plan versioning, and no separate funding-pool total.

## 1. Product and data boundaries

- Passport Workers submit expenses and receipts, confirm OCR-suggested values, view balances for assigned participants, and plan activities.
- Admins manage participants and category caps, review receipts and expenses, and produce Ministry-layout exports and receipt ZIPs.
- Patty remains the only person who submits to the Ministry portal. The application prepares information; it does not submit or process payments.
- Participants and caregivers do not have accounts in this phase.
- Receipt bytes live in private object storage, **not PostgreSQL**. The database stores an opaque reference plus metadata.
- OCR suggestions are not transactions. A worker confirming a value is what creates the expense and fills the cap.
- Invoices, billing contacts, and stored export records are **not** part of this schema. See section 12.

## 2. Conventions

- PostgreSQL; UUID primary keys (`gen_random_uuid()`); `TIMESTAMPTZ` instants; `DATE` business dates; `NUMERIC(12,2)` money; `NUMERIC(12,3)` distance; `NUMERIC(5,4)` confidence.
- Money is exact decimal, never floating point, and stored non-negative except signed adjustment deltas.
- Financial and audit rows are never physically deleted. Status changes are recorded in append-only tables.
- Text columns use `TEXT` with `CHECK` constraints for status vocabularies rather than PostgreSQL enums, so editing a vocabulary is a migration of a constraint, not a type.
- A naming convention on `Base.metadata` gives every constraint a deterministic name, which is what makes downgrades possible.
- Every participant-scoped query enforces authorization in the backend. A UI filter is not an access-control boundary.
- One Torchlight organization only. This is not multi-tenant.

## 3. Relationship overview

```text
users ──< participant_assignments >── participants

participants ──< participant_category_caps >── funding_categories
            └──< participant_category_caps >── fiscal_periods
funding_categories ──< funding_subcategories
                   └──< funding_category_cap_defaults >── fiscal_periods

participants ──< activity_plans ──< activity_plan_lines >── funding_categories
             └──< expenses ──< expense_funding_splits
                          ├──< expense_events
                          ├──< expense_adjustments
                          ├──< expense_reviews
                          ├──< expense_notes
                          └──< expense_receipts >── receipt_files ──< ocr_runs ──< ocr_field_candidates

participants ──< work_logs
             └──< mileage_logs

users ──< audit_events / user_notifications
```

24 tables. `expenses.confirmed_amount_candidate_id` also points at `ocr_field_candidates`, which is why the expense tables are created after the OCR tables.

## 4. Identity and access

### `users`

One row per staff account. Participants are never stored here, and the login link and role live inline rather than in tables of their own.

`id`, `display_name`, `email`, `role` (`admin|passport_worker`), `status` (`invited|active|suspended|deactivated`), `auth_provider` (default `supabase`), `auth_subject` (the JWT `sub`, null until the invite is accepted), `created_at`, `updated_at`, `deactivated_at`.

- `CHECK (email = lower(btrim(email)))` — normalizes on write, so a plain `UNIQUE(email)` is enough and lookups don't depend on callers remembering `lower()`.
- `CHECK ((status = 'deactivated') = (deactivated_at IS NOT NULL))` — the two cannot drift apart.
- `CHECK (status = 'invited' OR auth_subject IS NOT NULL)` — an activated account must be able to sign in. Invited rows may carry a null subject, and because `UNIQUE` treats nulls as distinct, several pending invites do not collide.
- `UNIQUE(email)`, `UNIQUE(auth_subject)`.
- Deactivate rather than delete, so history keeps an actor.

**Login.** Supabase owns credentials, email verification, sessions, and password reset; the database stores only the subject link. The backend validates the JWT and resolves `auth_subject` to an active row on every request. No password, token, or provider secret is stored. An email domain may restrict who can be invited; it never grants a role or participant access. If a second login provider is ever added, the link becomes its own table.

**Role is one column, not a join table.** It says what a person may do, not what they may see — participant access is `participant_assignments`. One role per person assumes an admin can do everything a worker can; if Torchlight needs someone to hold both at once, this becomes `roles TEXT[]` with a containment check. Role grants are recorded in `audit_events` rather than in a `granted_by_user_id` column.

### `participants`

`id`, `display_name`, `internal_reference` (nullable, unique), `status` (`active|inactive|archived`), `created_at`, `updated_at`, `archived_at`.

- `CHECK (internal_reference IS NULL OR btrim(internal_reference) <> '')` — `UNIQUE` treats NULLs as distinct but would accept `''` and `'   '` as two values.
- `CHECK ((status = 'archived') = (archived_at IS NOT NULL))`.
- No address, birth date, diagnosis, SIN, or health number. A Ministry client code gets its own column if Torchlight confirms one; it must not be folded into `internal_reference`, which means a Torchlight-side reference.

### `participant_assignments`

Temporal authorization: which worker may act for which participant.

`id`, `participant_id`, `worker_user_id`, `assigned_by_user_id`, `assigned_at`, `ended_at`, `end_reason`.

- `CHECK (ended_at IS NULL OR ended_at >= assigned_at)`. The `>=` is deliberate: `now()` is the transaction timestamp, so an assignment created and ended in one transaction compares equal. A storable zero-length assignment is harmless; a strict `>` would fail tests and quick admin corrections.
- `CHECK (ended_at IS NOT NULL OR end_reason IS NULL)`.
- Partial unique index on `(worker_user_id, participant_id) WHERE ended_at IS NULL` — one open assignment per pair.
- Indexes on `(worker_user_id, participant_id, ended_at)` and `(participant_id, ended_at)`.

Ending an assignment is a service rule, not a status lookup. Deactivating a worker or archiving a participant must, in the same transaction, close their open assignments — otherwise "who is currently assigned?" still lists them. The ending workflow also hands off any unconfirmed draft, so a receipt is never stranded.

## 5. Funding year and the category catalog

### `fiscal_periods`

`id`, `label UNIQUE`, `starts_on`, `ends_on`, `created_at`.

- `CHECK (starts_on <= ends_on)`.
- `EXCLUDE USING gist (daterange(starts_on, ends_on, '[]') WITH &&)` — without it, two overlapping years make every balance query either double-count or silently pick a row.

The April–March boundary is a row to seed, not an assumption baked into code. Getting it wrong misclassifies every transaction on either side.

### `funding_categories`

The Ministry catalog: **19 rows**, PDF items 1–12 and 14–19 plus "Other types, please specify" as `p1-13`.

`id`, `code UNIQUE`, `name`, `requires_description`, `active`, `created_at`.

"Other" is a real category row because it can carry a cap like any other bucket. `requires_description = true` marks it. This differs from the earlier position that Other was a classification with no allocation; the difference is that the flat cap model needs a bucket for every funded line, and Other is one of the lines a participant can be funded on.

Category identity is a UUID, not a code constant, because money hangs off it. Renaming a category in the source code must not change the meaning of historical rows. Retire with `active = false` and add a new row; never reuse a code for a different concept.

### `funding_subcategories`

`id`, `category_id`, `code`, `name`, `active`; `UNIQUE(category_id, code)`.

Only some categories have them (CPS Supplies, Live event tickets, Technology). Codes are unique per category, not globally.

## 6. Caps

### `funding_category_cap_defaults`

The Ministry-wide cap per category per funding year. `(category_id, fiscal_period_id)` composite PK, `annual_cap_amount`, `created_at`.

Scoped by period rather than stored on the category: if the Technology cap rises and the value is edited in place, every historical balance and already-issued export silently changes meaning. A new rule is a new row.

This table is the pre-fill template and the policy ceiling. It is also why an admin does not retype the same cap into 36 participants' records.

### `participant_category_caps`

One participant's ceiling for one category in one funding year. `(participant_id, fiscal_period_id, category_id)` composite PK, `annual_cap_amount`, `created_by_user_id`, `created_at`.

- A **missing row means "use the Ministry default"**, so the standard case is zero data entry.
- A row exists to record a participant-specific amount or an approved variance.
- Spending is never stored here.

```sql
SELECT COALESCE(pc.annual_cap_amount, d.annual_cap_amount) AS effective_cap
FROM funding_categories c
LEFT JOIN funding_category_cap_defaults d
  ON d.category_id = c.id AND d.fiscal_period_id = :period_id
LEFT JOIN participant_category_caps pc
  ON pc.category_id = c.id AND pc.participant_id = :participant_id
 AND pc.fiscal_period_id = :period_id
WHERE c.id = :category_id;
```

Absence of both means "no cap recorded", not a guessed zero. Do not seed dollar figures until Torchlight confirms the amounts and which lines they attach to. A participant's total annual funding is the sum of effective caps; there is no separate total to keep in sync.

## 7. Activity planning

### `activity_plans`

`id`, `participant_id`, `created_by_user_id`, `fiscal_period_id`, `title`, `planned_for`, `status` (`open|converted|cancelled|expired`), `created_at`, `updated_at`, `expires_at`.

Estimates only. They reserve no money and never affect a balance.

### `activity_plan_lines`

`id`, `activity_plan_id`, `category_id` (required), `other_category_description`, `requested_amount`, `estimated_passport_coverage`, `estimated_out_of_pocket`, `estimated_at`.

- `CHECK (estimated_passport_coverage + estimated_out_of_pocket = requested_amount)`.
- Converting a plan to an expense creates a normal expense and requires a receipt; it must not double-post the estimate.

## 8. Expenses

### `expenses`

One submitted expense. OCR output is never stored as the final amount.

`id`, `participant_id`, `fiscal_period_id`, `category_id` (**required**), `other_category_description`, `subcategory_id`, `submitted_by_user_id`, `source_kind` (`worker|admin|day_program_invoice|import|other`), `source_reference`, `expense_date`, `vendor_name`, `description`, `amount`, `currency`, `status` (`draft|awaiting_worker_confirmation|confirmed|rejected|voided`), `review_status` (`not_required|pending|reviewed|needs_correction`), `confirmed_by_user_id`, `confirmed_at`, `confirmed_amount_candidate_id`, `created_at`, `updated_at`, `voided_at`.

- `amount` is null until a human enters or confirms it; `CHECK (amount IS NULL OR amount > 0)`.
- `CHECK (status <> 'confirmed' OR (amount IS NOT NULL AND confirmed_by_user_id IS NOT NULL AND confirmed_at IS NOT NULL))` — confirmation state cannot be set halfway.
- `CHECK (other_category_description IS NULL OR btrim(other_category_description) <> '')`.
- Indexes: `(participant_id, expense_date)`, `(participant_id, fiscal_period_id, category_id, status)`, `(submitted_by_user_id, status, created_at)`, `(review_status, created_at)`.

*Service rule:* when `funding_categories.requires_description` is true, an expense on that category must supply the description. This is not a row `CHECK` because it depends on another table; it belongs in the confirmation transaction.

A worker may create and edit their own unconfirmed submissions and read but not edit records from other sources. After confirmation, a change to money or category is a reversal plus a replacement, never an edit.

### `expense_funding_splits`

How a confirmed amount was covered, one row per payer. This is why no `covered_amount` column exists on `expenses`: the split is the record of who paid, and the Passport rows are what fill the cap.

`id`, `expense_id`, `split_kind` (`passport|organization|family|partner|other_unfunded`), `amount`, `created_at`.

At confirmation the split amounts must sum to `expenses.amount`. Cross-row sum checks belong to the service transaction.

### `expense_events`

Append-only lifecycle log: `id`, `expense_id`, `actor_user_id`, `event_type`, `occurred_at`, `safe_details JSONB`. Never copies receipt bytes or raw OCR text.

### `expense_adjustments`

Append-only signed delta against a confirmed expense: `kind` (`refund|chargeback|reversal|other_approved`), `effective_date`, `total_delta != 0`, `passport_delta`, `reason`, `created_by_user_id`, `created_at`.

`passport_delta` must be zero or share the sign of `total_delta`, and cannot exceed it in magnitude. Corrections are compensating rows; nothing is edited or deleted.

### `expense_reviews`

Append-only admin decisions: `reviewer_user_id`, `decision` (`reviewed_ok|needs_correction|rejected|other`), `note`, `created_at`. A second review adds a row; it never overwrites the first. Review is not confirmation.

### `expense_notes`

Communication record: `author_user_id`, `recipient_kind`, `channel` (`phone|in_person|email|other`, nullable), `note`, `recorded_at`. This is where "the family was told the amount isn't fully covered" is logged. It does not imply an invoice was sent or paid.

## 9. Receipts and OCR

### `receipt_files`

Private object metadata only. `storage_key` (unique, opaque, non-PII), `original_filename` (display only), `content_type`, `byte_size > 0`, `sha256`, `uploaded_by_user_id`, `uploaded_at`, `deleted_at`, `deleted_by_user_id`.

- Bytes never enter PostgreSQL: backups stay small, WAL stays small, and a receipt ZIP can stream from object storage.
- `storage_key` must not encode a name, date, or participant. That string lands in access logs, proxies, error trackers, and presigned URLs.
- `sha256` catches duplicate uploads, proves the stored object is the reviewed one, and answers "was this the file at audit time?" without a second copy.
- Deletion is two-phase: soft-delete the row now, purge the object under the approved retention period.

### `expense_receipts`

`(expense_id, receipt_file_id)` composite PK plus `attached_by_user_id`, `attached_at`. Many-to-many, because a receipt can have three pages and one invoice can cover two participants. A `receipt_id` column on `expenses` cannot express either.

### `ocr_runs`

`id`, `receipt_file_id`, `engine_name`, `engine_version`, `status` (`succeeded|needs_review|failed`), `started_at`, `completed_at`, `safe_error_code`. One row per attempt, so re-running after an engine upgrade is history rather than an overwrite.

### `ocr_field_candidates`

`id`, `ocr_run_id`, `field_name` (`amount|date|vendor|other_approved`), `candidate_value`, `confidence` (0–1), `page_number`, `source`, `created_at`.

Multiple candidates per field. The worker's accepted amount is copied into `expenses.amount` and linked through `confirmed_amount_candidate_id`, which preserves who confirmed it and when. Low confidence flags the expense for review without blocking the worker's confirmation.

## 10. Hours and mileage

`work_logs`: `participant_id`, `worker_user_id`, `started_at`, `ended_at`, `entered_timezone`, `break_minutes >= 0`, `notes`, `status` (`draft|submitted|approved|returned|voided`), timestamps. `CHECK (ended_at IS NULL OR ended_at > started_at)`. Duration is computed, never stored as an editable number.

`mileage_logs`: `participant_id`, `worker_user_id`, `travel_date`, `distance_km > 0`, `purpose`, `notes`, `status`, timestamps.

Separate tables because a mileage-only trip has no shift, and a shift usually has no driving. Neither table implies an expense, a rate, or Passport coverage; no mileage rate or meal rate is assumed anywhere.

## 11. Audit, notifications, and balances

`audit_events`: `actor_user_id` (null for system), `action`, `entity_type`, `entity_id`, `occurred_at`, `request_id`, `safe_details JSONB`. Indexed on `(entity_type, entity_id, occurred_at)` and `(actor_user_id, occurred_at)`. Append-only; restrict database permissions so ordinary application roles cannot rewrite it. Export generation and download are recorded here.

`user_notifications` (optional): `user_id`, `notification_kind`, `entity_type`, `entity_id`, `created_at`, `read_at`. References records instead of copying details. Drop it if the MVP has no in-app alerts.

### Balance semantics

- No `remaining_balance` column anywhere is authoritative.
- `effective_cap` = participant cap, else Ministry default, else no cap.
- `spent` = sum of `expense_funding_splits.amount` where `split_kind = 'passport'`, joined to confirmed expenses for that participant, period, and category.
- `net_spent` = `spent` plus signed `expense_adjustments.passport_delta` rows for those expenses.
- `headroom` = `effective_cap − net_spent`.
- A draft or unconfirmed expense never counts. A confirmed expense still counts after being voided; its full reversal brings its net impact to zero. Never filter a reversed expense out *and* subtract its reversal.
- A confirmed expense can take a category past its cap only if the service allows it; decide whether overspend is blocked, warned, or admin-overridable, and enforce whichever it is with a row lock in the confirmation transaction.

## 12. Deferred, deliberately

These were designed in earlier revisions and are **not** in the schema:

| Deferred | Why | What it costs later |
|---|---|---|
| `invoices`, `invoice_lines` | Invoicing is not being built yet | A new table plus a link from an uncovered split when it is |
| `billing_parties`, `participant_billing_parties` | No invoice recipients to store yet | Add when the first invoice needs a payer identity |
| `report_exports`, `report_export_participants` | Exports can be generated on request and streamed | Add only if cached exports become necessary; audit events already record who exported what |
| `funding_plans` and plan versioning | One cap per participant/category/year is enough; plans added approval workflow nobody asked for | If mid-year reallocation history is ever needed, add an append-only cap-change log rather than a plan object |

`expense_funding_splits` already distinguishes `family`, `partner`, and `organization`, so who owes an uncovered amount is known even without party records. When billing returns, add the party tables and point the split at one.

## 13. Decisions still needed

1. **Catalog:** confirm the 19 names/codes, whether Other is ever funded, and the subcategory lists.
2. **Fiscal calendar and caps:** confirm year boundaries, each cap amount, and whether a participant cap may exceed the Ministry default.
3. **Overspend:** block, warn, or allow with admin approval?
4. **Posting:** confirm that worker confirmation posts to the ledger even while review is pending, and that a later rejection is a full reversal.
5. **Receipts:** allowed file types and sizes, malware scanning, storage provider and region, OCR confidence threshold, raw-text retention, and the audit retention period.
6. **Hours and mileage:** whether admin approval is required and whether either can affect funding.
7. **PII:** minimum participant fields, access review, retention, backups, incident process.
8. **Exports:** the current Ministry workbook, column meanings, and whether a row represents expense date or confirmation date.

## 14. Migration notes

- One revision creates all 24 tables; it has been verified upgrade → downgrade → upgrade, and `alembic check` reports no drift from the models.
- The exclusion constraint and the partial unique indexes are created with the tables; they are what make overlapping fiscal years and duplicate open assignments impossible rather than merely discouraged.
- `alembic/versions/*` is exempted from two lint rules (`E501`, `I001`, `UP007`, `UP035`) because Alembic generates those files.
- Add models to `app/db/models/__init__.py`. A module that is never imported is invisible to `--autogenerate`, which is how a model silently fails to reach the database.
- Cross-row invariants (split sums, cap resolution, category/period consistency) stay in the service transaction, not in triggers.
