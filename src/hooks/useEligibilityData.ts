import { useEffect, useState } from 'react';
import { getQuizFromSession, clearQuizFromSession } from '@/services/eligibilityService';

export interface EligibilityData {
  result: 'completed';
  completedAt: string;
}

export function useEligibilityData() {
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);

  useEffect(() => {
    const stored = getQuizFromSession();
    setEligibilityData(stored ? { result: 'completed', completedAt: stored.completedAt } : null);
  }, []);

  const clearEligibilityData = () => {
    clearQuizFromSession();
    setEligibilityData(null);
  };

  return { eligibilityData, clearEligibilityData };
}
