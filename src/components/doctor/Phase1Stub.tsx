import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function DoctorPhase1Stub(props: {
  title: string;
  description?: string;
  notes?: string[];
}) {
  const { title, description, notes } = props;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Phase 1 Stub (Doctor Portal)
          </CardTitle>
          <CardDescription>
            The doctor portal backend (Supabase tables, PDF generation, and file access) will be enabled in Phase 2.
            Phase 1 keeps the UI shell but disables backend operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This is intentional to avoid shipping partially-secured medical workflows (Storage/RLS/edge functions) before
            Phase 2 hardening.
          </p>
          {notes?.length ? (
            <ul className="list-disc list-inside space-y-1">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
