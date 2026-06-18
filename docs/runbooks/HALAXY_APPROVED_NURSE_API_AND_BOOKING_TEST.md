# Halaxy approved nurse: API + booking-link test plan

Date: 2026-06-18

## Current audited state

- Supabase linked project: `vqfodbwvtkeduhmmmjtc`.
- Halaxy migrations are applied remotely:
  - `20260602090000_halaxy_consult_scaffold.sql`
  - `20260604110000_halaxy_clinical_rls_cleanup.sql`
- Deployed Edge Functions exist:
  - `halaxy-prepare-consult`
  - `halaxy-webhook`
- Supabase secrets currently do **not** include `HALAXY_*` keys, so live booking/API mode is not active yet.
- Patient UI already has pending local support for:
  - creating/reusing a Halaxy-backed consult record,
  - showing patient consultations from Supabase,
  - showing pending Halaxy sync state,
  - opening Halaxy booking/manage links when present.
- Admin UI already has pending local support for `/admin/halaxy-consults` manual fallback queue.
- There is no deployed/implemented periodic Halaxy API pull/sync function yet. Current integration is booking-link + webhook-first.

## Known Halaxy IDs from previous setup

- Halaxy group/practice id: `30671053`
- Location PouchCare Clayfield id: `1365901`
- Private funder id: `2020235`
- Production-style fee id: `10220543` — `PouchCare GP Telehealth Consult`, `$49.99`
- Smoke-test fee id: `10220747` — `PouchCare TEST Booking Smoke Test`, `$0.50`
- Ann Wallace profile id: `1786155`
- Ann Wallace linkPrG/user pref id: `1997395`
- Ann Wallace access user id: `33468655`
- Ann Wallace practitioner-location schedule id: `3411555`

## What changed now

The prior blocker was Ann’s Halaxy practitioner/profile approval. If Ann is now approved/public/bookable, proceed with live booking verification.

## Phase 1 — prove Halaxy API access, read-only

1. In Halaxy, create/check API key from the developer/API page.
2. API key must include at minimum read scopes/resources for:
   - Patient
   - Practitioner / PractitionerRole
   - Location / Organization as applicable
   - HealthcareService / ChargeItemDefinition if we want to verify service/fee IDs
   - Appointment
   - Invoice / PaymentTransaction only if payment status needs to be mirrored
3. Run local read-only smoke test without printing payloads:

```bash
HALAXY_CLIENT_ID='...' \
HALAXY_CLIENT_SECRET='...' \
HALAXY_API_BASE_URL='https://au-api.halaxy.com/main' \
HALAXY_USER_AGENT='PouchCare (admin@pouchcare.com.au)' \
node scripts/halaxy-api-smoke.mjs
```

Expected:

- OAuth token request succeeds.
- `/Patient?_count=1` and `/Appointment?_count=5` return 200 or a clear permission error.
- If a permission error occurs, adjust Halaxy API key scopes before building sync logic.

Notes from Halaxy docs:

- OAuth token endpoint: `https://au-api.halaxy.com/main/oauth/token`.
- Grant type: `client_credentials`.
- Access tokens are short lived.
- Use `Accept: application/fhir+json` and a meaningful `User-Agent`.
- Rate limit is documented as 500 OAuth-authenticated requests/min; respect `retry-after` on 429.

## Phase 2 — generate verified booking links

Use the already-created Halaxy booking-link pages:

- Smoke test fee: `https://www.halaxy.com/a/pr/30671053/funder/fee/booking-link/10220747`
- Production fee: `https://www.halaxy.com/a/pr/30671053/funder/fee/booking-link/10220543`

Actions:

1. Confirm PouchCare Clayfield + Ann Wallace are selectable.
2. Generate a direct booking link for the `$0.50` smoke-test fee first.
3. Generate/copy production `$49.99` link after smoke test passes.
4. If Halaxy supports URL query passthrough, confirm the booking link preserves:
   - `pouchcare_consultation_id`
   - `booking_return_token`

