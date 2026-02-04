// Dev Prescription Toggle - For testing prescription gating
// Visibility: import.meta.env.DEV OR URLSearchParams.get('dev') === '1'
// Never visible in prod without URL param

import { Button } from '@/components/ui/button';

interface DevPrescriptionToggleProps {
  onCreatePrescription: (maxStrengthMg: 3 | 6 | 9) => void;
  onClearPrescription: () => void;
  activePrescription?: { maxStrengthMg: number } | null;
}

export function DevPrescriptionToggle({ 
  onCreatePrescription, 
  onClearPrescription,
  activePrescription 
}: DevPrescriptionToggleProps) {
  // VISIBILITY GATE: dev mode OR URL param ?dev=1
  const isDevVisible = import.meta.env.DEV || 
    new URLSearchParams(window.location.search).get('dev') === '1';
  
  if (!isDevVisible) {
    return null; // Never visible in prod
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border p-4 rounded-lg shadow-lg z-50 space-y-3">
      <p className="text-sm font-medium">Dev: Mock Prescription</p>
      
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant={activePrescription?.maxStrengthMg === 3 ? "default" : "outline"} 
          onClick={() => onCreatePrescription(3)}
        >
          3mg
        </Button>
        <Button 
          size="sm" 
          variant={activePrescription?.maxStrengthMg === 6 ? "default" : "outline"} 
          onClick={() => onCreatePrescription(6)}
        >
          6mg
        </Button>
        <Button 
          size="sm" 
          variant={activePrescription?.maxStrengthMg === 9 ? "default" : "outline"} 
          onClick={() => onCreatePrescription(9)}
        >
          9mg
        </Button>
      </div>
      
      <Button 
        size="sm" 
        variant="destructive" 
        onClick={onClearPrescription} 
        className="w-full"
      >
        Clear Prescription
      </Button>
      
      <p className="text-xs text-muted-foreground">
        {activePrescription 
          ? `✅ Active: ${activePrescription.maxStrengthMg}mg max` 
          : '🔒 No prescription'}
      </p>
    </div>
  );
}
