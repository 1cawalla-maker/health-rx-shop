import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, webPageSchema } from "@/components/seo/schema";

export default function RefundPolicy() {
  return (
    <PublicLayout>
      <Seo
        title="Refund Policy"
        description="PouchCare refund policy for telehealth consultations and prescription-restricted product orders."
        canonicalPath="/refund-policy"
        ogImagePath="/og/refund-policy.png"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}/refund-policy`,
            name: 'Refund policy',
            description: 'PouchCare refund policy for telehealth consultations and prescription-restricted product orders.',
            dateModified: '2026-05-28',
            siteOrigin: SITE_ORIGIN,
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Refund Policy', url: `${SITE_ORIGIN}/refund-policy` },
            ],
          }),
        ]}
      />
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h1 className="font-display text-4xl font-bold text-foreground mb-8">
              Refund Policy
            </h1>

            <p className="text-muted-foreground mb-6">
              Last updated: May 2026
            </p>

            <div className="space-y-8 text-muted-foreground">
              <section>
                <p>
                  This Refund Policy applies to consultation bookings and product orders made through PouchCare.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Telehealth consultation fees
                </h2>
                <p>
                  Consultation fees are charged at the time of booking.
                </p>
                <p className="mt-4">
                  A full refund may be available if:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>the consultation is cancelled at least 24 hours before the scheduled appointment time;</li>
                  <li>PouchCare or the consulting practitioner is unable to provide the consultation; or</li>
                  <li>a technical issue caused by PouchCare or its consultation systems prevents the consultation from proceeding.</li>
                </ul>
                <p className="mt-4">
                  Consultation fees are generally not refundable if:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>the consultation has already been completed;</li>
                  <li>the patient does not attend or cannot be reached at the scheduled appointment time;</li>
                  <li>the patient cancels within 24 hours of the scheduled appointment time; or</li>
                  <li>the practitioner determines that a prescription is not clinically appropriate.</li>
                </ul>
                <p className="mt-4">
                  Payment for a consultation does not guarantee that a prescription will be issued. Prescribing decisions are made by the consulting medical practitioner based on clinical judgement.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. Rescheduling
                </h2>
                <p>
                  Patients may request to reschedule a consultation up to 24 hours before the scheduled appointment time, subject to practitioner availability.
                </p>
                <p className="mt-4">
                  Rescheduling requests made within 24 hours of the scheduled appointment time may not be accepted.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. Product orders
                </h2>
                <p>
                  Prescription-restricted products cannot be returned for change of mind once supplied or dispatched.
                </p>
                <p className="mt-4">
                  A refund may be available where:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>the order has not yet been processed or passed to the fulfilment partner;</li>
                  <li>the ordered product is unavailable and the patient does not accept a suitable alternative; or</li>
                  <li>a refund is required under Australian Consumer Law.</li>
                </ul>
                <p className="mt-4">
                  Refunds are generally not available where:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>the order has already been processed or dispatched;</li>
                  <li>the customer provided incorrect delivery details;</li>
                  <li>the customer changes their mind after the order has been processed;</li>
                  <li>delivery is delayed for reasons outside PouchCare’s reasonable control; or</li>
                  <li>the product has been supplied in accordance with the customer’s order and prescription limits.</li>
                </ul>
                <p className="mt-4">
                  Returned prescription-restricted products cannot be accepted for resale or reuse.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Shipping issues
                </h2>
                <p>
                  If an order is delayed, lost, damaged, or seized during transit, PouchCare will review the circumstances and work with the customer and fulfilment partner to determine the appropriate outcome.
                </p>
                <p className="mt-4">
                  This may include replacement, store credit, refund, or supporting documentation, depending on the circumstances and applicable law.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. How to request a refund
                </h2>
                <p>
                  To request a refund, contact PouchCare at support@pouchcare.com.au.
                </p>
                <p className="mt-4">
                  Please include:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>your full name;</li>
                  <li>account email;</li>
                  <li>consultation or order reference;</li>
                  <li>reason for the refund request; and</li>
                  <li>any supporting information.</li>
                </ul>
                <p className="mt-4">
                  Refund requests are reviewed case by case. Approved refunds will be returned to the original payment method where possible.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
