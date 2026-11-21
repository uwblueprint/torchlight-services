import Link from "next/link";
import { getOnboardingOverview, mocksEnabled } from "@/lib/api/client";
import { ApiError, ApiResponseError } from "@/lib/api/errors";
import type { OnboardingOverview } from "@/lib/api/types";
import { isOnboardingComplete } from "@/lib/onboarding";
import { InviteWorkerForm } from "./invite-worker-form";
import { OnboardingRoster } from "./onboarding-roster";

function OnboardingLoadError({ error }: { error: unknown }) {
  let detail = "The onboarding API could not be reached. Check that the backend is running and try again.";

  if (error instanceof ApiError) {
    if (error.status === 501) {
      detail = "The onboarding API is not implemented yet. AUTH-01 and AUDIT-LOG-01 must land before this screen can load real records.";
    } else if (error.status === 401 || error.status === 403) {
      detail = "Your account is not allowed to view onboarding records.";
    } else {
      detail = `The onboarding API returned error ${error.status}. Try again or check the API logs.`;
    }
  } else if (error instanceof ApiResponseError) {
    detail = "The onboarding API returned a response that did not match the shared contract. The page is refusing to render malformed data.";
  }

  return (
    <section className="onboarding-error" role="alert">
      <p className="stub-eyebrow">Unable to load</p>
      <h2>We could not open worker onboarding</h2>
      <p>{detail}</p>
      <Link className="onboarding-text-link" href="/onboarding">Try again</Link>
    </section>
  );
}

export async function OnboardingContent() {
  let overview: OnboardingOverview;
  try {
    overview = await getOnboardingOverview();
  } catch (error) {
    return <OnboardingLoadError error={error} />;
  }

  const staff = overview.users.items;
  const pendingInvites = staff.filter((user) => user.status === "invited").length;
  const activeStaff = staff.filter((user) => user.status === "active").length;
  const trainingDue = staff.filter((user) => user.status === "active" && !user.training_acknowledgement).length;
  const fullyOnboarded = staff.filter(isOnboardingComplete).length;

  return (
    <>
      {mocksEnabled && (
        <p className="onboarding-preview">
          Preview mode: synthetic staff records from the local fixture API. No email is sent, and no production data is loaded.
        </p>
      )}

      <section className="onboarding-summary" aria-label="Onboarding summary">
        <div>
          <span>Awaiting invite acceptance</span>
          <strong>{pendingInvites}</strong>
        </div>
        <div>
          <span>Active staff</span>
          <strong>{activeStaff}</strong>
        </div>
        <div>
          <span>Training due</span>
          <strong>{trainingDue}</strong>
        </div>
        <div>
          <span>Fully onboarded</span>
          <strong>{fullyOnboarded}</strong>
        </div>
      </section>

      <div className="onboarding-layout">
        <OnboardingRoster users={staff} resendAvailable={overview.resend_available} />
        <InviteWorkerForm approvedDomains={overview.approved_email_domains} />
      </div>
    </>
  );
}
