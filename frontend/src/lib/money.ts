import type { Money } from "@/lib/api/types";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

// Intl formats the string exactly; never Number() it.
export function formatMoney(amount: Money): string {
  return currency.format(amount as Intl.StringNumericLiteral);
}
