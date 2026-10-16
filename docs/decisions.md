# Architecture decisions and open questions

This file records scaffold-level choices so that implementation tickets have a common starting point. It does not override the SOW or represent approval by Torchlight.

## Scaffold decisions

1. **Separate web and API applications.** The backend is FastAPI; the frontend is Next.js App Router with TypeScript.
2. **PostgreSQL is the local development database.** The API uses async SQLAlchemy. Local Compose uses a named volume for persistence.
3. **The API does not expose database credentials to the browser.** Web-to-API integration and authentication are not connected yet.
4. **The Ministry portal stays authoritative for submissions.** This application is not a payment processor and does not submit directly to the Ministry portal.
5. **OCR is advisory only.** The intended workflow preserves human review; OCR has no ability to approve or post expenses by itself.
6. **Prototype screens use fake data.** Real participant information, receipts, and production credentials must not be used in development screenshots, fixtures, or issue discussions.
7. **Avoid fixing unresolved business policies in code.** Category lists/caps, expense reservation and approval lifecycle, fee treatment, mileage/meal rules, retention implementation, OCR thresholds, and payers need confirmation.

## Open architecture/security decisions

- Authentication provider, role model, account lifecycle, session/token strategy, MFA, and worker-assignment authorization.
- Hosting provider, region/data residency, deployment process, secrets handling, encryption, backup/recovery, logging, and incident response.
- Receipt storage provider, access-control policy, upload size/type validation, signed upload/download design, malware scanning, retention, and deletion policy.
- Database migration, seed data, audit-log immutability, tenant/org boundaries, and restoration strategy.
- Whether AI/external APIs are used for receipt classification and how their cost, data handling, and accuracy are evaluated.
- Exact approval/status semantics, ledger treatment for pending/rejected/edited/deleted/refunded items, and concurrency/overspend rules.
- The current Ministry categories, participant allocations/splits, category caps, reporting template, and seven-year archive responsibilities.

Resolve relevant items in scoped tickets before storing real participant data or deploying outside local development.
