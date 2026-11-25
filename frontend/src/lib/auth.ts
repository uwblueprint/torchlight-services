import { forbidden } from "next/navigation";
import { mocksEnabled } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { DEMO_ADMIN } from "@/lib/demo-admin";

// AUTH-01 seam: replace this with the server-side Supabase session lookup. Until then,
// only the fixture-backed development preview has an administrator.
export async function getAdminSession(): Promise<User | null> {
  if (mocksEnabled) return DEMO_ADMIN;
  return null;
}

export async function requireAdmin(): Promise<User> {
  const user = await getAdminSession();
  if (!user || user.role !== "admin" || user.status !== "active") {
    forbidden();
  }
  return user;
}
