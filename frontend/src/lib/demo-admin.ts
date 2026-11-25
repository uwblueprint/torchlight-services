import type { User } from "@/lib/api/types";

// The fixture-backed development preview has one administrator. Shared with the fixture
// transport so audit events and the session always describe the same account. AUTH-01
// replaces the session lookup with the server-side Supabase session.
export const DEMO_ADMIN: User = {
  id: "00000000-0000-4000-8000-000000000100",
  display_name: "Demo Admin",
  email: "admin@torchlight.example",
  role: "admin",
  status: "active",
};
