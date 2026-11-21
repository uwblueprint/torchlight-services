import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalShell } from "@/components/portal-shell";
import { adminLinks } from "@/lib/admin-links";
import { requireAdmin } from "@/lib/auth";
import { OnboardingContent } from "./onboarding-content";
import { OnboardingSkeleton } from "./onboarding-skeleton";

export const metadata: Metadata = {
  title: "Worker onboarding · Torchlight Passport",
};

export default async function OnboardingPage() {
  const admin = await requireAdmin();

  return (
    <PortalShell audience="Torchlight Admin" links={adminLinks}>
      <main className="onboarding-page">
        <header className="onboarding-header">
          <div className="onboarding-header-copy">
            <p className="stub-eyebrow">Torchlight Admin · Staff access</p>
            <h1>Worker onboarding</h1>
            <p>
              Invite staff, review their server-side account state, and record the privacy and
              receipt walkthrough. Workers cannot choose their own role or participants.
            </p>
          </div>
          <div className="onboarding-signed-in">
            <span>Signed in as</span>
            <strong>{admin.display_name}</strong>
            <small>Admin access · checked on the server</small>
          </div>
        </header>

        <Suspense fallback={<OnboardingSkeleton />}>
          <OnboardingContent />
        </Suspense>
      </main>
    </PortalShell>
  );
}
