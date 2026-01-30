import { Link } from 'react-router-dom';
import { Lock, Upload, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ShopLockedOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <Card className="max-w-md mx-4 shadow-lg border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Prescription Required</CardTitle>
          <CardDescription className="text-base">
            To purchase nicotine pouches, you must upload a valid prescription or book a consultation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/patient/upload-prescription">
              <Upload className="h-4 w-4 mr-2" />
              Upload Prescription
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/patient/book">
              <Calendar className="h-4 w-4 mr-2" />
              Book Consultation
            </Link>
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Products are only available with a valid prescription from a registered doctor.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
