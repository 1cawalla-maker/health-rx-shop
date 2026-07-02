import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, serviceSchema, webPageSchema } from "@/components/seo/schema";

const processSteps = [
  {
    icon: ClipboardCheck,
    title: "Start with eligibility",
    description: "A guided first step helps eligible Australian adults understand whether the pathway may be relevant before anything else happens.",
  },
  {
    icon: CalendarCheck,
    title: "Book clinical review",
    description: "Where relevant, continue through the existing booking flow for clinician or GP assessment. No outcome is guaranteed.",
  },
  {
    icon: FileCheck,
    title: "Prescription only if appropriate",
    description: "A prescription is only issued by the practitioner if clinically appropriate after assessment.",
  },
  {
    icon: LockKeyhole,
    title: "Prescription-gated access",
    description: "Ordering can only unlock when prescription entitlement requirements are met and verified by PouchCare.",
  },
];

const trustCards = [
  {
    title: "Australian pathway",
    description: "Built around eligibility, clinical review where relevant, and controlled access requirements.",
  },
  {
    title: "Privacy-conscious",
    description: "Designed for careful handling of eligibility, account, prescription, and order information.",
  },
  {
    title: "No open catalogue",
    description: "Public pages stay process-led rather than presenting nicotine pouch products as ordinary ecommerce.",
  },
];

const learnLinks = [
  {
    title: "Nicotine pouches in Australia",
    description: "Understand the prescription-gated pathway and why public ecommerce is not the right framing.",
    to: "/guides/nicotine-pouches-australia",
  },
  {
    title: "Are nicotine pouches legal?",
    description: "A plain-English guide to the access process and important limitations.",
    to: "/guides/are-nicotine-pouches-legal-in-australia",
  },
  {
    title: "How PouchCare works",
    description: "Eligibility, clinical booking, practitioner assessment, upload, verification, and gated ordering.",
    to: "/how-it-works",
  },
];

const disclaimer =
  "General information only. Not medical or legal advice. PouchCare does not guarantee a prescription, product access, stock, supplier availability, importation outcome, customs outcome, or delivery timeframe.";

