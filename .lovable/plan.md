

## Doctor Earnings Rework + Portal Hardening

### P0: Earnings Page Rework

**File: `src/pages/doctor/Earnings.tsx`** — full rewrite

**A) Top Summary Cards (3 cards)**
- **This Week**: Filter earnings lines to current Mon–Sun, show paid/pending totals and consult count.
- **Pending**: Total pending across all weeks.
- **Paid**: Total paid across all weeks.
- Keep "Weekly payouts" copy line (informational only).

**B) Weekly List (replaces flat ledger + payslips section)**
- Group earnings lines by ISO week (Mon–Sun) using existing `doctorPayslipService` week helpers or inline grouping.
- Each row: week range label, paid total, pending total, consult count, "View details" button.
- Remove the "Weekly Payslips" card and "Open payslip" / `window.open` links entirely.

**C) Week Details Drawer**
- Use existing `Drawer` component (from vaul, already in project).
- Opens on "View details" click. Shows:
  - Consult rows: date/time (doctor TZ), patient name (via `userProfileService.getProfile` or fallback to patient ID), status badge, fee ($39), paid/pending badge.
  - "Mark all as paid" / "Mark all as pending" buttons with immediate effect + drawer refresh.
- No print/PDF styling.

**D) Payout Details Block (bottom of page)**
- Small read-only card showing: remittance email, masked bank details, ABN, entity name from `doctorPayoutProfileService.getProfile(user.id)`.
- "Edit payout details" link navigates to `/doctor/account`.

**Services used** (no changes needed):
- `doctorEarningsService.getEarnings(uid)` — line items
- `doctorPayoutService` — paid/pending toggles and summary
- `doctorPayoutProfileService.getProfile(uid)` — payout details display
- `userProfileService` — patient name resolution in drawer

**Removed from Earnings:**
- `doctorPayslipService` import and all payslip state/rendering
- "Open payslip" button / `window.open` to print route

---

### P1: Signature Pad Draw-Immediately Fix

**Files: `src/pages/doctor/Onboarding.tsx`, `src/pages/doctor/Account.tsx`, `src/pages/doctor/Registration.tsx`**

All three use the same broken pattern: `useMemo(() => canvas.getContext('2d'), [canvasRef.current])` which returns `null` on first render because the ref isn't set yet during memo evaluation.

**Fix:** Remove the `useMemo` for `ctx`. Instead, acquire context inline in the `start` handler:
```typescript
const start = (e: React.PointerEvent) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  setDrawing(true);
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
  ctx.beginPath();
  const rect = canvas.getBoundingClientRect();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
};
```
Similarly update `move` and `clear` to acquire `ctx` from `canvasRef.current.getContext('2d')` inline. Remove `ctx` from state/memo entirely.

---

### P1: Remove Internal Copy

**File: `src/pages/doctor/Availability.tsx`** line 67:
- Remove comment `// Phase 1: no patient name in mock bookings`

The `Mock` type references (`MockBooking`, `MockAvailabilityBlock`, `mockAvailabilityService`) are code-internal type/variable names, not user-visible copy — no change needed.

---

### P1: ConsultationView Status Controls + Post-Issue Nav

Already implemented correctly in the current codebase (verified lines 237-258 and 130-143). No changes needed.

---

### Files to modify

| File | Action | Scope |
|------|--------|-------|
| `src/pages/doctor/Earnings.tsx` | Rewrite | P0: Full rework with drawer |
| `src/pages/doctor/Onboarding.tsx` | Edit | P1: Fix ctx acquisition |
| `src/pages/doctor/Account.tsx` | Edit | P1: Fix ctx acquisition |
| `src/pages/doctor/Registration.tsx` | Edit | P1: Fix ctx acquisition |
| `src/pages/doctor/Availability.tsx` | Edit | P1: Remove Phase 1 comment |

