import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ClipboardList, AlertTriangle } from 'lucide-react';
import { getPatientEligibilityQuiz } from '@/services/eligibilityService';
import { generateEligibilitySummarySections, type EligibilityQuizResult } from '@/types/eligibility';

interface PatientEligibilitySummaryProps {
  patientId: string;
}

export function PatientEligibilitySummary({ patientId }: PatientEligibilitySummaryProps) {
  const [quizData, setQuizData] = useState<EligibilityQuizResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuizData() {
      setLoading(true);
      const data = await getPatientEligibilityQuiz(patientId);
      setQuizData(data);
      setLoading(false);
    }

    if (patientId) {
      void fetchQuizData();
    }
  }, [patientId]);

  const sections = useMemo(() => {
    if (!quizData) return [];
    return generateEligibilitySummarySections(quizData.answers, quizData.riskFlags || []);
  }, [quizData]);

  if (loading) return null;

  if (!quizData || !sections.length) {
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
  const headlineSections = sections.slice(0, 3);
  const detailSections = sections.slice(3);

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
          Completed on {new Date(quizData.completedAt).toLocaleDateString('en-AU')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 text-sm">
          {headlineSections.map((section) => (
            <section key={section.title} className="rounded-lg border bg-muted/30 p-3">
              <h4 className="font-medium mb-2">{section.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields.map((field) => (
                  <div key={`${section.title}-${field.label}`} className="space-y-1">
                    <p className="text-muted-foreground">{field.label}</p>
                    <p className="font-medium whitespace-pre-wrap">{field.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>View medical review and GP attention points</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {detailSections.map((section) => (
              <section key={section.title} className="rounded-lg border bg-muted/30 p-3 text-sm">
                <h4 className="font-medium mb-2">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map((field) => (
                    <div key={`${section.title}-${field.label}`} className="space-y-1">
                      <p className="text-muted-foreground">{field.label}</p>
                      <p className="font-medium whitespace-pre-wrap">{field.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
