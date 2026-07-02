import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo, { SITE_ORIGIN } from '@/components/seo/Seo';
import { breadcrumbSchema, serviceSchema, webPageSchema } from '@/components/seo/schema';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PATH = '/guides';

const guides = [
  {
    title: 'Nicotine pouches in Australia: prescription process explained',
    description: 'General information about prescription requirements and the controlled access pathway.',
    to: '/guides/nicotine-pouches-australia',
  },
  {
    title: 'Are nicotine pouches legal in Australia?',
    description: 'A plain-English overview of legality and process questions.',
    to: '/guides/are-nicotine-pouches-legal-in-australia',
  },
  {
    title: 'How to get nicotine pouches in Australia',
    description: 'A process-led guide to eligibility, clinical review, prescription requirements, and gated access.',
    to: '/guides/how-to-get-nicotine-pouches-in-australia',
  },
  {
    title: 'Personal Importation Scheme: general information',
    description: 'General information about process questions and why requirements matter.',
    to: '/guides/personal-importation-scheme-nicotine-pouches',
  },
  {
    title: 'Nicotine pouch strengths: 3mg, 6mg, 9mg',
    description: 'General information about strength terminology and why practitioner/prescription limits matter.',
    to: '/guides/nicotine-pouch-strength-3mg-6mg-9mg',
  },
  {
    title: 'ZYN Australia',
    description: 'A careful, process-led explainer for people searching brand-specific questions.',
    to: '/guides/zyn-australia',
  },
  {
    title: 'ZYN vs other nicotine pouches',
    description: 'General category information without product-shopping or guaranteed-access framing.',
    to: '/guides/zyn-vs-other-nicotine-pouches',
  },
  {
    title: 'Nicotine pouches vs vaping',
    description: 'A general information guide about category differences and why clinical advice matters.',
    to: '/guides/nicotine-pouches-vs-vaping',
  },
  {
    title: 'How PouchCare works',
    description: 'Eligibility, clinical booking, GP assessment, prescription-gated ordering, and fulfilment support.',
    to: '/how-it-works',
  },
];

export default function GuidesIndex() {
  return (
    <PublicLayout>
      <Seo
        title="Guides | Nicotine Pouch Access and Prescription Process in Australia"
        description="Process-led guides about nicotine pouch access, prescription requirements, legality questions, and PouchCare’s eligibility-first pathway."
        canonicalPath={PATH}
        ogImagePath="/og/guides.png"
        ogType="website"
        jsonLd={[
          webPageSchema({ url: `${SITE_ORIGIN}${PATH}`, name: 'Guides', description: 'Process-led guides about nicotine pouch access, prescription requirements, legality questions, and PouchCare’s eligibility-first pathway.', dateModified: '2026-07-02', siteOrigin: SITE_ORIGIN }),
          serviceSchema({ url: `${SITE_ORIGIN}${PATH}`, name: 'PouchCare process education', description: 'General information about nicotine pouch access in Australia, prescription requirements, eligibility, and prescription-gated pathways.', providerUrl: SITE_ORIGIN }),
          breadcrumbSchema({ items: [{ name: 'Home', url: `${SITE_ORIGIN}/` }, { name: 'Guides', url: `${SITE_ORIGIN}${PATH}` }] }),
          { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${SITE_ORIGIN}${PATH}#collection`, name: 'Guides', url: `${SITE_ORIGIN}${PATH}`, inLanguage: 'en-AU' },
          { '@context': 'https://schema.org', '@type': 'ItemList', '@id': `${SITE_ORIGIN}${PATH}#itemlist`, itemListOrder: 'https://schema.org/ItemListOrderUnordered', numberOfItems: guides.length, itemListElement: guides.map((g, idx) => ({ '@type': 'ListItem', position: idx + 1, name: g.title, url: `${SITE_ORIGIN}${g.to}` })) },
        ]}
      />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--pc-bg-soft-blue))_0%,hsl(var(--background))_52%,hsl(var(--pc-sky))_100%)] py-16 md:py-24">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <BookOpen className="h-4 w-4" />
              Process-led education
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-6xl">Guides for understanding the pathway.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              General information for eligible Australian adults researching nicotine pouch access, prescription requirements, legality questions, and PouchCare’s controlled pathway.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="lg" asChild className="rounded-2xl">
                <Link to="/start-consult">Start eligibility check</Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild className="rounded-2xl bg-white/80">
                <Link to="/how-it-works">How PouchCare works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Link key={g.to} to={g.to} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary">{g.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{g.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Read guide <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-primary/10 bg-primary/5 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">General information only</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    These guides are not medical or legal advice and do not guarantee prescription, ordering access, product availability, supplier availability, importation outcome, or delivery.
                  </p>
                </div>
              </div>
              <Button variant="hero-outline" asChild className="rounded-2xl bg-white/80 md:shrink-0">
                <Link to="/faq">Read FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
