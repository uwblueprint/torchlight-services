// Fictional data only. Output still goes through parse.ts, so fixtures can't drift.
import type { ApiTransport } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type {
  CategoryBalance,
  ExpenseRecord,
  InviteWorkerInput,
  ListResponse,
  Money,
  OnboardingUser,
  ParticipantSummary,
  SignedMoney,
  TrainingAcknowledgement,
} from "@/lib/api/types";

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

const TRAINING_MATERIAL = "Privacy, receipts, and expense expectations";
const APPROVED_EMAIL_DOMAINS = ["torchlight.example"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEMO_ADMIN = { id: "00000000-0000-4000-8000-000000000100", display_name: "Demo Admin" };

type FixtureAuditEvent = {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action: string;
  entity_type: "user";
  entity_id: string;
  occurred_at: string;
  safe_details: Record<string, string>;
};

type FixtureState = {
  users: OnboardingUser[];
  auditEvents: FixtureAuditEvent[];
};

const FIXTURE_STATE_VERSION = 1;
const globalForFixtures = globalThis as typeof globalThis & {
  __torchlightFixtureState?: { version: number; state: FixtureState };
};

function createFixtureState(): FixtureState {
  const users: OnboardingUser[] = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      display_name: "Avery Example",
      email: "avery@torchlight.example",
      role: "passport_worker",
      status: "invited",
      invited_at: "2026-09-18T14:00:00Z",
      open_assignment_count: 0,
      training_acknowledgement: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      display_name: "Morgan Sample",
      email: "morgan@torchlight.example",
      role: "passport_worker",
      status: "active",
      invited_at: "2026-09-12T15:20:00Z",
      open_assignment_count: 2,
      training_acknowledgement: {
        acknowledged_at: "2026-10-02T15:10:00Z",
        material: TRAINING_MATERIAL,
        acknowledged_by_name: "Morgan Sample",
        recorded_by_name: DEMO_ADMIN.display_name,
        audit_event_id: "00000000-0000-4000-8000-0000000000f1",
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      display_name: "Casey Placeholder",
      email: "casey@torchlight.example",
      role: "passport_worker",
      status: "suspended",
      invited_at: "2026-08-21T13:05:00Z",
      open_assignment_count: 1,
      training_acknowledgement: {
        acknowledged_at: "2026-09-30T17:05:00Z",
        material: TRAINING_MATERIAL,
        acknowledged_by_name: "Casey Placeholder",
        recorded_by_name: DEMO_ADMIN.display_name,
        audit_event_id: "00000000-0000-4000-8000-0000000000f2",
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000104",
      display_name: "Jamie Demo",
      email: "jamie@torchlight.example",
      role: "passport_worker",
      status: "active",
      invited_at: "2026-10-15T18:40:00Z",
      open_assignment_count: 0,
      training_acknowledgement: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000105",
      display_name: "Riley Sample",
      email: "riley@torchlight.example",
      role: "passport_worker",
      status: "deactivated",
      invited_at: "2026-08-01T16:30:00Z",
      open_assignment_count: 0,
      training_acknowledgement: {
        acknowledged_at: "2026-09-12T14:30:00Z",
        material: TRAINING_MATERIAL,
        acknowledged_by_name: "Riley Sample",
        recorded_by_name: DEMO_ADMIN.display_name,
        audit_event_id: "00000000-0000-4000-8000-0000000000f3",
      },
    },
  ];

  const auditEvents: FixtureAuditEvent[] = users.flatMap((entry) => entry.training_acknowledgement
    ? [{
      id: entry.training_acknowledgement.audit_event_id,
      actor_user_id: DEMO_ADMIN.id,
      actor_name: DEMO_ADMIN.display_name,
      action: "user.training_acknowledged",
      entity_type: "user" as const,
      entity_id: entry.id,
      occurred_at: entry.training_acknowledgement.acknowledged_at,
      safe_details: { material: entry.training_acknowledgement.material },
    }]
    : []);

  return { users, auditEvents };
}

function fixtureState(): FixtureState {
  const existing = globalForFixtures.__torchlightFixtureState;
  if (existing?.version === FIXTURE_STATE_VERSION) return existing.state;
  const state = createFixtureState();
  globalForFixtures.__torchlightFixtureState = { version: FIXTURE_STATE_VERSION, state };
  return state;
}

function list<T>(items: T[]): ListResponse<T> {
  return { items, total: items.length, next_cursor: null };
}

function findParticipant(id: string): ParticipantSummary {
  const participant = participants.find((entry) => entry.id === id);
  if (!participant) throw new ApiError(404, "Participant not found");
  return participant;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1);
}

function findUser(state: FixtureState, id: string): OnboardingUser {
  const user = state.users.find((entry) => entry.id === id);
  if (!user) throw new ApiError(404, "Staff account not found");
  return user;
}

