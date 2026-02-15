import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentPlaceholderProps {
  totalCents: number;
  isProcessing: boolean;
  onPlaceOrder: () => void;
  onBack: () => void;
  disabled?: boolean;
}

export function PaymentPlaceholder({
  totalCents,
  isProcessing,
  onPlaceOrder,
  onBack,
  disabled = false,
}: PaymentPlaceholderProps) {
  const totalFormatted = (totalCents / 100).toFixed(2);
  return (
    <div className="space-y-6">
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertDescription className="text-amber-700">
          <strong>Development Mode:</strong> Payment processing will be integrated in a future update. 
          Click "Place Order" to simulate a successful order.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
          <CardDescription>
            Secure payment powered by Stripe (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mock Payment Form */}
          <div className="space-y-4 opacity-60">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                id="cardName"
                placeholder="John Smith"
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
            <Lock className="h-4 w-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total to Pay</span>
            <span className="text-2xl font-bold text-primary">${totalFormatted} AUD</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          size="lg"
          onClick={onPlaceOrder}
          disabled={isProcessing || disabled}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Place Order (${totalFormatted})
            </>
          )}
        </Button>

        <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review
        </Button>
      </div>
    </div>
  );
}
