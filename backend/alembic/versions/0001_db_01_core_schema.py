"""DB-01 core schema: twelve tables, the funding category catalog, and append-only audit events.

Revision ID: 0001
Revises:
Create Date: 2026-11-21 11:50:10.986406

The catalog is a snapshot transcribed from the Ministry Passport form (P1PictureInstructions.pdf,
via frontend/src/lib/passport-categories.ts). Codes follow the transcription's numbering, with
"Other" as p1-13. Confirm names and codes against the PDF: a code can never be reused once data
references it. No caps are seeded (default_annual_cap stays NULL until Torchlight confirms the
amounts), and no participant, budget, expense, or receipt data.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Inlined rather than imported so this migration never changes when application code does.
FUNDING_CATEGORIES = [
    ("p1-01", "Community participation supports and activities of daily living"),
    ("p1-02", "Education: tutoring, personal training, life skill development, job coaching"),
    ("p1-03", "Respite: in-home relief"),
    (
        "p1-04",
        "Community activities e.g. participation in sporting/recreational activities, museums, "
        "park admissions, bowling, movies, etc.",
    ),
    (
        "p1-05",
        "Day programs, classes, training, workshops, resume development and tests and licenses",
    ),
    ("p1-06", "Membership / Live Event Season Ticket Packages"),
    ("p1-07", "Camp"),
    ("p1-08", "Out of home respite"),
    ("p1-09", "Transportation provided by agency, taxis, parking, public transit (not annual)"),
    ("p1-10", "Annual Public Transit Pass"),
    (
        "p1-11",
        "Support Worker's vacation expenses for accompanying client during trips and holiday "
        "travel",
    ),
    ("p1-12", "Support Worker's meal"),
    # Its expenses should describe themselves in other_category_desc; the API enforces that.
    ("p1-13", "Other types (please specify)"),
    ("p1-14", "CPS Supplies and Equipment"),
    ("p1-15", "Mileage"),
    ("p1-16", "Administration"),
    ("p1-17", "Person Directed Program"),
    ("p1-18", "Live event tickets"),
    ("p1-19", "Technology"),
]

FUNDING_SUBCATEGORIES = {
    "p1-14": [
        "Activity/hobby/recreational supplies and equipment",
        "Other",
        "Personal fitness equipment",
        "PPE",
        "Sensory items",
    ],
    "p1-18": [
        "Live Theatre/Musicals",
        "Music Events",
        "Other Live Entertainment",
        "Sporting Events",
    ],
    "p1-19": [
        "Cell phones and phone plans",
        "Computers, laptops, tablets and related accessories",
        "Other hardware/electronic items",
        "Other services",
        "Technology Services",
    ],
}


def seed_funding_catalog() -> None:
    categories = sa.table(
        "funding_categories", sa.column("code", sa.Text), sa.column("name", sa.Text)
    )
    op.bulk_insert(categories, [{"code": code, "name": name} for code, name in FUNDING_CATEGORIES])
    for code, names in FUNDING_SUBCATEGORIES.items():
        for name in names:
            op.execute(
                sa.text(
                    "INSERT INTO funding_subcategories (category_id, name) "
                    "SELECT id, :name FROM funding_categories WHERE code = :code"
                ).bindparams(name=name, code=code)
            )


def make_audit_events_append_only() -> None:
    # Guards against application bugs, not a database owner: they can still disable triggers.
    op.execute(
        """
        CREATE FUNCTION audit_events_reject_change() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'audit_events is append-only: % is not allowed', TG_OP;
        END
        $$
        """
    )
    op.execute(
        "CREATE TRIGGER audit_events_no_update_delete BEFORE UPDATE OR DELETE ON audit_events "
        "FOR EACH ROW EXECUTE FUNCTION audit_events_reject_change()"
    )


def upgrade() -> None:
    op.create_table(
        "funding_categories",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("default_annual_cap", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.CheckConstraint(
            "default_annual_cap IS NULL OR default_annual_cap >= 0",
            name=op.f("ck_funding_categories_default_annual_cap_nonnegative"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_funding_categories")),
        sa.UniqueConstraint("code", name=op.f("uq_funding_categories_code")),
    )
    op.create_table(
        "participants",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("client_code", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_participants")),
        sa.UniqueConstraint("client_code", name=op.f("uq_participants_client_code")),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "(status = 'deactivated') = (deactivated_at IS NOT NULL)",
            name=op.f("ck_users_deactivated_at_matches_status"),
        ),
        sa.CheckConstraint(
            "role IN ('admin', 'passport_worker')", name=op.f("ck_users_role_allowed")
        ),
        sa.CheckConstraint(
            "status IN ('invited', 'active', 'suspended', 'deactivated')",
            name=op.f("ck_users_status_allowed"),
        ),
        sa.CheckConstraint("email = lower(btrim(email))", name=op.f("ck_users_email_normalized")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_table(
        "activity_plans",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("planned_for", sa.Date(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"], ["users.id"], name=op.f("fk_activity_plans_created_by_user_id")
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"], ["participants.id"], name=op.f("fk_activity_plans_participant_id")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_activity_plans")),
    )
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("entity_type", sa.Text(), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=True),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("request_id", sa.Text(), nullable=True),
        sa.Column(
            "safe_details",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "jsonb_typeof(safe_details) = 'object'",
            name=op.f("ck_audit_events_safe_details_is_object"),
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"], ["users.id"], name=op.f("fk_audit_events_actor_user_id")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_events")),
    )
    op.create_index(
        "ix_audit_events_actor", "audit_events", ["actor_user_id", "occurred_at"], unique=False
    )
    op.create_index(
        "ix_audit_events_entity",
        "audit_events",
        ["entity_type", "entity_id", "occurred_at"],
        unique=False,
    )
    op.create_table(
        "funding_subcategories",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["funding_categories.id"],
            name=op.f("fk_funding_subcategories_category_id"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_funding_subcategories")),
        sa.UniqueConstraint(
            "category_id", "name", name=op.f("uq_funding_subcategories_category_id_name")
        ),
        sa.UniqueConstraint(
            "id", "category_id", name=op.f("uq_funding_subcategories_id_category_id")
        ),
    )
    op.create_table(
        "participant_assignments",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("worker_id", sa.Uuid(), nullable=False),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "ended_at IS NULL OR ended_at >= assigned_at",
            name=op.f("ck_participant_assignments_ended_after_assigned"),
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["participants.id"],
            name=op.f("fk_participant_assignments_participant_id"),
        ),
        sa.ForeignKeyConstraint(
            ["worker_id"], ["users.id"], name=op.f("fk_participant_assignments_worker_id")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_participant_assignments")),
    )
    op.create_index(
        "uq_participant_assignments_open_worker_participant",
        "participant_assignments",
        ["worker_id", "participant_id"],
        unique=True,
        postgresql_where=sa.text("ended_at IS NULL"),
    )
    op.create_table(
        "participant_budgets",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("managing_agency", sa.Text(), nullable=False),
        sa.Column("total_budget", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("admin_fee_percent", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "admin_fee_percent IS NULL OR admin_fee_percent BETWEEN 0 AND 100",
            name=op.f("ck_participant_budgets_admin_fee_percent_range"),
        ),
        sa.CheckConstraint(
            "total_budget >= 0", name=op.f("ck_participant_budgets_total_budget_nonnegative")
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["participants.id"],
            name=op.f("fk_participant_budgets_participant_id"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_participant_budgets")),
        sa.UniqueConstraint(
            "participant_id",
            "fiscal_year",
            name=op.f("uq_participant_budgets_participant_id_fiscal_year"),
        ),
    )
    op.create_table(
        "receipts",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("uploaded_by_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("ocr_status", sa.Text(), nullable=False),
        sa.Column("ocr_confidence", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("ocr_extracted_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "ocr_status IN ('pending', 'succeeded', 'failed', 'skipped')",
            name=op.f("ck_receipts_ocr_status_allowed"),
        ),
        sa.CheckConstraint(
            "ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)",
            name=op.f("ck_receipts_ocr_confidence_range"),
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"], ["participants.id"], name=op.f("fk_receipts_participant_id")
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by_id"], ["users.id"], name=op.f("fk_receipts_uploaded_by_id")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_receipts")),
        sa.UniqueConstraint("storage_key", name=op.f("uq_receipts_storage_key")),
    )
    op.create_table(
        "shift_logs",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("worker_id", sa.Uuid(), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("shift_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("shift_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("mileage_km", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "mileage_km IS NULL OR mileage_km >= 0",
            name=op.f("ck_shift_logs_mileage_km_nonnegative"),
        ),
        sa.CheckConstraint(
            "shift_end IS NULL OR shift_start IS NOT NULL",
            name=op.f("ck_shift_logs_shift_end_requires_start"),
        ),
        sa.CheckConstraint(
            "shift_end IS NULL OR shift_start IS NULL OR shift_end > shift_start",
            name=op.f("ck_shift_logs_shift_end_after_start"),
        ),
        sa.CheckConstraint(
            "shift_start IS NOT NULL OR mileage_km IS NOT NULL",
            name=op.f("ck_shift_logs_has_shift_or_mileage"),
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"], ["participants.id"], name=op.f("fk_shift_logs_participant_id")
        ),
        sa.ForeignKeyConstraint(["worker_id"], ["users.id"], name=op.f("fk_shift_logs_worker_id")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_shift_logs")),
    )
    op.create_table(
        "category_allocations",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_budget_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("allocated_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("projected_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.CheckConstraint(
            "allocated_amount >= 0",
            name=op.f("ck_category_allocations_allocated_amount_nonnegative"),
        ),
        sa.CheckConstraint(
            "projected_amount >= 0",
            name=op.f("ck_category_allocations_projected_amount_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["funding_categories.id"],
            name=op.f("fk_category_allocations_category_id"),
        ),
        sa.ForeignKeyConstraint(
            ["participant_budget_id"],
            ["participant_budgets.id"],
            name=op.f("fk_category_allocations_participant_budget_id"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_category_allocations")),
        sa.UniqueConstraint(
            "participant_budget_id",
            "category_id",
            name=op.f("uq_category_allocations_participant_budget_id_category_id"),
        ),
    )
    op.create_table(
        "expenses",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=True),
        sa.Column("category_id", sa.Uuid(), nullable=True),
        sa.Column("subcategory_id", sa.Uuid(), nullable=True),
        sa.Column("other_category_desc", sa.Text(), nullable=True),
        sa.Column("submitted_by_id", sa.Uuid(), nullable=True),
        sa.Column("source_kind", sa.Text(), nullable=False),
        sa.Column("vendor_name", sa.Text(), nullable=True),
        sa.Column("receipt_number", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("ticket_count", sa.Integer(), nullable=True),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("covered_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("out_of_pocket_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("review_status", sa.Text(), nullable=False),
        sa.Column("reviewed_by_id", sa.Uuid(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("family_informed_note", sa.Text(), nullable=True),
        sa.Column("invoice_status", sa.Text(), nullable=False),
        sa.Column("invoice_payer_name", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "other_category_desc IS NULL OR btrim(other_category_desc) <> ''",
            name=op.f("ck_expenses_other_category_desc_not_blank"),
        ),
        sa.CheckConstraint(
            "review_status IN ('not_required', 'pending', 'reviewed', 'needs_correction')",
            name=op.f("ck_expenses_review_status_allowed"),
        ),
        sa.CheckConstraint(
            "source_kind IN ('worker', 'admin', 'day_program_invoice', 'import', 'other')",
            name=op.f("ck_expenses_source_kind_allowed"),
        ),
        sa.CheckConstraint(
            "status <> 'confirmed' OR category_id IS NOT NULL",
            name=op.f("ck_expenses_confirmed_has_category"),
        ),
        sa.CheckConstraint(
            "status <> 'confirmed' OR total_amount > 0",
            name=op.f("ck_expenses_confirmed_amount_positive"),
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'awaiting_worker_confirmation', 'confirmed', 'rejected', "
            "'voided')",
            name=op.f("ck_expenses_status_allowed"),
        ),
        sa.CheckConstraint(
            "(reviewed_by_id IS NULL) = (reviewed_at IS NULL)",
            name=op.f("ck_expenses_reviewed_by_and_at_together"),
        ),
        sa.CheckConstraint(
            "covered_amount + out_of_pocket_amount = total_amount",
            name=op.f("ck_expenses_amounts_sum_to_total"),
        ),
        sa.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name=op.f("ck_expenses_end_date_after_start"),
        ),
        sa.CheckConstraint(
            "subcategory_id IS NULL OR category_id IS NOT NULL",
            name=op.f("ck_expenses_subcategory_requires_category"),
        ),
        sa.CheckConstraint(
            "ticket_count IS NULL OR ticket_count >= 0",
            name=op.f("ck_expenses_ticket_count_nonnegative"),
        ),
        sa.CheckConstraint(
            "total_amount >= 0 AND covered_amount >= 0 AND out_of_pocket_amount >= 0",
            name=op.f("ck_expenses_amounts_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["category_id"], ["funding_categories.id"], name=op.f("fk_expenses_category_id")
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"], ["participants.id"], name=op.f("fk_expenses_participant_id")
        ),
        sa.ForeignKeyConstraint(
            ["receipt_id"], ["receipts.id"], name=op.f("fk_expenses_receipt_id")
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"], ["users.id"], name=op.f("fk_expenses_reviewed_by_id")
        ),
        sa.ForeignKeyConstraint(
            ["subcategory_id", "category_id"],
            ["funding_subcategories.id", "funding_subcategories.category_id"],
            name=op.f("fk_expenses_subcategory_id_category_id"),
        ),
        sa.ForeignKeyConstraint(
            ["submitted_by_id"], ["users.id"], name=op.f("fk_expenses_submitted_by_id")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_expenses")),
    )
    op.create_index(
        "ix_expenses_balance",
        "expenses",
        ["participant_id", "fiscal_year", "category_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_expenses_review_queue", "expenses", ["review_status", "created_at"], unique=False
    )
    make_audit_events_append_only()
    seed_funding_catalog()


def downgrade() -> None:
    op.drop_index("ix_expenses_review_queue", table_name="expenses")
    op.drop_index("ix_expenses_balance", table_name="expenses")
    op.drop_table("expenses")
    op.drop_table("category_allocations")
    op.drop_table("shift_logs")
    op.drop_table("receipts")
    op.drop_table("participant_budgets")
    op.drop_index(
        "uq_participant_assignments_open_worker_participant",
        table_name="participant_assignments",
        postgresql_where=sa.text("ended_at IS NULL"),
    )
    op.drop_table("participant_assignments")
    op.drop_table("funding_subcategories")
    op.drop_index("ix_audit_events_entity", table_name="audit_events")
    op.drop_index("ix_audit_events_actor", table_name="audit_events")
    op.drop_table("audit_events")  # also drops its trigger
    op.execute("DROP FUNCTION audit_events_reject_change()")
    op.drop_table("activity_plans")
    op.drop_table("users")
    op.drop_table("participants")
    op.drop_table("funding_categories")
