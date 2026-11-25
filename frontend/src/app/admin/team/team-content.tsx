import Link from "next/link";
import { getOnboardingOverview } from "@/lib/api/client";
import { ApiError, ApiResponseError } from "@/lib/api/errors";
import type { OnboardingOverview } from "@/lib/api/types";
import { TeamDirectory } from "./team-directory";

function TeamLoadError({ error }: { error: unknown }) {
  let detail = "The team API could not be reached. Check that the backend is running and try again.";

  if (error instanceof ApiError) {
    if (error.status === 501) {
      detail = "The team API is not implemented yet. AUTH-01 and AUDIT-LOG-01 must land before this screen can load real records.";
    } else if (error.status === 401 || error.status === 403) {
      detail = "Your account is not allowed to view team records.";
    } else {
      detail = `The team API returned error ${error.status}. Try again or check the API logs.`;
    }
  } else if (error instanceof ApiResponseError) {
    detail = "The team API returned a response that did not match the shared contract. The page is refusing to render malformed data.";
  }

  return (
    <section className="onboarding-error" role="alert">
      <p className="stub-eyebrow">Unable to load</p>
      <h2>We could not open the team directory</h2>
      <p>{detail}</p>
      <Link className="onboarding-text-link" href="/admin/team">Try again</Link>
    </section>
  );
}

export async function TeamContent() {
  let overview: OnboardingOverview;
  try {
    overview = await getOnboardingOverview();
  } catch (error) {
    return <TeamLoadError error={error} />;
  }

  return <TeamDirectory
    approvedDomains={overview.approved_email_domains}
    users={overview.users.items}
  />;
}
