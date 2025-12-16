import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function DoctorPending() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24 gradient-section min-h-[60vh] flex items-center">
        <div className="container">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <CardTitle>Account Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your doctor account is currently being reviewed. You'll receive an email once your account has been approved.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
