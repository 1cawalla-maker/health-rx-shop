// Shop types - designed for future Shopify integration

// Flavour = Product, Variant = Flavour × Strength
export interface ProductVariant {
  id: string;
  strengthMg: 3 | 6 | 9;
  priceCents: number;
  currency: 'AUD';
  available: boolean;
}

export interface Product {
  id: string;
  shopifyId?: string | null;
  name: string; // e.g., "Mint", "Spearmint", "Black Cherry"
  brand: string;
  flavor: string; // Same as name for now
  canSizePouches: 20; // Display only - always 20 pouches per can
  imageUrl?: string;
  description?: string;
  variants: ProductVariant[];
  // Legacy fields for backwards compatibility
  strength?: number;
  packSize?: number;
  price?: number;
  inStock?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  flavor: string;
  strengthMg: 3 | 6 | 9;
  priceCents: number;
  qtyCans: number; // Quantity in cans
  totalPriceCents?: number; // Derived: priceCents * qtyCans (convenience field)
  imageUrl?: string;
  // Legacy fields for compatibility
  strength?: number;
  packSize?: number;
  price?: number;
  quantity?: number;
}

export interface Cart {
  items: CartItem[];
  subtotalCents: number;
  totalCans: number;
  // Legacy fields
  subtotal?: number;
  itemCount?: number;
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

export interface OrderItem {
  productId: string;
  variantId: string;
  flavor: string;
  strengthMg: 3 | 6 | 9;
  qtyCans: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalCans: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  prescriptionId?: string;
  shopifyOrderId?: string | null;
  stripePaymentIntentId?: string | null;
  // Legacy fields for compatibility
  subtotal?: number;
  shipping?: number;
  total?: number;
}

export interface MockPrescription {
  id: string;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  maxStrengthMg: 3 | 6 | 9;
  totalCansAllowed: 60;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionStatus {
  hasActivePrescription: boolean;
  allowedStrengthMg?: number;
  maxContainers?: number;
  prescriptionId?: string;
  expiresAt?: Date;
  referenceId?: string;
  // New fields for allowance tracking
  totalCansAllowed?: number;
  remainingCans?: number;
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

// Constants
export const PRESCRIPTION_TOTAL_CANS = 60;
export const CAN_SIZE_POUCHES = 20;
