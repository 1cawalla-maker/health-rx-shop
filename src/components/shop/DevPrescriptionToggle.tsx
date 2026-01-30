import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DevPrescriptionToggleProps {
  mockEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function DevPrescriptionToggle({ mockEnabled, onToggle }: DevPrescriptionToggleProps) {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-3">
        <Switch
          id="dev-prescription"
          checked={mockEnabled}
          onCheckedChange={onToggle}
        />
        <Label htmlFor="dev-prescription" className="text-sm font-medium">
          Dev: Simulate Prescription
        </Label>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {mockEnabled ? '✅ Shop unlocked' : '🔒 Shop locked'}
      </p>
    </div>
  );
}
