import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { getPatientEligibilityQuiz } from '@/services/eligibilityService';
import { generateEligibilitySummary, type EligibilityQuizResult } from '@/types/eligibility';

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

  const summary = useMemo(() => {
    if (!result) return null;
    return generateEligibilitySummary(result.answers);
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

        {result && summary ? (
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

            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-muted-foreground mb-2">Smoking / nicotine history</p>
              <ul className="space-y-1">
                <DetailRow label="Age" value={summary.age} />
                <DetailRow label="Smoker declaration" value={summary.smokerStatus} />
                <DetailRow label="Reason for assessment" value={summary.smokingGoal} />
                <DetailRow label="Smoking history" value={summary.smokingHistory} />
                <DetailRow label="Previous cessation methods" value={summary.previousCessation} />
              </ul>
            </div>

            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-muted-foreground mb-2">Medical / oral-health review</p>
              <ul className="space-y-1">
                <DetailRow label="Medical screens" value={summary.medicalRisk} />
                <DetailRow label="Current medicines/products" value={summary.medicines} />
                <DetailRow label="Dental/oral health" value={summary.oralHealth} />
              </ul>
            </div>

            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-muted-foreground mb-2">Pouch request context</p>
              <ul className="space-y-1">
                <DetailRow label="Pouch history" value={summary.pouchUse} />
                <DetailRow label="Requested strength range" value={summary.requestedPouchRange} />
                <DetailRow label="Daily pouch quantity" value={summary.dailyPouchQuantity} />
                <DetailRow label="Quit/reduce timeline" value={summary.quitPouchesTimeline} />
              </ul>
            </div>

          </>
        ) : (
          <p className="text-muted-foreground">No quiz results on file for this patient.</p>
        )}
      </CardContent>
    </Card>
  );
}
