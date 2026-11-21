"""DB-01 schema tests against a real PostgreSQL database migrated to head.

Every test runs inside a transaction that is rolled back, so the database keeps only the
migration's seed rows. Rejections assert the constraint name, so a test cannot pass because a
different constraint happened to fail.
"""

import os
import subprocess
import sys
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import delete, func, insert, select, text, update
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import Executable

from app.db.models import (
    AuditEvent,
    CategoryAllocation,
    Expense,
    FundingCategory,
    FundingSubcategory,
    Participant,
    ParticipantAssignment,
    ParticipantBudget,
    Receipt,
    ShiftLog,
    User,
)

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
BACKEND_DIR = Path(__file__).resolve().parents[2]

APPLICATION_TABLES = {
    "users",
    "participants",
    "participant_assignments",
    "participant_budgets",
    "category_allocations",
    "funding_categories",
    "funding_subcategories",
    "expenses",
    "receipts",
    "shift_logs",
    "activity_plans",
    "audit_events",
}

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(TEST_DATABASE_URL is None, reason="TEST_DATABASE_URL is not set"),
]


@pytest.fixture(scope="module", autouse=True)
def migrated_database() -> None:
    # A no-op when CI has already migrated; lets a local run start from an empty database.
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env={**os.environ, "DATABASE_URL": TEST_DATABASE_URL or ""},
        check=True,
        capture_output=True,
    )


@pytest.fixture
async def conn() -> AsyncIterator[AsyncConnection]:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            try:
                yield connection
            finally:
                await transaction.rollback()
    finally:
        await engine.dispose()


async def assert_rejected(conn: AsyncConnection, statement: Executable, match: str) -> None:
    # The savepoint keeps the test's outer transaction usable after the expected error.
    with pytest.raises(DBAPIError, match=match):
        async with conn.begin_nested():
            await conn.execute(statement)


async def add(conn: AsyncConnection, model: type[Any], **values: Any) -> uuid.UUID:
    return (await conn.execute(insert(model).values(**values).returning(model.id))).scalar_one()


async def add_user(conn: AsyncConnection, **overrides: Any) -> uuid.UUID:
    values = {
        "display_name": "Test Worker",
        "email": f"worker-{uuid.uuid4().hex[:8]}@example.org",
        "role": "passport_worker",
        "status": "active",
    }
    return await add(conn, User, **{**values, **overrides})


async def add_participant(conn: AsyncConnection) -> uuid.UUID:
    return await add(conn, Participant, display_name="Sample Participant")


async def category_id(conn: AsyncConnection, code: str) -> uuid.UUID:
    statement = select(FundingCategory.id).where(FundingCategory.code == code)
    return (await conn.execute(statement)).scalar_one()


async def subcategory_id(conn: AsyncConnection, code: str, name: str) -> uuid.UUID:
    statement = (
        select(FundingSubcategory.id)
        .join(FundingCategory, FundingCategory.id == FundingSubcategory.category_id)
        .where(FundingCategory.code == code, FundingSubcategory.name == name)
    )
    return (await conn.execute(statement)).scalar_one()


def expense_values(participant_id: uuid.UUID, **overrides: Any) -> dict[str, Any]:
    values = {
        "participant_id": participant_id,
        "fiscal_year": 2026,
        "source_kind": "worker",
        "start_date": date(2026, 5, 1),
        "total_amount": Decimal("100.00"),
        "covered_amount": Decimal("80.00"),
        "out_of_pocket_amount": Decimal("20.00"),
        "review_status": "pending",
        "invoice_status": "none",
    }
    return {**values, **overrides}


# --- Migration and seed -------------------------------------------------------------------


async def test_migration_creates_exactly_the_twelve_application_tables(
    conn: AsyncConnection,
) -> None:
    rows = await conn.execute(
        text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    )
    assert {name for (name,) in rows} == APPLICATION_TABLES | {"alembic_version"}


async def test_category_cap_cannot_be_negative(conn: AsyncConnection) -> None:
    statement = insert(FundingCategory).values(
        code="test-negative-cap", name="Test", default_annual_cap=Decimal("-0.01")
    )
    await assert_rejected(conn, statement, "ck_funding_categories_default_annual_cap_nonnegative")


