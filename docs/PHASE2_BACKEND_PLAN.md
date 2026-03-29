# Phase 2 Backend Plan (Supabase + Stripe)

Goal: Wire the existing Phase 1 UI to a real backend **without UI changes**.

Principles:
- **Auth** = Supabase Auth (email+password only for Phase 2).
- **App data** = Postgres tables in Supabase.
- **Service seams**: UI talks only to `src/services/*`; Phase 2 swaps implementations.
- **RLS on** by default; only use service role where strictly required (webhooks/admin-only).
- **Idempotent** writes: payment confirmation + booking creation must be safe to retry.

---

## 1) Architecture overview

### Runtime components
- **Client SPA (Vercel)**
  - Supabase anon key for authenticated user operations (subject to RLS).
  - Calls **Supabase Edge Functions** for privileged operations (Stripe webhooks, internal booking finalisation, admin actions).

- **Supabase**
  - Auth (users, sessions)
  - Postgres (tables + RLS)
  - Storage (later; uploads)
  - Edge Functions (Stripe integration + privileged workflows)

- **Stripe**
  - Checkout + payment intents
  - Webhooks to Supabase Edge Functions

---

## 2) Identity + roles

### Roles
- `patient`
- `doctor`
- `admin`

### Source of truth
- **Supabase Auth**: `user_metadata.role` (quick client gating)
- **DB**: `profiles.role` (querying + joins + auditing)

On signup:
- Create auth user
- Set `user_metadata.role`
- Upsert `profiles` row

---

## 3) Data model (tables)

### 3.1 `profiles`
**Purpose:** anchor row for every authed user.

Columns:
- `id uuid pk` (== `auth.uid()`)
- `role text not null check (role in ('patient','doctor','admin'))`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Indexes:
- pk on `id`
- index on `role`

### 3.2 `patient_profiles`
**Purpose:** editable patient contact + demographic data (NOT login email).

Columns (align to Phase 1 UI fields; expand as needed):
- `id uuid pk fk -> profiles.id`
- `full_name text`
- `dob date`
- `phone text`
- `contact_email text`
- `address_line1 text`, `address_line2 text`, `suburb text`, `state text`, `postcode text`
- timestamps

### 3.3 `doctor_profiles`
**Purpose:** doctor identity + approval status.

Columns:
- `id uuid pk fk -> profiles.id`
- `full_name text`
- `ahpra_number text`
- `status text not null default 'pending' check (status in ('pending','approved','rejected'))`
- `approved_at timestamptz`
- timestamps

Doctor UX rule (Phase 2): doctor can access portal immediately, but features can be gated by `status`.

### 3.4 `eligibility_quiz_results`
**Purpose:** persist quiz responses + computed result for doctor viewing.

Columns:
- `id uuid pk default gen_random_uuid()`
- `patient_id uuid not null fk -> profiles.id`
- `responses jsonb not null`
- `result jsonb not null`
- `created_at`, `updated_at`

Constraints:
- unique index on `(patient_id)` if we want “latest row overwrites”
  - or allow history by removing uniqueness (not needed for Phase 2)

### 3.5 `bookings`
**Purpose:** real booking objects backing patient/doctor flows.

Columns:
- `id uuid pk default gen_random_uuid()`
- `patient_id uuid not null fk -> profiles.id`
- `doctor_id uuid fk -> profiles.id` (nullable until payment confirmed)
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `status text not null` (match existing TS enum set)
- `consultation_type text not null` (keep type shape; UI enforces phone-only)
- `created_at`, `updated_at`

Payment linkage:
- `stripe_checkout_session_id text unique`
- `stripe_payment_intent_id text unique`
- `paid_at timestamptz`
- `amount_paid_cents int`
- `currency text default 'AUD'`

Anti-collision:
- DB-level constraints are hard because doctor assignment is delayed.
- We will enforce via transactional logic in an Edge Function when payment confirms.

### 3.6 `doctor_availability` (Phase 2)
**Purpose:** defines which doctors can take 5-min slots.

