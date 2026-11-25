export function TeamSkeleton() {
  return (
    <div className="team-skeleton" role="status" aria-live="polite">
      <span className="onboarding-sr-only">Loading team records…</span>

      <div className="team-skeleton-header" aria-hidden="true">
        <div>
          <span className="onboarding-skeleton-line short" />
          <span className="team-skeleton-title" />
          <span className="onboarding-skeleton-line medium" />
        </div>
        <span className="team-skeleton-button" />
      </div>

      <section className="team-skeleton-panel" aria-hidden="true">
        <div className="team-skeleton-tabs">
          <span className="onboarding-skeleton-line medium" />
          <span className="onboarding-skeleton-line short" />
        </div>

        <div className="team-skeleton-toolbar">
          <span className="team-skeleton-search" />
          <span className="team-skeleton-sort" />
        </div>

        <div className="team-skeleton-table">
          {[0, 1, 2, 3, 4].map((row) => <div className="team-skeleton-row" key={row}>
            <span className="team-skeleton-avatar" />
            <span className="onboarding-skeleton-line medium" />
            <span className="onboarding-skeleton-line short" />
            <span className="onboarding-skeleton-line short" />
          </div>)}
        </div>
      </section>
    </div>
  );
}
