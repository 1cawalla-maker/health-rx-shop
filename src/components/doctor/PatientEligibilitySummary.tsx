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
      void fetchQuizData();
    }
  }, [patientId]);

  if (loading) return null;

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

  const hasWarnings = (quizData.riskFlags || []).length > 0;

  return (
    <Card className={hasWarnings ? 'border-warning/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            PouchCare Intake Summary
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Smoker declaration</p>
            <p className="font-medium">{summary.smokerStatus}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Reason for assessment</p>
            <p className="font-medium">{summary.smokingGoal}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Requested strength range</p>
            <p className="font-medium">{summary.requestedPouchRange}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Daily pouch quantity</p>
            <p className="font-medium">{summary.dailyPouchQuantity}</p>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>View GP intake details</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            <div className="space-y-3 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground">Smoking history</p>
                <p className="font-medium">{summary.smokingHistory}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Previous cessation methods</p>
                <p className="font-medium">{summary.previousCessation}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Medical screens</p>
                <p className="font-medium">{summary.medicalRisk}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current medicines/products</p>
                <p className="font-medium whitespace-pre-wrap">{summary.medicines}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dental/oral health</p>
                <p className="font-medium">{summary.oralHealth}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pouch use</p>
                <p className="font-medium">{summary.pouchUse}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quit/reduce timeline</p>
                <p className="font-medium">{summary.quitPouchesTimeline}</p>
              </div>

            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
