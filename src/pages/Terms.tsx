import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Terms() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h1 className="font-display text-4xl font-bold text-foreground mb-8">
              Terms of Service
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Last updated: December 2024
            </p>

            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using the NicoPatch platform ("Service"), you accept and agree to be bound 
                  by the terms and provision of this agreement. If you do not agree to abide by these terms, 
                  please do not use this Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. Description of Service
                </h2>
                <p>
                  NicoPatch provides a telehealth platform that connects patients with registered Australian 
                  medical practitioners for consultations regarding nicotine pouch products. Our service includes:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Online video and phone consultations with AHPRA-registered doctors</li>
                  <li>Medical assessments for nicotine pouch suitability</li>
                  <li>Electronic prescription issuance where clinically appropriate</li>
                  <li>Access to a product ordering platform for eligible patients</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. Eligibility
                </h2>
                <p>
                  To use our Service, you must:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Be a resident of Australia</li>
                  <li>Provide accurate and complete information during registration</li>
                  <li>Have a valid form of identification for verification purposes</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Medical Disclaimer
                </h2>
                <p>
                  The information provided through our Service is for general informational purposes only 
                  and should not be considered a substitute for professional medical advice, diagnosis, 
                  or treatment. Always consult with a qualified healthcare provider regarding any medical 
                  condition or treatment.
                </p>
                <p className="mt-4">
                  Prescription decisions are made solely by the consulting physician and are based on their 
                  clinical judgment. Not all consultations will result in a prescription.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. Payment and Refunds
                </h2>
                <p>
                  Consultation fees are charged at the time of booking and are non-refundable once the 
                  consultation has taken place. If you cancel your appointment more than 24 hours in advance, 
                  you may be eligible for a full refund or credit.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  6. Privacy
                </h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand how we 
                  collect, use, and protect your personal and medical information.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  7. Limitation of Liability
                </h2>
                <p>
                  To the fullest extent permitted by law, NicoPatch shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages arising out of or related to 
                  your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  8. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes by posting the new Terms of Service on this page with an updated 
                  revision date.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  9. Contact Us
                </h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at 
                  support@nicopatch.com.au
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
