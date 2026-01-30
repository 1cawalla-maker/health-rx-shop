// Shop types - designed for future Shopify integration

export interface Product {
  id: string;
  shopifyId?: string | null;
  name: string;
  brand: string;
  flavor: string;
  strength: number; // mg
  packSize: number;
  price: number;
  imageUrl?: string;
  description?: string;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  flavor: string;
  strength: number; // mg
  packSize: number;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  prescriptionId?: string;
  shopifyOrderId?: string | null;
  stripePaymentIntentId?: string | null;
}

export interface PrescriptionStatus {
  hasActivePrescription: boolean;
  allowedStrengthMg?: number;
  maxContainers?: number;
  prescriptionId?: string;
  expiresAt?: Date;
  referenceId?: string;
}

// Australian states for shipping
export const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
] as const;
