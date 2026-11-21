// Fictional data only. Output still goes through parse.ts, so fixtures can't drift.
import type { ApiTransport } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { CategoryBalance, ExpenseRecord, ListResponse, Money, ParticipantSummary, SignedMoney } from "@/lib/api/types";

const money = (value: string) => value as Money;
const signedMoney = (value: string) => value as SignedMoney;

const participants: ParticipantSummary[] = [
  { id: "00000000-0000-4000-8000-000000000001", display_name: "Alex Sample", client_code: "DEMO-001", is_active: true },
  { id: "00000000-0000-4000-8000-000000000002", display_name: "Jordan Placeholder", client_code: "DEMO-002", is_active: true },
  { id: "00000000-0000-4000-8000-000000000003", display_name: "Riley Example", client_code: null, is_active: false },
];

const balances: Record<string, CategoryBalance[]> = {
  "00000000-0000-4000-8000-000000000001": [
    {
      category_id: "00000000-0000-4000-8000-0000000000c4",
      category_code: "4",
      category_name: "Community activities",
      fiscal_year: 2026,
      allocated_amount: money("1500.00"),
      projected_amount: money("1200.00"),
      spent_amount: money("342.75"),
      remaining_amount: signedMoney("1157.25"),
    },
    {
      category_id: "00000000-0000-4000-8000-0000000000c7",
      category_code: "7",
      category_name: "Camp",
      fiscal_year: 2026,
      allocated_amount: money("2000.00"),
      projected_amount: money("2000.00"),
      spent_amount: money("0.00"),
      remaining_amount: signedMoney("2000.00"),
    },
    {
      category_id: "00000000-0000-4000-8000-0000000000c8",
      category_code: "19",
      category_name: "Other types, please specify",
      fiscal_year: 2026,
      allocated_amount: money("500.00"),
      projected_amount: money("500.00"),
      spent_amount: money("625.00"),
      remaining_amount: signedMoney("-125.00"),
    },
  ],
  "00000000-0000-4000-8000-000000000002": [
    {
      category_id: "00000000-0000-4000-8000-0000000000c9",
      category_code: "9",
      category_name: "Transportation",
      fiscal_year: 2026,
      allocated_amount: money("800.00"),
      projected_amount: money("600.00"),
      spent_amount: money("125.50"),
      remaining_amount: signedMoney("674.50"),
    },
  ],
};

const expenses: ExpenseRecord[] = [
  {
    id: "00000000-0000-4000-8000-0000000000e1",
    participant_id: "00000000-0000-4000-8000-000000000001",
    fiscal_year: 2026,
    receipt_id: "00000000-0000-4000-8000-0000000000a1",
    category_id: "00000000-0000-4000-8000-0000000000c4",
    category_name: "Community activities",
    other_category_desc: null,
    source_kind: "worker",
    vendor_name: "Example Bowling Lanes",
    start_date: "2026-05-14",
    end_date: null,
    total_amount: money("342.75"),
    covered_amount: money("342.75"),
    out_of_pocket_amount: money("0.00"),
    status: "confirmed",
    review_status: "reviewed",
    created_at: "2026-05-15T16:20:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000e2",
    participant_id: "00000000-0000-4000-8000-000000000001",
    fiscal_year: 2026,
    receipt_id: null,
    category_id: null,
    category_name: null,
    other_category_desc: null,
    source_kind: "worker",
    vendor_name: null,
    start_date: "2026-06-02",
    end_date: null,
    total_amount: money("48.00"),
    covered_amount: money("48.00"),
    out_of_pocket_amount: money("0.00"),
    status: "draft",
    review_status: "pending",
    created_at: "2026-06-02T19:05:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000e3",
    participant_id: "00000000-0000-4000-8000-000000000002",
    fiscal_year: 2026,
    receipt_id: "00000000-0000-4000-8000-0000000000a3",
    category_id: "00000000-0000-4000-8000-0000000000c9",
    category_name: "Transportation",
    other_category_desc: null,
    source_kind: "admin",
    vendor_name: "Sample City Transit",
    start_date: "2026-07-21",
    end_date: null,
    total_amount: money("150.50"),
    covered_amount: money("125.50"),
    out_of_pocket_amount: money("25.00"),
    status: "confirmed",
    review_status: "not_required",
    created_at: "2026-07-22T13:40:00Z",
  },
];

function list<T>(items: T[]): ListResponse<T> {
  return { items, total: items.length, next_cursor: null };
}

function findParticipant(id: string): ParticipantSummary {
  const participant = participants.find((entry) => entry.id === id);
  if (!participant) throw new ApiError(404, "Participant not found");
  return participant;
}

export const fixtureTransport: ApiTransport = async (path) => {
  const url = new URL(path, "http://fixtures.local");
  const fiscalYear = Number(url.searchParams.get("fiscal_year"));

  if (url.pathname === "/participants") return list(participants);

  const match = url.pathname.match(/^\/participants\/([^/]+)\/(balances|expenses)$/);
  if (match) {
    const participant = findParticipant(decodeURIComponent(match[1]));
    if (match[2] === "balances") {
      return list((balances[participant.id] ?? []).filter((row) => row.fiscal_year === fiscalYear));
    }
    return list(expenses.filter((row) => row.participant_id === participant.id && row.fiscal_year === fiscalYear));
  }

  // Unknown paths act like an unbuilt route instead of returning fake data.
  throw new ApiError(501, `No fixture for ${url.pathname}`);
};
