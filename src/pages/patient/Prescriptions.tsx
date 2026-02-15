import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { shopPrescriptionService } from '@/services/shopPrescriptionService';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ReturnType<typeof shopPrescriptionService.getActivePrescription> | null>(null);
  const [latestInfo, setLatestInfo] = useState<ReturnType<typeof shopPrescriptionService.getLatestPrescription> | null>(null);

  useEffect(() => {
    // Phase 1: localStorage-only read via service boundary.
    // No Supabase calls; no network calls.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">Phase 1: entitlement is mock/localStorage only</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/patient/upload-prescription">
            <Upload className="h-4 w-4 mr-2" />
            Upload (Phase 2)
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            PDF Upload/View Disabled (Phase 1)
          </CardTitle>
          <CardDescription>
            Prescription PDFs are intentionally disabled in Phase 1 to avoid partial/unsafe Supabase Storage + RLS.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            To test shop access in Phase 1, use the <strong>Dev Mock Prescription</strong> toggle to create a valid
            entitlement in <code>healthrx_mock_prescriptions</code>.
          </p>
          <p>
            The upload route is kept for MVP continuity, but it does not accept files yet.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shop Entitlement</CardTitle>
          <CardDescription>Derived from localStorage mock prescription data (Phase 1)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  No active prescription found. Use the Dev Mock Prescription toggle to unlock the shop for testing.
                </p>
              )}
            </div>

            {/* Phase 1 stub UX for PDF actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled title="Available in Phase 2">
                View PDF (Phase 2)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