Expected:

- A public patient-facing Halaxy booking URL exists.
- The URL works in a clean/incognito browser.

## Phase 3 — wire Supabase secrets

Once the smoke booking URL and API credentials are confirmed, set these secrets on project `vqfodbwvtkeduhmmmjtc`:

```bash
supabase secrets set --project-ref vqfodbwvtkeduhmmmjtc \
  HALAXY_API_BASE_URL='https://au-api.halaxy.com/main' \
  HALAXY_CLIENT_ID='...' \
  HALAXY_CLIENT_SECRET='...' \
  HALAXY_BOOKING_URL='https://...' \
  HALAXY_WEBHOOK_SECRET='...'
```

Optional:

- `HALAXY_BOOKING_EMBED_URL` if Halaxy provides a better embeddable URL than the direct booking URL.

Then smoke `halaxy-prepare-consult` with a real patient account:

- It should create/reuse a `consultations` row with `booking_provider = halaxy`.
- It should return `bookingUrl`.
- It should append PouchCare return params to the booking URL.
- It should no longer return live-config warning unless only partial config is present.

## Phase 4 — real booking + webhook validation

1. Use the `$0.50` booking link.
2. Book a test appointment with Ann.
3. Confirm the appointment appears in Halaxy calendar.
4. Watch Supabase function logs for `halaxy-webhook`.
5. Confirm a row appears in `halaxy_webhook_events`.
6. Confirm the matching `consultations` row updates:
   - `booking_status`
   - `scheduled_at`
   - `halaxy_appointment_id`
   - `halaxy_appointment_status`
   - `halaxy_practitioner_id/name`
   - `halaxy_location_id/name`
   - `halaxy_manage_url` if Halaxy sends one

If webhook payload does not include the PouchCare params, reconciliation fallback is:

- match by `halaxy_appointment_id` if already known, or
- use API pull to search recent appointments and manually/admin-link the first event until parser is adapted.

## Phase 5 — implement API pull/sync fallback

Only after Phase 1 confirms actual readable resources and search parameters.

Recommended function:

- `supabase/functions/halaxy-sync-appointments/index.ts`
- Service-role only / admin-only invocation.
- Uses OAuth client credentials.
- Pulls appointments by one of:
  - `Appointment/{id}` for known appointment IDs,
  - `Appointment?patient=Patient/{halaxy_patient_id}` for known patients, if supported,
  - bounded recent appointment search for the practice/location/practitioner, if supported.
- Upserts raw pull metadata to `halaxy_webhook_events` or a new `halaxy_sync_runs` table.
- Updates the same safe `consultations` fields as `halaxy-webhook`.
- Does **not** pull or interpret prescriptions/documents until separately validated.

## Phase 6 — patient-visible acceptance criteria

Patient should be able to:

- submit a consult request in PouchCare,
- click through to Halaxy booking/payment,
- return to PouchCare dashboard,
- see the consult as pending/syncing immediately,
- later see booked date/time/practitioner once webhook/API sync completes,
- click Open Halaxy / manage link if present.

Admin should be able to:

- see Halaxy consults in `/admin/halaxy-consults`,
- manually fill Halaxy patient/appointment IDs if sync fails,
- mark booked/cancelled/completed/manual-review states,
- see whether a webhook has been received.

Doctor/nurse should be able to:

- see assigned Halaxy consults once `doctors.halaxy_practitioner_id` maps to the Halaxy practitioner id,
- leave unassigned/manual-review consults visible to admin if mapping is missing.

## Deployment caution

The local repo has many unrelated pending changes. Do not blindly deploy the whole dirty tree. For a safe Halaxy release, isolate:

- Halaxy scaffold migrations/functions,
- patient Halaxy booking/list UI,
- admin Halaxy queue,
- `consultBookingProvider` config,
- any API sync function added after credential validation.

Keep Twilio, unrelated email, Shopify, doctor portal, and broad copy changes out unless deliberately included.
