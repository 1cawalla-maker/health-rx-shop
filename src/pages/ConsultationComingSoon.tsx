import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ConsultationComingSoon() {
  return (
    <PublicLayout>
      <Seo
        title="Consultations coming soon | Pouch Care"
        description="Pouch Care consultations are temporarily unavailable while we update our booking pathway."
        canonicalPath="/start-consult"
        noIndex
      />
      <section className="bg-gradient-hero py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/80 bg-white/95 p-8 text-center shadow-2xl shadow-primary/10 md:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Coming soon</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Consultations are temporarily unavailable
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
              We’re updating the Pouch Care booking pathway. New eligibility checks and consultation bookings will be available again soon.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-2xl">
                <Link to="/contact">Contact support</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
