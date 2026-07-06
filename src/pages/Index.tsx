import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  LockKeyhole,
  ShieldCheck,
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
    title: "Doctor consultation pathway",
    description: "Eligible adults can move from online eligibility into clinical review where relevant. A prescription is never guaranteed.",
  },
  {
    title: "From $10 per can",
    description: "Where ordering is unlocked, pouch pricing starts from $10 per can, subject to prescription entitlement, stock, supplier availability, and checkout requirements.",
  },
  {
    title: "Overseas supplier with a variety of treatment options",
    description: "Fulfilment support can involve a broader prescription-gated supplier pathway after prescription requirements are met and PouchCare checks are complete.",
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

const testimonialVideos = [
  "/videos/testimonials/pouchcare-review-01.mp4",
  "/videos/testimonials/pouchcare-review-02.mp4",
  "/videos/testimonials/pouchcare-review-03.mp4",
  "/videos/testimonials/pouchcare-review-04.mp4",
  "/videos/testimonials/pouchcare-review-05.mp4",
];

function BreathingLungsVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm rounded-[2rem] border border-white/80 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--pc-sky))_0%,white_54%,hsl(var(--pc-bg-soft-blue))_100%)] p-6 shadow-2xl shadow-primary/10">
      <div className="absolute inset-5 rounded-[1.5rem] border border-primary/10" />
      <div className="absolute left-6 top-6 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">Smoke-free alternative pathway</div>
      <svg viewBox="0 0 260 260" role="img" aria-label="Animated breathing lung outline" className="relative z-10 h-full w-full">
        <defs>
          <filter id="lungGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.02 0 0 0 0 0.32 0 0 0 0 1 0 0 0 0.28 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#lungGlow)">
          <g className="animate-lung-breathe">
            <path d="M119 91 C101 78 76 80 59 102 C42 124 34 154 36 181 C38 211 55 231 81 232 C107 233 119 206 121 177 C123 151 115 124 119 91 Z" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinejoin="round" />
            <path d="M141 91 C159 78 184 80 201 102 C218 124 226 154 224 181 C222 211 205 231 179 232 C153 233 141 206 139 177 C137 151 145 124 141 91 Z" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinejoin="round" />
          </g>
          <g className="animate-lung-breathe" fill="none" stroke="hsl(var(--primary) / 0.72)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M130 34 C130 61 130 83 130 104" strokeWidth="8" />
            <path d="M130 104 C119 113 109 125 101 141" />
            <path d="M101 141 C88 151 78 166 72 184" />
            <path d="M101 141 C96 160 97 181 103 202" />
            <path d="M101 141 C82 137 66 145 56 160" />
            <path d="M130 104 C141 113 151 125 159 141" />
            <path d="M159 141 C172 151 182 166 188 184" />
            <path d="M159 141 C164 160 163 181 157 202" />
            <path d="M159 141 C178 137 194 145 204 160" />
          </g>
          <g className="animate-lung-breathe" fill="none" stroke="hsl(var(--pc-cyan) / 0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path className="animate-air-thread" d="M130 46 C130 68 130 84 130 104" />
            <path className="animate-air-thread animation-delay-200" d="M116 118 C100 132 86 153 78 187" />
            <path className="animate-air-thread animation-delay-300" d="M106 139 C91 141 73 148 61 164" />
            <path className="animate-air-thread animation-delay-400" d="M144 118 C160 132 174 153 182 187" />
            <path className="animate-air-thread animation-delay-500" d="M154 139 C169 141 187 148 199 164" />
          </g>
        </g>
        <circle cx="130" cy="135" r="100" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="14" />
      </svg>
    </div>
  );
}

