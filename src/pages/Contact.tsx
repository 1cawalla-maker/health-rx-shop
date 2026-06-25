import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, contactPageSchema, serviceSchema } from "@/components/seo/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Clock } from "lucide-react";
import type { FormEvent } from "react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@pouchcare.com.au",
    description: "We'll respond within 24 hours",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Gold Coast, QLD",
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement | null)?.value.trim() || "";
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement | null)?.value.trim() || "";
    const email = (form.elements.namedItem("email") as HTMLInputElement | null)?.value.trim() || "";
    const subject = (form.elements.namedItem("subject") as HTMLInputElement | null)?.value.trim() || "PouchCare support enquiry";
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement | null)?.value.trim() || "";

    const body = [
      `Name: ${firstName} ${lastName}`.trim(),
      `Email: ${email}`,
      "",
      message,
    ].join("\n");

    window.location.href = `mailto:support@pouchcare.com.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <PublicLayout>
      <Seo
        title="Contact PouchCare"
        description="Contact the PouchCare team for help with consultations, prescriptions, and ordering nicotine pouches in Australia."
        canonicalPath="/contact"
        ogImagePath="/og/contact.png"
        ogType="website"
        jsonLd={[
          contactPageSchema({
            url: `${SITE_ORIGIN}/contact`,
            name: 'Contact',
            description:
              'Contact the PouchCare team for help with consultations, prescriptions, and ordering nicotine pouches in Australia.',
            dateModified: '2026-03-30',
          }),
          breadcrumbSchema({
            items: [
              { name: 'Home', url: `${SITE_ORIGIN}/` },
              { name: 'Contact', url: `${SITE_ORIGIN}/contact` },
            ],
          }),
          serviceSchema({
            url: `${SITE_ORIGIN}/contact`,
            name: 'Customer support',
            description:
              'Customer support for PouchCare consultations and ordering questions.',
            providerUrl: SITE_ORIGIN,
          }),
        ]}
      />
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
                        name="firstName"
                        placeholder="John" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        placeholder="Doe" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email" 
                      placeholder="john@example.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject"
                      name="subject"
                      placeholder="How can we help?" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      name="message"
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
                  >
                    Open Email
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
                    department. PouchCare is not an emergency medical service.
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
