import type { EligibilityQuizResult } from '@/types/eligibility';

const QUIZ_KEY = 'healthrx_mock_quiz_results';

export type StoredQuizResult = EligibilityQuizResult & { userId: string };

class EligibilityQuizService {
  getLatestResult(userId: string): StoredQuizResult | null {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      const all: StoredQuizResult[] = raw ? JSON.parse(raw) : [];
      const mine = all.filter((r) => r.userId === userId);
      if (!mine.length) return null;
      return mine.sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    } catch {
      return null;
    }
  }

  saveResult(userId: string, result: EligibilityQuizResult): void {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(QUIZ_KEY);
      const all: StoredQuizResult[] = raw ? JSON.parse(raw) : [];
      all.push({ ...result, userId });
      localStorage.setItem(QUIZ_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  // Called after auth to move the pre-signup session quiz into user-scoped storage.
  importFromSession(userId: string): void {
    if (!userId) return;
    try {
      const raw = sessionStorage.getItem('healthrx_quiz_result');
      if (!raw) return;
      const result = JSON.parse(raw) as EligibilityQuizResult;
      if (!result?.completedAt) return;
      this.saveResult(userId, result);
      sessionStorage.removeItem('healthrx_quiz_result');
    } catch {
      // ignore
    }
  }
}

export const eligibilityQuizService = new EligibilityQuizService();
