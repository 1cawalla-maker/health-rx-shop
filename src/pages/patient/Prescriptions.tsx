import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ReturnType<typeof shopPrescriptionService.getActivePrescription> | null>(null);
  const [latestInfo, setLatestInfo] = useState<ReturnType<typeof shopPrescriptionService.getLatestPrescription> | null>(null);

  useEffect(() => {
    setLoading(true);

    if (!user?.id) {
      setActive(null);
      setLatestInfo({ prescription: null, isExpired: false });
      setLoading(false);
      return;
    }

    const activeRx = shopPrescriptionService.getActivePrescription(user.id);
    const latest = shopPrescriptionService.getLatestPrescription(user.id);

    setActive(activeRx);
    setLatestInfo(latest);
    setLoading(false);
  }, [user?.id]);

  const statusBadge = useMemo(() => {
    if (!latestInfo?.prescription) {
      return <Badge variant="outline">None</Badge>;
    }

    if (latestInfo.isExpired) {
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Expired</Badge>;
    }

    if (latestInfo.prescription.status === 'active') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
    }

    return <Badge variant="outline">{latestInfo.prescription.status}</Badge>;
  }, [latestInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">View your prescription details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>Your current prescription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Prescription Status</p>
                  {statusBadge}
                </div>
                {latestInfo?.prescription?.createdAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Added: {format(new Date(latestInfo.prescription.createdAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>

            {active ? (
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Max strength:</strong> {active.maxStrengthMg}mg
                </p>
                <p>
                  <strong>Total allowance:</strong> {active.totalCansAllowed} cans
                </p>
                {active.expiresAt && (
                  <p>
                    <strong>Expires:</strong> {format(new Date(active.expiresAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No active prescription found. Book a consultation to have a doctor issue your prescription.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
