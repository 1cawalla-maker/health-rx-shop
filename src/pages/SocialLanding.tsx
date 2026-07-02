import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo, { SITE_ORIGIN } from "@/components/seo/Seo";
import { breadcrumbSchema, webPageSchema } from "@/components/seo/schema";

const PATH = "/start";

const checks = [
  "Eligibility-first pathway",
  "Clinical review where relevant",
  "No guaranteed prescription",
  "Prescription-gated ordering only",
];

export default function SocialLanding() {
  return (
    <PublicLayout>
      <Seo
        title="Start PouchCare | Eligibility-first online pathway"
        description="A focused starting page for eligible Australian adults to understand the PouchCare pathway and begin eligibility."
        canonicalPath={PATH}
        ogImagePath="/og/home.png"
        ogType="website"
        jsonLd={[
          webPageSchema({
            url: `${SITE_ORIGIN}${PATH}`,
            name: "Start PouchCare",
            description: "A focused starting page for eligible Australian adults to understand the PouchCare pathway and begin eligibility.",
            dateModified: "2026-07-02",
            siteOrigin: SITE_ORIGIN,
          }),
          breadcrumbSchema({ items: [{ name: "Home", url: `${SITE_ORIGIN}/` }, { name: "Start", url: `${SITE_ORIGIN}${PATH}` }] }),
        ]}
      />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--pc-bg-soft-blue))_0%,hsl(var(--background))_50%,hsl(var(--pc-sky))_100%)] py-10 md:py-16">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-info/15 blur-3xl animate-blob animation-delay-500" />
        <div className="container relative grid min-h-[calc(100svh-4rem)] items-center gap-10 md:grid-cols-[1fr_0.92fr] lg:gap-16">
          <div className="max-w-2xl space-y-7 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              A clearer way to start
            </div>
            <div className="space-y-5">
              <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Check the pathway before anything else.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                PouchCare is not open online retail. Start with eligibility, continue to clinical review where relevant, and only access ordering where prescription requirements are met.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="xl" asChild className="rounded-2xl shadow-glow">
                <Link to="/start-consult">Start eligibility check <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild className="rounded-2xl bg-white/80">
                <Link to="/how-it-works">See steps</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {checks.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in-up animation-delay-200">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-info/10 to-white blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-2xl shadow-primary/10">
              <img src="/images/pouchcare-doctor-hero-blue.jpg" alt="PouchCare online pathway" className="aspect-[4/5] w-full rounded-[1.5rem] object-cover object-center" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur animate-float-slow">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">Prescription-gated by design</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">No prescription means no nicotine pouch ordering through PouchCare.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container max-w-3xl text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">General information only</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            PouchCare does not guarantee a prescription, product access, stock, supplier availability, importation outcome, customs outcome, or delivery timeframe.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
