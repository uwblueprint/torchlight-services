import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Numeric, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.common import UUIDPrimaryKey, created_at, fk


class FundingCategory(UUIDPrimaryKey, Base):
    """A Ministry Passport funding category (seeded catalog).

    `code` is stable (`p1-NN`, the Ministry form's item number); never reuse a code for a
    different concept. Retire a category with `active = false` and add a new row instead.
    """

    __tablename__ = "funding_categories"
    __table_args__ = (
        CheckConstraint(
            "default_annual_cap IS NULL OR default_annual_cap >= 0",
            name="default_annual_cap_nonnegative",
        ),
    )

    code: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    # NULL means no cap has been confirmed; it is not a cap of zero.
    default_annual_cap: Mapped[Decimal | None]
    active: Mapped[bool] = mapped_column(server_default=text("true"))


class FundingSubcategory(UUIDPrimaryKey, Base):
    __tablename__ = "funding_subcategories"
    __table_args__ = (
        UniqueConstraint("category_id", "name"),
        # Target for expenses' composite FK, which keeps a subcategory inside its category.
        UniqueConstraint("id", "category_id"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(fk("funding_categories.id"))
    name: Mapped[str]
    active: Mapped[bool] = mapped_column(server_default=text("true"))


class ParticipantBudget(UUIDPrimaryKey, Base):
    """One participant's annual Passport budget.

    `fiscal_year` is an integer label derived server-side from dates, never accepted from a
    client; the fiscal-year boundary is not yet confirmed.
    """

    __tablename__ = "participant_budgets"
    __table_args__ = (
        UniqueConstraint("participant_id", "fiscal_year"),
        CheckConstraint("total_budget >= 0", name="total_budget_nonnegative"),
        CheckConstraint(
            "admin_fee_percent IS NULL OR admin_fee_percent BETWEEN 0 AND 100",
            name="admin_fee_percent_range",
        ),
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(fk("participants.id"))
    fiscal_year: Mapped[int]
    managing_agency: Mapped[str]
    total_budget: Mapped[Decimal]
    # Nullable until the admin-fee treatment is confirmed (DB-01 open decision 1).
    admin_fee_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = created_at()


class CategoryAllocation(UUIDPrimaryKey, Base):
    """How much of a participant's budget goes to one category.

    One row per category is materialized when the budget is created, so a balance query never
    falls back to a default. The category's default_annual_cap only pre-fills the amount; while it
    is NULL (unconfirmed) the admin enters the allocation. Allocations belong to their budget and
    are deleted with it.
    """

    __tablename__ = "category_allocations"
    __table_args__ = (
        UniqueConstraint("participant_budget_id", "category_id"),
        CheckConstraint("allocated_amount >= 0", name="allocated_amount_nonnegative"),
        CheckConstraint("projected_amount >= 0", name="projected_amount_nonnegative"),
    )

    participant_budget_id: Mapped[uuid.UUID] = mapped_column(
        fk("participant_budgets.id", ondelete="CASCADE")
    )
    category_id: Mapped[uuid.UUID] = mapped_column(fk("funding_categories.id"))
    allocated_amount: Mapped[Decimal]
    projected_amount: Mapped[Decimal]
