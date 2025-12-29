import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  ArrowLeft, 
  Shield,
  Info,
  UserPlus,
  FileUp,
  XCircle,
  Stethoscope
} from 'lucide-react';
import { 
  eligibilityQuestions, 
  consentItems, 
  saveQuizToSession, 
  calculateQuizResult 
} from '@/services/eligibilityService';
import type { EligibilityAnswers, EligibilityQuizResult } from '@/types/eligibility';

export default function EligibilityQuiz() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<EligibilityAnswers>>({});
  const [otherReason, setOtherReason] = useState('');
  const [consents, setConsents] = useState({
    consent_nicotine_risk: false,
    consent_no_guarantee: false,
    consent_doctor_discussion: false
  });
  const [result, setResult] = useState<'eligible' | 'may_not_suitable' | 'not_eligible' | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  const totalSteps = eligibilityQuestions.length + 1; // +1 for consent step
  const currentQuestion = eligibilityQuestions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (value: string) => {
    if (currentQuestion) {
      setAnswers(prev => ({ 
        ...prev, 
        [currentQuestion.id]: value 
      }));
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    const selectedOption = currentQuestion.options.find(
      opt => opt.value === answers[currentQuestion.id]
    );
    
    // Check for blocking conditions immediately
    if (selectedOption?.flag === 'block') {
      setResult('not_eligible');
      return;
    }

    // If "other" is selected for reason, save the text
    if (currentQuestion.id === 'pouch_reason' && answers.pouch_reason === 'other') {
      setAnswers(prev => ({ ...prev, pouch_reason_other: otherReason }));
    }

    if (currentStep < eligibilityQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Move to consent step
      setShowConsent(true);
    }
  };

  const handleBack = () => {
    if (showConsent) {
      setShowConsent(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setAnswers({});
    setOtherReason('');
    setConsents({
      consent_nicotine_risk: false,
      consent_no_guarantee: false,
      consent_doctor_discussion: false
    });
    setResult(null);
    setShowConsent(false);
  };

  const handleSubmitConsent = () => {
    // Validate all consents are checked
    if (!consents.consent_nicotine_risk || !consents.consent_no_guarantee || !consents.consent_doctor_discussion) {
      return;
    }

    // Calculate result
    const quizResult = calculateQuizResult(answers);
    
    // Save to session storage
    const fullAnswers: EligibilityAnswers = {
      nicotine_use: answers.nicotine_use!,
      previous_nrt_use: answers.previous_nrt_use!,
      nicotine_intensity: answers.nicotine_intensity!,
      pouch_reason: answers.pouch_reason!,
      pouch_reason_other: answers.pouch_reason_other,
      medical_safety: answers.medical_safety!,
      age_confirmation: answers.age_confirmation!,
      consent_nicotine_risk: consents.consent_nicotine_risk,
      consent_no_guarantee: consents.consent_no_guarantee,
      consent_doctor_discussion: consents.consent_doctor_discussion
    };

    const quizData: EligibilityQuizResult = {
      answers: fullAnswers,
      result: quizResult,
      completedAt: new Date().toISOString()
    };

    saveQuizToSession(quizData);
    setResult(quizResult);
  };

  const handleContinueToSignup = () => {
    navigate('/auth?mode=signup&from=eligibility');
  };

  const handleUploadPrescription = () => {
    navigate('/auth?mode=signup&from=eligibility&action=upload');
  };

  const allConsentsChecked = consents.consent_nicotine_risk && 
    consents.consent_no_guarantee && 
    consents.consent_doctor_discussion;

  // Result screen
  if (result) {
    if (result === 'not_eligible') {
      return (
        <PublicLayout>
          <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
            <div className="container max-w-2xl">
              <Card className="border-destructive/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Unable to Proceed</CardTitle>
                  <CardDescription className="text-base">
                    Based on your responses, we are unable to offer our service at this time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Why am I seeing this?</AlertTitle>
                    <AlertDescription>
                      Our service is only available to Australian residents aged 18 and over. 
                      This is a legal requirement for nicotine product prescriptions in Australia.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-4 justify-center pt-4">
                    <Button variant="outline" onClick={handleStartOver}>
                      Start Over
                    </Button>
                    <Button asChild>
                      <Link to="/">Return Home</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </PublicLayout>
      );
    }

    // Eligible or may_not_suitable - show neutral outcome screen
    return (
      <PublicLayout>
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Questionnaire Complete</CardTitle>
                <CardDescription className="text-base mt-2">
                  Based on your responses, a doctor can assess whether nicotine pouches 
                  may be appropriate for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result === 'may_not_suitable' && (
                  <Alert className="border-warning/50 bg-warning/5">
                    <Info className="h-4 w-4 text-warning" />
                    <AlertTitle className="text-warning">Additional Assessment Required</AlertTitle>
                    <AlertDescription>
                      Some of your responses indicate factors that will need careful consideration 
                      by a doctor. This doesn't mean you're ineligible—it means a thorough 
                      consultation is especially important for your situation.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted/50 rounded-lg p-5 space-y-4">
                  <h4 className="font-display font-semibold text-foreground">Choose how to proceed:</h4>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button 
                      onClick={handleContinueToSignup}
                      className="h-auto py-4 flex-col gap-2"
                      variant="default"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span className="font-medium">Create Account & Book</span>
                      <span className="text-xs opacity-80 font-normal">
                        Book a consultation with a doctor
                      </span>
                    </Button>
                    
                    <Button 
                      onClick={handleUploadPrescription}
                      className="h-auto py-4 flex-col gap-2"
                      variant="outline"
                    >
                      <FileUp className="h-5 w-5" />
                      <span className="font-medium">Upload Prescription</span>
                      <span className="text-xs opacity-80 font-normal">
                        I already have a valid prescription
                      </span>
                    </Button>
                  </div>
                </div>

                <Alert className="bg-muted border-muted">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Disclaimer:</strong> This questionnaire is for pre-screening purposes only 
                    and does not constitute medical advice. A qualified doctor will make the final 
                    assessment during your consultation.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center pt-2">
                  <Button variant="ghost" onClick={handleStartOver}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Consent step
  if (showConsent) {
    return (
      <PublicLayout>
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Understanding & Consent
              </h1>
              <p className="text-muted-foreground">
                Please confirm you understand the following before proceeding.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Final Step
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(((eligibilityQuestions.length + 1) / totalSteps) * 100)}% complete
                  </span>
                </div>
                <Progress value={100} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {consentItems.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
                      <Checkbox
                        id={item.id}
                        checked={consents[item.id as keyof typeof consents]}
                        onCheckedChange={(checked) => 
                          setConsents(prev => ({ ...prev, [item.id]: checked === true }))
                        }
                        className="mt-0.5"
                      />
                      <Label 
                        htmlFor={item.id} 
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitConsent}
                    disabled={!allConsentsChecked}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center mt-6">
              This screening tool is for informational purposes only and does not constitute medical advice. 
              All clinical decisions are made by qualified doctors during your consultation.
            </p>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Question steps
  return (
    <PublicLayout>
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Pre-Consultation Questionnaire
            </h1>
            <p className="text-muted-foreground">
              Answer a few questions to help us understand your needs.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  Question {currentStep + 1} of {eligibilityQuestions.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {Math.round(progress)}% complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <CardTitle className="text-xl">
                {currentQuestion.question}
              </CardTitle>

              <RadioGroup
                value={answers[currentQuestion.id] as string || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestion.options.map(option => (
                  <div key={option.value}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label 
                        htmlFor={option.value} 
                        className="flex-1 cursor-pointer py-2"
                      >
                        {option.label}
                      </Label>
                    </div>
                    {option.showTextInput && answers[currentQuestion.id] === option.value && (
                      <div className="ml-6 mt-2">
                        <Input
                          placeholder="Please specify..."
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This screening tool is for informational purposes only and does not constitute medical advice. 
            All clinical decisions are made by qualified doctors during your consultation.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
