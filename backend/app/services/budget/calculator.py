from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ExpenseSplit:
    requested_amount: Decimal
    covered_amount: Decimal
    out_of_pocket_amount: Decimal
    remaining_allocated_budget: Decimal
    remaining_category_cap: Decimal | None


class BudgetCalculator:
    """Calculate a proposed expense split using approved allocation inputs.

    TODO(BE-01):
    - Distinguish participant allocation remaining from annual category-cap headroom.
    - Apply the confirmed expense status/ledger timing rules.
    - Define currency quantization and rounding policy explicitly.
    - Do not apply caps unless the category and cap are confirmed for the participant/year.
    - Do not calculate an agency fee or trigger family acknowledgment here.
    """

    def calculate_expense_split(
        self,
        *,
        requested_amount: Decimal,
        remaining_allocated_budget: Decimal,
        current_fiscal_category_spent: Decimal,
        category_annual_cap: Decimal | None,
    ) -> ExpenseSplit:
        raise NotImplementedError("BE-01: budget split calculation is not implemented")
