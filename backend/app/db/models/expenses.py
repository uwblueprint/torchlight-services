import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKeyConstraint, Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.common import UUIDPrimaryKey, created_at, fk, one_of


class OcrStatus(StrEnum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    SKIPPED = "skipped"


class ExpenseSourceKind(StrEnum):
    WORKER = "worker"
    ADMIN = "admin"
    DAY_PROGRAM_INVOICE = "day_program_invoice"
    IMPORT = "import"
    OTHER = "other"


class ExpenseStatus(StrEnum):
    DRAFT = "draft"
    AWAITING_WORKER_CONFIRMATION = "awaiting_worker_confirmation"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    VOIDED = "voided"


class ReviewStatus(StrEnum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    REVIEWED = "reviewed"
    NEEDS_CORRECTION = "needs_correction"


class Receipt(UUIDPrimaryKey, Base):
    """An uploaded receipt or invoice file plus its advisory OCR output.

    A multi-page upload is one object. One receipt can back several expenses (for example one
    invoice covering two participants); `participant_id` here is bookkeeping, and each
    expense's own `participant_id` is authoritative. OCR output never approves or categorizes
    an expense.
    """

    __tablename__ = "receipts"
    __table_args__ = (
        one_of("ocr_status", OcrStatus),
        CheckConstraint(
            "ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)",
            name="ocr_confidence_range",
        ),
        Index("ix_receipts_participant_id", "participant_id"),
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(fk("participants.id"))
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(fk("users.id"))
    storage_key: Mapped[str] = mapped_column(unique=True)
    content_type: Mapped[str]
    ocr_status: Mapped[str] = mapped_column(server_default=OcrStatus.PENDING.value)
    ocr_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    ocr_extracted_data: Mapped[dict[str, Any] | None]
    created_at: Mapped[datetime] = created_at()


class Expense(UUIDPrimaryKey, Base):
    """One funded (or partly funded) purchase for one participant.

    Coverage is two columns: `covered_amount` is charged to Passport funding and
    `out_of_pocket_amount` is not; who paid the remainder is a note, not data. A wrong confirmed
    expense is voided and re-entered rather than edited (enforced in API-02), and review
    decisions, corrections, and voids are recorded in `audit_events`.
    """

    __tablename__ = "expenses"
    __table_args__ = (
        one_of("source_kind", ExpenseSourceKind),
        one_of("status", ExpenseStatus),
        one_of("review_status", ReviewStatus),
        CheckConstraint(
            "covered_amount + out_of_pocket_amount = total_amount", name="amounts_sum_to_total"
        ),
        CheckConstraint(
            "total_amount >= 0 AND covered_amount >= 0 AND out_of_pocket_amount >= 0",
            name="amounts_nonnegative",
        ),
        CheckConstraint(
            "status <> 'confirmed' OR total_amount > 0", name="confirmed_amount_positive"
        ),
        # Otherwise a confirmed expense silently drops out of every category balance.
        CheckConstraint(
            "status <> 'confirmed' OR category_id IS NOT NULL", name="confirmed_has_category"
        ),
        CheckConstraint(
            "(reviewed_by_id IS NULL) = (reviewed_at IS NULL)", name="reviewed_by_and_at_together"
        ),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="end_date_after_start"),
        CheckConstraint(
            "ticket_count IS NULL OR ticket_count >= 0", name="ticket_count_nonnegative"
        ),
        CheckConstraint(
            "other_category_desc IS NULL OR btrim(other_category_desc) <> ''",
            name="other_category_desc_not_blank",
        ),
        # MATCH SIMPLE skips the composite FK when category_id is NULL, so require it here.
        CheckConstraint(
            "subcategory_id IS NULL OR category_id IS NOT NULL",
            name="subcategory_requires_category",
        ),
        ForeignKeyConstraint(
            ["subcategory_id", "category_id"],
            ["funding_subcategories.id", "funding_subcategories.category_id"],
            ondelete="RESTRICT",
        ),
        Index("ix_expenses_balance", "participant_id", "fiscal_year", "category_id", "status"),
        Index("ix_expenses_review_queue", "review_status", "created_at"),
        Index("ix_expenses_receipt_id", "receipt_id"),
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(fk("participants.id"))
    # Derived server-side from start_date, never accepted from a client.
    fiscal_year: Mapped[int]
    receipt_id: Mapped[uuid.UUID | None] = mapped_column(fk("receipts.id"))
    # Nullable so an unclassified expense can exist before review (DB-01 open decision 2).
    category_id: Mapped[uuid.UUID | None] = mapped_column(fk("funding_categories.id"))
    subcategory_id: Mapped[uuid.UUID | None]
    other_category_desc: Mapped[str | None]
    submitted_by_id: Mapped[uuid.UUID | None] = mapped_column(fk("users.id"))
    source_kind: Mapped[str]
    vendor_name: Mapped[str | None]
    receipt_number: Mapped[str | None]
    start_date: Mapped[date]
    end_date: Mapped[date | None]
    ticket_count: Mapped[int | None]
    total_amount: Mapped[Decimal]
    covered_amount: Mapped[Decimal]
    out_of_pocket_amount: Mapped[Decimal]
    status: Mapped[str] = mapped_column(server_default=ExpenseStatus.DRAFT.value)
    review_status: Mapped[str]
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(fk("users.id"))
    reviewed_at: Mapped[datetime | None]
    review_note: Mapped[str | None]
    family_informed_note: Mapped[str | None]
    # Allowed values are unconfirmed (INVOICE-01), so there is no CHECK or default yet.
    invoice_status: Mapped[str]
    invoice_payer_name: Mapped[str | None]
    created_at: Mapped[datetime] = created_at()
