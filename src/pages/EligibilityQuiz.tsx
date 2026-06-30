import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Seo from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Info,
  UserPlus,
  Loader2,
  Stethoscope
} from 'lucide-react';
import {
  eligibilityQuestions,
  consentItems,
  saveQuizToSession,
  calculateQuizResult,
  calculateQuizRiskFlags
} from '@/services/eligibilityService';
import {
  ELIGIBILITY_COLLECTION_NOTICE_VERSION,
  ELIGIBILITY_PRIVACY_POLICY_VERSION,
  type EligibilityAnswers,
  type EligibilityQuizResult
} from '@/types/eligibility';
import { toast } from 'sonner';

export default function EligibilityQuiz() {
  const navigate = useNavigate();
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<EligibilityAnswers>>({});
  const [textAnswers, setTextAnswers] = useState<Partial<Record<keyof EligibilityAnswers, string>>>({});
  const [finalConsentAccepted, setFinalConsentAccepted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [blockedUnder21, setBlockedUnder21] = useState(false);

  const visibleQuestions = eligibilityQuestions.filter(question => !question.showWhen || question.showWhen(answers));
  const totalSteps = visibleQuestions.length + 2; // collection notice + questions + acknowledgement
  const currentQuestion = visibleQuestions[currentStep];
  const progress = showNotice ? 5 : showConsent ? 100 : ((currentStep + 2) / totalSteps) * 100;

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      return { ...prev, [currentQuestion.id]: value };
    });
  };

  const handleMultiAnswer = (value: string, checked: boolean) => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const current = Array.isArray(prev[currentQuestion.id]) ? prev[currentQuestion.id] as string[] : [];
      const exclusiveOptions = currentQuestion.exclusiveOptions || [];
      const isExclusive = exclusiveOptions.includes(value);
      let nextValues = checked
        ? isExclusive
          ? [value]
          : [...current.filter(item => !exclusiveOptions.includes(item)), value]
        : current.filter(item => item !== value);

      nextValues = Array.from(new Set(nextValues));

      return { ...prev, [currentQuestion.id]: nextValues };
    });
  };

  const currentSelectedOption = currentQuestion?.options?.find(opt => opt.value === answers[currentQuestion.id]);
  const currentTextKey = currentSelectedOption?.textAnswerKey;
  const currentTextValue = currentTextKey ? (textAnswers[currentTextKey] || '') : '';
  const currentQuestionTextValue = currentQuestion ? (textAnswers[currentQuestion.id] || '') : '';

  const handleNext = () => {
    if (!currentQuestion) return;

    if (currentQuestion.inputType === 'text') {
      if (currentQuestion.textRequired && !currentQuestionTextValue.trim()) {
        toast.error('Please provide the requested details before continuing.');
        return;
      }
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: currentQuestionTextValue.trim() }));
    } else if (currentQuestion.inputType === 'multi') {
      const values = answers[currentQuestion.id];
      if (!Array.isArray(values) || values.length === 0) {
        toast.error('Please select at least one option before continuing.');
        return;
      }
      const selectedTextOptions = currentQuestion.options?.filter(option => option.textRequired && values.includes(option.value)) || [];
      for (const option of selectedTextOptions) {
        if (option.textAnswerKey && !textAnswers[option.textAnswerKey]?.trim()) {
          toast.error('Please provide the requested details before continuing.');
          return;
        }
      }
      const extraTextEntries = selectedTextOptions.reduce<Partial<EligibilityAnswers>>((acc, option) => {
        if (option.textAnswerKey) {
          return { ...acc, [option.textAnswerKey]: textAnswers[option.textAnswerKey]?.trim() || undefined };
        }
        return acc;
      }, {});
      setAnswers(prev => ({ ...prev, ...extraTextEntries }));
    }

    if (currentSelectedOption?.textRequired && currentTextKey && !currentTextValue.trim()) {
      toast.error('Please provide the requested details before continuing.');
      return;
    }

    if (currentSelectedOption?.flag === 'block') {
      setBlockedUnder21(true);
      return;
    }

    if (currentTextKey) {
      setAnswers(prev => ({ ...prev, [currentTextKey]: currentTextValue.trim() }));
    }

    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowConsent(true);
    }
  };

  const handleBack = () => {
    if (showConsent) {
      setShowConsent(false);
    } else if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setShowNotice(true);
    }
  };

  const handleStartOver = () => {
    setNoticeAccepted(false);
    setShowNotice(true);
    setCurrentStep(0);
    setAnswers({});
    setTextAnswers({});
    setFinalConsentAccepted(false);
    setComplete(false);
    setShowConsent(false);
    setBlockedUnder21(false);
  };

  const handleSubmitConsent = async () => {
    if (!finalConsentAccepted) return;

    const fullAnswers: EligibilityAnswers = {
      ...(answers as EligibilityAnswers),
      collection_notice_acknowledged: true,
      collection_notice_version: ELIGIBILITY_COLLECTION_NOTICE_VERSION,
      privacy_policy_version: ELIGIBILITY_PRIVACY_POLICY_VERSION,
      previous_cessation_methods_other: textAnswers.previous_cessation_methods_other || answers.previous_cessation_methods_other,
      allergies_reactions_details: textAnswers.allergies_reactions_details || answers.allergies_reactions_details,
      pouch_max_strength_other: textAnswers.pouch_max_strength_other || answers.pouch_max_strength_other,
      pouch_min_strength_other: textAnswers.pouch_min_strength_other || answers.pouch_min_strength_other,
      final_truth_accuracy_contact_consent: finalConsentAccepted
    };

    const quizData: EligibilityQuizResult = {
      answers: fullAnswers,
      result: calculateQuizResult(fullAnswers),
      riskFlags: calculateQuizRiskFlags(fullAnswers),
      completedAt: new Date().toISOString(),
      noticeVersion: ELIGIBILITY_COLLECTION_NOTICE_VERSION,
      privacyPolicyVersion: ELIGIBILITY_PRIVACY_POLICY_VERSION
    };

    setIsSaving(true);
    const sessionId = await saveQuizToSession(quizData);
    setIsSaving(false);

    if (!sessionId) {
      toast.error('We could not save your questionnaire. Please try again.');
      return;
    }

    setComplete(true);
  };

  const handleContinueToSignup = () => {
    navigate('/phone-login?role=patient&mode=signup&next=/patient/dashboard');
  };

  if (blockedUnder21) {
    return (
      <PublicLayout>
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            <Card className="border-destructive/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Unable to Continue Online</CardTitle>
                <CardDescription className="text-base">
                  PouchCare’s nicotine pouch pathway is only available to patients aged 21 and over.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>If you need support</AlertTitle>
                  <AlertDescription>
                    Please speak with your GP, pharmacist, Quitline or another appropriate health professional about approved smoking cessation options.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-4 justify-center pt-4">
                  <Button variant="outline" onClick={handleStartOver}>Start Over</Button>
                  <Button asChild><Link to="/">Return Home</Link></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (complete) {
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
                  Thanks — continue to create your account and book a doctor consultation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-muted border-muted">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This questionnaire does not approve treatment or guarantee a prescription. A qualified doctor will review your information during the consultation.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleContinueToSignup} className="h-auto py-4 gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create Account & Book Consultation
                  </Button>
                  <Button variant="outline" onClick={handleStartOver}>Start Over</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (showNotice) {
    return (
      <PublicLayout>
        <Seo
          title="Pre‑Consultation Questionnaire"
          description="Read the collection notice before answering health questions for a PouchCare telehealth consultation."
          canonicalPath="/eligibility"
          ogType="website"
          noIndex
        />
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Collection notice</span>
                  <span className="text-sm font-medium text-primary">Before we begin</span>
                </div>
                <Progress value={progress} className="h-2" />
                <CardTitle className="text-2xl mt-6">Before you answer health questions</CardTitle>
                <CardDescription>
                  PouchCare needs to collect sensitive health information so a doctor can assess your request during a telehealth consultation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Collection Notice and Privacy Policy</AlertTitle>
                  <AlertDescription className="space-y-3 mt-2">
                    <p>We collect your questionnaire answers, contact/account details and consultation information to arrange care, support doctor assessment, manage prescriptions or fulfilment if clinically appropriate, meet safety/legal obligations and operate the service.</p>
                    <p>Your information may be shared with doctors, pharmacy/fulfilment partners, service providers and regulators where required. You can read more in our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
                    <p>This questionnaire is not medical advice and does not guarantee a prescription, treatment, supply or importation approval.</p>
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <Checkbox
                    id="noticeAccepted"
                    checked={noticeAccepted}
                    onCheckedChange={(checked) => setNoticeAccepted(checked === true)}
                  />
                  <Label htmlFor="noticeAccepted" className="text-sm leading-relaxed cursor-pointer">
                    I have read and understood the Collection Notice and Privacy Policy, and consent to PouchCare collecting and using my sensitive health information for these purposes.
                  </Label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setShowNotice(false)} disabled={!noticeAccepted}>
                    Start Questionnaire
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (showConsent) {
    return (
      <PublicLayout>
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Final Acknowledgement</h1>
              <p className="text-muted-foreground">Please confirm before continuing to account creation.</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Final step</span>
                  <span className="text-sm font-medium text-primary">100% complete</span>
                </div>
                <Progress value={100} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    A doctor will make any clinical decision. This form only collects information for the consultation.
                  </AlertDescription>
                </Alert>

                {consentItems.map(item => (
                  <div key={item.id} className="flex items-start space-x-3 rounded-lg border p-4">
                    <Checkbox
                      id={item.id}
                      checked={finalConsentAccepted}
                      onCheckedChange={(checked) => setFinalConsentAccepted(checked === true)}
                    />
                    <Label htmlFor={item.id} className="text-sm leading-relaxed cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack} disabled={isSaving}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmitConsent} disabled={!finalConsentAccepted || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Continue
                    {!isSaving ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Seo
        title="Pre‑Consultation Questionnaire"
        description="Answer a few questions to help a doctor assess your request during a telehealth consultation."
        canonicalPath="/eligibility"
        ogType="website"
        noIndex
      />
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Pre-Consultation Questionnaire</h1>
            <p className="text-muted-foreground">Answer a few questions to help the doctor understand your needs.</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Question {currentStep + 1} of {visibleQuestions.length}</span>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
                {currentQuestion.description && <p className="text-sm text-muted-foreground mt-2">{currentQuestion.description}</p>}
              </div>

              {currentQuestion.inputType === 'text' ? (
                <div className="space-y-2">
                  {currentQuestion.textInputLabel && <Label className="text-sm text-muted-foreground">{currentQuestion.textInputLabel}</Label>}
                  <Textarea
                    placeholder={currentQuestion.textInputPlaceholder || 'Please provide details...'}
                    value={textAnswers[currentQuestion.id] || ''}
                    onChange={(e) => setTextAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    className="min-h-32"
                  />
                </div>
              ) : currentQuestion.inputType === 'multi' ? (
                <div className="space-y-3">
                  {(currentQuestion.options || []).map(option => {
                    const selected = Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as string[]).includes(option.value);
                    const textKey = option.textAnswerKey;
                    return (
                      <div key={option.value}>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`${currentQuestion.id}-${option.value}`}
                            checked={selected}
                            onCheckedChange={(checked) => handleMultiAnswer(option.value, checked === true)}
                          />
                          <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer py-2">
                            {option.label}
                          </Label>
                        </div>
                        {option.showTextInput && selected && textKey && (
                          <div className="ml-6 mt-2 space-y-2">
                            {option.textInputLabel && <Label className="text-xs text-muted-foreground">{option.textInputLabel}</Label>}
                            <Textarea
                              placeholder={option.textInputPlaceholder || 'Please specify...'}
                              value={textAnswers[textKey] || ''}
                              onChange={(e) => setTextAnswers(prev => ({ ...prev, [textKey]: e.target.value }))}
                              className="min-h-24"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  value={answers[currentQuestion.id] as string || ''}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {(currentQuestion.options || []).map(option => {
                    const textKey = option.textAnswerKey;
                    return (
                      <div key={option.value}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                          <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer py-2">
                            {option.label}
                          </Label>
                        </div>
                        {option.showTextInput && answers[currentQuestion.id] === option.value && textKey && (
                          <div className="ml-6 mt-2 space-y-2">
                            {option.textInputLabel && <Label className="text-xs text-muted-foreground">{option.textInputLabel}</Label>}
                            <Textarea
                              placeholder={option.textInputPlaceholder || 'Please specify...'}
                              value={textAnswers[textKey] || ''}
                              onChange={(e) => setTextAnswers(prev => ({ ...prev, [textKey]: e.target.value }))}
                              className="min-h-24"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={
                    currentQuestion.inputType === 'text'
                      ? !textAnswers[currentQuestion.id]?.trim()
                      : !answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as string[]).length === 0)
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This questionnaire is for consultation preparation only and does not constitute medical advice.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