async def test_seed_holds_the_category_catalog_and_no_participant_data(
    conn: AsyncConnection,
) -> None:
    categories = (
        await conn.execute(
            select(
                FundingCategory.code, FundingCategory.default_annual_cap, FundingCategory.active
            ).order_by(FundingCategory.code)
        )
    ).all()
    assert [code for code, _, _ in categories] == [f"p1-{n:02d}" for n in range(1, 20)]
    # Caps are unconfirmed, so none is seeded, and every category starts active.
    assert all(cap is None and active for _, cap, active in categories)

    other = await conn.execute(select(FundingCategory.name).where(FundingCategory.code == "p1-13"))
    assert other.scalar_one() == "Other types (please specify)"

    per_category = await conn.execute(
        select(FundingCategory.code, func.count(FundingSubcategory.id))
        .join(FundingSubcategory, FundingSubcategory.category_id == FundingCategory.id)
        .group_by(FundingCategory.code)
    )
    assert dict(per_category.all()) == {"p1-14": 5, "p1-18": 4, "p1-19": 5}

    for table in APPLICATION_TABLES - {"funding_categories", "funding_subcategories"}:
        count = await conn.execute(text(f"SELECT count(*) FROM {table}"))
        assert count.scalar_one() == 0, table


# --- users and participants --------------------------------------------------------------


@pytest.mark.parametrize(
    ("overrides", "constraint"),
    [
        ({"email": "Mixed.Case@Example.org"}, "ck_users_email_normalized"),
        ({"email": " padded@example.org"}, "ck_users_email_normalized"),
        ({"role": "superuser"}, "ck_users_role_allowed"),
        ({"status": "deleted"}, "ck_users_status_allowed"),
        ({"status": "deactivated"}, "ck_users_deactivated_at_matches_status"),
        ({"deactivated_at": datetime.now(UTC)}, "ck_users_deactivated_at_matches_status"),
    ],
)
async def test_invalid_users_are_rejected(
    conn: AsyncConnection, overrides: dict[str, Any], constraint: str
) -> None:
    values = {
        "display_name": "Test",
        "email": "valid@example.org",
        "role": "admin",
        "status": "active",
    }
    await assert_rejected(conn, insert(User).values(**{**values, **overrides}), constraint)


async def test_user_defaults_and_unique_email(conn: AsyncConnection) -> None:
    user_id = await add(conn, User, display_name="New", email="new@example.org", role="admin")
    status = await conn.execute(select(User.status).where(User.id == user_id))
    assert status.scalar_one() == "invited"

    duplicate = insert(User).values(display_name="Dup", email="new@example.org", role="admin")
    await assert_rejected(conn, duplicate, "uq_users_email")

    deactivated = await add_user(conn, status="deactivated", deactivated_at=datetime.now(UTC))
    assert deactivated is not None


async def test_participant_client_code_is_unique_but_optional(conn: AsyncConnection) -> None:
    await add(conn, Participant, display_name="A", client_code="C-001")
    await add(conn, Participant, display_name="B")
    await add(conn, Participant, display_name="C")
    duplicate = insert(Participant).values(display_name="D", client_code="C-001")
    await assert_rejected(conn, duplicate, "uq_participants_client_code")


# --- participant_assignments -------------------------------------------------------------


async def test_only_one_open_assignment_per_worker_and_participant(
    conn: AsyncConnection,
) -> None:
    worker_id = await add_user(conn)
    participant_id = await add_participant(conn)
    pair = {"worker_id": worker_id, "participant_id": participant_id}

    first = await add(conn, ParticipantAssignment, **pair)
    await assert_rejected(
        conn,
        insert(ParticipantAssignment).values(**pair),
        "uq_participant_assignments_open_worker_participant",
    )

    # Ending the assignment keeps it as history and allows a new open one.
    await conn.execute(
        update(ParticipantAssignment)
        .where(ParticipantAssignment.id == first)
        .values(ended_at=func.now())
    )
    await add(conn, ParticipantAssignment, **pair)
    # Another worker can be assigned to the same participant at the same time.
    await add(
        conn, ParticipantAssignment, worker_id=await add_user(conn), participant_id=participant_id
    )


