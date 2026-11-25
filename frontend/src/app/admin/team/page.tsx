import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { TeamContent } from "./team-content";
import { TeamSkeleton } from "./team-skeleton";

export const metadata: Metadata = {
  title: "Team · Torchlight Passport",
};

export default async function TeamPage() {
  await requireAdmin();

  return <main className="team-page">
    <Suspense fallback={<TeamSkeleton />}>
      <TeamContent />
    </Suspense>
  </main>;
}
