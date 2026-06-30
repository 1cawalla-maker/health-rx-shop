import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { getPatientEligibilityQuiz } from '@/services/eligibilityService';
import { generateEligibilitySummarySections, type EligibilityQuizResult } from '@/types/eligibility';

function DetailRow(props: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted-foreground">{props.label}</span>
      <strong className="text-right max-w-[65%] whitespace-pre-wrap">{props.value || '—'}</strong>
    </li>
  );
}

export function EligibilityQuizCard(props: { patientId: string }) {
  const { patientId } = props;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityQuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!patientId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getPatientEligibilityQuiz(patientId);
        if (!mounted) return;
        setResult(res);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load pre-consultation questionnaire');
        setResult(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => { mounted = false; };
  }, [patientId]);

  const badge = (() => {
    if (loading) return <Badge variant="outline">Loading…</Badge>;
    if (!result) return <Badge variant="outline">No quiz</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
  })();

  const sections = useMemo(() => {
    if (!result) return [];
    return generateEligibilitySummarySections(result.answers, result.riskFlags || []);
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          PouchCare Intake Summary
        </CardTitle>
        <CardDescription>Relevant pre-consultation answers for GP review</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Status</div>
          {badge}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Completed</div>
              <div className="font-medium">{result.completedAt ? new Date(result.completedAt).toLocaleString('en-AU') : '—'}</div>
            </div>

            {result.riskFlags?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-medium mb-1">Review flags</p>
                <p className="text-xs break-words">{result.riskFlags.join(', ')}</p>
              </div>
            ) : null}

            {sections.map((section) => (
              <div key={section.title} className="border rounded-lg p-3 bg-muted/30">
                <p className="text-muted-foreground mb-2">{section.title}</p>
                <ul className="space-y-1">
                  {section.fields.map((field) => (
                    <DetailRow key={`${section.title}-${field.label}`} label={field.label} value={field.value} />
                  ))}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground">No quiz results on file for this patient.</p>
        )}
      </CardContent>
    </Card>
  );
}
