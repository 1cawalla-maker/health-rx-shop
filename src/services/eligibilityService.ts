// Eligibility Quiz Service - handles quiz logic and persistence
import { supabase } from '@/integrations/supabase/client';
import type { EligibilityAnswers, EligibilityQuizResult, EligibilityQuizQuestion } from '@/types/eligibility';

const SESSION_STORAGE_KEY = 'eligibility_responses';

// Quiz questions configuration
export const eligibilityQuestions: EligibilityQuizQuestion[] = [
  {
    id: 'nicotine_use',
    question: 'What is your current nicotine use?',
    options: [
      { value: 'cigarettes', label: 'Cigarettes' },
      { value: 'nicotine_vaping', label: 'Nicotine vaping' },
      { value: 'nicotine_pouches', label: 'Nicotine pouches' },
      { value: 'recently_quit', label: 'Recently quit smoking or vaping' },
      { value: 'no_nicotine', label: 'I do not currently use nicotine', flag: 'warning' }
    ]
  },
  {
    id: 'previous_nrt_use',
    question: 'Have you used nicotine replacement therapy (patches, gum, lozenges) before?',
    options: [
      { value: 'yes_helpful', label: 'Yes, it was helpful' },
      { value: 'yes_not_helpful', label: 'Yes, it was not helpful' },
      { value: 'no', label: 'No, I have not used NRT before' }
    ]
  },
  {
    id: 'nicotine_intensity',
    question: 'How would you describe your daily nicotine intake?',
    options: [
      { value: 'low', label: 'Low (occasional use, less than 5 cigarettes/day equivalent)' },
      { value: 'moderate', label: 'Moderate (5-15 cigarettes/day equivalent)' },
      { value: 'high', label: 'High (more than 15 cigarettes/day equivalent)' }
    ]
  },
  {
    id: 'pouch_reason',
    question: 'What is your primary reason for seeking nicotine pouches?',
    options: [
      { value: 'reduce_stop_smoking', label: 'Reduce or stop smoking' },
      { value: 'reduce_stop_vaping', label: 'Reduce or stop vaping' },
      { value: 'avoid_smoke_vapour', label: 'Avoid smoke/vapour exposure' },
      { value: 'convenience_discretion', label: 'Convenience or discretion' },
      { value: 'other', label: 'Other (please specify)', showTextInput: true }
    ]
  },
  {
    id: 'medical_safety',
    question: 'Do any of the following apply to you?',
    options: [
      { value: 'heart_disease', label: 'Heart disease or recent heart event', flag: 'warning' },
      { value: 'uncontrolled_bp', label: 'Uncontrolled high blood pressure', flag: 'warning' },
      { value: 'pregnant_breastfeeding', label: 'Pregnant or breastfeeding', flag: 'warning' },
      { value: 'none', label: 'None of the above' }
    ]
  },
  {
    id: 'age_confirmation',
    question: 'Please confirm your age',
    options: [
      { value: 'over_18', label: 'I am 18 years or older' },
      { value: 'under_18', label: 'I am under 18', flag: 'block' }
    ]
  }
];

// Consent questions (shown on final step)
export const consentItems = [
  {
    id: 'consent_nicotine_risk',
    label: 'I understand nicotine pouches contain nicotine and are not risk-free'
  },
  {
    id: 'consent_no_guarantee',
    label: 'I understand a prescription is not guaranteed'
  },
  {
    id: 'consent_doctor_discussion',
    label: 'I agree to discuss this information with a doctor'
  }
];

// Store quiz result in session storage (before account creation)
export function saveQuizToSession(result: EligibilityQuizResult): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result));
}

// Get quiz result from session storage
export function getQuizFromSession(): EligibilityQuizResult | null {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as EligibilityQuizResult;
  } catch {
    return null;
  }
}

// Clear quiz from session storage
export function clearQuizFromSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

// Calculate quiz result based on answers
export function calculateQuizResult(answers: Partial<EligibilityAnswers>): 'eligible' | 'may_not_suitable' | 'not_eligible' {
  // Block conditions
  if (answers.age_confirmation === 'under_18') {
    return 'not_eligible';
  }

  // Warning conditions
  const hasWarnings = 
    answers.nicotine_use === 'no_nicotine' ||
    answers.medical_safety === 'heart_disease' ||
    answers.medical_safety === 'uncontrolled_bp' ||
    answers.medical_safety === 'pregnant_breastfeeding';

  return hasWarnings ? 'may_not_suitable' : 'eligible';
}

// Save quiz responses to user's profile/intake after account creation
export async function persistQuizToProfile(userId: string): Promise<boolean> {
  const quizResult = getQuizFromSession();
  if (!quizResult) return false;

  try {
    // Store in patient_profiles as JSON in a field
    // The eligibility quiz responses will be available for doctor view
    const { error } = await supabase
      .from('patient_profiles')
      .upsert({
        user_id: userId,
        additional_notes: JSON.stringify({
          eligibility_quiz: quizResult
        })
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error persisting quiz to profile:', error);
      return false;
    }

    // Clear from session after successful save
    clearQuizFromSession();
    return true;
  } catch (err) {
    console.error('Error persisting quiz:', err);
    return false;
  }
}

// Get quiz responses from patient profile
export async function getPatientEligibilityQuiz(userId: string): Promise<EligibilityQuizResult | null> {
  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('additional_notes')
      .eq('user_id', userId)
      .single();

    if (error || !data?.additional_notes) return null;

    try {
      const notes = JSON.parse(data.additional_notes);
      return notes.eligibility_quiz || null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
