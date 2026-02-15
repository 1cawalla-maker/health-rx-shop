import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ShippingAddress, ShippingMethod } from '@/types/shop';
import { AUSTRALIAN_STATES } from '@/types/shop';
import { shippingFormService } from '@/services/shippingFormService';
import { getAvailableShippingQuotes } from '@/services/shippingService';
import { ShippingMethodSelector } from '@/components/checkout/ShippingMethodSelector';

interface ShippingFormProps {
  userId?: string;
  initialData: ShippingAddress | null;
  onSubmit: (data: ShippingAddress) => void;
  totalCans: number;
  selectedMethod: ShippingMethod;
  onMethodChange: (method: ShippingMethod) => void;
}

export function ShippingForm({ userId, initialData, onSubmit, totalCans, selectedMethod, onMethodChange }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<ShippingAddress>({
    defaultValues: initialData || {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      suburb: '',
      state: '',
      postcode: '',
    },
  });

  const selectedState = useWatch({ control, name: 'state' });

  // Load saved draft on mount (if no initialData provided)
  useEffect(() => {
    if (userId && !initialData) {
      const savedDraft = shippingFormService.getDraft(userId);
      if (savedDraft) {
        Object.entries(savedDraft).forEach(([key, value]) => {
          if (value && key !== 'shippingMethod') setValue(key as keyof ShippingAddress, value);
        });
      }
    }
  }, [userId, initialData, setValue]);

  // Save draft on blur (per-field) to reduce localStorage writes
  const handleFieldBlur = () => {
    if (userId) {
      const currentValues = getValues();
      shippingFormService.saveDraft(userId, { ...currentValues, shippingMethod: selectedMethod });
    }
  };

  // Handle shipping method change: update parent + persist draft
  const handleMethodChange = (method: ShippingMethod) => {
    onMethodChange(method);
    if (userId) {
      const currentValues = getValues();
      shippingFormService.saveDraft(userId, { ...currentValues, shippingMethod: method });
    }
  };

  // Clear draft on successful submit
  const handleFormSubmit = (data: ShippingAddress) => {
    if (userId) {
      shippingFormService.clearDraft(userId);
    }
    onSubmit(data);
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^(\+?61|0)4\d{8}$/;
    const cleaned = value.replace(/\s/g, '');
    return phoneRegex.test(cleaned) || 'Please enter a valid Australian mobile number';
  };

  const validatePostcode = (value: string) => {
    const postcodeRegex = /^\d{4}$/;
    return postcodeRegex.test(value) || 'Please enter a valid 4-digit postcode';
  };

  const quotes = getAvailableShippingQuotes(totalCans);

  return ( 
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...register('fullName', { required: 'Full name is required' })}
            placeholder="John Smith"
            className={errors.fullName ? 'border-destructive' : ''}
            onBlur={handleFieldBlur}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...register('phone', {
              required: 'Phone number is required',
              validate: validatePhone,
            })}
            placeholder="0412 345 678"
            className={errors.phone ? 'border-destructive' : ''}
            onBlur={handleFieldBlur}
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input
            id="addressLine1"
            {...register('addressLine1', { required: 'Address is required' })}
            placeholder="123 Main Street"
            className={errors.addressLine1 ? 'border-destructive' : ''}
            onBlur={handleFieldBlur}
          />
          {errors.addressLine1 && (
            <p className="text-sm text-destructive mt-1">{errors.addressLine1.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            id="addressLine2"
            {...register('addressLine2')}
            placeholder="Apartment, suite, unit, etc. (optional)"
            onBlur={handleFieldBlur}
          />
        </div>

        <div>
          <Label htmlFor="suburb">Suburb/City *</Label>
          <Input
            id="suburb"
            {...register('suburb', { required: 'Suburb is required' })}
            placeholder="Sydney"
            className={errors.suburb ? 'border-destructive' : ''}
            onBlur={handleFieldBlur}
          />
          {errors.suburb && (
            <p className="text-sm text-destructive mt-1">{errors.suburb.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Select
            value={selectedState}
            onValueChange={(value) => {
              setValue('state', value, { shouldValidate: true });
              handleFieldBlur();
            }}
          >
            <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {AUSTRALIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="hidden"
            {...register('state', { required: 'State is required' })}
          />
          {errors.state && (
            <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            {...register('postcode', {
              required: 'Postcode is required',
              validate: validatePostcode,
            })}
            placeholder="2000"
            maxLength={4}
            className={errors.postcode ? 'border-destructive' : ''}
            onBlur={handleFieldBlur}
          />
          {errors.postcode && (
            <p className="text-sm text-destructive mt-1">{errors.postcode.message}</p>
          )}
        </div>
      </div>

      {/* Shipping Method Selector */}
      <ShippingMethodSelector
        quotes={quotes}
        selectedMethod={selectedMethod}
        onMethodChange={handleMethodChange}
      />

      <Button type="submit" className="w-full" size="lg">
        Continue to Review
      </Button>
    </form>
  );
}