export default function Index() {
  return (
    <PublicLayout>
      <Seo
        title="PouchCare | Eligibility-first online pathway for Australians"
        description="A clear eligibility-first online pathway for Australian adults, clinical review where relevant, and prescription-gated ordering only where requirements are met."
        canonicalPath="/"
        ogImagePath="/og/home.png"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}/`,
            name: "PouchCare | Eligibility-first online pathway for Australians",
            description:
              "A clear eligibility-first online pathway for Australian adults, clinical review where relevant, and prescription-gated ordering only where requirements are met.",
            dateModified: "2026-07-02",
            siteOrigin: SITE_ORIGIN,
          }),
          serviceSchema({
            url: `${SITE_ORIGIN}/`,
            name: "PouchCare: eligibility-first online pathway",
            description:
              "PouchCare helps eligible Australian adults start with eligibility, continue to clinical booking where relevant, and access prescription-gated ordering only if requirements are met.",
            providerUrl: SITE_ORIGIN,
          }),
          breadcrumbSchema({ items: [{ name: "Home", url: `${SITE_ORIGIN}/` }] }),
        ]}
      />

      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,hsl(var(--pc-bg-soft-blue))_0%,hsl(var(--background))_45%,hsl(var(--pc-sky))_100%)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-info/15 blur-3xl animate-blob animation-delay-500" />

        <div className="container relative py-4 pb-24 md:grid md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-10 md:py-16 lg:gap-16">
          <div className="md:hidden">
            <div className="relative -mx-8 -mt-4 h-[310px] overflow-hidden bg-primary">
              <img
                src="/images/pouchcare-doctor-hero-blue.jpg"
                alt="PouchCare online clinical pathway visual"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="relative z-10 -mt-6 rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl shadow-primary/10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><ShieldCheck className="h-4 w-4" /> Eligibility first</div>
              <div className="space-y-3">
                <h1 className="font-display text-[2.35rem] font-bold leading-[0.98] tracking-tight text-foreground">
                  Start with a clearer clinical pathway.
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Check eligibility, then continue to clinical review where relevant. Ordering only unlocks if prescription requirements are met.
                </p>
              </div>

              <div className="mt-5 grid gap-2">
                <Button variant="hero" size="lg" asChild className="rounded-2xl shadow-glow">
                  <Link to="/start-consult">
                    Start eligibility check
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="rounded-2xl text-primary hover:bg-primary/5 hover:text-primary">
                  <Link to="/how-it-works">How it works</Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              {["No guaranteed prescription", "Prescription-gated ordering", "Privacy-conscious support"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden max-w-2xl space-y-7 animate-fade-in-up md:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Eligibility-first Australian telehealth pathway
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground lg:text-6xl">
                A clearer path through eligibility and clinical review.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Start with eligibility, continue to clinical review where relevant, and only access ordering where prescription requirements are met.
              </p>
            </div>

            <div className="flex flex-row gap-3">
              <Button variant="hero" size="xl" asChild className="rounded-2xl bg-primary px-7 shadow-glow sm:px-9">
                <Link to="/start-consult">
                  Start eligibility check
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild className="rounded-2xl border-primary/20 bg-white/80 px-7 sm:px-9">
                <Link to="/how-it-works">How it works</Link>
              </Button>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                "No guaranteed prescription",
                "Prescription-gated ordering",
                "Privacy-conscious support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-3 shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="max-w-xl text-xs leading-6 text-muted-foreground">{disclaimer}</p>
          </div>

          <div className="relative hidden w-full max-w-lg animate-fade-in-up animation-delay-200 md:block md:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-info/10 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-2 shadow-2xl shadow-primary/10 md:rounded-[2rem] md:p-3">
              <img
                src="/images/pouchcare-doctor-hero-blue.jpg"
                alt="PouchCare online clinical pathway visual"
                className="aspect-[16/11] w-full rounded-[1.25rem] object-cover object-center md:aspect-[4/5] md:rounded-[1.5rem]"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur animate-float-slow">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">Organised from the first step</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Clear next steps, careful wording, and a pathway designed around eligibility and review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-white/80 py-5">
        <div className="container grid gap-3 text-center text-sm font-medium text-muted-foreground sm:grid-cols-3">
          <span>Australian adults only</span>
          <span>Clinical review where relevant</span>
          <span>Prescription-gated access only</span>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">How the pathway works</p>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Simple steps, strict gates.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The experience is designed to be clear for patients while keeping clinical assessment and prescription requirements in the right order.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="group relative rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-4xl font-bold text-primary/15">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,hsl(var(--pc-bg-soft-blue))_0%,hsl(var(--background))_100%)] py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Why it feels different</p>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Healthcare-style clarity, not open online retail.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Public PouchCare pages should explain the pathway without product hype, strength/flavour promotion, or guaranteed outcomes. The aim is trust, compliance-readiness, and a smoother handoff into booking and verification.
            </p>
            <Button variant="hero-outline" size="lg" asChild className="rounded-2xl bg-white/80">
              <Link to="/faq">Read common questions</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {trustCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-sm backdrop-blur">
                <h3 className="font-display text-lg font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary">Learn before you proceed</p>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Understand the process first.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              If you are researching nicotine pouch access in Australia, start with process, prescription requirements, and limitations — not product claims.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {learnLinks.map((link) => (
              <Link key={link.to} to={link.to} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="font-display text-xl font-bold text-foreground group-hover:text-primary">{link.title}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 pb-28 text-primary-foreground md:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-2xl shadow-primary/20 backdrop-blur md:p-12">
            <h2 className="font-display text-3xl font-bold md:text-5xl">Ready to check the pathway?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-primary-foreground/80 md:text-lg">
              Start with eligibility and continue through the existing booking flow where relevant. A prescription is never guaranteed.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="xl" asChild className="rounded-2xl bg-white text-primary hover:bg-white/90">
                <Link to="/start-consult">Start eligibility check</Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="rounded-2xl border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/contact">Contact support</Link>
              </Button>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-xs leading-6 text-primary-foreground/70">{disclaimer}</p>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/40 bg-white/90 p-3 shadow-2xl backdrop-blur md:hidden">
        <Button variant="hero" size="lg" asChild className="w-full rounded-2xl">
          <Link to="/start-consult">Start eligibility check</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}
