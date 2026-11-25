# AUTH-01 — Authentication, roles, and assignment-scoped authorization

**Area:** API and security
**Depends on:** DB-01 (`users`, `participant_assignments`, `audit_events`), INFRA-01 (local API/PostgreSQL), confirmation of the provisional Supabase Auth direction
**Blocks:** FE-02 (real invite flow), FE-03 (sign-in and route protection), API-01 / API-02, FILE-01, REVIEW-01, REPORT-01, QA-API-01

## Context

The application has two staff roles: `admin` and `passport_worker`. Participants and
caregivers do not have accounts in this phase. Staff accounts are created only by an
administrator; there is no public sign-up and no way for an invitee to choose a role or
grant themselves participant access.

The repository has no working authentication. The frontend onboarding screen uses a
temporary fixture-backed admin and a temporary AUTH-01-shaped contract. The backend has
no session verification, and participant, receipt, and report endpoints are stubs that
return HTTP 501. AUTH-01 is the trust boundary that must be in place before any real
participant data is exposed.

An email domain may limit who can be invited. It must never grant a role or participant
access. Roles and assignments come from Torchlight-controlled database rows.

## Scope

- Confirm and configure the identity provider, provisionally Supabase Auth.
- Invite staff, resend invitations, and complete invitation acceptance.
- Verify staff sessions on every protected API request.
- Resolve the caller's role and account status from the database, not from client
  claims, email domains, or mutable token metadata.
- Enforce admin-only endpoints and participant-assignment authorization for workers.
- Suspend, reactivate, and deactivate accounts, including session revocation.
- Record security-relevant changes as append-only audit events.
- Supply the real session seam consumed by FE-02 and FE-03.

## Data contract

DB-01 remains authoritative for the schema. AUTH-01 must not add password, token, or
provider-secret columns to the application database.

- `users.email` is the unique, lowercased, trimmed join key to Supabase Auth. Renaming
  an email needs an explicit re-link procedure; do not silently create a second account.
- `users.status` is `invited | active | suspended | deactivated`.
- `users.role` is `admin | passport_worker`.
- An open `participant_assignments` row (`ended_at IS NULL`) is the worker's
  authorization to act for that participant.
- `audit_events` is the only history table. Store the actor, action, entity, timestamp,
  and safe details. Never put tokens, passwords, receipt content, or unnecessary PII in
  audit details.

## Deliverables

### 1. Provider configuration and secrets

- Confirm Supabase Auth as the provider before implementation. Record the project URL,
  JWT issuer/audience, approved email domains, and session lifetime in environment
  configuration.
- Keep the Supabase service-role key server-only. It must never be exposed through a
  `NEXT_PUBLIC_*` variable, the browser bundle, logs, or error responses.
- Use the SDK or a small server adapter behind one module so a provider change does not
  leak through endpoint or component code.
- Document the required environment variables in `.env.example` without real values.

### 2. Staff invitation

- Add an admin-only endpoint equivalent to `POST /api/v1/users/invitations` accepting
  `{ email, display_name, role }`.
- Normalize and validate the email before sending. Lowercase and trim it, enforce the
  approved-domain allowlist, and reject duplicates with HTTP 409.
- Allow only `admin` and `passport_worker` roles. The invitee cannot choose or change
  their role.
- Create the `users` row as `invited` and send the Supabase invitation through the
  server-side admin API. The operation must be idempotent and recoverable: a provider
  failure must not leave a phantom account or a row that cannot be resent.
- Add an admin-only resend endpoint equivalent to
  `POST /api/v1/users/{user_id}/invitations/resend`. Resend only for `invited` accounts;
  reject other statuses with 409.
- Rate-limit invite and resend operations. Do not send real email from local tests.
- Do not implement a public sign-up route.

### 3. Invitation acceptance

- Accept the provider's invitation callback through the server-side session flow.
- Match the verified email to the existing `invited` row. Do not create a new role or
  duplicate user from callback data.
- Activate the row only after the provider confirms the email and the invite is valid.
- Preserve the server-assigned role. If the email does not match an invited row, show an
  "account not set up" result and grant no access.
