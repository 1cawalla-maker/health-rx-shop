import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import type { MockPrescription } from '@/types/shop';

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const [all, setAll] = useState<MockPrescription[]>([]);

  useEffect(() => {
    // Phase 1: localStorage-only visibility for testing.
    // Phase 2: doctor should only see prescriptions they issued; enforce via RLS.
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.prescriptions);
      setAll(stored ? (JSON.parse(stored) as MockPrescription[]) : []);
    } catch {
      setAll([]);
    }
  }, [user?.id]);

  const rows = useMemo(() => {
    return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [all]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Prescriptions (Mock)</h1>
        <p className="text-muted-foreground mt-1">Phase 1: derived from localStorage entitlements (healthrx_mock_prescriptions)</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No prescriptions yet.</p>
            <p className="text-sm mt-2">Issue one from a booking to unlock patient shop access.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((rx) => (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Patient: {rx.userId}
                    </CardTitle>
                    <CardDescription>Prescription ID: {rx.id}</CardDescription>
                  </div>
                  <Badge className="capitalize" variant={rx.status === 'active' ? 'default' : 'outline'}>
                    {rx.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Max strength</p>
                  <p className="font-medium">{rx.maxStrengthMg}mg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Allowance</p>
                  <p className="font-medium">{rx.totalCansAllowed} cans</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                  <p className="font-medium">{new Date(rx.createdAt).toLocaleDateString('en-AU')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Expires</p>
                  <p className="font-medium">{rx.expiresAt ? new Date(rx.expiresAt).toLocaleDateString('en-AU') : '—'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
