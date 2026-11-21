export function OnboardingSkeleton() {
  return (
    <div className="onboarding-skeleton" role="status" aria-live="polite">
      <span className="onboarding-sr-only">Loading onboarding records…</span>

      <div className="onboarding-skeleton-summary" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div className="onboarding-skeleton-tile" key={item}>
            <span className="onboarding-skeleton-line short" />
            <span className="onboarding-skeleton-value" />
          </div>
        ))}
      </div>

      <div className="onboarding-layout" aria-hidden="true">
        <div className="onboarding-panel onboarding-skeleton-panel">
          <span className="onboarding-skeleton-line medium" />
          <span className="onboarding-skeleton-line" />
          <span className="onboarding-skeleton-line" />
          <span className="onboarding-skeleton-line short" />
        </div>
        <div className="onboarding-panel onboarding-skeleton-panel">
          <span className="onboarding-skeleton-line medium" />
          <span className="onboarding-skeleton-line" />
          <span className="onboarding-skeleton-line" />
          <span className="onboarding-skeleton-line short" />
        </div>
      </div>
    </div>
  );
}
