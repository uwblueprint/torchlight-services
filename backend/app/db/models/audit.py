import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.common import UUIDPrimaryKey, created_at, fk


class AuditEvent(UUIDPrimaryKey, Base):
    """Append-only record of a sensitive action; the only history table.

    Review decisions, corrections, and voids are recorded here and nowhere else. Database
    triggers (created in the DB-01 migration) reject UPDATE, DELETE, and TRUNCATE.
    `safe_details` must not hold receipt contents, OCR text, secrets, or unnecessary personal
    information.
    """

    __tablename__ = "audit_events"
    __table_args__ = (
        CheckConstraint("jsonb_typeof(safe_details) = 'object'", name="safe_details_is_object"),
        Index("ix_audit_events_entity", "entity_type", "entity_id", "occurred_at"),
        Index("ix_audit_events_actor", "actor_user_id", "occurred_at"),
    )

    # NULL for system actions with no signed-in user.
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(fk("users.id"))
    action: Mapped[str]
    entity_type: Mapped[str]
    entity_id: Mapped[uuid.UUID | None]
    occurred_at: Mapped[datetime] = created_at()
    request_id: Mapped[str | None]
    safe_details: Mapped[dict[str, Any]] = mapped_column(server_default=text("'{}'::jsonb"))
