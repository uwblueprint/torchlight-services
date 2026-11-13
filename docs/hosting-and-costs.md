# Hosting and Running Costs

**Status: estimate, not a quote. Vendor list prices checked 3 November 2026. USD, before Ontario HST (13%). Nothing here is committed — no accounts exist and Torchlight has not been asked to pay for anything.**

This document estimates what it costs to run the Passport application in production: where the data lives, what the fixed monthly bill is, what each receipt costs to process, and which costs grow. It assumes the stack in `docs/decisions.md` (FastAPI backend, Next.js frontend, PostgreSQL, private object storage for receipts) and the 24-table schema in `docs/database-schema-proposal.md`.

## 1. Volume assumptions

Every number below follows from these. If the real volume is different, the fixed costs do not change but the storage figures do.

| Assumption | Value | Basis |
| --- | --- | --- |
| Participants | 36 | SOW |
| Internal staff | ~20 passport workers, 3 admins | SOW |
| Reimbursable expenses | ~5 per participant per month | Estimate; SOW has no volume figure |
| Receipts submitted | **~180–250 per month**, peaking ~500 in camp/trip months | Derived |
| Stored photo size | ~1.5 MB per receipt after downscale | Typical phone photo |
| Retention | 7 years | SOW archive expectation |

Receipts per month, not participants, is what drives the variable costs. At 250/month the system handles about 8 receipts per working day.

## 2. Recommended stack

| Line item | Service | Plan | Monthly |
| --- | --- | --- | --- |
| Postgres, Auth, receipt storage | Supabase, region `ca-central-1` (Canada Central) | Pro | **$25.00** |
| API container (512 MB, always on) | Fly.io, region `yyz` (Toronto) | Pay-as-you-go | **$5.00** |
| Web frontend (Next.js) | Fly.io, second machine in `yyz` | Pay-as-you-go | **$3.00** |
| Domain | registrar | ~$15/year | **$1.25** |
| OCR | Google Cloud Vision | Pay-per-page | **$0.00** |
| Email | Resend free tier, if used | Free | **$0.00** |
| Jev decision model, if adopted | TypeSafe | Starter, one-time | **$0.00** |
| **Total** | | | **$34.25/month (~$410/year)** |

Both services run in Canadian regions, so the database, receipts, and API stay in Canada. TLS is included on all of the above; no certificate cost.

### Why Supabase Pro and not Free

Free technically runs this workload, but it fails on three points that matter for participant data:

| | Free | Pro |
| --- | --- | --- |
| File storage | **1 GB** | 100 GB |
| Backups | none | daily |
| Idle behaviour | project **pauses after 7 days of inactivity** | stays up |
| Database | 500 MB | 8 GB |
| Egress | 5 GB | 250 GB |
| Cost | $0 | $25/month |

Storage is the hard blocker. At 1.5 MB per receipt and 250 receipts per month, the app stores ~375 MB monthly and fills the 1 GB free quota in **about two and a half months**. Even aggressively downscaling photos to 600 KB only extends that to roughly six months — still inside the first fiscal year, which is the worst possible time to migrate live data.

A paused project returns errors until someone on staff restores it from the dashboard; it does not resume by itself. Note that "activity" means database activity, so a quiet school break can trigger it.

What the $25 actually buys is operations, not capacity: you use roughly 1% of the 8 GB database and 4% of the 100 GB storage in year one.

### Alternatives considered

| Option | Monthly | Why not the default |
| --- | --- | --- |
| Supabase Free + Cloudflare R2 for receipts + scripted `pg_dump` | ~$9 | R2 has no Canadian region guarantee, so receipt PII leaves Canada; and the team owns backup and restore with nobody accountable for it |
| Render web service + Render Postgres | ~$20 | Needs a separate answer for auth and object storage; two vendors for what Supabase does in one |
| Vercel Pro for the frontend | +$20 | Unnecessary. Vercel's Hobby tier is non-commercial *personal* use only, which is a gray area for an NPO; running Next.js on the existing Fly account for ~$3 avoids both the fee and the ToS question |
| Everything on Supabase Edge Functions | $25 | Cheapest single vendor, but the receipt upload and OCR pipeline would need rewriting |

### Against the $10–$20/month target

The root `README.md` sets a recurring-infrastructure target of **$10–$20/month** and says that if safe hosting cannot fit the cap, the cap is escalated for a budget/scope decision rather than the safeguards being weakened. The recommendation above exceeds it, so recording that plainly:

| Configuration | Monthly | Inside target | What is lost |
| --- | --- | --- | --- |
| Recommended (Supabase Pro + Fly API + Fly web) | $34.25 | No | — |
| Supabase Pro + Fly API only, frontend on free hosting | $31.25 | No | — |
| Supabase Free + R2 + scripted `pg_dump` | ~$9.25 | Yes | Canadian residency for receipts, included daily backups |
| Render Postgres + Fly | ~$12 | Yes | Canadian region (Render has none), included backups |

