# PouchCare manual supplier handoff SOP

Purpose: safe manual fulfilment flow while supplier API automation is intentionally out of scope.

## Before sending anything to the supplier

1. Open Admin → Orders.
2. Open the paid Shopify order.
3. Confirm the order is linked to the expected uploaded/OCR prescription.
4. Confirm the prescription file opens.
5. Confirm order items are within the prescription context:
   - product/variant strength
   - quantity ordered
   - max strength allowed
   - total allowance
   - already used quantity
   - remaining allowance after synced paid orders
6. Confirm there are no warning states:
   - missing prescription link
   - missing prescription file
   - no synced order items
   - missing strength parsing
   - allowance remaining looks wrong
7. Copy the fulfilment pack from Admin → Orders.
8. Attach/include the original prescription file/context as required by the supplier workflow.
9. Perform final human sanity check before sending to supplier.

## Do not send to supplier if

- The paid order is not mirrored in Supabase.
- The order has no linked prescription and it should be an uploaded/OCR prescription order.
- The prescription file cannot be opened.
- The ordered strength exceeds prescription max strength.
- The order quantity would exceed remaining lifetime allowance.
- The customer/shipping details look incomplete.
- The product/variant cannot be confidently identified.

## Current MVP boundaries

- Manual supplier handoff is accepted.
- No supplier API automation yet.
- No clinical interpretation by the app.
- No monthly/refill/rolling-window enforcement.
- Lifetime-per-prescription allowance is the locked MVP rule.
