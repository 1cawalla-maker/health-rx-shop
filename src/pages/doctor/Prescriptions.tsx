import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { doctorOnboardingSupabaseService } from '@/services/doctorOnboardingSupabaseService';
import { issuedPrescriptionsSupabaseService, type IssuedPrescriptionRow } from '@/services/issuedPrescriptionsSupabaseService';

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<IssuedPrescriptionRow[]>([]);
  const [hasSignatureOnFile, setHasSignatureOnFile] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        const doctorRowId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(user.id);
        const list = await issuedPrescriptionsSupabaseService.listForDoctor({ doctorRowId });
        setRows(list);
      } catch (e) {
        console.error('Failed to load issued prescriptions from Supabase:', e);
        setRows([]);
      }
    };

    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        const doctorId = await doctorOnboardingSupabaseService.getDoctorRowIdForUser(user.id);
        const sig = await doctorOnboardingSupabaseService.getSignatureRowForDoctor(doctorId);
        setHasSignatureOnFile(Boolean(sig?.storage_path));
      } catch (e) {
        console.error('Failed to load doctor signature status:', e);
        setHasSignatureOnFile(false);
      }
    };

    void run();
  }, [user?.id]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.issued_at.localeCompare(a.issued_at)), [rows]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">Issued prescription records</p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No prescriptions issued yet.</p>
            <p className="text-sm mt-2">Issue one from a booking to unlock patient shop access.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((rx) => (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Patient: {rx.patient_id}
                    </CardTitle>
                    <CardDescription>Issued ID: {rx.id}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Max strength</p>
                  <p className="font-medium">{rx.max_strength_mg}mg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Issued</p>
                  <p className="font-medium">{new Date(rx.issued_at).toLocaleDateString('en-AU')}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Signature</p>
                  <p className="font-medium">
                    {hasSignatureOnFile === null
                      ? 'Checking…'
                      : hasSignatureOnFile
                        ? 'On file'
                        : 'Missing (add in Onboarding)'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