The blocker is entirely PostgreSQL, not the AI APIs: OCR is $0 at this volume and Jev is $0–$9.90 one-time. Supabase Pro is the cheapest managed option that gives both a Canadian region and included daily backups, and its **$25 alone exceeds the $20 ceiling** — so no configuration of this stack satisfies the target without giving one of those two up.

Recommendation: escalate for a **$35–$40/month** budget, which covers the stack with margin. The defensible fallback, if Torchlight will not fund it, is the ~$9 configuration with the storage limit, the residency gap, and the untested backup script written down as accepted risks with a named owner — not the Pro plan silently downgraded.

## 3. OCR cost per receipt

Cloud Vision's Document Text Detection is the recommendation: one request per page, returns text blocks with per-word confidence, which is what `ocr_field_candidates.confidence` expects.

| Provider | List price | Per receipt | 250/month | 1,000/month |
| --- | --- | --- | --- | --- |
| **Google Cloud Vision** (Document Text Detection) | $1.50 per 1,000 pages, **first 1,000 pages/month free** | $0 below 1k | **$0.00** | **$0.00** |
| AWS Textract (`DetectDocumentText`) | $1.50 per 1,000 pages; 1,000 free pages/month for the first 3 months only | $0.0015 | $0.38 | $1.50 |
| Azure Document Intelligence (Read) | $1.50 per 1,000 pages, 500 free pages/month | $0.0015 | $0.00–0.38 | $0.75 |
| LLM vision (Gemini Flash / GPT-4o-mini class) | per token, ~1.5k in + 200 out per image | $0.0002–0.001 | $0.05–0.25 | $0.20–1.00 |
| Tesseract, self-hosted | no per-page fee | $0 | $0 | $0 |

At this volume the OCR bill is **zero** and stays under a dollar even at 4× growth.

The costs not visible in that table:

- Tesseract is free per call but needs ~1 GB RAM in the container (budget $8–10/month instead of $5), and its accuracy on phone photos is the weakest of the five, which pushes more receipts into manual review. That is a staff-time cost, not a hosting cost.
- LLM vision returns a confidence signal you define yourself. Cloud Vision returns calibrated per-word confidence, which is what the schema column is for.

## 4. Jev (TypeSafe) decision model

Jev is a hosted *decision* model from TypeSafe, not an OCR service. Request: `state` (text, JSON object, or array of text) plus a map of typed questions. Response: one typed answer per question, with probabilities.

| Question type | Returns |
| --- | --- |
| `choice` | the selected option, a probability for every option, and a confidence value (up to 255 options) |
| `score` | a probability-weighted position on an ordered rubric of 2–10 levels |
| `noul` | a 0–1 probability that a yes/no statement is true |

Endpoint: `POST https://jevmodel.net/v1/systemone`, `Authorization: Bearer <key>`, `Content-Type: application/json`.

### What it cannot do

- **It does not accept images.** Their documentation states that image, audio, and video inputs are not supported, and that workflows starting from media must run OCR or transcription first, then evaluate the resulting text.
- **It does not extract fields.** It returns a chosen label, a score, or a probability — never an arbitrary object like `{merchant, total, date}`. Merchant, total, and date still come from the OCR pipeline.

So Jev cannot replace Cloud Vision here; it can only sit after it.

### Pricing

| Plan | Price | Credits | Limits |
| --- | --- | --- | --- |
| Starter | **$9.90 one-time** | 100,000, no expiry | 1 workspace, 1 concurrent request, standard speed |
| Pro | **$99 one-time** | 1,000,000, no expiry | 3 concurrent, fast lane, parallel questions |
| Enterprise | **$999 one-time** | 11,000,000 | 10 concurrent, team workspaces |

One-time purchase, no auto-renew, credits do not expire, and the online playground is free with unlimited runs.

**Unconfirmed:** the pricing page states credit counts but not what a credit is. Third-party write-ups (not TypeSafe) report one decision call consumes one credit regardless of question count, with a free allowance around 1,000 calls per day. On that reading, 250 receipts/month is far inside the free tier and Starter's $9.90 would cover roughly 33 years. Even under a token-metered reading at their published $0.042 per million input tokens, 250 receipts × ~500 tokens is about **$0.005 per month**.

Either way, Jev is a **$0–$10 one-time** line, not a monthly one. Confirm the credit rule with TypeSafe in writing before a grant application depends on it; the marketing page ("API plans include unlimited usage") and the pricing page (fixed credit counts) do not currently agree.

### Where it would fit, and whether it should

Reasonable uses, all answering in one request per receipt:

