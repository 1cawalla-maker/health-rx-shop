import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Info } from 'lucide-react';

// Phase 1: UI-only guide to support consistent prescribing discussions.
// Keep neutral, non-promotional, and avoid making clinical claims.

export function MedicationGuideCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication Guide (Phase 1)
        </CardTitle>
        <CardDescription>
          Quick reference to support a consistent consultation. This is not clinical decision support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Phone consult</Badge>
          <Badge variant="outline">Australia</Badge>
          <Badge variant="outline">Nicotine pouches</Badge>
        </div>

        <div className="space-y-2">
          <p className="font-medium">What the patient can order (shop gating)</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Prescription sets a <strong>maximum strength</strong> (3mg / 6mg / 9mg).</li>
            <li>Patient may order the allowed max strength or step down (never higher).</li>
            <li>Each prescription covers <strong>3 months</strong> supply (Personal Importation Scheme context).</li>
            <li>Maximum allowance is <strong>60 cans total</strong> per prescription.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Consult workflow reminders</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Confirm relevant history and discuss risks/expectations.</li>
            <li>Issue prescription only if clinically appropriate.</li>
            <li>If not issuing, record a brief reason.</li>
          </ul>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <p className="text-muted-foreground">
            Phase 2 will replace this with a richer workflow (PDF generation, secure storage, audit logs, and role-based access).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
