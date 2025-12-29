import { useOutletContext, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Upload, Calendar, ShoppingCart, Clock, FileText } from 'lucide-react';

interface OutletContext {
  hasActivePrescription: boolean;
  hasPendingPrescription: boolean;
  checkActivePrescription: () => void;
}

// Placeholder products
const placeholderProducts = [
  {
    id: '1',
    name: 'Mint Fresh',
    brand: 'NicoBrand',
    flavor: 'Mint',
    strengthMg: 6,
    packSize: 20,
    price: 24.99,
  },
  {
    id: '2',
    name: 'Cool Berry',
    brand: 'NicoBrand',
    flavor: 'Berry',
    strengthMg: 6,
    packSize: 20,
    price: 24.99,
  },
  {
    id: '3',
    name: 'Strong Mint',
    brand: 'NicoBrand',
    flavor: 'Mint',
    strengthMg: 12,
    packSize: 20,
    price: 27.99,
  },
  {
    id: '4',
    name: 'Citrus Burst',
    brand: 'NicoBrand',
    flavor: 'Citrus',
    strengthMg: 6,
    packSize: 20,
    price: 24.99,
  },
  {
    id: '5',
    name: 'Coffee Original',
    brand: 'NicoBrand',
    flavor: 'Coffee',
    strengthMg: 9,
    packSize: 20,
    price: 26.99,
  },
  {
    id: '6',
    name: 'Wintergreen',
    brand: 'NicoBrand',
    flavor: 'Wintergreen',
    strengthMg: 12,
    packSize: 20,
    price: 27.99,
  },
];

export default function PatientShop() {
  const { hasActivePrescription, hasPendingPrescription } = useOutletContext<OutletContext>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Product Shop</h1>
        <p className="text-muted-foreground mt-1">Browse and order nicotine pouch products</p>
      </div>

      <div className="relative">
        {/* Product Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="font-display text-lg font-bold text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.flavor}</CardDescription>
                  </div>
                  <Badge variant="outline">{product.strengthMg}mg</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Pack of {product.packSize}</span>
                  <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={!hasActivePrescription}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Pending Prescription Overlay */}
        {!hasActivePrescription && hasPendingPrescription && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <Card className="max-w-md mx-4 shadow-elegant border-2 border-amber-500/30">
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
        )}

        {/* Locked Overlay - No prescription at all */}
        {!hasActivePrescription && !hasPendingPrescription && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <Card className="max-w-md mx-4 shadow-elegant border-2">
              <CardHeader className="text-center pb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Shop Locked</CardTitle>
                <CardDescription className="text-base">
                  Upload your prescription or book a consultation to unlock access to products.
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
        )}
      </div>

      {hasActivePrescription && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">
              Your prescription is active. You can order products within your prescription limits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
