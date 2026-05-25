// Eligibility Quiz Service - handles quiz logic and persistence
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { EligibilityAnswers, EligibilityQuizResult, EligibilityQuizQuestion } from '@/types/eligibility';

const LEGACY_SESSION_STORAGE_KEY = 'eligibility_responses';
const LEGACY_SESSION_STORAGE_KEY_V2 = 'pouchcare_quiz_result';
const LEGACY_LOCAL_STORAGE_KEY = 'pouchcare_quiz_result_public';
const QUIZ_SESSION_ID_KEY = 'pouchcare_quiz_session_id';
const QUIZ_SESSION_META_KEY = 'pouchcare_quiz_session_meta';

export const eligibilityQuestions: EligibilityQuizQuestion[] = [
  {
    id: 'age_confirmation',
    question: 'Please confirm your age',
    options: [
      { value: 'over_18', label: 'I am 18 years or older' },
      { value: 'under_18', label: 'I am under 18', flag: 'block' }
    ]
  },
  {
    id: 'nicotine_use',
    question: 'What is your current nicotine use?',
    inputType: 'multi',
    exclusiveOptions: ['no_nicotine'],
    options: [
      { value: 'nicotine_pouches', label: 'Nicotine pouches' },
      { value: 'cigarettes', label: 'Cigarettes' },
      { value: 'nicotine_vaping', label: 'Nicotine vaping' },
      { value: 'oral_nrt', label: 'Nicotine replacement therapy, such as gum, lozenges, spray or similar' },
      { value: 'no_nicotine', label: 'I do not currently use nicotine', flag: 'warning' }
    ]
  },
  {
    id: 'current_pouch_strength',
    question: 'What nicotine pouch strength do you usually use?',
    description: 'This helps the doctor understand your current nicotine pouch use before the consultation.',
    showWhen: (answers) => answers.nicotine_use?.includes('nicotine_pouches') === true,
    options: [
      { value: '3mg', label: '3 mg per pouch' },
      { value: '6mg', label: '6 mg per pouch' },
      { value: '9mg', label: '9 mg per pouch' },
      { value: '12mg', label: '12 mg per pouch' },
      {
        value: 'other',
        label: 'Other strength',
        showTextInput: true,
        textInputLabel: 'Please tell the doctor the strength if you know it',
        textInputPlaceholder: 'Example: 4mg, 8mg, 10mg...',
        textAnswerKey: 'current_pouch_strength_other',
        textRequired: true
      },
      { value: 'not_sure', label: 'I’m not sure' }
    ]
  },
  {
    id: 'current_pouch_daily_use',
    question: 'On average, how many nicotine pouches do you currently use per day?',
    description: 'An estimate is fine. The doctor can clarify this during the consultation.',
    showWhen: (answers) => answers.nicotine_use?.includes('nicotine_pouches') === true,
    options: [
      { value: '1_5', label: '1–5 pouches per day' },
      { value: '6_10', label: '6–10 pouches per day' },
      { value: '11_20', label: '11–20 pouches per day' },
      { value: 'more_than_20', label: 'More than 20 pouches per day' },
      { value: 'not_sure', label: 'I’m not sure' }
    ]
  },
  {
    id: 'previous_nrt_use',
    question: 'Have you used nicotine replacement therapy before, such as patches, gum, lozenges, sprays or inhalators?',
    description: 'This helps the doctor understand what you have already tried and whether it helped.',
    options: [
      { value: 'yes_helpful', label: 'Yes, it was helpful' },
      { value: 'yes_not_helpful', label: 'Yes, it was not helpful' },
      { value: 'no', label: 'No, I have not used NRT before' }
    ]
  },
  {
    id: 'preferred_cessation_product',
    question: 'Which nicotine cessation or reduction option are you most interested in discussing with the doctor?',
    options: [
      { value: 'nicotine_pouches', label: 'Nicotine pouches' },
      { value: 'oral_nrt', label: 'Nicotine replacement therapy, such as gum, lozenges or spray' },
      { value: 'nicotine_patches', label: 'Nicotine patches' },
      { value: 'prescription_medicine', label: 'Prescription medicine to help stop smoking/vaping' },
      { value: 'not_sure', label: 'Not sure — I would like the doctor’s guidance' },
      {
        value: 'other',
        label: 'Other',
        showTextInput: true,
        textInputLabel: 'Please tell the doctor what you are interested in discussing',
        textInputPlaceholder: 'Briefly describe what you would like to discuss...',
        textAnswerKey: 'preferred_cessation_product_other',
        textRequired: true
      }
    ]
  },
  {
    id: 'medical_safety',
    question: 'Do any of the following apply to you?',
    inputType: 'multi',
    exclusiveOptions: ['none'],
    options: [
      { value: 'heart_stroke_blood_vessel', label: 'Heart disease, stroke, blood vessel disease, or recent heart event', flag: 'warning' },
      { value: 'uncontrolled_bp', label: 'Uncontrolled high blood pressure', flag: 'warning' },
      { value: 'lung_disease_breathing', label: 'Significant lung disease or severe breathing symptoms', flag: 'warning' },
      { value: 'seizures_epilepsy', label: 'Seizures or epilepsy', flag: 'warning' },
      { value: 'mental_health_severe', label: 'Significant mental-health history or current severe symptoms', flag: 'warning' },
      { value: 'diabetes_kidney_liver_serious', label: 'Diabetes, kidney/liver disease, or another serious condition', flag: 'warning' },
      { value: 'pregnant_breastfeeding', label: 'Pregnant, breastfeeding, or trying to conceive', flag: 'warning' },
      { value: 'prefer_discuss', label: 'Prefer to discuss with the doctor', flag: 'warning' },
      { value: 'none', label: 'None of the above' }
    ]
  },
  {
    id: 'allergies_reactions',
    question: 'Do you have any allergies or previous serious reactions to medicines, supplements, nicotine products, adhesives/patches, or oral products?',
    options: [
      { value: 'no', label: 'No' },
      {
        value: 'yes',
        label: 'Yes — I will list them',
        showTextInput: true,
        textInputLabel: 'Please list the allergy or reaction, including what caused it if known',
        textInputPlaceholder: 'Example: rash from nicotine patches, mouth irritation from lozenges, medicine allergy...',
        textAnswerKey: 'allergies_reactions_details',
        textRequired: true
      },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'oral_current_issues',
    question: 'Do you currently have any mouth ulcers, sores, cuts, bleeding gums, gum disease, dental infection, severe tooth pain, or unexplained mouth/throat pain?',
    description: 'This helps the doctor understand whether oral nicotine products may need extra review.',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'oral_unusual_changes',
    question: 'Have you noticed any white or red patches, lumps, swelling, numbness, or non-healing areas in your mouth, lips, tongue, gums, or throat?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'oral_recent_dental_work',
    question: 'Have you recently had dental or oral surgery, a tooth extraction, gum treatment, or major dental work?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'oral_nicotine_reaction',
    question: 'Have nicotine pouches, lozenges, gum, sprays, or similar oral products caused burning, irritation, nausea, hiccups, mouth pain, rash, or allergic-type reactions for you?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' },
      { value: 'never_used', label: 'I have not used oral nicotine products before' }
    ]
  },
  {
    id: 'oral_swallowing_choking_risk',
    question: 'Do you have difficulty swallowing, choking risk, or any condition that makes it unsafe to keep a pouch in your mouth?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'current_medications',
    question: 'Are you currently taking any prescription medicines, over-the-counter medicines, or supplements?',
    description: 'Please include anything relevant so the doctor can assess your overall health context and product suitability.',
    options: [
      { value: 'no', label: 'No' },
      {
        value: 'yes',
        label: 'Yes — I will list them',
        showTextInput: true,
        textInputLabel: 'List all medicines and supplements, including dose if known',
        textInputPlaceholder: 'Example: blood pressure medicine, heart medicine, diabetes medicine, mental health medicine, vitamins or supplements...',
        textAnswerKey: 'current_medications_details',
        textRequired: true
      }
    ]
  }
];

