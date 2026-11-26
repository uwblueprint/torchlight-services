import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKey:
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()"), sort_order=-1
    )


def created_at() -> Mapped[datetime]:
    return mapped_column(server_default=func.now())


def updated_at() -> Mapped[datetime]:
    # onupdate only fires for ORM/Core updates; raw SQL must set updated_at itself.
    return mapped_column(server_default=func.now(), onupdate=func.now())


def one_of(column: str, values: type[StrEnum]) -> CheckConstraint:
    """CHECK that a Text column holds one of an enum's values.

    Text + CHECK instead of a PostgreSQL ENUM: changing the allowed values later is a
    constraint swap inside a migration, with no ALTER TYPE or type cleanup on downgrade.
    """
    allowed = ", ".join(f"'{member.value}'" for member in values)
    return CheckConstraint(f"{column} IN ({allowed})", name=f"{column}_allowed")
