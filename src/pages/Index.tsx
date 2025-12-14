import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ClipboardCheck, 
  Package, 
  Shield, 
  UserCheck, 
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Book a Consultation",
    description: "Schedule an online video or phone consultation with a registered Australian doctor.",
  },
  {
    icon: ClipboardCheck,
    title: "Medical Assessment",
    description: "Your doctor will review your health history and determine if nicotine pouches are right for you.",
  },
  {
    icon: UserCheck,
    title: "Receive Prescription",
    description: "If clinically appropriate, your doctor will issue a prescription through our secure platform.",
  },
  {
    icon: Package,
    title: "Order Products",
    description: "Access our product shop and order eligible nicotine pouches under the Personal Importation Scheme.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Doctor Supervised",
    description: "All prescriptions issued by AHPRA-registered Australian doctors.",
  },
  {
    icon: Clock,
    title: "Quick & Convenient",
    description: "Consultations from the comfort of your home, no travel required.",
  },
  {
    icon: CheckCircle,
    title: "Fully Compliant",
    description: "Operating legally under Australia's Personal Importation Scheme.",
  },
];

export default function Index() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-section">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <Shield className="h-4 w-4" />
              <span>Trusted Australian Telehealth Service</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in-up">
              Your Path to{" "}
              <span className="text-gradient">Nicotine Pouches</span>{" "}
              Starts Here
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
              Consult with registered Australian doctors online. If clinically appropriate, 
              receive a prescription and access nicotine pouches legally under the Personal Importation Scheme.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-200">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Start Consultation
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
              Consultations from $49 AUD • No commitment required
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              A simple, secure process from consultation to doorstep delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative group"
              >
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="font-display text-4xl font-bold text-muted-foreground/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-border">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 gradient-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose NicoPatch?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We combine the convenience of telehealth with the oversight of registered medical 
                professionals to provide a safe, legal pathway to nicotine pouches in Australia.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-6 shadow-glow">
                    <Shield className="h-10 w-10" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground mb-2">
                    100% Australian
                  </p>
                  <p className="text-muted-foreground">
                    AHPRA-registered doctors and TGA-compliant processes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Book your consultation today and take the first step towards accessing 
              nicotine pouches through our secure, doctor-supervised platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl" 
                className="bg-background text-primary hover:bg-background/90 shadow-lg"
                asChild
              >
                <Link to="/auth?mode=signup">
                  Start Your Consultation
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link to="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
