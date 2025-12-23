import { useEffect, useState } from 'react';

export interface EligibilityData {
  answers: Record<string, string>;
  result: 'suitable' | 'may_not_suitable' | 'not_eligible';
  completedAt: string;
}

export function useEligibilityData() {
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('eligibility_responses');
    if (stored) {
      try {
        setEligibilityData(JSON.parse(stored));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  const clearEligibilityData = () => {
    sessionStorage.removeItem('eligibility_responses');
    setEligibilityData(null);
  };

  return { eligibilityData, clearEligibilityData };
}
