// Shop Prescription Service - Mock implementation for prescription gating
// MVP: Uses localStorage
// Future: Query from Supabase

import type { MockPrescription, Order, PRESCRIPTION_TOTAL_CANS } from '@/types/shop';
import { orderService } from './orderService';

const PRESCRIPTION_STORAGE_KEY = 'nicopatch_shop_prescription';

class ShopPrescriptionService {
  private getStoredPrescription(): MockPrescription | null {
    try {
      const stored = localStorage.getItem(PRESCRIPTION_STORAGE_KEY);
      if (stored) {
        const prescription = JSON.parse(stored) as MockPrescription;
        // Check if expired
        if (prescription.expiresAt && new Date(prescription.expiresAt) < new Date()) {
          return { ...prescription, status: 'expired' };
        }
        return prescription;
      }
    } catch (error) {
      console.error('Error reading prescription from localStorage:', error);
    }
    return null;
  }

  private savePrescription(prescription: MockPrescription): void {
    try {
      localStorage.setItem(PRESCRIPTION_STORAGE_KEY, JSON.stringify(prescription));
    } catch (error) {
      console.error('Error saving prescription to localStorage:', error);
    }
  }

  // Get active prescription for current user
  async getActivePrescription(userId: string): Promise<MockPrescription | null> {
    const prescription = this.getStoredPrescription();
    if (prescription && prescription.userId === userId && prescription.status === 'active') {
      return prescription;
    }
    return null;
  }

  // Calculate remaining allowance based on placed orders
  async getRemainingAllowance(userId: string): Promise<{ totalCansAllowed: number; cansUsed: number; remainingCans: number }> {
    const prescription = await this.getActivePrescription(userId);
    if (!prescription) {
      return { totalCansAllowed: 0, cansUsed: 0, remainingCans: 0 };
    }

    const orders = await orderService.getOrders(userId);
    const cansUsed = orders.reduce((sum, order) => sum + order.totalCans, 0);
    const remainingCans = Math.max(0, prescription.totalCansAllowed - cansUsed);

    return {
      totalCansAllowed: prescription.totalCansAllowed,
      cansUsed,
      remainingCans,
    };
  }

  // Create/activate a mock prescription (for dev toggle)
  async createMockPrescription(userId: string, maxStrengthMg: 3 | 6 | 9 = 9): Promise<MockPrescription> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 3 months

    const prescription: MockPrescription = {
      id: `mock-rx-${Date.now()}`,
      userId,
      status: 'active',
      maxStrengthMg,
      totalCansAllowed: 60,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.savePrescription(prescription);
    return prescription;
  }

  // Clear mock prescription (for dev toggle)
  clearMockPrescription(): void {
    localStorage.removeItem(PRESCRIPTION_STORAGE_KEY);
  }

  // Check if strength is allowed by prescription
  isStrengthAllowed(prescriptionMaxStrength: number, variantStrength: number): boolean {
    return variantStrength <= prescriptionMaxStrength;
  }
}

export const shopPrescriptionService = new ShopPrescriptionService();
