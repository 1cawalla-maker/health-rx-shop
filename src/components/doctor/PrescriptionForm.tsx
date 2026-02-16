import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, FileText, CheckCircle, XCircle, Lock, Pill } from 'lucide-react';
import { prescriptionFileService } from '@/services/prescriptionFileService';
import { ENABLE_PRESCRIPTION_PDF } from '@/config/features';
import type { NicotineStrength, UsageTier } from '@/types/telehealth';
import { calculatePrescriptionQuantities, usageTierLabels, nicotineStrengthLabels } from '@/types/telehealth';

interface DoctorInfo {
  fullName: string;
  ahpraNumber: string | null;
  providerNumber: string | null;
}

interface PatientInfo {
  fullName: string;
  dateOfBirth: string | null;
}

interface PrescriptionFormProps {
  bookingId: string;
  patientId: string;
  doctorId: string;
  doctorInfo: DoctorInfo;
  patientInfo: PatientInfo;
  onComplete: () => void;
}

const NICOTINE_STRENGTHS: NicotineStrength[] = ['3mg', '6mg', '9mg', '12mg'];
const USAGE_TIERS: UsageTier[] = ['light', 'moderate', 'heavy'];

const USAGE_TIER_DESCRIPTIONS: Record<UsageTier, string> = {
  light: 'Up to 5 pouches per day',
  moderate: 'Up to 10 pouches per day',
  heavy: 'Up to 20 pouches per day',
};

export function PrescriptionForm({
  bookingId,
  patientId,
  doctorId,
  doctorInfo,
  patientInfo,
  onComplete,
}: PrescriptionFormProps) {
  const [nicotineStrength, setNicotineStrength] = useState<NicotineStrength>('6mg');
  const [usageTier, setUsageTier] = useState<UsageTier>('moderate');
  const [declineReason, setDeclineReason] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  // Calculate quantities based on usage tier
  const quantities = calculatePrescriptionQuantities(usageTier);

  const issuePrescription = async () => {
    if (!doctorInfo.ahpraNumber || !doctorInfo.providerNumber) {
      toast.error('Doctor registration details are incomplete');
      return;
    }

    // Phase 1: doctor-side prescription issuance is disabled (no Supabase writes).
    setIsIssuing(true);

    try {
      if (!ENABLE_PRESCRIPTION_PDF) {
        toast.error('Prescription issuing will be enabled in Phase 2');
        return;
      }

      // If someone flips ENABLE_PRESCRIPTION_PDF without wiring Phase 2, fail loudly.
      await prescriptionFileService.uploadPrescriptionFile(new File([], 'placeholder.pdf'), doctorId);
    } catch (err: any) {
      toast.error(err.message || 'Prescription issuing will be enabled in Phase 2');
    } finally {
      setIsIssuing(false);
    }
  };

  const declinePrescription = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    // Phase 1: no backend writes.
    setIsDeclining(true);

    try {
      toast.success('Recorded for Phase 2 (no changes saved in Phase 1)');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'This will be enabled in Phase 2');
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Issue Prescription (Optional)
        </CardTitle>
        <CardDescription>
          Only issue a prescription if clinically appropriate after consultation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prescriber Information (Read-only) */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Lock className="h-3 w-3" />
            Prescriber Information
          </Label>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Doctor Name</span>
              <span className="font-medium">Dr. {doctorInfo.fullName || 'Not available'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AHPRA Number</span>
              <span className="font-medium">{doctorInfo.ahpraNumber || 'Not registered'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider Number</span>
              <span className="font-medium">{doctorInfo.providerNumber || 'Not registered'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Patient Information */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Patient Information</Label>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patient Name</span>
              <span className="font-medium">{patientInfo.fullName || 'Not available'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date of Birth</span>
              <span className="font-medium">
                {patientInfo.dateOfBirth 
                  ? new Date(patientInfo.dateOfBirth).toLocaleDateString('en-AU')
                  : 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Medication (Fixed) */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Lock className="h-3 w-3" />
            Medication
          </Label>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="font-medium text-primary">Nicotine Pouches (Synthetic)</p>
            <p className="text-sm text-muted-foreground mt-1">TGA Schedule 4 Medicine</p>
          </div>
        </div>

        {!showDeclineForm ? (
          <>
            {/* Nicotine Strength */}
            <div className="space-y-2">
              <Label>Nicotine Strength</Label>
              <Select 
                value={nicotineStrength} 
                onValueChange={(v) => setNicotineStrength(v as NicotineStrength)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NICOTINE_STRENGTHS.map((strength) => (
                    <SelectItem key={strength} value={strength}>
                      {nicotineStrengthLabels[strength]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Tier */}
            <div className="space-y-2">
              <Label>Usage / Supply Level</Label>
              <Select 
                value={usageTier} 
                onValueChange={(v) => setUsageTier(v as UsageTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium capitalize">{tier} use</span>
                        <span className="text-xs text-muted-foreground">
                          {USAGE_TIER_DESCRIPTIONS[tier]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated Quantities (Read-only) */}
            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Lock className="h-3 w-3" />
                Prescription Summary (90-day supply)
              </Label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Maximum</span>
                  <span className="font-medium">{quantities.dailyMaxPouches} pouches</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supply Duration</span>
                  <span className="font-medium">90 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pouches</span>
                  <span className="font-medium">{quantities.totalPouches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Containers</span>
                  <span className="font-medium">{quantities.containersAllowed}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={issuePrescription}
                disabled={isIssuing || !doctorInfo.ahpraNumber || !doctorInfo.providerNumber}
                className="flex-1"
              >
                {isIssuing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Issue Prescription
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeclineForm(true)}
                disabled={isIssuing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>

            {(!doctorInfo.ahpraNumber || !doctorInfo.providerNumber) && (
              <p className="text-sm text-destructive">
                Cannot issue prescriptions: AHPRA and Provider numbers are required.
              </p>
            )}
          </>
        ) : (
          /* Decline Form */
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive">Decline Prescription</p>
              <p className="text-sm text-muted-foreground mt-1">
                The consultation will be marked as complete. Doctors are paid regardless of outcome.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="declineReason">Reason for Declining *</Label>
              <Textarea
                id="declineReason"
                placeholder="Enter the clinical reason for not issuing a prescription..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={declinePrescription}
                disabled={isDeclining || !declineReason.trim()}
                className="flex-1"
              >
                {isDeclining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirm Decline
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeclineForm(false)}
                disabled={isDeclining}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
