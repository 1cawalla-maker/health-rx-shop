 // Shipping Form Draft Service - persists form state across page refreshes
 // Phase 1: Uses localStorage
 // Storage key: nicopatch_shipping_draft
 
 import type { ShippingAddress } from '@/types/shop';
 import { STORAGE_KEYS } from '@/lib/storageKeys';
 
 type DraftStore = Record<string, Partial<ShippingAddress>>;
 
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
 
   getDraft(userId: string): ShippingAddress | null {
     // NULL GUARD: Do not read localStorage if no userId
     if (!userId) return null;
     
     const drafts = this.getAllDrafts();
     const draft = drafts[userId];
     if (!draft || !draft.fullName) return null;
     return draft as ShippingAddress;
   }
 
   saveDraft(userId: string, address: Partial<ShippingAddress>): void {
     // NULL GUARD: Do not write localStorage if no userId
     if (!userId) return;
     
     const drafts = this.getAllDrafts();
     drafts[userId] = address;
     this.saveDrafts(drafts);
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