Minimal version:
- `id uuid pk`
- `doctor_id uuid fk -> profiles.id`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `timezone text` (or implicit; we store in UTC)
- `created_at`

We can also store recurring availability later; Phase 2 can start with explicit windows.

---

## 4) RLS policies (high-level)

Enable RLS on all tables.

### `profiles`
- user can read own row
- user cannot change role client-side (updates via edge function/admin only)

### `patient_profiles`
- patient can read/write own row

### `doctor_profiles`
- doctor can read/write own row
- patient cannot read doctor private fields (unless explicitly needed)

### `eligibility_quiz_results`
- patient can read/write their own
- doctor can read a patient’s quiz only if there exists a booking that links them:
  - exists `bookings` where `bookings.patient_id = eligibility_quiz_results.patient_id` and `bookings.doctor_id = auth.uid()`

### `bookings`
- patient can read bookings where `patient_id = auth.uid()`
- doctor can read bookings where `doctor_id = auth.uid()`
- insert/update rules:
  - patient can create a **pending payment** booking request (or a separate table)
  - final booking creation/doctor assignment is done by Edge Function on payment confirmation

---

## 5) Stripe integration approach (recommended)

### 5.1 Client flow
- Client requests a Checkout Session by calling an Edge Function:
  - `create_checkout_session`
- Edge Function validates:
  - user is authed and role=patient
  - slot is still reservable
  - amount matches pricing rules
- Edge Function creates Stripe Checkout Session and returns URL.

### 5.2 Webhook flow (source of truth)
- Stripe webhook → Edge Function `stripe_webhook`
- On `checkout.session.completed` / `payment_intent.succeeded`:
  - verify signature
  - load the pending reservation
  - allocate a doctor (based on availability + anti-collision)
  - write `bookings` row with `status='booked'`, `paid_at`, stripe ids
  - release reservation

This matches the product rule: **doctor is assigned only after payment confirmation**.

### 5.3 Reservation table (needed)
To prevent double booking before payment confirms, we should add:

`booking_reservations`
- `id uuid pk`
- `patient_id uuid`
- `starts_at timestamptz`
- `expires_at timestamptz`
- `status text` (`active|expired|converted`)
- `stripe_checkout_session_id text unique`

The UI already behaves like reservations exist; Phase 2 makes it real.

---

## 6) Mapping to existing Phase 1 service seams

| Phase 1 Service | Phase 2 backing |
|---|---|
| `userProfileService` | `patient_profiles` |
| `doctorProfileService` | `doctor_profiles` |
| `eligibilityQuizService` | `eligibility_quiz_results` |
| `consultationService` | `bookings` + `booking_reservations` + `doctor_availability` |
| cart/orders services | later tables + Stripe (Phase 2/3) |

Rule: no UI code touches Supabase directly; services own it.

---

## 7) Operational management (keep backend easy to manage)

### Naming + conventions
- All tables plural snake_case.
- All timestamps: `created_at`, `updated_at`.
- All times stored as `timestamptz` in UTC.

### Environments
- Supabase: separate **dev** and **prod** projects.
- Vercel: env vars set per environment.

### Documentation locations
- This plan: `docs/PHASE2_BACKEND_PLAN.md`
- Deployment/SEO sanity: `docs/SEO_SANITY_CHECK.md`

### Observability
- Edge Functions log key events (checkout create, webhook success/failure, booking allocation decisions).

---

## 8) Implementation order (Phase 2 execution)

1) Create tables + RLS skeleton
2) Implement auth role+profile upsert
3) Implement eligibility persistence
4) Implement reservations + Stripe checkout session Edge Function
5) Implement Stripe webhook Edge Function + booking finalisation + doctor assignment
6) Swap service implementations to Supabase-backed (keeping UI unchanged)
7) End-to-end tests in Vercel preview, then prod

---

## Open questions (to resolve before coding)

1) Pricing: fixed consultation price vs variable? (needed for Stripe amount)
2) Reservation TTL: how long do we hold a slot before expiry?
3) Doctor availability source: do we start with manual admin-managed windows?
4) Status enum mapping: confirm the canonical booking statuses we must support.
