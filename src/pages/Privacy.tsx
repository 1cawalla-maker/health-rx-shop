import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h1 className="font-display text-4xl font-bold text-foreground mb-8">
              Privacy Policy
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Last updated: December 2024
            </p>

            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Introduction
                </h2>
                <p>
                  NicoPatch ("we", "our", or "us") is committed to protecting your privacy. This Privacy 
                  Policy explains how we collect, use, disclose, and safeguard your information when you 
                  use our telehealth platform and related services.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. Information We Collect
                </h2>
                <p>We collect information you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, 
                  and residential address</li>
                  <li><strong>Medical Information:</strong> Health history, current medications, allergies, 
                  and other health-related information provided during consultations</li>
                  <li><strong>Identity Verification:</strong> Government-issued ID for age and identity verification</li>
                  <li><strong>Payment Information:</strong> Credit card details and billing information 
                  (processed securely by our payment provider)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. How We Use Your Information
                </h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Provide medical consultations and telehealth services</li>
                  <li>Issue and manage electronic prescriptions</li>
                  <li>Process orders and arrange product delivery</li>
                  <li>Communicate with you about appointments and orders</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Improve our services and user experience</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Medical Record Keeping
                </h2>
                <p>
                  As a healthcare service, we are required to maintain medical records in accordance with 
                  Australian healthcare regulations. Your medical records are stored securely and are 
                  accessible only to authorized healthcare professionals involved in your care.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. Information Sharing
                </h2>
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Healthcare providers involved in your treatment</li>
                  <li>Product suppliers for order fulfillment (limited to shipping information only)</li>
                  <li>Payment processors for transaction processing</li>
                  <li>Government authorities when required by law</li>
                </ul>
                <p className="mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  6. Data Security
                </h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal 
                  and medical information against unauthorized access, alteration, disclosure, or destruction. 
                  This includes encryption, secure servers, and strict access controls.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  7. Your Rights
                </h2>
                <p>Under Australian privacy law, you have the right to:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Access your personal and medical information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal retention requirements)</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  8. Cookies and Tracking
                </h2>
                <p>
                  We use cookies and similar technologies to improve your experience on our platform, 
                  analyze usage patterns, and provide personalized content. You can control cookie settings 
                  through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  9. Contact Us
                </h2>
                <p>
                  If you have questions about this Privacy Policy or wish to exercise your privacy rights, 
                  please contact our Privacy Officer at privacy@nicopatch.com.au
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