- Make expired, reused, and mismatched invitations fail closed.

### 4. Session verification

- Verify the Supabase access token's signature, issuer, audience, expiry, and not-before
  time on every protected backend request. Use cached JWKS; refresh on an unknown key.
- Reject malformed tokens, unsupported algorithms, unverified email, unknown users,
  invited users, suspended users, and deactivated users.
- Resolve the staff row from the verified identity on each request and use that row's
  role and status. Do not trust `user_metadata`, a client header, or role data embedded
  in the token.
- Provide one server-resolved staff session lookup for the frontend, proposed as
  `GET /api/v1/auth/session`, returning the `User` shape already used by FE-02. Return
  401 when there is no valid staff session.
- Use httpOnly, Secure, SameSite cookies for the web session. Never store session tokens
  in `localStorage`. The backend may receive the access token as a Bearer token from the
  server-side web layer.
- Check CSRF protections for cookie-authenticated mutations and use origin checks for
  server actions.

### 5. Role authorization

- Implement reusable FastAPI dependencies for `require_active_staff` and
  `require_admin`.
- Admin-only routes include staff onboarding, invitation resend, role/status changes,
  the full participant directory, and all participant records. Worker access to the
  admin portal is denied on the server.
- Workers may access only endpoints for participants they are assigned to. They must not
  receive full participant profiles or unrelated participant data.
- Return 401 for unauthenticated requests and 403 for an authenticated caller with the
  wrong role or inactive account. For participant records, use a non-disclosing 404 for
  an unassigned participant unless the security review chooses an explicit 403.
- Enforce authorization in the data access path, not only in route code or the UI. A
  filtered UI is not an access-control boundary.

### 6. Assignment authorization

- Add one server-side helper that answers whether a caller may act for a participant:
  admins may manage all participants; workers need an open assignment.
- Every participant-scoped query and mutation must use that helper. Never accept a
  `worker_id` from the browser to establish ownership.
- Assignment creation and ending are admin-only and audited. Ending an assignment sets
  `ended_at`; do not delete the row.
- Deactivating a worker or archiving a participant must close their open assignments in
  the same transaction so "currently assigned" cannot keep listing them.
- When an assignment ends, surface or hand off any unconfirmed drafts so work is not
  stranded.

### 7. Account lifecycle and revocation

- Support suspend, reactivate, and deactivate. Deactivation sets `deactivated_at` and
  preserves history; never delete the staff account.
- Reject every request from a suspended or deactivated account even if its access token
  has not expired. Use short access-token lifetimes and DB status checks.
- Revoke Supabase sessions through the server-side admin API when suspending or
  deactivating. Document the maximum propagation delay.
- Prevent an administrator from removing the last active administrator, including
  self-deactivation.
- Audit invite, resend, acceptance, role changes, status changes, and assignment changes
  through AUDIT-LOG-01. Do not duplicate the audit table.

### 8. Frontend integration contract

- Replace the fixture-only `getAdminSession()` in `frontend/src/lib/auth.ts` with the real
  server-side session lookup.
- Keep FE-02's fixture transport available only for `next dev` with
  `NEXT_PUBLIC_USE_MOCKS=true`; production builds must continue to reject mocks.
- Expose distinct states to FE-03: no session (401/sign-in), valid worker (redirect to the
  worker portal), valid admin (admin portal), and authenticated but unprovisioned
  (account-not-set-up). Do not use redirect loops.
- Preserve the intended URL through sign-in and return the user there after a successful
  login.
- Sign-out clears the server-side session and the session cookie; the back button must
  not restore protected content.
- Do not render protected data before the server-side guard has resolved.

## API and error contract

- Invite duplicate: 409 with a readable conflict.
- Disallowed email domain or invalid role: 422 with a field-level detail.
- Unauthenticated: 401. Wrong role or inactive account: 403.
- Unknown staff record: 404. Unassigned participant: 404 by default, pending the
  security decision noted below.
- Provider failure: 502/503 without leaking provider internals, tokens, or email content.
- Responses never echo passwords, access tokens, refresh tokens, service-role keys, or
  full auth headers.

## Acceptance criteria

