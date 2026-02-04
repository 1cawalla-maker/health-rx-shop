// Shop Prescription Service - Mock implementation for prescription gating
// Phase 1: Uses localStorage only - NO Supabase
// Storage key: healthrx_mock_prescriptions

import type { MockPrescription } from '@/types/shop';
import { orderService } from './orderService';

const PRESCRIPTION_STORAGE_KEY = 'healthrx_mock_prescriptions';

class ShopPrescriptionService {
  // Private: Read all prescriptions from localStorage
  private getAllPrescriptions(): MockPrescription[] {
    try {
      const stored = localStorage.getItem(PRESCRIPTION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as MockPrescription[];
      }
    } catch (error) {
      console.error('Error reading prescriptions from localStorage:', error);
    }
    return [];
  }

  // Private: Save all prescriptions to localStorage
  private savePrescriptions(prescriptions: MockPrescription[]): void {
    try {
      localStorage.setItem(PRESCRIPTION_STORAGE_KEY, JSON.stringify(prescriptions));
    } catch (error) {
      console.error('Error saving prescriptions to localStorage:', error);
    }
  }

  // Get active prescription for specific user
  // Returns newest active, non-expired prescription or null
  getActivePrescription(userId: string): MockPrescription | null {
    const all = this.getAllPrescriptions();
    const now = new Date().toISOString();
    
    // Filter by userId, status='active', and non-expired
    const activePrescriptions = all.filter(p => 
      p.userId === userId && 
      p.status === 'active' && 
      (!p.expiresAt || p.expiresAt > now)
    );
    
    // Return newest (by createdAt)
    if (activePrescriptions.length === 0) {
      return null;
    }
    
    return activePrescriptions.sort((a, b) => 
      b.createdAt.localeCompare(a.createdAt)
    )[0];
  }

  // Calculate remaining allowance from persisted orders (user-scoped)
  // Formula: 60 - sum(orders.filter(o => o.userId).totalCans)
  async getRemainingAllowance(userId: string): Promise<{
    totalCansAllowed: number;
    cansUsed: number;
    remainingCans: number;
  }> {
    const prescription = this.getActivePrescription(userId);
    if (!prescription) {
      return { totalCansAllowed: 0, cansUsed: 0, remainingCans: 0 };
    }

    const cansUsed = await orderService.getTotalCansOrdered(userId);
    const remainingCans = Math.max(0, prescription.totalCansAllowed - cansUsed);

    return {
      totalCansAllowed: prescription.totalCansAllowed,
      cansUsed,
      remainingCans,
    };
  }

  // Create mock prescription for testing (dev helper)
  // Removes existing prescriptions for this user first
  createMockPrescription(userId: string, maxStrengthMg: 3 | 6 | 9): MockPrescription {
    // Remove existing prescriptions for this user
    this.clearMockPrescriptionsForUser(userId);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days for testing

    const prescription: MockPrescription = {
      id: `mock-rx-${Date.now()}`,
      userId,
      status: 'active',
      maxStrengthMg,
      totalCansAllowed: 60,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const all = this.getAllPrescriptions();
    all.push(prescription);
    this.savePrescriptions(all);
    
    return prescription;
  }

  // Clear prescriptions for specific user only
  clearMockPrescriptionsForUser(userId: string): void {
    const all = this.getAllPrescriptions();
    const filtered = all.filter(p => p.userId !== userId);
    this.savePrescriptions(filtered);
  }

  // Legacy: Clear all prescriptions (for backwards compatibility)
  clearAllPrescriptions(): void {
    this.savePrescriptions([]);
  }

  // STRENGTH GATING HELPER
  // Rule: variant.strengthMg <= prescription.maxStrengthMg
  isVariantAllowed(variantStrengthMg: number, prescriptionMaxStrengthMg: number): boolean {
    return variantStrengthMg <= prescriptionMaxStrengthMg;
  }
}

export const shopPrescriptionService = new ShopPrescriptionService();
