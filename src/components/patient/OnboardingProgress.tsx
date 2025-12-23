import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  className?: string;
}

export function OnboardingProgress({ steps, className }: OnboardingProgressProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                step.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : step.current
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {step.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-1 whitespace-nowrap",
                step.completed || step.current
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 mx-2 mt-[-1rem]",
                step.completed ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
