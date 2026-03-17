import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { FileText } from 'lucide-react';
import { issuedPrescriptionService, type IssuedPrescriptionRecord } from '@/services/issuedPrescriptionService';

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<IssuedPrescriptionRecord[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setRows(issuedPrescriptionService.listByDoctor(user.id));
  }, [user?.id]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [rows]);

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
                      Patient: {rx.patientId}
                    </CardTitle>
                    <CardDescription>Issued ID: {rx.id}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Max strength</p>
                  <p className="font-medium">{rx.maxStrengthMg}mg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Issued</p>
                  <p className="font-medium">{new Date(rx.createdAt).toLocaleDateString('en-AU')}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Signature</p>
                  <p className="font-medium">{rx.signatureDataUrl ? 'On file' : 'Missing (add in Registration)'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
