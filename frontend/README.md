# Torchlight web app

This Next.js app contains navigable worker and admin workflow previews using fabricated sample values only. Most pages are not wired to the API yet; team management and worker onboarding run against the dev fixture transport, and the typed client they will use is in `src/lib/api/`. Do not use the app with real participant information.

## Run

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Worker routes are under `/worker`; admin previews are under `/admin`.

## API and fixtures

Copy `.env.example` to `.env.local`.

- `BACKEND_URL` (default `http://localhost:8000`): the FastAPI backend. Browser requests to `/api/v1/*` are proxied there, and server-side calls use it directly. It is read when `next.config.ts` loads, so production builds must set it at build time.
- `NEXT_PUBLIC_USE_MOCKS=true`: `npm run dev` serves the fictional fixtures in `src/lib/api/fixtures.ts` instead of calling the backend. Requests without a fixture fail with 501, like an unbuilt route.
- `npm run build` refuses to run while `NEXT_PUBLIC_USE_MOCKS=true`, so fixtures cannot ship.

With mocks off, a failed or malformed response throws `ApiError` or `ApiResponseError`; it never falls back to fixtures.

The Team screen uses a temporary AUTH-01/AUDIT-LOG-01-shaped contract for inviting staff, resending an invite, and recording a training acknowledgment. The fixture transport keeps those records in memory, sends no email, and resets when the dev server restarts. With mocks off, the server-side admin guard denies the route until [AUTH-01](../docs/tickets/AUTH-01.md) supplies a session. `/onboarding` redirects to `/admin/team`; member detail lives at `/admin/team/[id]`.

## Brand assets and design tokens

The shared palette is defined in `src/app/globals.css` as `--color-*` tokens and documented in [`docs/design/README.md`](../docs/design/README.md). Brand images live in `public/brand/`; the flame mark is used in the app header and is the source for the multi-size tab icon at `src/app/favicon.ico`. The full wordmark is reserved for larger placements. The color and brand sheets in `docs/design/reference/` are reference material, not served app assets.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Frontend ticket and release sequence

- **FE-01 — Frontend MVP and workflow implementation:** agree the user-facing MVP with Torchlight, turn the current page stubs into the selected worker/admin flows, integrate only the authorized API contracts, and test responsive layouts plus loading, empty, validation, and error states. The current fabricated-data previews are not finished or production-connected functionality. Coordinate scope and dependencies with the backend ticket map in [`../backend/README.md`](../backend/README.md).

Screen tickets, one per route in the current stub set. Shared money, list, state, and authorization rules live in the [frontend conventions](../CONTRIBUTING.md#frontend-conventions).

| Ticket | Screen | Route |
|---|---|---|
| FE-02 | Team directory & worker onboarding | `/admin/team`, `/admin/team/[id]` |
| FE-03 | Sign-in, session, and role routing | `/login`, `/` |
| FE-04 | Funding & activity | `/worker/dashboard` |
| FE-05 | Add an expense | `/worker/submit` |
| FE-06 | Hours & mileage | `/worker/shifts` |
| FE-07 | Coverage calculator | `/worker/calculator` |
| FE-08 | Admin overview | `/admin/dashboard` |
| FE-09 | Participant directory | `/admin/participants` |
| FE-10 | Participant workspace | `/admin/participants/[id]` |
| FE-11 | Receipt follow-up & categorization | `/admin/ocr-review` |
| FE-12 | Overages & invoice tracking | `/admin/invoicing` |
| FE-13 | Month-end exports & receipt archive | `/admin/reports` |
- **Release readiness:** production deployment is gated on backend authorization, privacy/security review, deployment/migration procedure, managed secrets, TLS, tested backup/restore, operational monitoring, and a staff-approved pilot. Hosting has a target of $10–$20/month, not a confirmed quote; include database, receipt storage, backups, domain/email, taxes, and OCR/API services in the total-cost check.
- **Training, showcase, and handoff:** prepare role-specific training and quick-reference materials, a sanitized showcase demo/deck and technical overview, then transfer the runbook, operational ownership, backup/recovery and data-retention responsibilities, access procedures, and escalation contacts. Train against a stable pilot; do not use real participant details in showcase materials. Torchlight staff should demonstrate routine autonomous operation before final handoff sign-off.

These steps are a dependency-based target, not a dated commitment. The SOW estimates an 8–12 month project duration from September 23, 2026; release timing and milestone durations require agreement. Root [`../README.md`](../README.md) has the cross-project milestone overview. For repository setup and contributor workflow, see [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
