import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@nicopatch.com.au",
    description: "We'll respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "1800 NICO 123",
    description: "Mon-Fri, 9am-5pm AEST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Melbourne, VIC",
    description: "Australia",
  },
  {
    icon: Clock,
    title: "Support Hours",
    value: "9am - 5pm AEST",
    description: "Monday to Friday",
  },
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Message sent successfully! We'll get back to you soon.");
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="gradient-section py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We're here to help. Reach out and our team will get back to you 
              as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="How can we help?" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your inquiry..." 
                      rows={5}
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Our support team is available to assist you with any questions about our 
                    telehealth services, consultations, or orders.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {contactInfo.map((item) => (
                    <div 
                      key={item.title}
                      className="bg-card rounded-xl border border-border p-6 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-primary font-medium">
                        {item.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    Medical Emergencies
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For medical emergencies, please call 000 or visit your nearest emergency 
                    department. NicoPatch is not an emergency medical service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