export const consentItems = [
  {
    id: 'import_compliance_acknowledgement',
    label: 'I understand that submitting this questionnaire does not guarantee a prescription, treatment, supply or importation approval; a doctor may recommend a different option or no treatment; nicotine products are not risk-free; and any supply/importation must comply with applicable Australian laws and requirements.'
  }
] as const;

export function getQuizSessionId(): string | null {
  return sessionStorage.getItem(QUIZ_SESSION_ID_KEY) || localStorage.getItem(QUIZ_SESSION_ID_KEY);
}

export function getQuizFromSession(): Pick<EligibilityQuizResult, 'completedAt' | 'result'> | null {
  const sessionId = getQuizSessionId();
  if (sessionId) {
    const metaRaw = sessionStorage.getItem(QUIZ_SESSION_META_KEY) || localStorage.getItem(QUIZ_SESSION_META_KEY);
    if (metaRaw) {
      try {
        return JSON.parse(metaRaw) as Pick<EligibilityQuizResult, 'completedAt' | 'result'>;
      } catch {
        return { completedAt: new Date().toISOString(), result: 'completed' };
      }
    }
    return { completedAt: new Date().toISOString(), result: 'completed' };
  }

  // Legacy fallback: existing users may have completed a quiz before this migration.
  const legacy = sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) || localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy) as EligibilityQuizResult;
    return { completedAt: parsed.completedAt, result: 'completed' };
  } catch {
    return null;
  }
}

export function clearQuizFromSession(): void {
  sessionStorage.removeItem(QUIZ_SESSION_ID_KEY);
  sessionStorage.removeItem(QUIZ_SESSION_META_KEY);
  localStorage.removeItem(QUIZ_SESSION_ID_KEY);
  localStorage.removeItem(QUIZ_SESSION_META_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY_V2);
  localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
}

