import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.common import UUIDPrimaryKey, created_at, one_of, updated_at


class UserRole(StrEnum):
    ADMIN = "admin"
    PASSPORT_WORKER = "passport_worker"


class UserStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class User(UUIDPrimaryKey, Base):
    """A Torchlight staff account.

    Supabase Auth is the only identity provider and there is no provider subject column:
    `email` is the join key to the Supabase account. Changing a user's email therefore
    requires re-linking the Supabase account in the same change, or sign-in stops matching.
    Accounts are deactivated, never deleted, because expenses and audit events reference them.
    """

    __tablename__ = "users"
    __table_args__ = (
        # With UNIQUE(email), this makes email uniqueness case- and whitespace-insensitive.
        CheckConstraint("email = lower(btrim(email))", name="email_normalized"),
        one_of("role", UserRole),
        one_of("status", UserStatus),
        CheckConstraint(
            "(status = 'deactivated') = (deactivated_at IS NOT NULL)",
            name="deactivated_at_matches_status",
        ),
    )

    display_name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    role: Mapped[str]
    status: Mapped[str]
    deactivated_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()


class Participant(UUIDPrimaryKey, Base):
    """A person receiving Passport funding. Kept minimal: only what staff need to identify them."""

    __tablename__ = "participants"

    display_name: Mapped[str]
    client_code: Mapped[str | None] = mapped_column(unique=True)
    is_active: Mapped[bool] = mapped_column(server_default=text("true"))
    created_at: Mapped[datetime] = created_at()


class ParticipantAssignment(UUIDPrimaryKey, Base):
    """Which worker supports which participant, and when.

    This is the authorization boundary (AUTH-01): a worker sees a participant only through an
    open assignment (`ended_at IS NULL`). Ending an assignment keeps the row as history.
    """

    __tablename__ = "participant_assignments"
    __table_args__ = (
        CheckConstraint("ended_at IS NULL OR ended_at >= assigned_at", name="ended_after_assigned"),
        Index(
            "uq_participant_assignments_open_worker_participant",
            "worker_id",
            "participant_id",
            unique=True,
            postgresql_where=text("ended_at IS NULL"),
        ),
    )

    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"))
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = created_at()
    ended_at: Mapped[datetime | None]
