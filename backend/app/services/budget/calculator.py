"""Passport funding and expense coverage calculations."""
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Context, Decimal, InvalidOperation, localcontext

CENT = Decimal("0.01")
# Fixed context so results never depend on the caller's precision or trap settings.
MONEY_CONTEXT = Context(prec=28, rounding=ROUND_HALF_UP, traps=[InvalidOperation])


@dataclass(frozen=True)
class ExpenseSplit:
    requested_amount: Decimal
    covered_amount: Decimal
    out_of_pocket_amount: Decimal
    remaining_allocated_budget: Decimal
    remaining_category_cap: Decimal | None


def _to_currency(name: str, value: Decimal) -> Decimal:
    """Validate a money input and round it to cents with ROUND_HALF_UP."""
    # Decimal only: float (and int/bool) inputs are rejected so binary rounding never enters.
    if not isinstance(value, Decimal):
        raise TypeError(f"{name} must be a Decimal, got {type(value).__name__}")
    if not value.is_finite():
        raise ValueError(f"{name} must be finite")
    if value < 0:
        raise ValueError(f"{name} must not be negative")
    # copy_abs() turns -0 into 0 without the context rounding that abs() applies.
    try:
        return value.copy_abs().quantize(CENT, rounding=ROUND_HALF_UP)
    except InvalidOperation:
        raise ValueError(f"{name} is too large") from None


class BudgetCalculator:
    """Calculate a proposed expense split using approved allocation inputs.

    Every input is normalized to two decimal places with ROUND_HALF_UP before any
    arithmetic, so all outputs are exact cents and covered + out_of_pocket always
    equals the normalized request. Non-Decimal, non-finite, and negative inputs are
    rejected; amounts too large for 28 significant digits raise ValueError.

    Callers supply the inputs; this class does not decide them:
    - Pass a category cap only when it is confirmed for the participant/year; None means
      no category cap applies.
    - Which expense statuses count toward spending (ledger timing) is decided upstream.
    - No agency fee or family acknowledgment is calculated here.
    """

    def calculate_expense_split(
        self,
        *,
        requested_amount: Decimal,
        remaining_allocated_budget: Decimal,
        current_fiscal_category_spent: Decimal,
        category_annual_cap: Decimal | None,
    ) -> ExpenseSplit:
        with localcontext(MONEY_CONTEXT):
            requested = _to_currency("requested_amount", requested_amount)
            allocation = _to_currency("remaining_allocated_budget", remaining_allocated_budget)
            spent = _to_currency("current_fiscal_category_spent", current_fiscal_category_spent)

            if category_annual_cap is None:
                headroom = None
                available = allocation
            else:
                cap = _to_currency("category_annual_cap", category_annual_cap)
                headroom = max(cap - spent, Decimal("0.00"))
                available = min(headroom, allocation)

            covered = min(requested, available)
            return ExpenseSplit(
                requested_amount=requested,
                covered_amount=covered,
                out_of_pocket_amount=requested - covered,
                remaining_allocated_budget=allocation - covered,
                remaining_category_cap=None if headroom is None else headroom - covered,
            )