async def test_assignment_cannot_end_before_it_starts(conn: AsyncConnection) -> None:
    now = datetime.now(UTC)
    statement = insert(ParticipantAssignment).values(
        worker_id=await add_user(conn),
        participant_id=await add_participant(conn),
        assigned_at=now,
        ended_at=now - timedelta(days=1),
    )
    await assert_rejected(conn, statement, "ck_participant_assignments_ended_after_assigned")


# --- participant_budgets and category_allocations ----------------------------------------


async def test_second_budget_for_same_participant_and_year_is_rejected(
    conn: AsyncConnection,
) -> None:
    participant_id = await add_participant(conn)
    budget = {
        "participant_id": participant_id,
        "managing_agency": "Sample Agency",
        "total_budget": Decimal("5000.00"),
    }
    await add(conn, ParticipantBudget, fiscal_year=2026, **budget)
    await add(conn, ParticipantBudget, fiscal_year=2027, **budget)
    await assert_rejected(
        conn,
        insert(ParticipantBudget).values(fiscal_year=2026, **budget),
        "uq_participant_budgets_participant_id_fiscal_year",
    )


@pytest.mark.parametrize(
    ("overrides", "constraint"),
    [
        ({"total_budget": Decimal("-1.00")}, "ck_participant_budgets_total_budget_nonnegative"),
        (
            {"admin_fee_percent": Decimal("100.01")},
            "ck_participant_budgets_admin_fee_percent_range",
        ),
        ({"admin_fee_percent": Decimal("-0.01")}, "ck_participant_budgets_admin_fee_percent_range"),
    ],
)
async def test_invalid_budgets_are_rejected(
    conn: AsyncConnection, overrides: dict[str, Any], constraint: str
) -> None:
    values = {
        "participant_id": await add_participant(conn),
        "fiscal_year": 2026,
        "managing_agency": "Sample Agency",
        "total_budget": Decimal("5000.00"),
    }
    await assert_rejected(
        conn, insert(ParticipantBudget).values(**{**values, **overrides}), constraint
    )


async def test_allocations_are_unique_per_category_and_deleted_with_their_budget(
    conn: AsyncConnection,
) -> None:
    budget_id = await add(
        conn,
        ParticipantBudget,
        participant_id=await add_participant(conn),
        fiscal_year=2026,
        managing_agency="Sample Agency",
        total_budget=Decimal("5000.00"),
    )
    allocation = {
        "participant_budget_id": budget_id,
        "category_id": await category_id(conn, "p1-07"),
        "allocated_amount": Decimal("1000.00"),
        "projected_amount": Decimal("0.00"),
    }
    await add(conn, CategoryAllocation, **allocation)
    await assert_rejected(
        conn,
        insert(CategoryAllocation).values(**allocation),
        "uq_category_allocations_participant_budget_id_category_id",
    )
    negative = {**allocation, "category_id": await category_id(conn, "p1-08")}
    await assert_rejected(
        conn,
        insert(CategoryAllocation).values(**{**negative, "allocated_amount": Decimal("-1")}),
        "ck_category_allocations_allocated_amount_nonnegative",
    )
    await assert_rejected(
        conn,
        insert(CategoryAllocation).values(**{**negative, "projected_amount": Decimal("-1")}),
        "ck_category_allocations_projected_amount_nonnegative",
    )

    await conn.execute(delete(ParticipantBudget).where(ParticipantBudget.id == budget_id))
    remaining = await conn.execute(select(func.count()).select_from(CategoryAllocation))
    assert remaining.scalar_one() == 0


async def test_participant_with_financial_records_cannot_be_deleted(
    conn: AsyncConnection,
) -> None:
    participant_id = await add_participant(conn)
    await add(conn, Expense, **expense_values(participant_id))
    await assert_rejected(
        conn,
        delete(Participant).where(Participant.id == participant_id),
        "fk_expenses_participant_id",
    )


