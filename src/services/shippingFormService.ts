// Shipping Form Draft Service - persists form state across page refreshes
// Phase 1: Uses localStorage
// Storage key: nicopatch_shipping_draft

import type { ShippingAddress, ShippingMethod } from '@/types/shop';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { safeShippingMethod } from '@/services/shippingService';

type ShippingDraft = Partial<ShippingAddress> & {
  shippingMethod?: string; // stored as string, validated on read
};

type DraftStore = Record<string, ShippingDraft>;

class ShippingFormService {
  private getAllDrafts(): DraftStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.shippingDraft);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveDrafts(drafts: DraftStore): void {
    try {
      localStorage.setItem(STORAGE_KEYS.shippingDraft, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving shipping draft:', error);
    }
  }

  getDraft(userId: string): ShippingDraft | null {
    // NULL GUARD: Do not read localStorage if no userId
    if (!userId) return null;

    const drafts = this.getAllDrafts();
    const draft = drafts[userId];
    if (!draft || !draft.fullName) return null;
    // Normalize shippingMethod on read + write-back if changed
    const normalized = safeShippingMethod(draft.shippingMethod);
    if (draft.shippingMethod !== normalized) {
      draft.shippingMethod = normalized;
      drafts[userId] = draft;
      this.saveDrafts(drafts);
    }
    return {
      ...draft,
      shippingMethod: normalized,
    };
  }

  saveDraft(userId: string, draft: ShippingDraft): void {
    // NULL GUARD: Do not write localStorage if no userId
    if (!userId) return;

    const drafts = this.getAllDrafts();
    drafts[userId] = draft;
    this.saveDrafts(drafts);
  }

  /** Get just the selected shipping method from the draft (defaults to 'standard'). */
  getSelectedMethod(userId: string): ShippingMethod {
    if (!userId) return 'standard';
    const drafts = this.getAllDrafts();
    const draft = drafts[userId];
    const normalized = safeShippingMethod(draft?.shippingMethod);
    // Write-back if stored value was invalid/missing
    if (draft && draft.shippingMethod !== normalized) {
      draft.shippingMethod = normalized;
      drafts[userId] = draft;
      this.saveDrafts(drafts);
    }
    return normalized;
  }

  clearDraft(userId: string): void {
    // NULL GUARD: No-op if no userId
    if (!userId) return;

    const drafts = this.getAllDrafts();
    delete drafts[userId];
    this.saveDrafts(drafts);
  }
}

export const shippingFormService = new ShippingFormService();
