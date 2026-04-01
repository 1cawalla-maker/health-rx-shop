import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google?: any;
  }
}

let googlePlacesScriptPromise: Promise<void> | null = null;

function loadGooglePlaces(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  if (!googlePlacesScriptPromise) {
    googlePlacesScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-google-places="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Places script')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlaces = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Places script'));
      document.head.appendChild(script);
    });
  }

  return googlePlacesScriptPromise;
}

export type AddressComponentsResult = {
  addressLine1: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  placeId: string | null;
};

function parsePlace(place: any): AddressComponentsResult | null {
  if (!place) return null;
  const comps: any[] = place.address_components || [];

  const get = (type: string) => comps.find((c) => (c.types || []).includes(type));

  const streetNumber = get('street_number')?.long_name || '';
  const route = get('route')?.long_name || '';
  const locality = get('locality')?.long_name || get('postal_town')?.long_name || '';
  const adminArea = get('administrative_area_level_1')?.short_name || '';
  const postalCode = get('postal_code')?.long_name || '';
  const country = get('country')?.short_name || 'AU';

  const addressLine1 = `${streetNumber} ${route}`.trim() || (place.formatted_address ? String(place.formatted_address).split(',')[0] : '');

  return {
    addressLine1,
    suburb: locality,
    state: adminArea,
    postcode: postalCode,
    country,
    placeId: place.place_id || null,
  };
}

export function AddressAutocompleteInput(props: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelectPlace: (result: AddressComponentsResult) => void;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [ready, setReady] = useState(false);

  const canUseGoogle = useMemo(() => Boolean(apiKey), [apiKey]);

  useEffect(() => {
    let cancelled = false;
    if (!canUseGoogle) return;

    loadGooglePlaces(apiKey!)
      .then(() => {
        if (cancelled) return;
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canUseGoogle, apiKey]);

  useEffect(() => {
    if (!ready) return;
    if (!inputRef.current) return;
    if (!window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'au' },
      fields: ['address_components', 'formatted_address', 'place_id'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const parsed = parsePlace(place);
      if (!parsed) return;
      props.onChange(parsed.addressLine1);
      props.onSelectPlace(parsed);
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [ready]);

  return (
    <Input
      ref={inputRef}
      id={props.id}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      placeholder={props.placeholder}
      disabled={props.disabled}
      className={props.className}
      autoComplete="street-address"
    />
  );
}