# --- expenses and receipts ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("overrides", "constraint"),
    [
        ({"covered_amount": Decimal("90.00")}, "ck_expenses_amounts_sum_to_total"),
        (
            {"covered_amount": Decimal("-10.00"), "out_of_pocket_amount": Decimal("110.00")},
            "ck_expenses_amounts_nonnegative",
        ),
        (
            {
                "total_amount": Decimal("-5.00"),
                "covered_amount": Decimal("-5.00"),
                "out_of_pocket_amount": Decimal("0.00"),
            },
            "ck_expenses_amounts_nonnegative",
        ),
        (
            {
                "status": "confirmed",
                "category_id": "category",
                "total_amount": Decimal("0.00"),
                "covered_amount": Decimal("0.00"),
                "out_of_pocket_amount": Decimal("0.00"),
            },
            "ck_expenses_confirmed_amount_positive",
        ),
        ({"status": "confirmed"}, "ck_expenses_confirmed_has_category"),
        ({"reviewed_by_id": "reviewer"}, "ck_expenses_reviewed_by_and_at_together"),
        ({"reviewed_at": datetime.now(UTC)}, "ck_expenses_reviewed_by_and_at_together"),
        ({"end_date": date(2026, 4, 30)}, "ck_expenses_end_date_after_start"),
        ({"ticket_count": -1}, "ck_expenses_ticket_count_nonnegative"),
        ({"other_category_desc": "   "}, "ck_expenses_other_category_desc_not_blank"),
        ({"status": "approved"}, "ck_expenses_status_allowed"),
        ({"review_status": "done"}, "ck_expenses_review_status_allowed"),
        ({"source_kind": "email"}, "ck_expenses_source_kind_allowed"),
    ],
)
async def test_invalid_expenses_are_rejected(
    conn: AsyncConnection, overrides: dict[str, Any], constraint: str
) -> None:
    # Placeholders for rows that need the database, which parametrize cannot reach.
    if overrides.get("reviewed_by_id") == "reviewer":
        overrides = {**overrides, "reviewed_by_id": await add_user(conn, role="admin")}
    if overrides.get("category_id") == "category":
        overrides = {**overrides, "category_id": await category_id(conn, "p1-07")}
    values = expense_values(await add_participant(conn), **overrides)
    await assert_rejected(conn, insert(Expense).values(**values), constraint)


async def test_valid_expense_defaults_and_exact_money(conn: AsyncConnection) -> None:
    reviewer_id = await add_user(conn, role="admin")
    expense_id = await add(
        conn,
        Expense,
        **expense_values(
            await add_participant(conn),
            category_id=await category_id(conn, "p1-13"),
            other_category_desc="Art class materials",
            total_amount=Decimal("33.35"),
            covered_amount=Decimal("33.34"),
            out_of_pocket_amount=Decimal("0.01"),
            reviewed_by_id=reviewer_id,
            reviewed_at=datetime.now(UTC),
            review_status="reviewed",
        ),
    )
    row = (
        await conn.execute(
            select(Expense.status, Expense.total_amount, Expense.covered_amount).where(
                Expense.id == expense_id
            )
        )
    ).one()
    assert row == ("draft", Decimal("33.35"), Decimal("33.34"))

    confirmed = expense_values(
        await add_participant(conn),
        status="confirmed",
        category_id=await category_id(conn, "p1-07"),
    )
    await add(conn, Expense, **confirmed)


async def test_one_receipt_can_back_expenses_for_two_participants(
    conn: AsyncConnection,
) -> None:
    uploader_id = await add_user(conn)
    first, second = await add_participant(conn), await add_participant(conn)
    receipt_id = await add(
        conn,
        Receipt,
        participant_id=first,
        uploaded_by_id=uploader_id,
        storage_key=f"{first}/2026-05/{uuid.uuid4()}.pdf",
        content_type="application/pdf",
    )

    await add(conn, Expense, **expense_values(first, receipt_id=receipt_id))
    await add(conn, Expense, **expense_values(second, receipt_id=receipt_id))

    participants = await conn.execute(
        select(Expense.participant_id).where(Expense.receipt_id == receipt_id)
    )
    assert set(participants.scalars()) == {first, second}


async def test_subcategory_must_belong_to_the_expense_category(conn: AsyncConnection) -> None:
    participant_id = await add_participant(conn)
    supplies = await category_id(conn, "p1-14")
    sensory = await subcategory_id(conn, "p1-14", "Sensory items")
    phones = await subcategory_id(conn, "p1-19", "Cell phones and phone plans")

    await add(
        conn,
        Expense,
        **expense_values(participant_id, category_id=supplies, subcategory_id=sensory),
    )
    await assert_rejected(
        conn,
        insert(Expense).values(
            **expense_values(participant_id, category_id=supplies, subcategory_id=phones)
        ),
        "fk_expenses_subcategory_id_category_id",
    )
    await assert_rejected(
        conn,
        insert(Expense).values(**expense_values(participant_id, subcategory_id=sensory)),
        "ck_expenses_subcategory_requires_category",
    )


