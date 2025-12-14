import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  ClipboardList, 
  Video, 
  FileCheck, 
  ShoppingBag, 
  Truck,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";

const detailedSteps = [
  {
    icon: UserPlus,
    step: 1,
    title: "Create Your Account",
    description: "Sign up for a free NicoPatch account in minutes. We'll need some basic information to get you started.",
    details: [
      "Provide your email and create a secure password",
      "Verify your identity with a valid Australian ID",
      "Set up your patient profile with contact details",
    ],
  },
  {
    icon: ClipboardList,
    step: 2,
    title: "Complete Medical Profile",
    description: "Tell us about your health history so our doctors can provide the best care.",
    details: [
      "Smoking or vaping history and current habits",
      "Existing health conditions and medications",
      "Allergies and contraindications",
      "Previous nicotine replacement therapy experience",
    ],
  },
  {
    icon: Video,
    step: 3,
    title: "Book Your Consultation",
    description: "Choose a convenient time for your online consultation with one of our registered Australian doctors.",
    details: [
      "Select from available video or phone appointments",
      "Choose a time that suits your schedule",
      "Receive confirmation and appointment reminders",
      "Join securely from any device with internet",
    ],
  },
  {
    icon: FileCheck,
    step: 4,
    title: "Medical Assessment",
    description: "During your consultation, the doctor will assess your suitability for nicotine pouches.",
    details: [
      "Discuss your health goals and nicotine needs",
      "Review your medical history with the doctor",
      "Receive personalized medical advice",
      "Doctor determines if prescription is appropriate",
    ],
  },
  {
    icon: ShoppingBag,
    step: 5,
    title: "Prescription & Product Access",
    description: "If approved, your prescription unlocks access to our product shop within your platform.",
    details: [
      "Prescription issued electronically and securely",
      "Product shop unlocked based on your prescription",
      "View only products matching your prescription limits",
      "Add items to cart within approved quantities",
    ],
  },
  {
    icon: Truck,
    step: 6,
    title: "Delivery to Your Door",
    description: "Complete your order and receive your nicotine pouches via secure delivery.",
    details: [
      "Checkout with secure payment processing",
      "Products shipped under Personal Importation Scheme",
      "Track your order status in your dashboard",
      "Discreet packaging for your privacy",
    ],
  },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="gradient-section py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground">
              Our simple, secure process takes you from sign-up to delivery in just a few steps. 
              Here's everything you need to know about accessing nicotine pouches through NicoPatch.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {detailedSteps.map((step, index) => (
              <div 
                key={step.step}
                className={`relative flex gap-6 md:gap-8 pb-12 ${
                  index < detailedSteps.length - 1 ? "border-l-2 border-border ml-6 md:ml-8" : "ml-6 md:ml-8"
                }`}
              >
                {/* Step Number Circle */}
                <div className="absolute -left-8 md:-left-10 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold shadow-lg">
                  {step.step}
                </div>

                {/* Content */}
                <div className="pl-8 md:pl-12">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                      {step.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Importation Scheme Info */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl border border-border p-8 md:p-10 shadow-lg">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    About the Personal Importation Scheme
                  </h2>
                  <p className="text-muted-foreground">
                    Understanding how nicotine products are legally accessed in Australia.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  In Australia, nicotine-containing products (including nicotine pouches) require a valid 
                  prescription from a registered medical practitioner. The Therapeutic Goods Administration (TGA) 
                  allows individuals with a valid prescription to import nicotine products for personal use 
                  under the Personal Importation Scheme.
                </p>
                <p>
                  Through NicoPatch, you can consult with AHPRA-registered doctors who can assess your 
                  suitability for nicotine pouches. If clinically appropriate, they may issue a prescription 
                  that allows you to legally import and use these products.
                </p>
                <p className="text-sm italic">
                  Please note: Prescriptions are issued at the sole discretion of the prescribing doctor 
                  based on clinical assessment. Not all consultations will result in a prescription.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Ready to Begin?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start your journey today with a consultation with one of our registered doctors.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Book Your Consultation
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
