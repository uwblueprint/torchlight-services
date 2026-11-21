from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Date, DateTime, MetaData, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase

# Deterministic constraint names, so later migrations can alter or drop them by name.
NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for application database models."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map = {
        str: Text,
        date: Date,
        datetime: DateTime(timezone=True),
        # Money by default; percentages, confidences, and distances override the precision.
        Decimal: Numeric(12, 2),
        dict[str, Any]: JSONB,
    }