function readInviteInput(body: unknown): InviteWorkerInput {
  const record = typeof body === "object" && body !== null && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const email = typeof record.email === "string" ? normalizeEmail(record.email) : "";
  const displayName = typeof record.display_name === "string" ? record.display_name.trim() : "";
  const role = record.role;

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(422, [{ loc: ["body", "email"], msg: "Enter a valid work email address.", type: "value_error" }]);
  }
  if (!displayName) {
    throw new ApiError(422, [{ loc: ["body", "display_name"], msg: "Enter the worker's display name.", type: "value_error" }]);
  }
  if (role !== "passport_worker" && role !== "admin") {
    throw new ApiError(422, [{ loc: ["body", "role"], msg: "Choose a valid staff role.", type: "value_error" }]);
  }
  return { email, display_name: displayName, role };
}

function auditInvite(state: FixtureState, action: string, entityId: string, details: Record<string, string>): void {
  state.auditEvents.push({
    id: crypto.randomUUID(),
    actor_user_id: DEMO_ADMIN.id,
    actor_name: DEMO_ADMIN.display_name,
    action,
    entity_type: "user",
    entity_id: entityId,
    occurred_at: new Date().toISOString(),
    safe_details: details,
  });
}

export const fixtureTransport: ApiTransport = async (path, request) => {
  const url = new URL(path, "http://fixtures.local");
  const method = request?.method ?? "GET";
  const state = fixtureState();

  if (url.pathname === "/users/onboarding" && method === "GET") {
    return {
      users: list(state.users),
      approved_email_domains: [...APPROVED_EMAIL_DOMAINS],
      training_material: TRAINING_MATERIAL,
      resend_available: true,
    };
  }

  if (url.pathname === "/users/invitations" && method === "POST") {
    const input = readInviteInput(request?.body);
    if (!APPROVED_EMAIL_DOMAINS.includes(emailDomain(input.email))) {
      throw new ApiError(422, [{
        loc: ["body", "email"],
        msg: `Use an approved work email domain (${APPROVED_EMAIL_DOMAINS.join(", ")}).`,
        type: "value_error",
      }]);
    }
    if (state.users.some((entry) => entry.email === input.email)) {
      throw new ApiError(409, "A staff account with this email already exists.");
    }

    const now = new Date().toISOString();
    const newUser: OnboardingUser = {
      id: crypto.randomUUID(),
      display_name: input.display_name,
      email: input.email,
      role: input.role,
      status: "invited",
      invited_at: now,
      open_assignment_count: 0,
      training_acknowledgement: null,
    };
    state.users.push(newUser);
    auditInvite(state, "user.invited", newUser.id, { role: input.role });
    return newUser;
  }

  const resendMatch = url.pathname.match(/^\/users\/([^/]+)\/invitations\/resend$/);
  if (resendMatch && method === "POST") {
    const user = findUser(state, decodeURIComponent(resendMatch[1]));
    if (user.status !== "invited") {
      throw new ApiError(409, "Only an invited account can have its invitation resent.");
    }
    user.invited_at = new Date().toISOString();
    auditInvite(state, "user.invitation_resent", user.id, { email: user.email });
    return user;
  }

  const trainingMatch = url.pathname.match(/^\/users\/([^/]+)\/training-acknowledgements$/);
  if (trainingMatch && method === "POST") {
    const user = findUser(state, decodeURIComponent(trainingMatch[1]));
    if (user.status !== "active") {
      throw new ApiError(409, "Only an active account can have training recorded.");
    }
    if (user.training_acknowledgement) {
      throw new ApiError(409, "Training is already recorded for this account.");
    }

    const acknowledgedAt = new Date().toISOString();
    const auditEventId = crypto.randomUUID();
    const acknowledgement: TrainingAcknowledgement = {
      acknowledged_at: acknowledgedAt,
      material: TRAINING_MATERIAL,
      acknowledged_by_name: user.display_name,
      recorded_by_name: DEMO_ADMIN.display_name,
      audit_event_id: auditEventId,
    };
    user.training_acknowledgement = acknowledgement;
    state.auditEvents.push({
      id: auditEventId,
      actor_user_id: DEMO_ADMIN.id,
      actor_name: DEMO_ADMIN.display_name,
      action: "user.training_acknowledged",
      entity_type: "user",
      entity_id: user.id,
      occurred_at: acknowledgedAt,
      safe_details: { material: TRAINING_MATERIAL },
    });
    return user;
  }

  if (url.pathname === "/participants") return list(participants);

  const match = url.pathname.match(/^\/participants\/([^/]+)\/(balances|expenses)$/);
  if (match) {
    const participant = findParticipant(decodeURIComponent(match[1]));
    const fiscalYear = Number(url.searchParams.get("fiscal_year"));
    if (match[2] === "balances") {
      return list((balances[participant.id] ?? []).filter((row) => row.fiscal_year === fiscalYear));
    }
    return list(expenses.filter((row) => row.participant_id === participant.id && row.fiscal_year === fiscalYear));
  }

  // Unknown paths act like an unbuilt route instead of returning fake data.
  throw new ApiError(501, `No fixture for ${url.pathname}`);
};
