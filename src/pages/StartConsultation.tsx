import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo from "@/components/seo/Seo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getQuizFromSession, persistQuizToProfile } from "@/services/eligibilityService";
import { halaxyConsultationService } from "@/services/halaxyConsultationService";
import type { PrepareHalaxyConsultResponse } from "@/types/halaxy";

export default function StartConsultation() {
  const { user, loading } = useAuth();
  const [preparing, setPreparing] = useState(false);
  const [response, setResponse] = useState<PrepareHalaxyConsultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let cancelled = false;
    const run = async () => {
      setPreparing(true);
      setError(null);
      try {
        if (getQuizFromSession()) {
          await persistQuizToProfile(user.id);
        }

        const res = await halaxyConsultationService.prepareConsult();
        if (cancelled) return;
        setResponse(res);
        if (res.bookingUrl) {
          window.location.assign(res.bookingUrl);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not prepare consultation booking.");
      } finally {
        if (!cancelled) setPreparing(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (!loading && !user) {
    return <Navigate to="/phone-login?role=patient&next=/patient/start-consult" replace />;
  }

  return (
    <PublicLayout>
      <Seo title="Preparing Consultation" description="Preparing your PouchCare consultation booking." canonicalPath="/start-consult" noIndex />
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Preparing your consultation</CardTitle>
              <CardDescription>
                We are linking your intake to your patient account and preparing the clinic booking step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(loading || preparing || response?.bookingUrl) && !error ? (
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{response?.bookingUrl ? "Opening Halaxy booking…" : "Preparing booking…"}</span>
                </div>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not continue to booking</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {response && !response.bookingUrl && !error ? (
                <Alert>
                  <AlertTitle>Consult request captured</AlertTitle>
                  <AlertDescription>
                    {response.message || "Your consult request has been saved. Clinic booking setup is pending."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {error ? (
                  <>
                    <Button onClick={() => window.location.reload()}>Try again</Button>
                    <Button asChild variant="outline">
                      <Link to="/eligibility">Complete questionnaire</Link>
                    </Button>
                  </>
                ) : null}
                <Button asChild variant="outline">
                  <Link to="/patient/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
