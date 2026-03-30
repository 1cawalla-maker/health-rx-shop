import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { getPatientEligibilityQuiz, eligibilityQuestions } from '@/services/eligibilityService';
import type { EligibilityQuizResult } from '@/types/eligibility';

function labelForAnswer(questionId: string, value: any, otherText?: string): string {
  const q = eligibilityQuestions.find((qq) => qq.id === questionId);
  const opt = q?.options?.find((o) => o.value === value);
  if (value === undefined || value === null || value === '') return '—';
  if (value === 'other' && otherText) return `${opt?.label || String(value)} (${otherText})`;
  return opt?.label || String(value);
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
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load eligibility quiz');
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
    if (result.result === 'eligible') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Eligible</Badge>;
    if (result.result === 'may_not_suitable') return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Needs review</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Not eligible</Badge>;
  })();

  const summary = useMemo(() => {
    if (!result) return null;
    const a: any = result.answers || {};
    return {
      nicotine_use: labelForAnswer('nicotine_use', a.nicotine_use),
      previous_nrt_use: labelForAnswer('previous_nrt_use', a.previous_nrt_use),
      nicotine_intensity: labelForAnswer('nicotine_intensity', a.nicotine_intensity),
      pouch_reason: labelForAnswer('pouch_reason', a.pouch_reason, a.pouch_reason_other),
      medical_safety: labelForAnswer('medical_safety', a.medical_safety),
      age_confirmation: labelForAnswer('age_confirmation', a.age_confirmation),
      consent_nicotine_risk: a.consent_nicotine_risk === true ? 'Yes' : a.consent_nicotine_risk === false ? 'No' : '—',
      consent_no_guarantee: a.consent_no_guarantee === true ? 'Yes' : a.consent_no_guarantee === false ? 'No' : '—',
      consent_doctor_discussion: a.consent_doctor_discussion === true ? 'Yes' : a.consent_doctor_discussion === false ? 'No' : '—',
    };
  }, [result]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Eligibility Quiz
        </CardTitle>
        <CardDescription>Derived from patient quiz responses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Status</div>
          {badge}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Completed</div>
              <div className="font-medium">{result.completedAt ? new Date(result.completedAt).toLocaleString('en-AU') : '—'}</div>
            </div>

            {summary && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-muted-foreground mb-2">Answers</p>
                <ul className="space-y-1">
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Nicotine use</span><strong className="text-right">{summary.nicotine_use}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Previous NRT</span><strong className="text-right">{summary.previous_nrt_use}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Intensity</span><strong className="text-right">{summary.nicotine_intensity}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Reason</span><strong className="text-right">{summary.pouch_reason}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Medical safety</span><strong className="text-right">{summary.medical_safety}</strong></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">Age</span><strong className="text-right">{summary.age_confirmation}</strong></li>
                </ul>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-muted-foreground mb-2">Consents</p>
                  <ul className="space-y-1">
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Nicotine risk</span><strong className="text-right">{summary.consent_nicotine_risk}</strong></li>
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">No guarantee</span><strong className="text-right">{summary.consent_no_guarantee}</strong></li>
                    <li className="flex justify-between gap-3"><span className="text-muted-foreground">Doctor discussion</span><strong className="text-right">{summary.consent_doctor_discussion}</strong></li>
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