export function calculateQuizRiskFlags(answers: Partial<EligibilityAnswers>): string[] {
  const flags: string[] = [];
  if (answers.age_confirmation === 'under_18') flags.push('age_under_18');
  if (answers.nicotine_use?.includes('no_nicotine')) flags.push('no_current_nicotine_use');
  answers.medical_safety?.forEach(flag => {
    if (flag !== 'none') flags.push(`medical_safety_${flag}`);
  });
  if (answers.allergies_reactions === 'yes') flags.push('allergies_or_reactions_declared');
  if (answers.allergies_reactions === 'not_sure') flags.push('allergies_or_reactions_not_sure');
  if (answers.current_medications === 'yes') flags.push('current_medicines_declared');
  return flags;
}

// Kept for compatibility with older imports. Patient-facing code must not display this as an eligibility judgement.
export function calculateQuizResult(_answers: Partial<EligibilityAnswers>): 'completed' {
  return 'completed';
}

function generateQuizSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ (Math.random() * 16 >> Number(c) / 4)).toString(16)
  );
}

export async function saveQuizToSession(result: EligibilityQuizResult): Promise<string | null> {
  const id = generateQuizSessionId();
  const payload = {
    id,
    answers: result.answers as unknown as Json,
    result: result.result,
    risk_flags: result.riskFlags || [],
    notice_version: result.noticeVersion || result.answers.collection_notice_version,
    privacy_policy_version: result.privacyPolicyVersion || result.answers.privacy_policy_version,
    completed_at: result.completedAt
  };

  const { error } = await supabase
    .from('eligibility_quiz_sessions')
    .insert(payload);

  if (error) {
    console.error('Error saving eligibility quiz session:', error);
    return null;
  }

  const meta = JSON.stringify({ completedAt: result.completedAt, result: 'completed' });

  sessionStorage.setItem(QUIZ_SESSION_ID_KEY, id);
  sessionStorage.setItem(QUIZ_SESSION_META_KEY, meta);
  localStorage.setItem(QUIZ_SESSION_ID_KEY, id);
  localStorage.setItem(QUIZ_SESSION_META_KEY, meta);

  // Ensure no health answers remain in browser storage after Supabase save.
  sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY_V2);
  localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);

  return id;
}

export async function persistQuizToProfile(userId: string): Promise<boolean> {
  void userId;
  const quizSessionId = getQuizSessionId();

  if (quizSessionId) {
    const { data, error } = await supabase.rpc('link_eligibility_quiz_session', {
      _quiz_session_id: quizSessionId
    });

    if (error || data !== true) {
      console.error('Error linking eligibility quiz session:', error || data);
      return false;
    }

    clearQuizFromSession();
    return true;
  }

  // Legacy fallback: persist old browser-stored quiz into the profile only if still present.
  const legacyRaw = sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) || localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  if (!legacyRaw) return false;

  try {
    const legacyQuiz = JSON.parse(legacyRaw) as EligibilityQuizResult;
    const { error } = await supabase
      .from('patient_profiles')
      .upsert({
        user_id: userId,
        additional_notes: JSON.stringify({ eligibility_quiz: legacyQuiz })
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error persisting legacy quiz to profile:', error);
      return false;
    }

    clearQuizFromSession();
    return true;
  } catch (err) {
    console.error('Error parsing legacy quiz:', err);
    return false;
  }
}

export async function getPatientEligibilityQuiz(userId: string): Promise<EligibilityQuizResult | null> {
  try {
    const { data, error } = await supabase
      .from('eligibility_quiz_sessions')
      .select('answers, result, completed_at, risk_flags, notice_version, privacy_policy_version')
      .eq('patient_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        answers: data.answers as unknown as EligibilityAnswers,
        result: 'completed',
        completedAt: data.completed_at,
        riskFlags: data.risk_flags || [],
        noticeVersion: data.notice_version || undefined,
        privacyPolicyVersion: data.privacy_policy_version || undefined
      };
    }

    // Backwards-compatible fallback for older profile-stored quiz responses.
    const { data: profileData, error: profileError } = await supabase
      .from('patient_profiles')
      .select('additional_notes')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData?.additional_notes) return null;

    const raw: unknown = profileData.additional_notes;
    const notes = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const maybeObj: unknown = typeof notes === 'string' ? JSON.parse(notes) : notes;
    const legacy = maybeObj && typeof maybeObj === 'object' && 'eligibility_quiz' in maybeObj
      ? (maybeObj as { eligibility_quiz?: EligibilityQuizResult }).eligibility_quiz
      : undefined;
    if (!legacy) return null;

    return {
      ...legacy,
      result: 'completed',
      riskFlags: legacy.riskFlags || []
    };
  } catch {
    return null;
  }
}
