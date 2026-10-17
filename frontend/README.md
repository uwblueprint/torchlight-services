# Torchlight web app

This Next.js app contains navigable worker and admin workflow previews using fabricated sample values only. It is not connected to the API and must not be used with real participant information.

## Run

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Worker routes are under `/worker`; admin previews are under `/admin`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Frontend ticket and release sequence

- **FE-01 — Frontend MVP and workflow implementation:** agree the user-facing MVP with Torchlight, turn the current page stubs into the selected worker/admin flows, integrate only the authorized API contracts, and test responsive layouts plus loading, empty, validation, and error states. The current fabricated-data previews are not finished or production-connected functionality. Coordinate scope and dependencies with the backend ticket map in [`../backend/README.md`](../backend/README.md).
- **Release readiness:** production deployment is gated on backend authorization, privacy/security review, deployment/migration procedure, managed secrets, TLS, tested backup/restore, operational monitoring, and a staff-approved pilot. Hosting has a target of $10–$20/month, not a confirmed quote; include database, receipt storage, backups, domain/email, taxes, and OCR/API services in the total-cost check.
- **Training, showcase, and handoff:** prepare role-specific training and quick-reference materials, a sanitized showcase demo/deck and technical overview, then transfer the runbook, operational ownership, backup/recovery and data-retention responsibilities, access procedures, and escalation contacts. Train against a stable pilot; do not use real participant details in showcase materials. Torchlight staff should demonstrate routine autonomous operation before final handoff sign-off.

These steps are a dependency-based target, not a dated commitment. The SOW estimates an 8–12 month project duration from September 23, 2026; release timing and milestone durations require agreement. Root [`../README.md`](../README.md) has the cross-project milestone overview. For repository setup and contributor workflow, see [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