- **Category suggestion.** A `choice` question whose options are the 19 funding categories — close to the shape the model was built for — returning a suggestion the worker confirms. It never sets `expenses.category_id` itself.
- **Duplicate detection.** A `noul` question comparing a receipt's text against a prior one.
- **Review routing.** A `noul` question feeding `expense_reviews`.

The counterargument: this ledger has to be explainable to Torchlight and the Ministry. "The classifier was 0.81 confident" is weaker audit evidence than a merchant-to-category rule table, and the schema already requires a human decision (`expenses.category_id` NOT NULL plus `expense_reviews`). At 250 receipts/month, one person reviewing 8 a day is not the bottleneck Jev solves. Treat it as an optional suggestion layer, adopted only if the model is logged well enough to reproduce (model version, question text, probabilities, threshold, and the resulting action).

Two further cautions: TypeSafe publishes no processing region, so receipt text containing participant names would leave Canada — worth asking before adopting, since the whole stack is otherwise deliberately Canadian. And OpenAI's Decisions API (generally available 22 October 2026) is the alternative if image input in a single hop is wanted: $0.10 per million input tokens with free output, roughly $0.01/month here, but US/EU processing only.

## 5. What grows

| Resource | Year 1 | Year 7 at 250/month | Included in Pro |
| --- | --- | --- | --- |
| Receipt storage (1.5 MB) | ~4.5 GB | ~31 GB | 100 GB → no overage |
| Database | <100 MB | ~150k rows, well under 1 GB | 8 GB |
| Egress (audit ZIPs, downloads) | a few GB | a few GB | 250 GB |
| OCR pages | 3,000 | 21,000 | free under 1k/month |

Storage is the only line that moves, and it reaches roughly a third of the included quota by year seven. At 500 receipts/month it would reach ~63 GB by year seven, still inside the quota.

**All-in marginal cost per receipt:** $34.25 ÷ 250 ≈ **$0.14**, of which OCR is $0.00. The bill is almost entirely fixed platform fees; a 4× increase in receipt volume would move it by about a dollar.

## 6. Backups are not retention

These are two different obligations and only one is included:

- **Disaster recovery.** Supabase Pro includes daily backups retained for about a week. This covers a bad migration or an accidental delete, not an audit request.
- **Audit retention.** The Ministry can ask for records years later. That needs a scheduled logical export (`pg_dump` plus the receipt archive) written to storage on a recurring basis, independent of the plan. **No plan tier provides this.**

Whatever backup approach is chosen, a restore must be performed and documented at least once before launch. An untested backup is an assumption, not a control.

## 7. Data residency

- Supabase: `ca-central-1` (Canada Central) holds Postgres, Auth, and Storage.
- Fly.io: `yyz` (Toronto) for both machines.
- Cloud Vision and Jev: no Canadian guarantee. Receipt *bytes* stay in Canada; extracted *text* sent to these services does not. If that distinction matters to Torchlight, the OCR step is the thing to review, not the database.

## 8. What to tell Torchlight

Budget **$35–$40/month (~$420–$480/year)** plus **$9.90 one-time** if Jev is adopted. The SOW states Torchlight covers hosting after launch; at this size it is a single line in a Board budget rather than a negotiation.

This is above the repository's $10–$20/month target (see section 2), so it is a decision for Torchlight, not a number to squeeze. The gap is $25/month of PostgreSQL — it buys Canadian residency and daily backups, and there is no managed alternative at that price point that provides both.

Recurring costs, if any, are: the Supabase subscription, Fly usage, and an annual domain renewal. Everything else is per-use and currently free.

## 9. Open questions

- Confirm actual receipt volume with Patty; the storage figures are the only numbers that depend on it.
- Confirm the hosting budget: $35–$40/month, or accept the documented risks of the ~$9 configuration.
- Confirm that Torchlight is willing to hold the Supabase and Fly billing accounts (and a payment method) rather than the student team.
- Decide whether extracted receipt text may leave Canada for OCR and decision services.
- Decide who owns the scheduled export and who runs the restore test.
- Confirm Jev's credit definition in writing before relying on the $0 estimate.

## Sources

- Supabase pricing and free-plan pausing: <https://supabase.com/pricing>, <https://supabase.com/docs/guides/platform/free-project-pausing>
- Supabase regions: <https://supabase.com/docs/guides/platform/regions>
- Fly.io pricing: <https://fly.io/pricing/>
- Google Cloud Vision pricing: <https://cloud.google.com/vision/pricing>
- Jev Model pricing and docs: <https://jevmodel.net/pricing>, <https://jevmodel.net/docs>
- OpenAI Decisions API: <https://developers.openai.com/api/docs/guides/decisions>
- Cloudflare R2 pricing: <https://developers.cloudflare.com/r2/pricing/>
