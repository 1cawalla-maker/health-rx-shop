import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eligibilityQuizService } from '@/services/eligibilityQuizService';
import { ClipboardList } from 'lucide-react';

export function EligibilityQuizCard(props: { patientId: string }) {
  const { patientId } = props;
  const result = eligibilityQuizService.getLatestResult(patientId);

  const badge = (() => {
    if (!result) return <Badge variant="outline">No quiz</Badge>;
    if (result.result === 'eligible') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Eligible</Badge>;
    if (result.result === 'may_not_suitable') return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Needs review</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Not eligible</Badge>;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Eligibility Quiz
        </CardTitle>
        <CardDescription>Phase 1: derived from local quiz responses (if completed)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Status</div>
          {badge}
        </div>

        {result ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Completed</div>
              <div className="font-medium">{new Date(result.completedAt).toLocaleString('en-AU')}</div>
            </div>

            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-muted-foreground mb-2">Summary</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Nicotine use: <strong>{result.answers.nicotine_use}</strong></li>
                <li>Intensity: <strong>{result.answers.nicotine_intensity}</strong></li>
                <li>Reason: <strong>{result.answers.pouch_reason}{result.answers.pouch_reason === 'other' && result.answers.pouch_reason_other ? ` (${result.answers.pouch_reason_other})` : ''}</strong></li>
                <li>Medical safety: <strong>{result.answers.medical_safety}</strong></li>
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
