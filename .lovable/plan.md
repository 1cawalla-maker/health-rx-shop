

# Remove "Book another consultation" CTA from Consultation Details Modal

## Overview
Simple UI cleanup: remove the bottom CTA button from the `ConsultationDetailDialog` component while preserving all other elements.

## File to Modify

**`src/components/patient/ConsultationDetailDialog.tsx`**

## Changes

### 1. Remove unused imports (line 2, 4)
Remove `Link` from react-router-dom and `Button` from UI components since they're no longer needed.

**Before:**
```typescript
import { Link } from 'react-router-dom';
...
import { Button } from '@/components/ui/button';
```

**After:**
```typescript
// Remove line 2 entirely (Link import)
// Keep Button import only if used elsewhere - but it IS used for the copy button on line 145
// So we keep Button, remove only the Link import
```

Actually, `Button` is still used for the copy booking ID button (line 145), so we only remove the `Link` import.

### 2. Remove the CTA block (lines 174-177)
Delete the entire "Book Another CTA" section.

**Remove:**
```tsx
{/* Book Another CTA */}
<Button asChild className="w-full">
  <Link to="/patient/book">Book another consultation</Link>
</Button>
```

---

## Summary

| Line(s) | Change |
|---------|--------|
| 2 | Remove `import { Link } from 'react-router-dom';` |
| 174-177 | Delete the "Book Another CTA" `<Button>` block |

## What Remains Unchanged
- Date/time display with timezone
- Status badge
- Doctor name (when available)
- Amount paid (when exists)
- Booking ID with copy functionality
- No-show policy (for upcoming bookings)
- Rescheduling note (for upcoming bookings)

---

**Awaiting approval.**