@pytest.mark.parametrize(
    ("overrides", "constraint"),
    [
        ({"ocr_confidence": Decimal("1.0001")}, "ck_receipts_ocr_confidence_range"),
        ({"ocr_confidence": Decimal("-0.0001")}, "ck_receipts_ocr_confidence_range"),
        ({"ocr_status": "approved"}, "ck_receipts_ocr_status_allowed"),
        ({"storage_key": "taken"}, "uq_receipts_storage_key"),
    ],
)
async def test_invalid_receipts_are_rejected(
    conn: AsyncConnection, overrides: dict[str, Any], constraint: str
) -> None:
    values = {
        "participant_id": await add_participant(conn),
        "uploaded_by_id": await add_user(conn),
        "content_type": "image/jpeg",
    }
    receipt_id = await add(conn, Receipt, **values, storage_key="taken")
    status = await conn.execute(select(Receipt.ocr_status).where(Receipt.id == receipt_id))
    assert status.scalar_one() == "pending"

    statement = insert(Receipt).values(**{**values, "storage_key": "fresh", **overrides})
    await assert_rejected(conn, statement, constraint)


# --- shift_logs --------------------------------------------------------------------------


async def test_mileage_only_and_hours_only_shift_logs_are_accepted(conn: AsyncConnection) -> None:
    base = {
        "participant_id": await add_participant(conn),
        "worker_id": await add_user(conn),
        "service_date": date(2026, 5, 1),
        "status": "submitted",
    }
    start = datetime(2026, 5, 1, 13, tzinfo=UTC)
    await add(conn, ShiftLog, **base, mileage_km=Decimal("42.50"))
    await add(conn, ShiftLog, **base, shift_start=start, shift_end=start + timedelta(hours=3))
    # An open shift (started, not yet ended) is representable.
    await add(conn, ShiftLog, **base, shift_start=start)


@pytest.mark.parametrize(
    ("overrides", "constraint"),
    [
        ({}, "ck_shift_logs_has_shift_or_mileage"),
        (
            {"shift_end": "start", "mileage_km": Decimal("1")},
            "ck_shift_logs_shift_end_requires_start",
        ),
        ({"shift_start": "start", "shift_end": "start"}, "ck_shift_logs_shift_end_after_start"),
        ({"mileage_km": Decimal("-0.01")}, "ck_shift_logs_mileage_km_nonnegative"),
    ],
)
async def test_invalid_shift_logs_are_rejected(
    conn: AsyncConnection, overrides: dict[str, Any], constraint: str
) -> None:
    start = datetime(2026, 5, 1, 13, tzinfo=UTC)
    values = {
        "participant_id": await add_participant(conn),
        "worker_id": await add_user(conn),
        "service_date": date(2026, 5, 1),
        "status": "submitted",
        **{key: start if value == "start" else value for key, value in overrides.items()},
    }
    await assert_rejected(conn, insert(ShiftLog).values(**values), constraint)


# --- audit_events ------------------------------------------------------------------------


async def test_audit_events_are_append_only(conn: AsyncConnection) -> None:
    event_id = await add(
        conn,
        AuditEvent,
        actor_user_id=await add_user(conn),
        action="expense.voided",
        entity_type="expense",
        entity_id=uuid.uuid4(),
    )
    details = await conn.execute(select(AuditEvent.safe_details).where(AuditEvent.id == event_id))
    assert details.scalar_one() == {}

    await assert_rejected(
        conn,
        update(AuditEvent).where(AuditEvent.id == event_id).values(action="edited"),
        "audit_events is append-only: UPDATE",
    )
    await assert_rejected(
        conn,
        delete(AuditEvent).where(AuditEvent.id == event_id),
        "audit_events is append-only: DELETE",
    )
    await assert_rejected(conn, text("TRUNCATE audit_events"), "audit_events is append-only")


async def test_audit_event_details_must_be_an_object(conn: AsyncConnection) -> None:
    statement = insert(AuditEvent).values(
        action="system.check", entity_type="system", safe_details=["not", "an", "object"]
    )
    await assert_rejected(conn, statement, "ck_audit_events_safe_details_is_object")
