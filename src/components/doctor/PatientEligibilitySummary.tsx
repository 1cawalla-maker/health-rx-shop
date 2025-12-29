import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ClipboardList, AlertTriangle } from 'lucide-react';
import { getPatientEligibilityQuiz } from '@/services/eligibilityService';
import { generateEligibilitySummary, type EligibilityQuizResult, type EligibilitySummary } from '@/types/eligibility';

interface PatientEligibilitySummaryProps {
  patientId: string;
}

export function PatientEligibilitySummary({ patientId }: PatientEligibilitySummaryProps) {
  const [quizData, setQuizData] = useState<EligibilityQuizResult | null>(null);
  const [summary, setSummary] = useState<EligibilitySummary | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuizData() {
      setLoading(true);
      const data = await getPatientEligibilityQuiz(patientId);
      if (data) {
        setQuizData(data);
        setSummary(generateEligibilitySummary(data.answers));
      }
      setLoading(false);
    }
    
    if (patientId) {
      fetchQuizData();
    }
  }, [patientId]);

  if (loading) {
    return null;
  }

  if (!quizData || !summary) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No pre-consultation questionnaire on file</p>
        </CardContent>
      </Card>
    );
  }

  const hasWarnings = quizData.result === 'may_not_suitable';

  return (
    <Card className={hasWarnings ? 'border-warning/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Pre-Consultation Questionnaire
          </CardTitle>
          {hasWarnings && (
            <Badge variant="outline" className="border-warning text-warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Review Required
            </Badge>
          )}
        </div>
        <CardDescription>
          Completed on {new Date(quizData.completedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Nicotine Usage</p>
            <p className="font-medium">{summary.intensity}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Current Use</p>
            <p className="font-medium">{summary.currentUse}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Prior NRT Use</p>
            <p className="font-medium">{summary.priorNRTUse}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Safety Flags</p>
            <p className={`font-medium ${summary.safetyFlags !== 'None declared' ? 'text-warning' : ''}`}>
              {summary.safetyFlags}
            </p>
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>View Full Responses</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            <div className="space-y-3 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Nicotine Use</span>
                <span className="font-medium">{summary.currentUse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous NRT Experience</span>
                <span className="font-medium">{summary.priorNRTUse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Intensity</span>
                <span className="font-medium">{summary.intensity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason for Seeking Pouches</span>
                <span className="font-medium text-right max-w-[60%]">{summary.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medical Safety Check</span>
                <span className={`font-medium ${summary.safetyFlags !== 'None declared' ? 'text-warning' : ''}`}>
                  {summary.safetyFlags}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-muted-foreground mb-2">Consents Given:</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Understands nicotine risk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    No prescription guarantee
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Agrees to doctor discussion
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
