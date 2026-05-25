import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { getPatientEligibilityQuiz, eligibilityQuestions } from '@/services/eligibilityService';
import type { EligibilityQuizResult } from '@/types/eligibility';

function labelForAnswer(questionId: string, value: unknown, otherText?: string): string {
  const q = eligibilityQuestions.find((qq) => qq.id === questionId);
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map(item => labelForAnswer(questionId, item)).join(', ');
  }
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value);
  const opt = q?.options?.find((o) => o.value === stringValue);
  if (value === undefined || value === null || value === '') return '—';
  if (stringValue === 'other' && otherText) return `${opt?.label || stringValue} (${otherText})`;
  return opt?.label || stringValue;
}

function yesNo(value: unknown): string {
  return value === true ? 'Yes' : value === false ? 'No' : '—';
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
        setError(e instanceof Error ? e.message : 'Failed to load eligibility quiz');
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
    const a = result.answers;
    return {
      nicotine_use: labelForAnswer('nicotine_use', a.nicotine_use),
      current_pouch_strength: labelForAnswer('current_pouch_strength', a.current_pouch_strength, a.current_pouch_strength_other),
      current_pouch_daily_use: labelForAnswer('current_pouch_daily_use', a.current_pouch_daily_use),
      previous_nrt_use: labelForAnswer('previous_nrt_use', a.previous_nrt_use),
      preferred_cessation_product: labelForAnswer('preferred_cessation_product', a.preferred_cessation_product, a.preferred_cessation_product_other),
      medical_safety: labelForAnswer('medical_safety', a.medical_safety),
      current_medications: labelForAnswer('current_medications', a.current_medications),
      current_medications_details: a.current_medications_details || '—',
      age_confirmation: labelForAnswer('age_confirmation', a.age_confirmation),
      collection_notice_acknowledged: yesNo(a.collection_notice_acknowledged),
      import_compliance_acknowledgement: yesNo(a.import_compliance_acknowledgement),
    };
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Pre-Consultation Questionnaire
        </CardTitle>
        <CardDescription>Patient quiz responses stored in Supabase</CardDescription>
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
              <div className="flex items-start justify-between gap-3">
                <div className="text-muted-foreground">Internal flags</div>
                <div className="font-medium text-right">{result.riskFlags.join(', ')}</div>
              </div>
            ) : null}

            {summary && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-muted-foreground mb-2">Answers</p>
                <ul className="space-y-1">
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Nicotine use</span><strong className="text-right">{summary.nicotine_use}</strong></li>
                  {result.answers.nicotine_use?.includes('nicotine_pouches') && (
                    <>
                      <li className="flex justify-between gap-3"><span className="text-muted-foreground">Current pouch strength</span><strong className="text-right">{summary.current_pouch_strength}</strong></li>
                      <li className="flex justify-between gap-3"><span className="text-muted-foreground">Current pouch daily use</span><strong className="text-right">{summary.current_pouch_daily_use}</strong></li>
                    </>
                  )}
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Previous NRT</span><strong className="text-right">{summary.previous_nrt_use}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Preferred product</span><strong className="text-right">{summary.preferred_cessation_product}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Medical safety</span><strong className="text-right">{summary.medical_safety}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Current medicines/products</span><strong className="text-right">{summary.current_medications}</strong></li>
                  {summary.current_medications !== 'No' && (
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Medication details</span><strong className="text-right max-w-[60%]">{summary.current_medications_details}</strong></li>
                  )}
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Age</span><strong className="text-right">{summary.age_confirmation}</strong></li>
                </ul>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-muted-foreground mb-2">Acknowledgements</p>
                  <ul className="space-y-1">
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Collection notice</span><strong className="text-right">{summary.collection_notice_acknowledged}</strong></li>
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Import/compliance</span><strong className="text-right">{summary.import_compliance_acknowledgement}</strong></li>
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No quiz results on file for this patient.</p>
        )}
      </CardContent>
    </Card>
  );
}
