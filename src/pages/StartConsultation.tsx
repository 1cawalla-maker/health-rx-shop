import { Link } from "react-router-dom";
import { Clock, FileText } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StartConsultation() {
  return (
    <PublicLayout>
      <Seo
        title="Consultations coming soon | PouchCare"
        description="PouchCare consultation requests are coming soon. Existing prescription uploads remain available for review."
        canonicalPath="/start-consult"
        noIndex
      />

      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-3xl">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="font-display text-3xl md:text-4xl">Consultations coming soon</CardTitle>
                <CardDescription className="mt-3 text-base md:text-lg">
                  We’re not taking new consultation requests through the website right now.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Existing prescription uploads are still available for review. Ordering access remains prescription-gated and only unlocks after review and approval.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/phone-login?role=patient&mode=signup&next=/patient/upload-prescription">
                    <FileText className="mr-2 h-5 w-5" />
                    Upload existing prescription
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
