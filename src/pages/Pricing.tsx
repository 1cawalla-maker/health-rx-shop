import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, serviceSchema, webPageSchema } from "@/components/seo/schema";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react";

const consultationFeatures = [
  "15-30 minute phone consultation",
  "Assessment by AHPRA-registered doctor",
  "Review of your medical history",
  "Personalized medical advice",
  "Prescription if clinically appropriate",
  "Follow-up support via messaging",
];

const productInfo = [
  {
    title: "Nicotine Pouches",
    description: "Various brands and strengths available based on your prescription.",
    priceRange: "See current pricing in the shop",
  },
];

export default function Pricing() {
  return (
    <PublicLayout>
      <Seo
        title="Pricing: Zyn Australia & Nicotine Pouches Consultation Cost"
        description="See consultation pricing and how costs work for nicotine pouches in Australia. Product prices and shipping are shown during checkout."
        canonicalPath="/pricing"
        ogImagePath="/placeholder.svg"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}/pricing`,
            name: 'Pricing',
            description:
              'See consultation pricing and how costs work for nicotine pouches in Australia. Product prices and shipping are shown during checkout.',
            dateModified: '2026-03-30',
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Pricing', url: `${SITE_ORIGIN}/pricing` },
            ],
          }),
          serviceSchema({
            url: `${SITE_ORIGIN}/pricing`,
            name: 'Consultation pricing',
            description:
              'Consultation pricing and how costs work for nicotine pouches in Australia, including products and shipping at checkout.',
            providerUrl: SITE_ORIGIN,
          }),
        ]}
      />
      {/* Hero Section */}
      <section className="gradient-section py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Pay only for your consultation. Products are priced separately based on your prescription needs.
            </p>
          </div>
        </div>
      </section>

      {/* Consultation Pricing */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Consultation Card */}
              <div className="bg-card rounded-2xl border-2 border-primary shadow-lg overflow-hidden">
                <div className="bg-primary p-6 text-center">
                  <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">
                    Doctor Consultation
                  </h2>
                  <p className="text-primary-foreground/80 text-sm">
                    One-time consultation fee
                  </p>
                </div>
                <div className="p-6 md:p-8">
                  <div className="text-center mb-8">
                    <span className="font-display text-5xl font-bold text-foreground">$49</span>
                    <span className="text-muted-foreground ml-2">AUD</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {consultationFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <Link to="/auth?mode=signup">
                      Book Consultation
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Follow-up Card */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-secondary p-6 text-center">
                  <h2 className="font-display text-2xl font-bold text-secondary-foreground mb-2">
                    Follow-up Consultation
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    For existing patients
                  </p>
                </div>
                <div className="p-6 md:p-8">
                  <div className="text-center mb-8">
                    <span className="font-display text-5xl font-bold text-foreground">$29</span>
                    <span className="text-muted-foreground ml-2">AUD</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">10-15 minute follow-up session</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Prescription renewal if appropriate</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Dosage adjustments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Progress check and support</span>
                    </li>
                  </ul>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/auth">
                      Log In to Book
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pricing Info */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Product Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Products are priced separately and available only after prescription approval.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              {productInfo.map((product, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-semibold text-primary">
                      {product.priceRange}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <HelpCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    Product availability and pricing depend on your prescription details. 
                    Shipping costs are calculated at checkout based on your location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Helpful Guides */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Helpful guides</h2>
            <p className="text-lg text-muted-foreground">
              Want quick answers before booking? These guides cover legality, access, and comparisons.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2">
            <Link
              to="/guides/zyn-australia"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">Zyn in Australia</p>
              <p className="text-sm text-muted-foreground mt-1">Legality, access, and next steps.</p>
            </Link>

            <Link
              to="/guides/nicotine-pouches-australia"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">Nicotine pouches in Australia</p>
              <p className="text-sm text-muted-foreground mt-1">How prescriptions, delivery, and ordering work.</p>
            </Link>

            <Link
              to="/guides/how-to-get-nicotine-pouches-in-australia"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">How to get nicotine pouches</p>
              <p className="text-sm text-muted-foreground mt-1">Step-by-step from questionnaire to consult.</p>
            </Link>

            <Link
              to="/guides/nicotine-pouches-vs-vaping"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">Nicotine pouches vs vaping</p>
              <p className="text-sm text-muted-foreground mt-1">Key differences and considerations.</p>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/eligibility">
                Start Consultation
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
