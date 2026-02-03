
# Phase 1 Copy Cleanup: Phone-Only Implementation

## Summary
Remove all "video" consultation references across patient-facing UI and replace with phone-only language. This enforces the platform-wide phone-only service model at the UI level while preserving database type compatibility.

---

## Files to Modify (8 total)

### 1. `src/pages/Index.tsx`
**Line 19** - Update step description:
- **Old**: `"Schedule an online video or phone consultation with a registered Australian doctor."`
- **New**: `"Schedule a phone consultation with a registered Australian doctor."`

---

### 2. `src/pages/Pricing.tsx`
**Line 7** - Update consultation feature:
- **Old**: `"15-30 minute video or phone consultation"`
- **New**: `"15-30 minute phone consultation"`

---

### 3. `src/pages/FAQ.tsx`
**Line 35** - Update FAQ answer:
- **Old**: `"...you can book a video or phone consultation at a time that suits you..."`
- **New**: `"...you can book a phone consultation at a time that suits you..."`

---

### 4. `src/pages/Terms.tsx`
**Line 38** - Update service description list item:
- **Old**: `"Online video and phone consultations with AHPRA-registered doctors"`
- **New**: `"Phone consultations with AHPRA-registered doctors"`

---

### 5. `src/pages/Disclaimer.tsx`
**Line 40** - Update telehealth services description:
- **Old**: `"NicoPatch provides telehealth consultations via video and phone with registered Australian..."`
- **New**: `"NicoPatch provides telehealth consultations via phone with registered Australian..."`

---

### 6. `src/pages/HowItWorks.tsx`
**Lines 4-14** - Replace Video icon import with Phone:
```typescript
import { 
  UserPlus, 
  ClipboardList, 
  Phone,  // Changed from Video
  FileCheck, 
  ShoppingBag, 
  Truck,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";
```

**Lines 40-51** - Update step 3 content:
```typescript
{
  icon: Phone,  // Changed from Video
  step: 3,
  title: "Book Your Consultation",
  description: "Choose a convenient time for your phone consultation with one of our registered Australian doctors.",
  details: [
    "Select from available phone appointment times",
    "Choose a time that suits your schedule",
    "Receive confirmation and appointment reminders",
    "We'll call you at your scheduled time",  // Changed from "Join securely from any device with internet"
  ],
},
```

---

### 7. `src/components/bookings/BookingCard.tsx`
**Line 5** - Remove Video from imports:
- **Old**: `import { Phone, Video, Calendar, Clock, User } from 'lucide-react';`
- **New**: `import { Phone, Calendar, Clock, User } from 'lucide-react';`

**Lines 15-16** - Hardcode Phone icon (treat legacy 'video' as phone for display):
```typescript
export function BookingCard({ booking, showPatient, onViewDetails, actions }: BookingCardProps) {
  // Always use Phone icon (phone-only service model)
  const Icon = Phone;
```

**Lines 27-29** - Hardcode "Phone Consultation" label:
```tsx
<CardTitle className="text-base font-semibold">
  Phone Consultation
</CardTitle>
```

---

### 8. `src/pages/patient/Consultations.tsx`
**Lines 15-22** - Remove unused `consultation_type` from local interface:
```typescript
interface Consultation {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
}
```

---

## What Is NOT Changed
- `src/types/database.ts` - Keep `consultation_type: 'video' | 'phone'` to match Supabase schema reality
- No routing, logic, or backend changes
- No new dependencies

---

## Summary Table

| File | Change Type | Description |
|------|-------------|-------------|
| Index.tsx | Text | Remove "video or" from step description |
| Pricing.tsx | Text | Remove "video or" from feature list |
| FAQ.tsx | Text | Remove "video or" from FAQ answer |
| Terms.tsx | Text | Remove "Online video and" from service list |
| Disclaimer.tsx | Text | Remove "video and" from telehealth description |
| HowItWorks.tsx | Icon + Text | Replace Video→Phone icon, update copy |
| BookingCard.tsx | Icon + Text | Hardcode Phone icon and label |
| Consultations.tsx | Type cleanup | Remove unused consultation_type property |

---

**Ready to implement once switched to default mode.**