- An anonymous request to an admin onboarding endpoint returns 401. A worker receives
  403. An active admin receives 200 and only authorized staff data.
- An active admin can invite an approved-domain address; the database row is `invited`
  and the provider invite is sent in the test harness. A duplicate returns 409. A
  disallowed domain returns 422. No public sign-up route exists.
- Resending works only for an invited account; suspended and deactivated accounts are
  rejected with 409.
- Accepting a valid invite activates the existing row without allowing the invitee to
  choose a role. An expired, reused, or mismatched invite grants no access.
- A worker can read a participant only when an open assignment exists. The same request
  for an unassigned participant returns no participant data. An admin can manage all
  participants.
- A suspended or deactivated user with an unexpired JWT is rejected on the next request.
  Deactivation closes open assignments and revokes sessions.
- Changing an email domain or editing token metadata cannot grant a role or participant
  access.
- Invite, resend, acceptance, role/status changes, and assignment changes create audit
  events with actor and timestamp. No token, password, receipt content, or unnecessary
  PII appears in audit details.
- FE-02 uses the real server session and no longer has a fixture-only admin when mocks
  are off. FE-03 receives 401, worker, admin, and unprovisioned states without a redirect
  loop or protected-content flash.
- The session cookie is httpOnly, Secure in production, and SameSite; no token is present
  in `localStorage`.
- The security checks cover invalid signature, expired token, wrong issuer, unknown key,
  unverified email, missing user row, invited account, suspended account, deactivated
  account, wrong role, and unassigned participant.

## Testing and verification

- Add backend unit tests with mocked Supabase JWKS/Admin API responses. Use synthetic
  staff emails on a test-only domain; never send a real invitation.
- Add integration tests against an isolated PostgreSQL database for the authorization
  matrix: anonymous, invited, active worker (assigned and unassigned), suspended,
  deactivated, and active admin.
- Test invite normalization, duplicate conflict, domain rejection, resend status rules,
  and invite acceptance.
- Test deactivation closing assignments and revoking sessions in the same workflow.
- Run `ruff check .` and `pytest` in `backend/`.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/`.
- Inspect the server-rendered HTML for the signed-out case, not only the browser view.
- Manual local verification only: no production credentials, no real invite email, no
  real participant data.

## Out of scope

- Participant or caregiver accounts and self-service signup.
- Participant directory/workspace UI: FE-09 and FE-10.
- Training acknowledgment persistence: AUDIT-LOG-01.
- Password reset email templates, branding, and deliverability: configure with the
  provider, but do not build a custom mail transport here.
- MFA, SSO, and password policy until the policy decision is confirmed.
- Production deployment and provider account provisioning.

## Open decisions

1. Confirm Supabase Auth as the provider and the final project/region.
2. Confirm the exact approved staff email domain or allowlist, including whether
   subdomains are accepted.
3. Confirm session lifetime, idle timeout, MFA, and whether administrators must use MFA.
4. Confirm whether an admin may change a staff email after invitation, and require an
   atomic re-link if so. The recommended MVP default is to disallow it.
5. Confirm the response for an unassigned participant (recommended: non-disclosing 404).
6. Confirm whether admins may change roles after activation and how last-admin
   protection works.
7. Confirm invite token expiry, resend cooldown, and rate-limit thresholds.

## Safety

- [x] This task does not require real participant data or production credentials.
- Use synthetic staff accounts and test-only email domains.
- Never commit `.env`, Supabase keys, invitation tokens, or session cookies.
- Do not expose participant or receipt data until this ticket and the relevant API
  authorization checks are complete.

## References

- [`docs/decisions.md`](../decisions.md) — provisional Supabase direction and open
  security decisions.
- [`docs/tickets/DB-01.md`](DB-01.md) — `users`, `participant_assignments`, and
  `audit_events`.
- [`docs/tickets/FE-02.md`](FE-02.md) — admin-operated invite and onboarding flow.
- [`docs/tickets/FE-03.md`](FE-03.md) — sign-in, session, and role routing.
- [`backend/README.md`](../../backend/README.md) — backend ticket map and suggested
  sequencing.
