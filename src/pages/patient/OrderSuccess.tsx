import { Link } from 'react-router-dom';
import { Clock, Package, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Shopify hosts the thank-you page.
 * This route is kept as a light-weight fallback in case we ever redirect back,
 * but it should not claim payment success without Shopify-confirmed data.
 */
export default function PatientOrderSuccess() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Order syncing…</h1>
        <p className="text-muted-foreground">
          If you completed payment in Shopify, your order will appear in your Order History shortly.
        </p>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Orders are imported from Shopify after payment via webhook. If it doesn’t show up within a minute, refresh.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>Where to go from here</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link to="/patient/orders">
              <Package className="h-4 w-4 mr-2" />
              View Order History
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/patient/shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Back to shop
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
