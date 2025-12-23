import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Shield,
  Info
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; flag?: 'warning' | 'block' }[];
}

const questions: Question[] = [
  {
    id: 'age',
    question: 'Are you 18 years of age or older?',
    options: [
      { value: 'yes', label: 'Yes, I am 18 or older' },
      { value: 'no', label: 'No, I am under 18', flag: 'block' }
    ]
  },
  {
    id: 'nicotine_use',
    question: 'What is your current or past nicotine use?',
    options: [
      { value: 'current_smoker', label: 'I currently smoke cigarettes' },
      { value: 'former_smoker', label: 'I used to smoke but have quit' },
      { value: 'current_vaper', label: 'I currently use vapes or e-cigarettes' },
      { value: 'other_nicotine', label: 'I use other nicotine products' },
      { value: 'never', label: 'I have never used nicotine products', flag: 'warning' }
    ]
  },
  {
    id: 'quit_intention',
    question: 'Are you looking to reduce or quit smoking/vaping?',
    options: [
      { value: 'quit', label: 'Yes, I want to quit entirely' },
      { value: 'reduce', label: 'Yes, I want to reduce my usage' },
      { value: 'switch', label: 'I want to switch to a less harmful option' },
      { value: 'no', label: 'No, I am not looking to change my habits' }
    ]
  },
  {
    id: 'pregnancy',
    question: 'Are you pregnant, breastfeeding, or planning to become pregnant?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes', flag: 'warning' }
    ]
  },
  {
    id: 'heart_condition',
    question: 'Do you have any heart conditions, high blood pressure, or have had a stroke?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes_managed', label: 'Yes, but it is well managed with medication' },
      { value: 'yes_unmanaged', label: 'Yes, and it is not well controlled', flag: 'warning' }
    ]
  },
  {
    id: 'diabetes',
    question: 'Do you have diabetes?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes_managed', label: 'Yes, but it is well managed' },
      { value: 'yes_unmanaged', label: 'Yes, and it is not well controlled', flag: 'warning' }
    ]
  },
  {
    id: 'australian_resident',
    question: 'Are you an Australian resident with a valid Australian address?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No', flag: 'block' }
    ]
  }
];

export default function EligibilityQuiz() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'suitable' | 'may_not_suitable' | 'not_eligible' | null>(null);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    const selectedOption = currentQuestion.options.find(
      opt => opt.value === answers[currentQuestion.id]
    );
    
    // Check for blocking conditions
    if (selectedOption?.flag === 'block') {
      setResult('not_eligible');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate result
      const hasWarnings = questions.some(q => {
        const answer = answers[q.id];
        const option = q.options.find(opt => opt.value === answer);
        return option?.flag === 'warning';
      });
      
      setResult(hasWarnings ? 'may_not_suitable' : 'suitable');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  const handleContinueToBooking = () => {
    // Store quiz responses in sessionStorage for later association with user record
    sessionStorage.setItem('eligibility_responses', JSON.stringify({
      answers,
      result,
      completedAt: new Date().toISOString()
    }));
    navigate('/auth?mode=signup&from=eligibility');
  };

  if (result) {
    return (
      <PublicLayout>
        <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
          <div className="container max-w-2xl">
            {result === 'not_eligible' ? (
              <Card className="border-destructive/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">Not Eligible at This Time</CardTitle>
                  <CardDescription className="text-base">
                    Based on your responses, you are not eligible for our service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Why am I not eligible?</AlertTitle>
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
            ) : result === 'may_not_suitable' ? (
              <Card className="border-warning/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                      <AlertTriangle className="h-8 w-8 text-warning" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">You May Still Be Suitable</CardTitle>
                  <CardDescription className="text-base">
                    Based on your responses, there are some factors that require a doctor's assessment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>What does this mean?</AlertTitle>
                    <AlertDescription>
                      Some of your answers indicate conditions that require careful consideration by a doctor. 
                      You can still proceed with booking a consultation, and the doctor will make a clinical 
                      decision based on your full medical history.
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-muted border-muted">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Disclaimer:</strong> This questionnaire is for screening purposes only and does not 
                      constitute medical advice. A qualified doctor will assess your suitability during your consultation.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-4 justify-center pt-4">
                    <Button variant="outline" onClick={handleStartOver}>
                      Start Over
                    </Button>
                    <Button onClick={handleContinueToBooking}>
                      Continue to Book
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-success/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">You Appear Likely to Be Suitable</CardTitle>
                  <CardDescription className="text-base">
                    Based on your responses, you may be a good candidate for nicotine pouch therapy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Next Steps:</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">1</span>
                        Create an account or log in
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">2</span>
                        Complete your medical intake form
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">3</span>
                        Book a 1-hour consultation slot
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">4</span>
                        Speak with a doctor by phone
                      </li>
                    </ol>
                  </div>
                  <Alert className="bg-muted border-muted">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Disclaimer:</strong> This questionnaire is for screening purposes only and does not 
                      constitute medical advice. Final suitability will be determined by a qualified doctor 
                      during your consultation.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-4 justify-center pt-4">
                    <Button variant="outline" asChild>
                      <Link to="/">Return Home</Link>
                    </Button>
                    <Button onClick={handleContinueToBooking}>
                      Continue to Book
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 gradient-section min-h-[70vh]">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Check Your Eligibility
            </h1>
            <p className="text-muted-foreground">
              Answer a few quick questions to see if nicotine pouch therapy might be suitable for you.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  Question {currentStep + 1} of {questions.length}
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
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestion.options.map(option => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="flex-1 cursor-pointer py-2"
                    >
                      {option.label}
                    </Label>
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
                  {currentStep === questions.length - 1 ? 'See Results' : 'Next'}
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
