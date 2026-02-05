 import { Link } from 'react-router-dom';
 import { Clock } from 'lucide-react';
 import { format } from 'date-fns';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 
 interface ShopExpiredOverlayProps {
   expiredAt?: Date;
 }
 
 export function ShopExpiredOverlay({ expiredAt }: ShopExpiredOverlayProps) {
   return (
     <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center">
       <Card className="max-w-md mx-4">
         <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
             <Clock className="h-6 w-6 text-muted-foreground" />
           </div>
           <CardTitle>Prescription Expired</CardTitle>
           <CardDescription>
             {expiredAt 
               ? `Your prescription expired on ${format(expiredAt, 'MMMM d, yyyy')}.`
               : 'Your prescription has expired.'}
             {' '}To continue ordering, please book a new consultation.
           </CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col gap-2">
           <Button asChild>
             <Link to="/patient/book">Book Consultation</Link>
           </Button>
           <Button variant="outline" asChild>
             <Link to="/patient/prescriptions">View Prescriptions</Link>
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 }