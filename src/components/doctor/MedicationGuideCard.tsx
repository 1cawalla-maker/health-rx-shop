import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill } from 'lucide-react';

export function MedicationGuideCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication Guide
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
          <p className="font-medium">What the patient can order</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Prescription sets a <strong>maximum strength</strong> (3mg / 6mg / 9mg).</li>
            <li>Patient may order the allowed max strength or step down (never higher).</li>
            <li>Each prescription covers <strong>3 months</strong> supply.</li>
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
      </CardContent>
    </Card>
  );
}
