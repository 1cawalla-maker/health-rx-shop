import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { aboutPageSchema, serviceSchema } from "@/components/seo/schema";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Heart, Users, Award } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "Every prescription is issued by AHPRA-registered doctors following strict clinical guidelines.",
  },
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description: "We prioritize your health outcomes and provide ongoing support throughout your journey.",
  },
  {
    icon: Users,
    title: "Accessibility",
    description: "Making healthcare accessible to Australians regardless of location through telehealth.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Committed to the highest standards of medical practice and patient experience.",
  },
];

const doctors = [
  {
    name: "Dr. Sarah Mitchell",
    title: "Medical Director",
    qualifications: "MBBS, FRACGP",
    bio: "Dr. Mitchell brings over 15 years of experience in general practice with a special interest in harm reduction and smoking cessation. She leads our clinical team and ensures all protocols meet the highest standards.",
  },
  {
    name: "Dr. James Chen",
    title: "Senior Consulting Physician",
    qualifications: "MBBS, MPH",
    bio: "With a background in public health and primary care, Dr. Chen is passionate about leveraging telehealth to improve health outcomes for patients across Australia.",
  },
  {
    name: "Dr. Emma Thompson",
    title: "Consulting Physician",
    qualifications: "MBBS, Dip RACGP",
    bio: "Dr. Thompson specializes in patient education and counseling, helping individuals make informed decisions about their health and nicotine replacement options.",
  },
];

export default function About() {
  return (
    <PublicLayout>
      <Seo
        title="About NicoPatch: Doctor‑Supervised Nicotine Pouches in Australia"
        description="NicoPatch is an Australian telehealth platform connecting patients with AHPRA‑registered doctors for nicotine pouch consultations and clinically guided next steps."
        canonicalPath="/about"
        ogImagePath="/placeholder.svg"
        ogType="website"
        jsonLd={[
          aboutPageSchema({
            url: `${SITE_ORIGIN}/about`,
            name: 'About NicoPatch',
            description:
              'NicoPatch is an Australian telehealth platform connecting patients with AHPRA-registered doctors for nicotine pouch consultations and clinically guided next steps.',
            dateModified: '2026-03-29',
          }),
          serviceSchema({
            url: `${SITE_ORIGIN}/about`,
            name: 'Doctor-supervised nicotine pouch consultations',
            description:
              'An Australian telehealth service connecting patients with AHPRA-registered doctors for nicotine pouch consultations and clinically guided next steps.',
            providerUrl: SITE_ORIGIN,
          }),
        ]}
      />
      {/* Hero Section */}
      <section className="gradient-section py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              About NicoPatch
            </h1>
            <p className="text-lg text-muted-foreground">
              We're on a mission to provide Australians with safe, legal access to nicotine pouches 
              through doctor-supervised telehealth consultations.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    NicoPatch was founded with a clear purpose: to bridge the gap between 
                    Australians seeking nicotine alternatives and the medical oversight required 
                    to access them legally and safely.
                  </p>
                  <p>
                    We recognized that many people were struggling to find accessible, 
                    professional healthcare to support their transition away from traditional 
                    smoking or vaping. Our telehealth platform connects patients with registered 
                    Australian doctors who can provide thorough assessments and, when appropriate, 
                    prescriptions for nicotine pouches.
                  </p>
                  <p>
                    Today, we're proud to serve patients across Australia, providing a seamless 
                    experience from consultation to product delivery—all while maintaining the 
                    highest standards of medical care and regulatory compliance.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="font-display text-6xl font-bold text-primary mb-4">2024</p>
                    <p className="text-muted-foreground">Founded in Melbourne, Australia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Values
              </h2>
              <p className="text-lg text-muted-foreground">
                The principles that guide everything we do.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value) => (
                <div 
                  key={value.title}
                  className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Meet Our Doctors
              </h2>
              <p className="text-lg text-muted-foreground">
                AHPRA-registered medical professionals dedicated to your care.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {doctors.map((doctor) => (
                <div 
                  key={doctor.name}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-2xl font-bold">
                      {doctor.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-1">
                      {doctor.title}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {doctor.qualifications}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.bio}
                    </p>
                  </div>
                </div>
              ))}
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
              New to nicotine pouches? These guides cover common questions people search for in Australia.
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
              <p className="text-sm text-muted-foreground mt-1">How access and ordering works.</p>
            </Link>

            <Link
              to="/guides/nicotine-pouches-vs-vaping"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">Nicotine pouches vs vaping</p>
              <p className="text-sm text-muted-foreground mt-1">Key differences and considerations.</p>
            </Link>

            <Link
              to="/guides"
              className="block rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <p className="font-display text-lg font-semibold text-foreground">Browse all guides</p>
              <p className="text-sm text-muted-foreground mt-1">See the full library.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Book a consultation with one of our experienced doctors today.
            </p>
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
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
