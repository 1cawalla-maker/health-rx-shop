import { Truck, Zap } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ShippingMethod, ShippingQuote } from '@/types/shop';

interface ShippingMethodSelectorProps {
  quotes: ShippingQuote[];
  selectedMethod: ShippingMethod;
  onMethodChange: (method: ShippingMethod) => void;
}

export function ShippingMethodSelector({
  quotes,
  selectedMethod,
  onMethodChange,
}: ShippingMethodSelectorProps) {
  const icons: Record<ShippingMethod, React.ElementType> = {
    standard: Truck,
    express: Zap,
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Shipping Method</Label>
      <RadioGroup
        value={selectedMethod}
        onValueChange={(val) => onMethodChange(val as ShippingMethod)}
        className="grid gap-3"
      >
        {quotes.map((quote) => {
          const Icon = icons[quote.method];
          const isSelected = selectedMethod === quote.method;

          return (
            <Label
              key={quote.method}
              htmlFor={`shipping-${quote.method}`}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <RadioGroupItem
                value={quote.method}
                id={`shipping-${quote.method}`}
                className="sr-only"
              />
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{quote.label}</span>
                  {quote.isFree && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Free
                    </Badge>
                  )}
                </div>
                {quote.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{quote.description}</p>
                )}
              </div>
              <div className="text-right font-semibold">
                {quote.isFree
                  ? <span className="text-green-600 dark:text-green-400">Free</span>
                  : `$${(quote.costCents / 100).toFixed(2)}`}
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
