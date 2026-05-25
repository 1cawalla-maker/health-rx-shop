import type { EligibilityQuizResult } from '@/types/eligibility';

export type StoredQuizResult = EligibilityQuizResult & { userId: string };

/**
 * Deprecated compatibility shim.
 *
 * Quiz answers are now stored in Supabase via eligibilityService.ts and linked
 * to the patient account with link_eligibility_quiz_session. Do not store
 * production questionnaire answers in localStorage/sessionStorage.
 */
class EligibilityQuizService {
  getLatestResult(_userId: string): StoredQuizResult | null {
    return null;
  }

  saveResult(_userId: string, _result: EligibilityQuizResult): void {
    // Intentionally no-op.
  }

  importFromSession(_userId: string): void {
    try {
      sessionStorage.removeItem('pouchcare_quiz_result');
    } catch {
      // ignore
    }
  }
}

export const eligibilityQuizService = new EligibilityQuizService();
