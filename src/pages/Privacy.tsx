import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, webPageSchema } from "@/components/seo/schema";

const lastUpdated = "May 2026";

export default function Privacy() {
  return (
    <PublicLayout>
      <Seo
        title="Privacy Policy"
        description="How PouchCare handles personal information, sensitive health information, telehealth records, prescriptions and order data."
        canonicalPath="/privacy"
        ogImagePath="/og/privacy.png"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}/privacy`,
            name: "Privacy policy",
            description:
              "How PouchCare handles personal information, sensitive health information, telehealth records, prescriptions and order data.",
            dateModified: "2026-05-21",
            siteOrigin: SITE_ORIGIN,
          }),
          breadcrumbSchema({
            items: [
              { name: "Home", url: `${SITE_ORIGIN}/` },
              { name: "Privacy", url: `${SITE_ORIGIN}/privacy` },
            ],
          }),
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto prose prose-slate">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

            <div className="rounded-lg border bg-muted/40 p-5 mb-10 text-sm text-muted-foreground">
              <p className="m-0">
                This policy explains how PouchCare collects, uses, stores and discloses personal
                information and sensitive health information when providing our website, telehealth
                consultation pathway, prescription support and dispensing/fulfilment services. It is
                intended to satisfy our obligations under the Australian Privacy Principles in the
                Privacy Act 1988 (Cth).
              </p>
            </div>

            <div className="space-y-10 text-muted-foreground">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">1. Who we are</h2>
                <p>
                  PouchCare provides an online pathway for eligible Australian adults to access
                  telehealth assessment and, where clinically appropriate, prescription and product
                  fulfilment support. References to “PouchCare”, “we”, “us” or “our” mean the entity
                  operating this website and service. Entity, ABN and registered office details will be
                  added when finalised.
                </p>
                <p>
                  Because our services involve health assessment, prescriptions and dispensing support,
                  we treat health information as sensitive information and apply additional safeguards.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">2. Information we collect</h2>
                <p>Depending on how you use PouchCare, we may collect:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Account and identity details:</strong> name, email, phone, date of birth, address, login details and role.</li>
                  <li><strong>Health and eligibility information:</strong> clinical intake and consultation information handled through Halaxy or provided during care, prescription records, consultation reason where applicable, and consent records.</li>
                  <li><strong>Telehealth records:</strong> booking details, consultation status, consultation notes, call attempts, follow-up arrangements and doctor assessment outcomes.</li>
                  <li><strong>Prescription and document information:</strong> uploaded prescriptions, issued prescription details, prescription files, related correspondence and dispensing/fulfilment documents.</li>
                  <li><strong>Order and delivery information:</strong> products ordered, quantities, shipping details, order status, Shopify or fulfilment references and packing documentation.</li>
                  <li><strong>Payment information:</strong> payment status, transaction references and billing details. Card details are processed by our payment provider and should not be stored by PouchCare.</li>
                  <li><strong>Doctor information:</strong> AHPRA/provider details, professional profile, onboarding documents, signature, availability and payout/remittance details.</li>
                  <li><strong>Technical information:</strong> device/browser data, IP address, logs, cookies and security/audit events.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">3. How we collect information</h2>
                <p>
                  We collect information directly from you when you use the website, complete the
                  create an account, book or attend a consultation, upload a
                  document, place an order, contact support or apply to work with us as a doctor. We may
                  also receive information from treating doctors, pharmacists, payment providers,
                  fulfilment partners, identity/security systems and service providers that support our
                  platform.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">4. Why we collect, use and disclose information</h2>
                <p>We collect, use and disclose information where reasonably necessary to:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>assess whether our service may be suitable for you;</li>
                  <li>arrange and provide telehealth consultations;</li>
                  <li>support doctors to make independent clinical decisions;</li>
                  <li>issue, manage, review or verify prescriptions where clinically appropriate;</li>
                  <li>process payments, orders, dispensing and delivery;</li>
                  <li>communicate with you about your account, appointments, prescriptions, orders and support requests;</li>
                  <li>meet legal, regulatory, clinical governance, insurance, audit and record-keeping obligations;</li>
                  <li>protect patients, doctors, staff, systems and the public from fraud, misuse, safety risks or unlawful activity;</li>
                  <li>operate, troubleshoot and improve the service; and</li>
                  <li>send marketing only where permitted, with opt-out controls.</li>
                </ul>
                <p>
                  If you do not provide information required for clinical assessment, identity, legal
                  compliance, payment or fulfilment, we may not be able to provide the relevant service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">5. Sensitive health information and consent</h2>
                <p>
                  Health information is sensitive information under Australian privacy law. We collect
                  health information with your consent and only where reasonably necessary for our
                  telehealth, prescription, dispensing/fulfilment, safety and compliance functions.
                </p>
                <p>
                  Any Halaxy clinical intake is for consultation preparation only. It is not medical advice and does
                  not guarantee that a doctor will prescribe or that products will be supplied. A doctor
                  must make an independent clinical assessment.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">6. Who we may share information with</h2>
                <p>We may share information with:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>doctors and authorised clinical personnel involved in your care;</li>
                  <li>pharmacists, dispensers, suppliers and fulfilment partners where necessary for lawful supply and delivery;</li>
                  <li>payment processors such as Stripe for payment processing;</li>
                  <li>commerce and fulfilment platforms such as Shopify where necessary for order processing;</li>
                  <li>technology providers such as hosting, database, storage, email, SMS, telehealth, analytics and security providers;</li>
                  <li>professional advisers, insurers, auditors and debt/recovery providers where required;</li>
                  <li>government agencies, regulators, courts, law enforcement or dispute bodies where required or authorised by law; and</li>
                  <li>another organisation involved in a restructure, sale or transfer of our business, subject to confidentiality and legal safeguards.</li>
                </ul>
                <p>
                  We do not sell personal information. We aim to disclose the minimum information
                  reasonably necessary for each recipient’s role.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">7. Overseas disclosure</h2>
                <p>
                  Some service providers may store or access information from outside Australia. These
                  may include cloud hosting, database, payment, email, analytics, security, commerce or
                  support providers. Where we use overseas providers, we take reasonable steps to assess
                  privacy and security safeguards and to limit the information shared.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">8. Security</h2>
                <p>
                  We use technical, organisational and access-control safeguards designed to protect
                  personal and health information from misuse, interference, loss, unauthorised access,
                  modification or disclosure. These safeguards may include private storage, role-based
                  access controls, encryption in transit, audit logging, secure service providers,
                  limited staff access and operational security reviews.
                </p>
                <p>
                  No online system is risk-free. If we become aware of a data breach, we will assess it
                  under the Notifiable Data Breaches scheme and notify affected people and the OAIC where
                  required.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">9. Retention</h2>
                <p>
                  We keep personal information only for as long as reasonably necessary for the purposes
                  described in this policy, unless a longer period is required for medical records,
                  pharmacy/therapeutic goods compliance, tax, accounting, legal, insurance, dispute or
                  audit purposes. Health and prescription records may need to be retained even if an
                  account is closed.
                </p>
                <p>
                  When information is no longer required, we will take reasonable steps to destroy or
                  de-identify it, subject to legal and clinical record-keeping obligations.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">10. Access and correction</h2>
                <p>
                  You may request access to, or correction of, personal information we hold about you.
                  We may need to verify your identity before responding. In some cases, we may refuse or
                  limit access where permitted by law, for example where access would unreasonably impact
                  another person’s privacy, compromise security, or conflict with clinical or legal
                  obligations.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">11. Marketing</h2>
                <p>
                  We may send service, clinical, order and account messages that are necessary to provide
                  the service. We will only send promotional marketing where permitted by law. Marketing
                  messages will identify us and include a way to unsubscribe. We will not use sensitive
                  health information for marketing unless permitted by law and with any consent required.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">12. Cookies and analytics</h2>
                <p>
                  We may use cookies and similar technologies to keep the site working, maintain security,
                  remember preferences, understand site use and improve the service. You can control
                  cookies through your browser settings, but some features may not work correctly if
                  cookies are disabled.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">13. Children and age restrictions</h2>
                <p>
                  PouchCare is intended for Australian adults aged 18 and over. We do not knowingly offer
                  nicotine-related telehealth or dispensing pathways to minors.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">14. Complaints</h2>
                <p>
                  If you have a privacy concern, contact us first so we can investigate and respond. If
                  you are not satisfied with our response, you may contact the Office of the Australian
                  Information Commissioner at oaic.gov.au.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">15. Contact us</h2>
                <p>
                  Privacy enquiries, access/correction requests and complaints can be sent to:
                  <br />
                  <a href="mailto:privacy@pouchcare.com.au">privacy@pouchcare.com.au</a>
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">16. Changes to this policy</h2>
                <p>
                  We may update this policy from time to time. The updated version will be posted on
                  this page with the latest update date.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
