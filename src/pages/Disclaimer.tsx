import { PublicLayout } from "@/components/layout/PublicLayout";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground">
                Medical & Telehealth Disclaimer
              </h1>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Last updated: December 2024
            </p>

            <div className="space-y-8 text-muted-foreground">
              <section className="bg-warning/5 border border-warning/20 rounded-lg p-6">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Important Notice
                </h2>
                <p>
                  Please read this disclaimer carefully before using NicoPatch services. By using our 
                  platform, you acknowledge that you have read, understood, and agree to be bound by 
                  this disclaimer.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Telehealth Services
                </h2>
                <p>
                  NicoPatch provides telehealth consultations via phone with registered Australian 
                  medical practitioners. While telehealth is a convenient and effective way to access healthcare, 
                  it has certain limitations:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Physical examination is not possible during telehealth consultations</li>
                  <li>The quality of the consultation depends on the technology used and internet connectivity</li>
                  <li>Some conditions may require in-person assessment and cannot be adequately evaluated via telehealth</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Not a Substitute for Emergency Care
                </h2>
                <p className="font-semibold text-foreground">
                  NicoPatch is NOT an emergency medical service.
                </p>
                <p className="mt-4">
                  If you are experiencing a medical emergency, please call 000 immediately or go to your 
                  nearest emergency department. Our service is designed for non-emergency consultations 
                  only.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Prescription Decisions
                </h2>
                <p>
                  All prescription decisions are made solely by the consulting physician based on their 
                  clinical judgment and the information provided by the patient. Please note:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Not all consultations will result in a prescription</li>
                  <li>Doctors may decline to prescribe if they determine it is not clinically appropriate</li>
                  <li>The decision to prescribe is based on your individual health circumstances</li>
                  <li>Providing false or misleading health information may result in inappropriate treatment</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Nicotine Products
                </h2>
                <p>
                  Nicotine is an addictive substance. Nicotine pouches and other nicotine-containing products:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Are not suitable for everyone</li>
                  <li>May cause side effects including nausea, hiccups, and increased heart rate</li>
                  <li>Should not be used by pregnant or breastfeeding women</li>
                  <li>May interact with certain medications</li>
                  <li>Are intended for adult smokers or vapers seeking alternatives</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Personal Importation Scheme
                </h2>
                <p>
                  Products ordered through NicoPatch are imported under Australia's Personal Importation 
                  Scheme as permitted by the Therapeutic Goods Administration (TGA). This means:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Products are imported for personal use only</li>
                  <li>Quantities are limited as per TGA regulations</li>
                  <li>Products may be subject to customs inspection</li>
                  <li>Delivery times may vary due to international shipping and customs processing</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Information Accuracy
                </h2>
                <p>
                  The accuracy and effectiveness of our service depends on you providing complete and 
                  truthful information about your health. You are responsible for:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Providing accurate medical history and current health information</li>
                  <li>Disclosing all medications you are currently taking</li>
                  <li>Informing the doctor of any changes to your health status</li>
                  <li>Following the doctor's advice and instructions</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by law, NicoPatch, its directors, employees, and 
                  affiliated medical practitioners shall not be liable for any direct, indirect, 
                  incidental, consequential, or punitive damages arising from your use of our services 
                  or products ordered through our platform.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  Questions or Concerns
                </h2>
                <p>
                  If you have any questions about this disclaimer or concerns about our services, 
                  please contact us at support@nicopatch.com.au before using our platform.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
