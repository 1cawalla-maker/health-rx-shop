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
    question: 'Are you 21 years or older?',
    description: 'PouchCare’s nicotine pouch pathway is only available to patients 21 years and older.',
    options: [
      { value: 'over_21', label: 'Yes, I am 21 years or older' },
      { value: 'under_21', label: 'No, I am under 21', flag: 'block' }
    ]
  },
  {
    id: 'smoker_declaration',
    question: 'Have you ever been a tobacco or cigarette smoker?',
    description: 'This pathway is intended for current or previous smokers seeking support to quit, reduce, or remain off smoking.',
    options: [
      { value: 'current_smoker', label: 'Yes, I currently smoke cigarettes' },
      { value: 'previous_smoker', label: 'Yes, I previously smoked cigarettes' },
      { value: 'never_smoked', label: 'No, I have never smoked cigarettes', flag: 'warning' }
    ]
  },
  {
    id: 'smoking_cessation_intention',
    question: 'What are you seeking help with?',
    options: [
      { value: 'quit_smoking', label: 'I want to quit smoking' },
      { value: 'reduce_smoking', label: 'I want to reduce smoking' },
      { value: 'stay_off_smoking', label: 'I have already quit smoking and want help staying off cigarettes' },
      { value: 'stop_reduce_vaping', label: 'I want to stop or reduce vaping' },
      { value: 'discuss_pouches', label: 'I want to discuss nicotine pouches as part of smoking cessation' },
      { value: 'not_sure_doctor_guidance', label: 'I am not sure and want doctor guidance' }
    ]
  },
  {
    id: 'cigarettes_per_day',
    question: 'How many cigarettes do you currently smoke, or did you previously smoke, per day?',
    options: [
      { value: 'current_1_5', label: 'Current smoker: 1–5 cigarettes/day' },
      { value: 'current_6_10', label: 'Current smoker: 6–10 cigarettes/day' },
      { value: 'current_11_20', label: 'Current smoker: 11–20 cigarettes/day' },
      { value: 'current_21_40', label: 'Current smoker: 21–40 cigarettes/day' },
      { value: 'current_more_than_40', label: 'Current smoker: more than 40 cigarettes/day' },
      { value: 'ex_1_5', label: 'Ex-smoker: 1–5 cigarettes/day' },
      { value: 'ex_6_10', label: 'Ex-smoker: 6–10 cigarettes/day' },
      { value: 'ex_11_20', label: 'Ex-smoker: 11–20 cigarettes/day' },
      { value: 'ex_21_40', label: 'Ex-smoker: 21–40 cigarettes/day' },
      { value: 'ex_more_than_40', label: 'Ex-smoker: more than 40 cigarettes/day' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'years_smoked',
    question: 'How many years have you smoked, or did you smoke, cigarettes for?',
    options: [
      { value: 'less_than_1', label: 'Less than 1 year' },
      { value: '1_5', label: '1–5 years' },
      { value: '6_10', label: '6–10 years' },
      { value: '11_20', label: '11–20 years' },
      { value: 'more_than_20', label: 'More than 20 years' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'last_tobacco_use',
    question: 'When was your last cigarette or tobacco use?',
    options: [
      { value: 'today', label: 'Today' },
      { value: 'past_week', label: 'Within the past week' },
      { value: 'past_1_4_weeks', label: 'Within the past 1–4 weeks' },
      { value: '1_6_months', label: '1–6 months ago' },
      { value: '6_12_months', label: '6–12 months ago' },
      { value: '1_2_years', label: '1–2 years ago' },
      { value: '2_5_years', label: '2–5 years ago' },
      { value: 'more_than_5_years', label: 'More than 5 years ago' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'quit_attempts',
    question: 'How many times have you tried to quit smoking or tobacco use?',
    options: [
      { value: 'none', label: 'I have not tried before' },
      { value: '1_2', label: '1–2 times' },
      { value: '3_5', label: '3–5 times' },
      { value: '6_10', label: '6–10 times' },
      { value: 'more_than_10', label: 'More than 10 times' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'previous_cessation_methods',
    question: 'Which smoking cessation methods have you tried before? Select all that apply.',
    inputType: 'multi',
    exclusiveOptions: ['none_tried'],
    options: [
      { value: 'cold_turkey', label: 'Cold turkey' },
      { value: 'quitline', label: 'Quitline' },
      { value: 'counselling_behavioural_support', label: 'Counselling, psychologist, or behavioural support' },
      { value: 'nicotine_patches', label: 'Nicotine patches' },
      { value: 'nicotine_gum', label: 'Nicotine gum' },
      { value: 'nicotine_lozenges', label: 'Nicotine lozenges' },
      { value: 'nicotine_mouth_spray', label: 'Nicotine mouth spray' },
      { value: 'nicotine_inhalator', label: 'Nicotine inhalator' },
      { value: 'combination_nrt', label: 'Combination nicotine replacement therapy' },
      { value: 'varenicline_champix', label: 'Varenicline / Champix' },
      { value: 'bupropion_zyban', label: 'Bupropion / Zyban' },
      { value: 'nicotine_vaping_product', label: 'Nicotine vaping product' },
      { value: 'nicotine_pouches', label: 'Nicotine pouches' },
      { value: 'none_tried', label: 'I have not tried any cessation methods before' },
      {
        value: 'other',
        label: 'Other',
        showTextInput: true,
        textInputLabel: 'Please specify the other method',
        textInputPlaceholder: 'Briefly describe the method...',
        textAnswerKey: 'previous_cessation_methods_other',
        textRequired: true
      }
    ]
  },
  {
    id: 'recent_cardio_screen',
    question: 'In the last 3 months, have you had uncontrolled high blood pressure, irregular heartbeat/arrhythmia, chest pain/angina, heart attack, stroke/TIA, or significant blood vessel disease?',
    options: [
      { value: 'no_conditions', label: 'No, I do not have these conditions' },
      { value: 'stable_controlled', label: 'No, I have one of these conditions but it is stable/well controlled' },
      { value: 'recent_or_uncontrolled', label: 'Yes, I have had one of these issues recently or it is not well controlled', flag: 'warning' },
      { value: 'not_sure', label: 'Not sure', flag: 'warning' },
      { value: 'prefer_discuss', label: 'Prefer to discuss with doctor', flag: 'warning' }
    ]
  },
  {
    id: 'recent_lung_screen',
    question: 'In the last 3 months, have you had uncontrolled or severe lung disease?',
    description: 'Examples: asthma flare, emphysema, COPD, pneumonia, or unexplained shortness of breath.',
    options: [
      { value: 'no_condition', label: 'No, I do not have this' },
      { value: 'stable_controlled', label: 'No, I have a lung condition but it is stable/well controlled' },
      { value: 'recent_or_uncontrolled', label: 'Yes, I have had recent or uncontrolled symptoms', flag: 'warning' },
      { value: 'not_sure', label: 'Not sure', flag: 'warning' },
      { value: 'prefer_discuss', label: 'Prefer to discuss with doctor', flag: 'warning' }
    ]
  },
  {
    id: 'pregnancy_breastfeeding_screen',
    question: 'Does any of the following apply to you?',
    description: 'Nicotine may not be suitable during pregnancy or breastfeeding. The doctor may recommend alternative care or GP/specialist review.',
    options: [
      { value: 'pregnant', label: 'I am pregnant', flag: 'warning' },
      { value: 'trying_to_conceive', label: 'I am trying to become pregnant', flag: 'warning' },
      { value: 'breastfeeding', label: 'I am breastfeeding', flag: 'warning' },
      { value: 'none', label: 'None of the above' },
      { value: 'not_applicable', label: 'Not applicable' }
    ]
  },
  {
    id: 'medical_conditions',
    question: 'Please list any diagnosed medical conditions the doctor should know about.',
    description: 'Examples: high blood pressure, heart disease, lung disease, diabetes, kidney/liver disease, seizures, mental health conditions, cancer treatment, immune suppression, alcohol or drug dependence.',
    inputType: 'text',
    textInputPlaceholder: 'Write “none” if you do not have any diagnosed medical conditions.',
    textRequired: true
  },
  {
    id: 'current_medications',
    question: 'What regular medications, over-the-counter medicines, supplements, or nicotine products do you currently take?',
    inputType: 'text',
    textInputPlaceholder: 'Write “none” if you do not take any regular medicines or supplements.',
    textRequired: true
  },
  {
    id: 'allergies_reactions',
    question: 'Do you have allergies or previous serious reactions to medicines, nicotine products, patches/adhesives, or oral products?',
    options: [
      { value: 'no', label: 'No' },
      {
        value: 'yes',
        label: 'Yes — I will provide details',
        showTextInput: true,
        textInputLabel: 'Please describe the allergy or reaction',
        textInputPlaceholder: 'Example: medicine allergy, rash from patches, mouth irritation from lozenges...',
        textAnswerKey: 'allergies_reactions_details',
        textRequired: true
      },
      { value: 'not_sure', label: 'Not sure', flag: 'warning' }
    ]
  },
  {
    id: 'dental_gum_health',
    question: 'Which best describes your dental and gum health?',
    options: [
      { value: 'good_seen_dentist_12_months', label: 'I have good dental/gum health and have seen a dentist in the past 12 months' },
      { value: 'good_not_seen_dentist_12_months', label: 'I have good dental/gum health but have not seen a dentist in the past 12 months' },
      { value: 'poor_seen_dentist_12_months', label: 'I have poor dental/gum health and have seen a dentist in the past 12 months', flag: 'warning' },
      { value: 'poor_not_seen_dentist_12_months', label: 'I may have poor dental/gum health and have not seen a dentist in the past 12 months', flag: 'warning' },
      { value: 'not_sure', label: 'Not sure', flag: 'warning' }
    ]
  },
  {
    id: 'oral_health_issues',
    question: 'Do you currently have any of the following? Select all that apply.',
    inputType: 'multi',
    exclusiveOptions: ['none'],
    options: [
      { value: 'mouth_ulcers_sores_cuts_bleeding', label: 'Mouth ulcers, sores, cuts, or bleeding gums', flag: 'warning' },
      { value: 'gum_disease_or_dental_infection', label: 'Gum disease or dental infection', flag: 'warning' },
      { value: 'severe_tooth_pain', label: 'Severe tooth pain', flag: 'warning' },
      { value: 'unexplained_mouth_or_throat_pain', label: 'Unexplained mouth or throat pain', flag: 'warning' },
      { value: 'patches_lumps_swelling_numbness_non_healing', label: 'White/red patches, lumps, swelling, numbness, or non-healing areas in the mouth', flag: 'warning' },
      { value: 'recent_dental_or_oral_surgery', label: 'Recent dental/oral surgery, tooth extraction, or gum treatment', flag: 'warning' },
      { value: 'swallowing_or_choking_risk', label: 'Difficulty swallowing or choking risk', flag: 'warning' },
      { value: 'none', label: 'None of the above' },
      { value: 'not_sure', label: 'Not sure', flag: 'warning' }
    ]
  },
  {
    id: 'pouch_duration',
    question: 'If you currently or previously use nicotine pouches, how long have you used them for?',
    options: [
      { value: 'new_to_pouches', label: 'I am completely new to nicotine pouches' },
      { value: 'days_to_weeks', label: 'A few days to weeks' },
      { value: 'months_to_1_year', label: 'A few months to 1 year' },
      { value: '1_2_years', label: '1–2 years' },
      { value: 'more_than_2_years', label: 'More than 2 years' },
      { value: 'never_used', label: 'I have never used nicotine pouches before' }
    ]
  },
  {
    id: 'pouch_helpfulness',
    question: 'Have nicotine pouches helped you reduce or quit smoking?',
    options: [
      { value: 'yes_helpful', label: 'Yes, they have been helpful' },
      { value: 'somewhat_helpful', label: 'Somewhat helpful' },
      { value: 'not_helpful', label: 'No, they have not been helpful' },
      { value: 'not_sure', label: 'I am not sure' },
      { value: 'not_tried_yet', label: 'I have not tried them yet' }
    ]
  },
  {
    id: 'pouch_max_strength',
    question: 'What is the highest nicotine pouch strength you currently use or would like to discuss with the doctor?',
    description: 'This is a preference/request only. The doctor may recommend a lower strength, a different treatment, or no prescription.',
    options: [
      { value: '3mg', label: '3mg per pouch' },
      { value: '6mg', label: '6mg per pouch' },
      { value: '9mg', label: '9mg per pouch' },
      { value: '12mg', label: '12mg per pouch' },
      {
        value: 'other',
        label: 'Other',
        showTextInput: true,
        textInputLabel: 'Please specify the highest strength',
        textInputPlaceholder: 'Example: 16mg, 20mg...',
        textAnswerKey: 'pouch_max_strength_other',
        textRequired: true
      },
      { value: 'not_sure_doctor_advise', label: 'Not sure / doctor to advise' }
    ]
  },
  {
    id: 'pouch_min_strength',
    question: 'What is the lowest nicotine pouch strength you currently use or would like to discuss with the doctor?',
    options: [
      { value: '3mg', label: '3mg per pouch' },
      { value: '6mg', label: '6mg per pouch' },
      { value: '9mg', label: '9mg per pouch' },
      { value: '12mg', label: '12mg per pouch' },
      {
        value: 'other',
        label: 'Other',
        showTextInput: true,
        textInputLabel: 'Please specify the lowest strength',
        textInputPlaceholder: 'Example: 2mg, 4mg...',
        textAnswerKey: 'pouch_min_strength_other',
        textRequired: true
      },
      { value: 'not_sure_doctor_advise', label: 'Not sure / doctor to advise' }
    ]
  },
  {
    id: 'daily_pouch_quantity',
    question: 'How many nicotine pouches do you currently use or expect to use per day?',
    options: [
      { value: 'zero_unsure', label: '0 — I have not used them before / unsure' },
      { value: '1_5', label: '1–5 per day' },
      { value: '6_10', label: '6–10 per day' },
      { value: '11_20', label: '11–20 per day' },
      { value: 'more_than_20', label: 'More than 20 per day' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    id: 'prescription_timing_acknowledgement',
    question: 'Important prescription timing acknowledgement',
    description: 'I understand that prescriptions cannot be backdated. If I ordered or imported nicotine pouches before having a valid prescription, PouchCare cannot guarantee that a doctor can issue a prescription that will satisfy Border Force, customs, suppliers, or any other authority for that earlier order.',
    options: [
      { value: 'understand_no_backdating', label: 'I understand' }
    ]
  },
  {
    id: 'quit_pouches_timeline',
    question: 'Are you planning to quit or reduce nicotine pouches/nicotine use?',
    options: [
      { value: 'within_3_months', label: 'Yes, within the next 3 months' },
      { value: 'within_6_months', label: 'Yes, within the next 6 months' },
      { value: 'within_12_months', label: 'Yes, within the next 12 months' },
      { value: 'yes_not_sure_when', label: 'Yes, but I am not sure when' },
      { value: 'no_not_currently', label: 'No, not currently' },
      { value: 'discuss_with_doctor', label: 'I want to discuss this with the doctor' }
    ]
  },
  {
    id: 'personal_use_declaration',
    question: 'Please confirm that any prescribed treatment is for your own personal use only.',
    description: 'If treatment is prescribed, it is for my own personal use only. I will not share, sell, or supply prescribed nicotine products to another person.',
    options: [
      { value: 'confirm', label: 'I confirm' },
      { value: 'do_not_confirm', label: 'I do not confirm', flag: 'warning' }
    ]
  },
  {
    id: 'patient_authority_declaration',
    question: 'If completing this form for someone else, please confirm you have authority or consent.',
    options: [
      { value: 'confirm', label: 'I confirm the information is about the patient and I have their consent or authority to complete this form' },
      { value: 'not_applicable', label: 'Not applicable — I am completing this for myself' }
    ]
  }
];

export const consentItems = [
  {
    id: 'final_truth_accuracy_contact_consent',
    label: 'I confirm the information I provided is true, accurate, and complete to the best of my knowledge. I understand withholding information may affect safe clinical assessment. I understand this form does not guarantee a prescription, treatment, supply, delivery, or import approval. I understand the doctor may decline, defer, request more information, or recommend another treatment. I understand nicotine is addictive and may be harmful. I understand nicotine products must be kept away from children and pets. I have read and agree to the Privacy Policy and Collection Notice. I consent to PouchCare contacting me by phone, SMS, or email about my assessment.'
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
  if (answers.age_confirmation === 'under_21') flags.push('age_under_21');
  if (answers.smoker_declaration === 'never_smoked') flags.push('never_smoked_declared');
  if (answers.recent_cardio_screen === 'recent_or_uncontrolled') flags.push('recent_or_uncontrolled_cardiovascular_issue');
  if (answers.recent_cardio_screen === 'not_sure' || answers.recent_cardio_screen === 'prefer_discuss') flags.push('cardiovascular_clarification_needed');
  if (answers.recent_lung_screen === 'recent_or_uncontrolled') flags.push('recent_or_uncontrolled_lung_issue');
  if (answers.recent_lung_screen === 'not_sure' || answers.recent_lung_screen === 'prefer_discuss') flags.push('lung_clarification_needed');
  if (answers.pregnancy_breastfeeding_screen && !['none', 'not_applicable'].includes(answers.pregnancy_breastfeeding_screen)) flags.push('pregnancy_breastfeeding_or_trying');
  if (answers.allergies_reactions === 'yes') flags.push('allergies_or_reactions_declared');
  if (answers.allergies_reactions === 'not_sure') flags.push('allergies_or_reactions_not_sure');
  if (answers.dental_gum_health?.startsWith('poor')) flags.push('dental_gum_health_review');
  answers.oral_health_issues?.forEach(issue => {
    if (issue !== 'none') flags.push(`oral_health_${issue}`);
  });
  if (answers.daily_pouch_quantity === 'more_than_20') flags.push('high_daily_pouch_quantity');
  if (answers.personal_use_declaration === 'do_not_confirm') flags.push('personal_use_not_confirmed');
  return Array.from(new Set(flags));
}

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
