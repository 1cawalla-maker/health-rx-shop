// Call Attempt Repository - Mock/localStorage implementation
// Option A-ready: When migrating to Supabase, create a new file
// (e.g., callAttemptRepositorySupabase.ts) implementing CallAttemptRepository
// and swap the export below.

import type { CallAttempt, CallAttemptOutcome, CallAttemptRepository } from '@/types/telehealth';

// localStorage key for mock call attempts
const STORAGE_KEY = 'nicopatch_call_attempts';

// Helper to get stored attempts
function getStoredAttempts(): CallAttempt[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save attempts
function saveAttempts(attempts: CallAttempt[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

// Mock implementation using localStorage
const mockCallAttemptRepository: CallAttemptRepository = {
  async list(consultationId: string): Promise<CallAttempt[]> {
    const allAttempts = getStoredAttempts();
    return allAttempts
      .filter(a => a.consultationId === consultationId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  },

  async add(params: { consultationId: string; outcome: CallAttemptOutcome }): Promise<CallAttempt> {
    const { consultationId, outcome } = params;
    
    const allAttempts = getStoredAttempts();
    const consultationAttempts = allAttempts.filter(a => a.consultationId === consultationId);
    const nextAttemptNumber = consultationAttempts.length + 1;

    if (nextAttemptNumber > 3) {
      throw new Error('Maximum call attempts (3) reached');
    }

    const newAttempt: CallAttempt = {
      id: crypto.randomUUID(),
      consultationId,
      attemptNumber: nextAttemptNumber,
      outcome,
      attemptedAtIso: new Date().toISOString(),
    };

    allAttempts.push(newAttempt);
    saveAttempts(allAttempts);

    return newAttempt;
  },

  canMarkNoShow(attempts: CallAttempt[]): boolean {
    const failedAttempts = attempts.filter(a => a.outcome === 'no_answer');
    return failedAttempts.length >= 3;
  },
};

// Export the mock repository as the active implementation
export const callAttemptRepository: CallAttemptRepository = mockCallAttemptRepository;

// Re-export types for convenience
export type { CallAttempt, CallAttemptOutcome, CallAttemptRepository };