export default function Index() {
  return (
    <PublicLayout>
      <Seo
        title="PouchCare | Nicotine pouch access pathway for eligible Australians"
        description="A nicotine pouch access pathway for eligible Australian adults with eligibility checks, doctor consultation where relevant, prescription-gated ordering, and supplier fulfilment support where requirements are met."
        canonicalPath="/"
        ogImagePath="/og/home.png"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}/`,
            name: "PouchCare | Nicotine pouch access pathway for eligible Australians",
            description:
              "A nicotine pouch access pathway for eligible Australian adults with eligibility checks, doctor consultation where relevant, prescription-gated ordering, and supplier fulfilment support where requirements are met.",
            dateModified: "2026-07-02",
            siteOrigin: SITE_ORIGIN,
          }),
          serviceSchema({
            url: `${SITE_ORIGIN}/`,
            name: "PouchCare: nicotine pouch access pathway",
            description:
              "PouchCare helps eligible Australian adults start with eligibility, continue to doctor consultation where relevant, and access prescription-gated nicotine pouch ordering only if requirements are met.",
            providerUrl: SITE_ORIGIN,
          }),
          breadcrumbSchema({ items: [{ name: "Home", url: `${SITE_ORIGIN}/` }] }),
        ]}
      />

      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,hsl(var(--pc-bg-soft-blue))_0%,hsl(var(--background))_45%,hsl(var(--pc-sky))_100%)]">
        <div className="absolute inset-x-0 top-0 hidden h-32 bg-gradient-to-b from-white/80 to-transparent md:block" />
        <div className="absolute -left-24 top-20 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-blob md:block" />
        <div className="absolute -right-24 bottom-10 hidden h-80 w-80 rounded-full bg-info/15 blur-3xl animate-blob animation-delay-500 md:block" />

        <div className="container relative py-4 pb-2 md:grid md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-10 md:py-16 lg:gap-16">
          <div className="md:hidden">
            <div className="relative -mx-8 -mt-4 h-[310px] overflow-hidden bg-primary">
              <img
                src="/images/pouchcare-doctor-hero-blue.jpg"
                alt="PouchCare online clinical pathway visual"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="relative z-10 mt-4 rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl shadow-primary/10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><ShieldCheck className="h-4 w-4" /> Eligibility first</div>
              <div className="space-y-3">
                <h1 className="font-display text-[2.35rem] font-bold leading-[0.98] tracking-tight text-foreground">
                  Alternative Smoking Cessation Care.
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Quit smoking the way you prefer. Discuss your cessation plans with our practitioners and begin your journey for $10 per can.
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
              {["Online doctors consultation", "Overseas supplier with a variety of treatment options", "Guaranteed prescription fulfilment"].map((item) => (
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
              Guaranteed Australian fulfilment with a prescription
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground lg:text-6xl">
                Alternative Smoking Cessation Care.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Quit smoking the way you prefer. Discuss your cessation plans with our practitioners and begin your journey for $10 per can.
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
                "Online doctors consultation",
                "Overseas supplier with a variety of treatment options",
                "Guaranteed prescription fulfilment",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-3 shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </div>

          <div className="relative hidden w-full max-w-lg animate-fade-in-up animation-delay-200 md:block md:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-info/10 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-2 shadow-2xl shadow-primary/10 md:rounded-[2rem] md:p-3">
              <img
                src="/images/pouchcare-doctor-hero-blue.jpg"
                alt="PouchCare online clinical pathway visual"
                className="aspect-[16/11] w-full rounded-[1.25rem] object-cover object-center md:aspect-[4/5] md:rounded-[1.5rem]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--pc-bg-soft-blue))_100%)] py-3 md:py-20">
        <div className="container flex justify-center">
          <BreathingLungsVisual />
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
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Nicotine pouches, with the gates in the right order.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              PouchCare can support eligible adults looking for a smoke-free alternative pathway, but it is not open online retail. Doctor consultation, prescription entitlement, supplier availability, and fulfilment checks all matter before ordering access can happen.
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

      <section className="overflow-hidden bg-background py-14 md:py-20">
        <div className="container">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Join Thousands of Other Aussies</h2>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent md:w-12" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent md:w-12" />
          <div className="flex w-max gap-3 animate-testimonial-marquee md:gap-4">
            {[...testimonialVideos, ...testimonialVideos].map((src, index) => (
              <div key={`${src}-${index}`} className="w-28 shrink-0 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white p-1.5 shadow-xl shadow-primary/10 sm:w-32 md:w-36 md:rounded-[1.7rem]">
                <video
                  src={src}
                  className="aspect-[9/16] w-full rounded-[1rem] object-cover md:rounded-[1.25rem]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  preload="auto"
                  aria-label={`PouchCare customer review video ${((index % testimonialVideos.length) + 1)}`}
                />
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

      <section className="bg-primary py-16 text-primary-foreground md:py-20">
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

          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
