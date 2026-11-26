import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.common import UUIDPrimaryKey, created_at, updated_at


class ShiftLog(UUIDPrimaryKey, Base):
    """Worker hours and/or mileage for one participant on one day.

    Either part may be absent: a mileage-only trip has no shift times. `service_date` is the
    day worked or driven, which monthly reporting groups by. Mileage rates are not stored here.
    """

    __tablename__ = "shift_logs"
    __table_args__ = (
        CheckConstraint(
            "shift_end IS NULL OR shift_start IS NULL OR shift_end > shift_start",
            name="shift_end_after_start",
        ),
        CheckConstraint(
            "shift_end IS NULL OR shift_start IS NOT NULL", name="shift_end_requires_start"
        ),
        CheckConstraint("mileage_km IS NULL OR mileage_km >= 0", name="mileage_km_nonnegative"),
        CheckConstraint(
            "shift_start IS NOT NULL OR mileage_km IS NOT NULL", name="has_shift_or_mileage"
        ),
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"))
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    service_date: Mapped[date]
    shift_start: Mapped[datetime | None]
    shift_end: Mapped[datetime | None]
    mileage_km: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None]
    # Allowed values are unconfirmed (SHIFT-01), so there is no CHECK or default yet.
    status: Mapped[str]
    created_at: Mapped[datetime] = created_at()


class ActivityPlan(UUIDPrimaryKey, Base):
    """A dated plan header for a participant's activity. No line items or cost estimates."""

    __tablename__ = "activity_plans"
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"))
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    fiscal_year: Mapped[int]
    title: Mapped[str]
    planned_for: Mapped[date]
    # Allowed values are unconfirmed, so there is no CHECK or default yet.
    status: Mapped[str]
    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()
    expires_at: Mapped[datetime | None]
