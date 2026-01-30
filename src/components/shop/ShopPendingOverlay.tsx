import { Link } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ShopPendingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <Card className="max-w-md mx-4 shadow-lg border-2 border-amber-500/30">
        <CardHeader className="text-center pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Prescription Pending Review</CardTitle>
          <CardDescription className="text-base">
            Your uploaded prescription is being reviewed by our team. You'll be notified once it's approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-amber-500/10 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-600 font-medium">
              Review typically takes 1-2 business days
            </p>
          </div>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/patient/prescriptions">
              <FileText className="h-4 w-4 mr-2" />
              View Prescription Status
            </Link>
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Need faster access? Book a consultation with one of our doctors.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
