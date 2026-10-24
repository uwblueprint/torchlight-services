from decimal import Decimal, localcontext

import pytest

from app.services.budget.calculator import BudgetCalculator, ExpenseSplit

D = Decimal


def split(requested, allocation, spent="0", cap=None) -> ExpenseSplit:
    result = BudgetCalculator().calculate_expense_split(
        requested_amount=D(requested),
        remaining_allocated_budget=D(allocation),
        current_fiscal_category_spent=D(spent),
        category_annual_cap=None if cap is None else D(cap),
    )
    assert result.covered_amount >= 0
    assert result.out_of_pocket_amount >= 0
    assert result.covered_amount + result.out_of_pocket_amount == result.requested_amount
    return result


@pytest.mark.parametrize(
    ("args", "covered", "out_of_pocket", "allocation_left", "cap_left"),
    [
        pytest.param(("50", "500", "100", "1000"), "50.00", "0.00", "450.00", "850.00",
                     id="full-coverage"),
        pytest.param(("50", "0", "0", "1000"), "0.00", "50.00", "0.00", "1000.00",
                     id="zero-allocation"),
        pytest.param(("50", "500", "1000", "1000"), "0.00", "50.00", "500.00", "0.00",
                     id="exhausted-category-cap"),
        pytest.param(("50", "500", "1200", "1000"), "0.00", "50.00", "500.00", "0.00",
                     id="spending-over-cap"),
        pytest.param(("80", "30", "0", "1000"), "30.00", "50.00", "0.00", "970.00",
                     id="exhausted-participant-allocation"),
        pytest.param(("80", "500", "960", "1000"), "40.00", "40.00", "460.00", "0.00",
                     id="partial-category-headroom"),
        pytest.param(("80", "500", "0", None), "80.00", "0.00", "420.00", None,
                     id="no-cap"),
        pytest.param(("100", "100", "900", "1000"), "100.00", "0.00", "0.00", "0.00",
                     id="exact-limits"),
        pytest.param(("100.01", "100", "0", None), "100.00", "0.01", "0.00", None,
                     id="one-cent-over-allocation"),
        pytest.param(("100.01", "500", "900", "1000"), "100.00", "0.01", "400.00", "0.00",
                     id="one-cent-over-cap"),
        pytest.param(("0", "500", "0", "1000"), "0.00", "0.00", "500.00", "1000.00",
                     id="zero-request"),
    ],
)
def test_calculate_expense_split(args, covered, out_of_pocket, allocation_left, cap_left) -> None:
    result = split(*args)

    assert result.covered_amount == D(covered)
    assert result.out_of_pocket_amount == D(out_of_pocket)
    assert result.remaining_allocated_budget == D(allocation_left)
    assert result.remaining_category_cap == (None if cap_left is None else D(cap_left))


def test_outputs_are_normalized_to_cents_with_round_half_up() -> None:
    result = split("10.005", "10.004", "0.125", "20.004")

    assert result.requested_amount == D("10.01")
    assert result.covered_amount == D("10.00")
    assert result.out_of_pocket_amount == D("0.01")
    assert result.remaining_category_cap == D("9.87")
    for value in (result.requested_amount, result.covered_amount, result.out_of_pocket_amount,
                  result.remaining_allocated_budget, result.remaining_category_cap):
        assert value.as_tuple().exponent == -2


def test_negative_zero_normalizes_to_zero() -> None:
    result = split("-0", "10")

    assert str(result.requested_amount) == "0.00"


def test_long_inputs_are_rounded_once() -> None:
    result = split("1.004999999999999999999999999999", "10")

    assert result.requested_amount == D("1.00")


def test_results_ignore_caller_decimal_context() -> None:
    with localcontext() as ctx:
        ctx.prec = 3
        result = split("1000", "123456.78", "0", "200000")

    assert result.remaining_allocated_budget == D("122456.78")
    assert result.remaining_category_cap == D("199000.00")


@pytest.mark.parametrize("field", ["requested", "allocation", "spent", "cap"])
@pytest.mark.parametrize(
    ("bad", "error"),
    [
        (D("-0.01"), ValueError),
        (D("NaN"), ValueError),
        (D("sNaN"), ValueError),
        (D("Infinity"), ValueError),
        (D("-Infinity"), ValueError),
        (D("1e30"), ValueError),
        (10.5, TypeError),
        (True, TypeError),
        (10, TypeError),
        ("10.00", TypeError),
    ],
)
def test_invalid_amounts_are_rejected(field, bad, error) -> None:
    kwargs = {
        "requested_amount": D("10"),
        "remaining_allocated_budget": D("10"),
        "current_fiscal_category_spent": D("0"),
        "category_annual_cap": D("100"),
    }
    key = {
        "requested": "requested_amount",
        "allocation": "remaining_allocated_budget",
        "spent": "current_fiscal_category_spent",
        "cap": "category_annual_cap",
    }[field]
    kwargs[key] = bad

    with pytest.raises(error, match=key):
        BudgetCalculator().calculate_expense_split(**kwargs)
